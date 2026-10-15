import { describe, expect, it } from 'vitest';
import { formatNoticeText } from './notice-format';
import { registerDictionary, setLocale } from '../../../shared/i18n';
import { VI } from '../../../shared/locales/vi';

describe('formatNoticeText', () => {
  it('translates Portuguese arrive notice to Vietnamese', () => {
    registerDictionary('vi', VI);
    setLocale('vi');

    const pt = '👋 Tatiana chegou em d:/habblaud (Antigravity)';
    const vi = formatNoticeText(pt);
    expect(vi).toBe('👋 Tatiana đã đến d:/habblaud (Antigravity)');
  });

  it('translates Portuguese arrive notice without account to Vietnamese', () => {
    registerDictionary('vi', VI);
    setLocale('vi');

    const pt = '👋 Tatiana chegou em d:/habblaud';
    const vi = formatNoticeText(pt);
    expect(vi).toBe('👋 Tatiana đã đến d:/habblaud');
  });

  it('translates leave notice to Vietnamese', () => {
    registerDictionary('vi', VI);
    setLocale('vi');

    const pt = '🚪 Tatiana encerrou a sessão';
    const vi = formatNoticeText(pt);
    expect(vi).toBe('🚪 Tatiana đã kết thúc phiên làm việc');
  });

  it('translates done notice to Vietnamese', () => {
    registerDictionary('vi', VI);
    setLocale('vi');

    const pt = '✅ Tatiana concluiu em Sala 1';
    const vi = formatNoticeText(pt);
    expect(vi).toBe('✅ Tatiana đã hoàn thành tại Sala 1');
  });

  it('leaves already translated text as-is', () => {
    registerDictionary('vi', VI);
    setLocale('vi');

    const viInput = '👋 Tatiana đã đến d:/habblaud (Antigravity)';
    expect(formatNoticeText(viInput)).toBe(viInput);
  });
});
