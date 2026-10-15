import { describe, expect, it } from 'vitest';
import { TunnelService } from './tunnel';

describe('TunnelService', () => {
  it('inicializa com status desligado', () => {
    const s = new TunnelService();
    const st = s.status();
    expect(st.active).toBe(false);
    expect(st.starting).toBe(false);
    expect(st.url).toBeNull();
    expect(st.user).toBe('admin');
  });

  it('stop com túnel desligado não quebra', async () => {
    const s = new TunnelService();
    const st = await s.stop();
    expect(st.active).toBe(false);
    expect(st.url).toBeNull();
  });
});
