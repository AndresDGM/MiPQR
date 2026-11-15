import {
  bigIntToBytes,
  bitLength,
  bytesToBigInt,
  gcd,
  generatePrime,
  modInverse,
  modPow,
} from './bigint-utils.js';

export interface RsaPublicKey {
  n: bigint;
  e: bigint;
}

export interface RsaPrivateKey {
  n: bigint;
  d: bigint;
}

export interface RsaKeyPair {
  publicKey: RsaPublicKey;
  privateKey: RsaPrivateKey;
}

/** Exponente publico estandar (F4) */
export const PUBLIC_EXPONENT = 65537n;

/** Bytes minimos de relleno aleatorio de PKCS#1 v1.5 */
const MIN_PADDING = 8;
/** Bytes de cabecera de PKCS#1 v1.5: 0x00 0x02 ... 0x00 */
const PADDING_OVERHEAD = 3 + MIN_PADDING;

/**
 * Implementacion manual de RSA con relleno PKCS#1 v1.5 (tipo 2, aleatorio).
 *
 * Usa solo BigInt nativo y sin librerias externas. El relleno aleatorio hace que
 * cifrar dos veces el mismo mensaje produzca resultados distintos.
 */
export class RsaAlgorithm {
  /** Longitud del modulo en bytes; todo bloque cifrado ocupa exactamente esta longitud. */
  readonly blockSize: number;

  /** Maximo de bytes de mensaje que caben en un bloque. */
  readonly maxMessageSize: number;

  constructor(
    private readonly n: bigint,
    private readonly e?: bigint,
    private readonly d?: bigint
  ) {
    this.blockSize = Math.ceil(bitLength(n) / 8);
    this.maxMessageSize = this.blockSize - PADDING_OVERHEAD;
    if (this.maxMessageSize < 1) throw new Error('El modulo RSA es demasiado pequeno');
  }

  /** Genera un par de claves con un modulo de `bits` bits. */
  static generateKeyPair(bits = 1024): RsaKeyPair {
    for (;;) {
      const p = generatePrime(bits / 2);
      const q = generatePrime(bits / 2);
      if (p === q) continue;

      const n = p * q;
      if (bitLength(n) !== bits) continue;

      const phi = (p - 1n) * (q - 1n);
      if (gcd(PUBLIC_EXPONENT, phi) !== 1n) continue;

      const d = modInverse(PUBLIC_EXPONENT, phi);
      return { publicKey: { n, e: PUBLIC_EXPONENT }, privateKey: { n, d } };
    }
  }

  /** Cifra un mensaje de hasta `maxMessageSize` bytes y devuelve un bloque de `blockSize` bytes. */
  encryptBlock(message: Uint8Array): Uint8Array {
    if (this.e === undefined) throw new Error('Falta la clave publica');
    if (message.length > this.maxMessageSize) throw new Error('El mensaje excede el tamano del bloque');

    // EM = 0x00 || 0x02 || PS (bytes aleatorios distintos de cero) || 0x00 || M
    const padded = new Uint8Array(this.blockSize);
    padded[1] = 2;
    const paddingLength = this.blockSize - message.length - 3;
    for (let i = 0; i < paddingLength; i++) padded[2 + i] = this.randomNonZeroByte();
    padded.set(message, 3 + paddingLength);

    const cipher = modPow(bytesToBigInt(padded), this.e, this.n);
    return bigIntToBytes(cipher, this.blockSize);
  }

  /** Descifra un bloque de `blockSize` bytes y devuelve el mensaje original. */
  decryptBlock(block: Uint8Array): Uint8Array {
    if (this.d === undefined) throw new Error('Falta la clave privada');
    if (block.length !== this.blockSize) throw new Error('Longitud de bloque invalida');

    const cipher = bytesToBigInt(block);
    if (cipher >= this.n) throw new Error('Bloque cifrado invalido');

    const padded = bigIntToBytes(modPow(cipher, this.d, this.n), this.blockSize);
    if (padded[0] !== 0 || padded[1] !== 2) throw new Error('Relleno invalido');

    let separator = 2;
    while (separator < padded.length && padded[separator] !== 0) separator++;
    if (separator >= padded.length || separator < 2 + MIN_PADDING) throw new Error('Relleno invalido');

    return padded.slice(separator + 1);
  }

  private randomNonZeroByte(): number {
    for (;;) {
      const byte = globalThis.crypto.getRandomValues(new Uint8Array(1))[0];
      if (byte !== 0) return byte;
    }
  }
}
