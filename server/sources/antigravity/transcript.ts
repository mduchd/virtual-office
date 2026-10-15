import { basename, maskSecrets, truncate, type ActivityDescription } from '../../../shared/activity';
import type { Activity, ActivityKind, AgentStats, AgentStatus, AskQuestion, TaskItem } from '../../../shared/types';
import { tr } from '../../../shared/i18n';

export interface AntigravityTranscriptState {
  stats: AgentStats;
  tasks: TaskItem[];
  title?: string;
  firstAt?: number;
  lastAt?: number;
  lastStatus?: AgentStatus;
  waitingFor?: string;
}

export function createAntigravityTranscriptState(): AntigravityTranscriptState {
  return {
    stats: {
      toolCalls: 0,
      tokensIn: 0,
      tokensOut: 0,
      subagents: 0,
    },
    tasks: [],
  };
}

export interface AntigravityToolCall {
  name: string;
  args?: Record<string, unknown> | string;
}

export interface AntigravityStep {
  step_index?: number;
  source?: string; // 'USER_EXPLICIT' | 'MODEL' | 'SYSTEM'
  type?: string;   // 'USER_INPUT' | 'PLANNER_RESPONSE' | 'GENERIC' | 'SYSTEM_MESSAGE'
  status?: string;
  created_at?: string;
  input_tokens?: number;
  cache_read_tokens?: number;
  output_tokens?: number;
  thinking?: string;
  tool_calls?: AntigravityToolCall[];
  content?: string;
}

export interface AntigravityLineResult {
  activities: Activity[];
  status?: AgentStatus;
  waitingFor?: string;
  title?: string;
}

function parseArgs(args: unknown): Record<string, unknown> {
  if (!args) return {};
  if (typeof args === 'object') return args as Record<string, unknown>;
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args) as unknown;
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      // not JSON
    }
  }
  return {};
}

function unquote(v: unknown): string {
  if (typeof v !== 'string') return '';
  let s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      s = JSON.parse(s) as string;
    } catch {
      s = s.slice(1, -1);
    }
  }
  return s;
}

/** Descreve uma ferramenta do Antigravity para virar atividade legível. */
export function describeAntigravityTool(name: string, rawArgs: unknown): ActivityDescription {
  const args = parseArgs(rawArgs);
  const action = unquote(args.toolAction);
  const summary = unquote(args.toolSummary);

  if (action) {
    let kind: ActivityKind = 'other';
    let icon = '⚙️';
    if (name === 'run_command') {
      kind = 'run';
      icon = '💻';
    } else if (name === 'view_file') {
      kind = 'read';
      icon = '📄';
    } else if (name === 'replace_file_content' || name === 'write_to_file') {
      kind = 'edit';
      icon = '✏️';
    } else if (name === 'search_web') {
      kind = 'search';
      icon = '🔍';
    } else if (name === 'read_url_content') {
      kind = 'web';
      icon = '🌐';
    } else if (name === 'ask_question') {
      kind = 'ask';
      icon = '❓';
    } else if (name.includes('subagent')) {
      kind = 'delegate';
      icon = '🤖';
    }

    const cmd = unquote(args.CommandLine);
    const file = unquote(args.TargetFile || args.AbsolutePath);
    const detail = cmd || file || summary || undefined;

    return {
      kind,
      icon,
      text: truncate(tr(action), 46),
      detail: detail ? truncate(maskSecrets(detail), 300) : undefined,
    };
  }

  switch (name) {
    case 'run_command': {
      const cmd = unquote(args.CommandLine) || 'command';
      return {
        kind: 'run',
        icon: '💻',
        text: truncate(`Exec: ${cmd}`, 46),
        detail: truncate(maskSecrets(cmd), 300),
      };
    }
    case 'view_file': {
      const file = unquote(args.AbsolutePath) || tr('arquivo');
      return {
        kind: 'read',
        icon: '📄',
        text: truncate(tr('Lendo {0}', [basename(file)]), 46),
        detail: file,
      };
    }
    case 'replace_file_content':
    case 'write_to_file': {
      const file = unquote(args.TargetFile) || tr('arquivo');
      return {
        kind: 'edit',
        icon: '✏️',
        text: truncate(tr('Editando {0}', [basename(file)]), 46),
        detail: file,
      };
    }
    case 'search_web': {
      const q = unquote(args.query) || tr('busca');
      return {
        kind: 'search',
        icon: '🔍',
        text: truncate(tr('Buscando: {0}', [q]), 46),
        detail: q,
      };
    }
    case 'read_url_content': {
      const url = unquote(args.Url) || 'web';
      return {
        kind: 'web',
        icon: '🌐',
        text: truncate(tr('Acessando {0}', [url]), 46),
        detail: url,
      };
    }
    case 'ask_question': {
      return {
        kind: 'ask',
        icon: '❓',
        text: truncate(tr('Aguardando resposta do usuário'), 46),
      };
    }
    case 'invoke_subagent':
    case 'manage_subagents': {
      return {
        kind: 'delegate',
        icon: '🤖',
        text: truncate(tr('Subagente Antigravity'), 46),
      };
    }
    default:
      return {
        kind: 'other',
        icon: '⚙️',
        text: truncate(name, 46),
      };
  }
}

