import { maskSecrets, truncate } from '../../../shared/activity';
import type { TerminalEntry } from '../../../shared/types';
import type { TerminalParser } from '../terminal';
import type { AntigravityStep } from './transcript';

const TEXT_MAX = 20_000;
const THINKING_MAX = 8_000;
const RESULT_MAX = 4_000;

export function createAntigravityTerminalParser(idPrefix = 'agy'): TerminalParser {
  let lastToolUseId = '';

  return {
    push(line: string): TerminalEntry[] {
      if (!line.trim()) return [];
      let step: AntigravityStep;
      try {
        step = JSON.parse(line) as AntigravityStep;
      } catch {
        return [];
      }
      if (!step || typeof step !== 'object') return [];

      const at = step.created_at ? Date.parse(step.created_at) || Date.now() : Date.now();
      const stepIdx = step.step_index ?? 0;
      const entries: TerminalEntry[] = [];

      // 1. Mensagem do usuário
      if (step.source === 'USER_EXPLICIT' && step.type === 'USER_INPUT' && step.content) {
        entries.push({
          kind: 'user',
          id: `${idPrefix}-usr-${stepIdx}`,
          at,
          text: truncate(maskSecrets(step.content), TEXT_MAX),
        });
        return entries;
      }

      // 2. Modelo (Thinking, Tools, Resposta)
      if (step.source === 'MODEL' && step.type === 'PLANNER_RESPONSE') {
        if (step.thinking && step.thinking.trim()) {
          entries.push({
            kind: 'thinking',
            id: `${idPrefix}-thk-${stepIdx}`,
            at,
            text: truncate(maskSecrets(step.thinking), THINKING_MAX),
          });
        }

        if (Array.isArray(step.tool_calls) && step.tool_calls.length) {
          step.tool_calls.forEach((tc, i) => {
            const toolId = `${idPrefix}-tool-${stepIdx}-${i}`;
            lastToolUseId = toolId;
            let inputStr = '';
            if (tc.args) {
              inputStr = typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args, null, 2);
            }

            entries.push({
              kind: 'tool',
              id: toolId,
              at,
              tool: tc.name,
              title: `${tc.name}()`,
              input: inputStr ? truncate(maskSecrets(inputStr), 2_000) : undefined,
            });
          });
        }

        if (step.content && step.content.trim()) {
          entries.push({
            kind: 'assistant',
            id: `${idPrefix}-ast-${stepIdx}`,
            at,
            text: truncate(maskSecrets(step.content), TEXT_MAX),
          });
        }

        return entries;
      }

      // 3. Resultado de ferramenta (GENERIC)
      if (step.source === 'MODEL' && step.type === 'GENERIC' && step.content) {
        entries.push({
          kind: 'result',
          id: `${idPrefix}-res-${stepIdx}`,
          at,
          toolUseId: lastToolUseId || `${idPrefix}-tool-unknown`,
          text: truncate(maskSecrets(step.content), RESULT_MAX),
        });
        return entries;
      }

      // 4. Mensagens de sistema
      if (step.source === 'SYSTEM' && step.content) {
        entries.push({
          kind: 'system',
          id: `${idPrefix}-sys-${stepIdx}`,
          at,
          text: truncate(maskSecrets(step.content), 200),
          level: 'info',
        });
        return entries;
      }

      return entries;
    },
  };
}
