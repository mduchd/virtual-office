import { describe, expect, it, beforeEach } from 'vitest';
import { moveAgent, orderAgents } from './agentorder';
import { nodeRunningTier } from './model';
import type { AgentInfo } from '../../../shared/types';
import type { AgentNode } from './model';

const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
};

function fakeAgent(id: string, status: AgentInfo['status'], statusSince = 100, shells: AgentInfo['shells'] = []): AgentInfo {
  return {
    id,
    name: id,
    role: 'dev',
    kind: 'main',
    account: 'acc1',
    roomId: 'room1',
    sessionId: `sess-${id}`,
    status,
    look: 'f',
    tasks: [],
    recent: [],
    startedAt: 100,
    lastEventAt: 100,
    statusSince,
    stats: { toolCalls: 0, tokensIn: 0, tokensOut: 0, subagents: 0 },
    seed: 123,
    shells,
  };
}

function fakeNode(agent: AgentInfo, subs: AgentInfo[] = []): AgentNode {
  return {
    agent,
    subs,
    subTotal: subs.length,
  };
}

describe('agentorder: orderAgents', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('đẩy các agent đang chạy (working, shell) và cần bạn (waiting) lên đầu danh sách', () => {
    const a1 = fakeNode(fakeAgent('a1', 'idle', 100));
    const a2 = fakeNode(fakeAgent('a2', 'working', 200));
    const a3 = fakeNode(fakeAgent('a3', 'idle', 150));
    const a4 = fakeNode(fakeAgent('a4', 'waiting', 250));

    const result = orderAgents('room1', [a1, a2, a3, a4], (n) => n.agent.sessionId, nodeRunningTier);
    expect(result.map((n) => n.agent.id)).toEqual(['a4', 'a2', 'a1', 'a3']);
  });

  it('đẩy agent chính lên đầu nếu có subagent đang chạy', () => {
    const a1 = fakeNode(fakeAgent('a1', 'idle', 100));
    const sub = fakeAgent('sub1', 'working', 300);
    const a2 = fakeNode(fakeAgent('a2', 'idle', 120), [sub]);
    const a3 = fakeNode(fakeAgent('a3', 'idle', 110));

    const result = orderAgents('room1', [a1, a2, a3], (n) => n.agent.sessionId, nodeRunningTier);
    expect(result.map((n) => n.agent.id)).toEqual(['a2', 'a1', 'a3']);
  });

  it('ưu tiên agent có lệnh shell đang chạy dù status là idle', () => {
    const a1 = fakeNode(fakeAgent('a1', 'idle', 100));
    const a2 = fakeNode(fakeAgent('a2', 'idle', 100, [{ id: 'sh1' } as any]));
    const a3 = fakeNode(fakeAgent('a3', 'idle', 100));

    const result = orderAgents('room1', [a1, a2, a3], (n) => n.agent.sessionId, nodeRunningTier);
    expect(result.map((n) => n.agent.id)).toEqual(['a2', 'a1', 'a3']);
  });

  it('giữ thứ tự kéo thả trong cùng một nhóm trạng thái (running hoặc idle)', () => {
    const a1 = fakeNode(fakeAgent('a1', 'idle', 100));
    const a2 = fakeNode(fakeAgent('a2', 'idle', 100));
    const a3 = fakeNode(fakeAgent('a3', 'idle', 100));

    // Kéo a3 lên trước a1
    moveAgent('room1', [a1, a2, a3], (n) => n.agent.id, (n) => n.agent.sessionId, 'a3', 'a1', false);

    // Khi tất cả đều idle, thứ tự lưu là a3, a1, a2
    const idleResult = orderAgents('room1', [a1, a2, a3], (n) => n.agent.sessionId, nodeRunningTier);
    expect(idleResult.map((n) => n.agent.id)).toEqual(['a3', 'a1', 'a2']);

    // Giờ cho a2 đang làm việc
    a2.agent.status = 'working';
    const runningResult = orderAgents('room1', [a1, a2, a3], (n) => n.agent.sessionId, nodeRunningTier);
    // a2 đang chạy nhảy lên đầu; a3 và a1 vẫn giữ thứ tự lưu a3 > a1
    expect(runningResult.map((n) => n.agent.id)).toEqual(['a2', 'a3', 'a1']);
  });
});
