import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountsService } from '../../accounts/service';
import { NameStore } from '../../model/names';
import { Office } from '../../model/office';
import { detectAntigravityAccounts, isAntigravityHome } from './accounts';
import { decodeWorkspacePath } from './files';
import { AntigravityHistory } from './history';
import { AntigravitySource } from './source';
import { createAntigravityTerminalParser } from './terminal';
import { createAntigravityTranscriptState, parseAntigravityLine } from './transcript';
import { calculateAntigravityUsage } from './usage';

describe('Antigravity Integration', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = join(tmpdir(), `habblaud-antigravity-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(tmp, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('accounts & detection', () => {
    it('detects Antigravity structure when presence, db or brain is present', () => {
      expect(isAntigravityHome(tmp)).toBe(false);
      mkdirSync(join(tmp, 'presence'), { recursive: true });
      expect(isAntigravityHome(tmp)).toBe(true);
    });

    it('detects accounts correctly', () => {
      const accounts = detectAntigravityAccounts([tmp]);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toMatchObject({
        id: 'antigravity',
        provider: 'antigravity',
        short: 'AGY',
        name: 'Antigravity',
        plan: 'Pro',
      });
    });

    it('decodes workspace uris properly', () => {
      expect(decodeWorkspacePath(undefined)).toBeUndefined();
      expect(decodeWorkspacePath('')).toBeUndefined();
      const decoded1 = decodeWorkspacePath('["file:///d%3A/habblaud"]');
      expect(decoded1).toBeDefined();
      expect(decoded1?.toLowerCase().replace(/\\/g, '/')).toContain('d:/habblaud');
    });
  });

  describe('transcript parser', () => {
    it('parses user input step', () => {
      const state = createAntigravityTranscriptState();
      const line = JSON.stringify({
        step_index: 0,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        content: '<USER_REQUEST>\nFix the button color\n</USER_REQUEST>',
        created_at: '2026-10-15T12:00:00Z',
      });

      const res = parseAntigravityLine(state, line, { idPrefix: 'conv1' });
      expect(res.status).toBe('working');
      expect(res.activities).toHaveLength(1);
      expect(res.activities[0].kind).toBe('prompt');
      expect(res.activities[0].text).toBe('Fix the button color');
    });

    it('parses thinking and tool calls and accumulates stats', () => {
      const state = createAntigravityTranscriptState();
      const line = JSON.stringify({
        step_index: 1,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        thinking: 'I need to check the files first.',
        tool_calls: [
          {
            name: 'view_file',
            args: { AbsolutePath: 'd:/habblaud/src/App.tsx', toolAction: 'Viewing App.tsx' },
          },
        ],
        input_tokens: 100,
        output_tokens: 50,
        created_at: '2026-10-15T12:00:05Z',
      });

      const res = parseAntigravityLine(state, line, { idPrefix: 'conv1' });
      expect(res.status).toBe('working');
      expect(res.activities).toHaveLength(2);
      expect(res.activities[0].kind).toBe('think');
      expect(res.activities[1].kind).toBe('read');
      expect(res.activities[1].text).toBe('Viewing App.tsx');
      expect(state.stats.tokensIn).toBe(100);
      expect(state.stats.tokensOut).toBe(50);
      expect(state.stats.toolCalls).toBe(1);
    });

    it('sets waiting status when ask_question tool is called', () => {
      const state = createAntigravityTranscriptState();
      const line = JSON.stringify({
        step_index: 2,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        tool_calls: [
          {
            name: 'ask_question',
            args: { question: 'Should we proceed?' },
          },
        ],
      });

      const res = parseAntigravityLine(state, line, { idPrefix: 'conv1' });
      expect(res.status).toBe('waiting');
      expect(res.waitingFor).toBeDefined();
    });
  });

  describe('terminal parser', () => {
    it('emits proper TerminalEntry items', () => {
      const parser = createAntigravityTerminalParser('test');
      const userLine = JSON.stringify({
        step_index: 0,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        content: 'Hello Antigravity',
      });
      const entries1 = parser.push(userLine);
      expect(entries1).toHaveLength(1);
      expect(entries1[0].kind).toBe('user');
      expect((entries1[0] as { text: string }).text).toBe('Hello Antigravity');

      const modelLine = JSON.stringify({
        step_index: 1,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        thinking: 'Thinking...',
        tool_calls: [{ name: 'run_command', args: { CommandLine: 'npm test' } }],
        content: 'I will run the tests.',
      });
      const entries2 = parser.push(modelLine);
      expect(entries2).toHaveLength(3);
      expect(entries2[0].kind).toBe('thinking');
      expect(entries2[1].kind).toBe('tool');
      expect(entries2[2].kind).toBe('assistant');

      const genericLine = JSON.stringify({
        step_index: 2,
        source: 'MODEL',
        type: 'GENERIC',
        content: 'Tests passed!',
      });
      const entries3 = parser.push(genericLine);
      expect(entries3).toHaveLength(1);
      expect(entries3[0].kind).toBe('result');
      expect((entries3[0] as { text: string }).text).toBe('Tests passed!');
    });
  });

  describe('source and office sync', () => {
    it('discovers presence locks and syncs active sessions into office', () => {
      const presenceDir = join(tmp, 'presence');
      mkdirSync(presenceDir, { recursive: true });
      const convId = '11111111-2222-3333-4444-555555555555';
      writeFileSync(join(presenceDir, `${convId}.lock`), '');

      // Create SQLite conversation_summaries.db
      const dbPath = join(tmp, 'conversation_summaries.db');
      const db = new DatabaseSync(dbPath);
      db.exec(`
        CREATE TABLE conversation_summaries (
          conversation_id text PRIMARY KEY,
          title text,
          workspace_uris text,
          status text,
          last_modified_time text,
          step_count integer,
          parent_conversation_id text,
          agent_name text,
          not_fully_idle integer,
          killed integer
        )
      `);
      db.prepare(`
        INSERT INTO conversation_summaries VALUES (
          ?, 'Test Conversation', '["file:///d%3A/test-project"]', 'CASCADE_RUN_STATUS_RUNNING',
          '2026-10-15 12:00:00.0000000+00:00', 10, '', '', 1, 0
        )
      `).run(convId);
      db.close();

      // Create transcript log
      const logDir = join(tmp, 'brain', convId, '.system_generated', 'logs');
      mkdirSync(logDir, { recursive: true });
      const transcriptFile = join(logDir, 'transcript.jsonl');
      writeFileSync(
        transcriptFile,
        JSON.stringify({
          step_index: 0,
          source: 'USER_EXPLICIT',
          type: 'USER_INPUT',
          content: '<USER_REQUEST>Build the feature</USER_REQUEST>',
        }) + '\n'
      );

      const accounts = new AccountsService({
        dirs: [],
        home: tmp,
        env: {},
        onChange: () => {},
      });
      const names = new NameStore(join(tmp, 'names.json'));
      const office = new Office({
        names,
        version: '0.11.0',
        startedAt: Date.now(),
        accounts: () => [],
        sources: () => [],
        accountName: () => 'Antigravity',
      });

      const src = new AntigravitySource({
        accounts,
        office,
        dirs: [tmp],
      });

      src.start();

      const list = office.list();
      expect(list.some((a) => a.sessionId === convId && a.provider === 'antigravity')).toBe(true);

      const agent = list.find((a) => a.sessionId === convId)!;
      expect(agent.status).toBe('working');
      expect(src.transcriptPathOf(convId)).toBe(transcriptFile);

      // Usage status should be pushed
      const acc = accounts.list(new Map()).find((a) => a.id === 'antigravity');
      expect(acc?.usageStatus).toBe('ok');
      expect(acc?.usage?.source).toBe('antigravity');

      src.stop();
    });

    it('calculates usage from transcripts correctly with 5h and 7d rolling windows', () => {
      const convId = 'usage-conv-1';
      const logDir = join(tmp, 'brain', convId, '.system_generated', 'logs');
      mkdirSync(logDir, { recursive: true });
      const now = 1_700_000_000_000;
      const transcriptFile = join(logDir, 'transcript.jsonl');

      // Add a step 1 hour ago
      const step1 = {
        step_index: 0,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        input_tokens: 400_000,
        output_tokens: 100_000,
        created_at: new Date(now - 3600 * 1000).toISOString(),
      };
      // Add a step 2 days ago
      const step2 = {
        step_index: 1,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        input_tokens: 1_500_000,
        output_tokens: 500_000,
        created_at: new Date(now - 48 * 3600 * 1000).toISOString(),
      };
      writeFileSync(transcriptFile, `${JSON.stringify(step1)}\n${JSON.stringify(step2)}\n`);

      const usage = calculateAntigravityUsage(tmp, now, { quota5h: 1_000_000, quotaWeek: 10_000_000 });

      expect(usage.source).toBe('antigravity');
      expect(usage.fetchedAt).toBe(now);
      expect(usage.fiveHour).toBeDefined();
      expect(usage.sevenDay).toBeDefined();
      // 500k tokens in 5h / 1M quota = 50%
      expect(usage.fiveHour?.utilization).toBe(50);
      expect(usage.fiveHour?.resetsAt).toBe(now - 3600 * 1000 + 5 * 3600 * 1000);
      // 2.5M tokens in 7d / 10M quota = 25%
      expect(usage.sevenDay?.utilization).toBe(25);
    });
  });
});
