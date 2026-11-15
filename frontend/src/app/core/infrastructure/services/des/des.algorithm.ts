import { E, FP, IP, P, PC1, PC2, SBOXES, SHIFTS } from './des-tables';

export const BLOCK_SIZE = 8;

type Bits = number[];

/** Pasa bytes a un arreglo de bits (el bit mas significativo primero). */
function bytesToBits(bytes: Uint8Array): Bits {
  const bits: Bits = [];
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }
  return bits;
}

function bitsToBytes(bits: Bits): Uint8Array {
  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bits.length; i++) bytes[i >> 3] |= bits[i] << (7 - (i & 7));
  return bytes;
}

/** Reordena los bits segun una tabla de posiciones que empiezan en 1. */
function permute(bits: Bits, table: readonly number[]): Bits {
  return table.map((position) => bits[position - 1]);
}

function xor(a: Bits, b: Bits): Bits {
  return a.map((bit, i) => bit ^ b[i]);
}

function rotateLeft(bits: Bits, count: number): Bits {
  return [...bits.slice(count), ...bits.slice(0, count)];
}

/** Calendario de claves: genera las 16 subclaves de 48 bits. */
function generateSubkeys(key: Uint8Array): Bits[] {
  const permuted = permute(bytesToBits(key), PC1);
  let c = permuted.slice(0, 28);
  let d = permuted.slice(28);

  return SHIFTS.map((shift) => {
    c = rotateLeft(c, shift);
    d = rotateLeft(d, shift);
    return permute([...c, ...d], PC2);
  });
}

/** Funcion de Feistel: expansion, mezcla con la subclave, cajas S y permutacion P. */
function feistel(right: Bits, subkey: Bits): Bits {
  const mixed = xor(permute(right, E), subkey);
  const output: Bits = [];

  for (let box = 0; box < 8; box++) {
    const chunk = mixed.slice(box * 6, box * 6 + 6);
    const row = (chunk[0] << 1) | chunk[5];
    const column = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
    const value = SBOXES[box][row * 16 + column];
    for (let i = 3; i >= 0; i--) output.push((value >> i) & 1);
  }

  return permute(output, P);
}

/**
 * Implementacion manual de DES (cifrado de bloques de 64 bits con clave de 56 bits efectivos).
 *
 * No usa librerias ni dependencias externas. DES es un algoritmo obsoleto; se implementa
 * con fines academicos y no debe emplearse para proteger datos reales.
 */
export class DesAlgorithm {
  private readonly subkeys: Bits[];

  constructor(key: Uint8Array) {
    if (key.length !== BLOCK_SIZE) {
      throw new Error(`La clave DES debe tener ${BLOCK_SIZE} bytes`);
    }
    this.subkeys = generateSubkeys(key);
  }

  /** Cifra un bloque de 8 bytes. */
  encryptBlock(block: Uint8Array): Uint8Array {
    return this.processBlock(block, this.subkeys);
  }

  /** Descifra un bloque de 8 bytes (mismas rondas con las subclaves en orden inverso). */
  decryptBlock(block: Uint8Array): Uint8Array {
    return this.processBlock(block, [...this.subkeys].reverse());
  }

  /** Cifra con DES en modo CBC y relleno PKCS7. */
  encryptCbc(data: Uint8Array, iv: Uint8Array): Uint8Array {
    const padding = BLOCK_SIZE - (data.length % BLOCK_SIZE);
    const padded = new Uint8Array(data.length + padding).fill(padding);
    padded.set(data);

    const output = new Uint8Array(padded.length);
    let previous = iv;

    for (let offset = 0; offset < padded.length; offset += BLOCK_SIZE) {
      const block = padded.slice(offset, offset + BLOCK_SIZE).map((byte, i) => byte ^ previous[i]);
      previous = this.encryptBlock(block);
      output.set(previous, offset);
    }

    return output;
  }

  /** Descifra con DES en modo CBC y retira el relleno PKCS7. */
  decryptCbc(data: Uint8Array, iv: Uint8Array): Uint8Array {
    if (data.length === 0 || data.length % BLOCK_SIZE !== 0) {
      throw new Error('Longitud de datos cifrados invalida');
    }

    const output = new Uint8Array(data.length);
    let previous = iv;

    for (let offset = 0; offset < data.length; offset += BLOCK_SIZE) {
      const block = data.slice(offset, offset + BLOCK_SIZE);
      const decrypted = this.decryptBlock(block).map((byte, i) => byte ^ previous[i]);
      output.set(decrypted, offset);
      previous = block;
    }

    const padding = output[output.length - 1];
    if (padding < 1 || padding > BLOCK_SIZE) {
      throw new Error('Relleno invalido');
    }
    for (let i = output.length - padding; i < output.length; i++) {
      if (output[i] !== padding) throw new Error('Relleno invalido');
    }

    return output.slice(0, output.length - padding);
  }

  private processBlock(block: Uint8Array, subkeys: Bits[]): Uint8Array {
    if (block.length !== BLOCK_SIZE) {
      throw new Error(`El bloque DES debe tener ${BLOCK_SIZE} bytes`);
    }

    const permuted = permute(bytesToBits(block), IP);
    let left = permuted.slice(0, 32);
    let right = permuted.slice(32);

    for (const subkey of subkeys) {
      [left, right] = [right, xor(left, feistel(right, subkey))];
    }

    // En la ultima ronda no se intercambian las mitades
    return bitsToBytes(permute([...right, ...left], FP));
  }
}
