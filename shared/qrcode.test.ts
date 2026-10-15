import { describe, expect, it } from 'vitest';
import { generateQrMatrix, generateQrSvg } from './qrcode';

describe('qrcode', () => {
  it('geração da matriz e do svg', () => {
    const text = 'https://cool-banana.trycloudflare.com';
    const matrix = generateQrMatrix(text);
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0][0]).toBe(true); // Finder top-left

    const svg = generateQrSvg(text);
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('<rect');
    expect(svg).toContain('<path');
  });
});
