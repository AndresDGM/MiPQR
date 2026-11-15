const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Codifica bytes a Base64 estandar con relleno "=". */
export function toBase64(bytes: Uint8Array): string {
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const group = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    result += ALPHABET[(group >> 18) & 63] + ALPHABET[(group >> 12) & 63];
    result += i + 1 < bytes.length ? ALPHABET[(group >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? ALPHABET[group & 63] : '=';
  }

  return result;
}

/** Decodifica Base64 estandar. Lanza un Error si el texto no es Base64 valido. */
export function fromBase64(text: string): Uint8Array {
  if (text.length === 0 || text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
    throw new Error('Base64 invalido');
  }

  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((text.length / 4) * 3 - padding);
  let index = 0;

  for (let i = 0; i < text.length; i += 4) {
    let group = 0;
    for (let j = 0; j < 4; j++) {
      const char = text[i + j];
      group = (group << 6) | (char === '=' ? 0 : ALPHABET.indexOf(char));
    }
    for (let shift = 16; shift >= 0 && index < bytes.length; shift -= 8) {
      bytes[index++] = (group >> shift) & 255;
    }
  }

  return bytes;
}