/** Limpa texto de pedido do usuário (<USER_REQUEST>...</USER_REQUEST>). */
export function cleanUserPrompt(raw: string): string {
  const m = /<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i.exec(raw);
  const text = m ? m[1] : raw;
  return truncate(text.replace(/\s+/g, ' ').trim(), 46);
}

/** Interpreta uma linha JSONL do transcript do Antigravity. */
export function parseAntigravityLine(
  state: AntigravityTranscriptState,
  line: string,
  opts: { idPrefix: string; now?: number }
): AntigravityLineResult {
  const now = opts.now ?? Date.now();
  if (!line.trim()) return { activities: [] };

  let step: AntigravityStep;
  try {
    step = JSON.parse(line) as AntigravityStep;
  } catch {
    return { activities: [] };
  }

  if (!step || typeof step !== 'object') return { activities: [] };

  const at = step.created_at ? Date.parse(step.created_at) || now : now;
  state.firstAt = state.firstAt ? Math.min(state.firstAt, at) : at;
  state.lastAt = Math.max(state.lastAt ?? 0, at);

  // Acumula tokens
  if (typeof step.input_tokens === 'number') state.stats.tokensIn += step.input_tokens;
  if (typeof step.cache_read_tokens === 'number') state.stats.tokensIn += step.cache_read_tokens;
  if (typeof step.output_tokens === 'number') state.stats.tokensOut += step.output_tokens;

  const activities: Activity[] = [];
  const stepIdx = step.step_index ?? 0;

  // 1. Mensagem do usuário
  if (step.source === 'USER_EXPLICIT' && step.type === 'USER_INPUT' && step.content) {
    const text = cleanUserPrompt(step.content);
    activities.push({
      id: `${opts.idPrefix}-usr-${stepIdx}`,
      kind: 'prompt',
      icon: '💬',
      text: text || tr('Nova instrução recebida'),
      detail: truncate(maskSecrets(step.content), 300),
      at,
    });
    return { activities, status: 'working' };
  }

  // 2. Resposta do modelo / Chamada de ferramentas
  if (step.source === 'MODEL' && step.type === 'PLANNER_RESPONSE') {
    let hasAskQuestion = false;

    // Bloco de thinking
    if (step.thinking && step.thinking.trim()) {
      activities.push({
        id: `${opts.idPrefix}-thk-${stepIdx}`,
        kind: 'think',
        icon: '💭',
        text: tr('Pensando...'),
        detail: truncate(maskSecrets(step.thinking), 300),
        at,
      });
    }

    // Ferramentas
    if (Array.isArray(step.tool_calls) && step.tool_calls.length) {
      step.tool_calls.forEach((tc, i) => {
        state.stats.toolCalls++;
        if (tc.name === 'ask_question') hasAskQuestion = true;
        const desc = describeAntigravityTool(tc.name, tc.args);
        activities.push({
          id: `${opts.idPrefix}-tool-${stepIdx}-${i}`,
          kind: desc.kind,
          icon: desc.icon,
          text: desc.text,
          detail: desc.detail,
          tool: tc.name,
          at,
        });
      });
    } else if (step.content && step.content.trim()) {
      // Resposta final do turno em texto
      activities.push({
        id: `${opts.idPrefix}-resp-${stepIdx}`,
        kind: 'respond',
        icon: '💬',
        text: truncate(step.content, 46),
        detail: truncate(maskSecrets(step.content), 300),
        at,
      });
    }

    if (hasAskQuestion) {
      return { activities, status: 'waiting', waitingFor: tr('responder pergunta do agente') };
    }

    return { activities, status: 'working' };
  }

  return { activities };
}
