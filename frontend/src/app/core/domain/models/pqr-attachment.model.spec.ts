import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  getAttachmentCategory,
} from './pqr-attachment.model';

describe('pqr-attachment.model helpers', () => {
  it('debe clasificar correctamente las categorías de extensión', () => {
    expect(getAttachmentCategory('.pdf')).toBe('pdf');
    expect(getAttachmentCategory('.PDF')).toBe('pdf');
    expect(getAttachmentCategory('.doc')).toBe('word');
    expect(getAttachmentCategory('.docx')).toBe('word');
    expect(getAttachmentCategory('.jpg')).toBe('image');
    expect(getAttachmentCategory('.jpeg')).toBe('image');
    expect(getAttachmentCategory('.png')).toBe('image');
    expect(getAttachmentCategory('.zip')).toBe('other');
  });

  it('debe formatear los bytes de forma comprensible', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });
});
