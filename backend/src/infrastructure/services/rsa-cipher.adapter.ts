import { CipherService } from '../../domain/services/cipher.service.js';
import { fromBase64, toBase64 } from './encoding/base64.js';
import { fromHex } from './rsa/bigint-utils.js';
import { RsaAlgorithm } from './rsa/rsa.algorithm.js';

/** Marca de version del formato almacenado; permite distinguir valores ya protegidos. */
export const RSA_FORMAT_PREFIX = 'rsa1:';

/**
 * Adapter que adapta el algoritmo {@link RsaAlgorithm} al contrato {@link CipherService}.
 *
 * Formato del valor: "rsa1:" + Base64(bloque_1 || bloque_2 || ...). Los textos mas largos
 * que un bloque se dividen en trozos que se cifran por separado.
 *
 * Las claves se reciben en hexadecimal: modulo `n`, exponente publico `e` y exponente
 * privado `d`.
 */
export class RsaCipherAdapter extends CipherService {
  private readonly rsa: RsaAlgorithm;
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder('utf-8', { fatal: true });

  constructor(nHex: string, eHex: string, dHex: string) {
    super();
    this.rsa = new RsaAlgorithm(fromHex(nHex), fromHex(eHex), fromHex(dHex));
  }

  encrypt(plainText: string): string {
    const bytes = this.encoder.encode(plainText);
    const chunkSize = this.rsa.maxMessageSize;
    const chunks = Math.max(1, Math.ceil(bytes.length / chunkSize));

    const output = new Uint8Array(chunks * this.rsa.blockSize);
    for (let i = 0; i < chunks; i++) {
      const block = this.rsa.encryptBlock(bytes.slice(i * chunkSize, (i + 1) * chunkSize));
      output.set(block, i * this.rsa.blockSize);
    }

    return RSA_FORMAT_PREFIX + toBase64(output);
  }

  decrypt(cipherText: string): string {
    if (!cipherText.startsWith(RSA_FORMAT_PREFIX)) {
      throw new Error('Formato cifrado invalido');
    }

    const bytes = fromBase64(cipherText.slice(RSA_FORMAT_PREFIX.length));
    if (bytes.length === 0 || bytes.length % this.rsa.blockSize !== 0) {
      throw new Error('Contenido cifrado invalido');
    }

    const parts: Uint8Array[] = [];
    for (let offset = 0; offset < bytes.length; offset += this.rsa.blockSize) {
      parts.push(this.rsa.decryptBlock(bytes.slice(offset, offset + this.rsa.blockSize)));
    }

    const message = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let position = 0;
    for (const part of parts) {
      message.set(part, position);
      position += part.length;
    }

    return this.decoder.decode(message);
  }
}
