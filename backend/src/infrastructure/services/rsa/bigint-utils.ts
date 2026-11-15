/**
 * Aritmetica de enteros grandes para RSA, implementada sobre el tipo nativo BigInt.
 * No usa librerias externas.
 */

const SMALL_PRIMES = [
  2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n,
  73n, 79n, 83n, 89n, 97n, 101n, 103n, 107n, 109n, 113n, 127n, 131n, 137n, 139n, 149n, 151n,
];

export function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) result = (result << 8n) | BigInt(byte);
  return result;
}

/** Convierte a bytes de longitud fija (big-endian). Falla si el valor no cabe. */
export function bigIntToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  if (value !== 0n) throw new Error('El valor no cabe en la longitud indicada');
  return bytes;
}

export function bitLength(value: bigint): number {
  return value === 0n ? 0 : value.toString(2).length;
}

export function toHex(value: bigint): string {
  return value.toString(16);
}

export function fromHex(hex: string): bigint {
  if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error('Valor hexadecimal invalido');
  return BigInt(`0x${hex}`);
}

/** Exponenciacion modular por cuadrados sucesivos: base^exp mod mod. */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;

  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }

  return result;
}

export function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/** Inverso multiplicativo de a modulo m con el algoritmo de Euclides extendido. */
export function modInverse(a: bigint, m: bigint): bigint {
  let [oldR, r] = [a % m, m];
  let [oldS, s] = [1n, 0n];

  while (r !== 0n) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }

  if (oldR !== 1n) throw new Error('El valor no tiene inverso modular');
  return ((oldS % m) + m) % m;
}

/** Entero aleatorio de exactamente `bits` bits (el bit mas alto en 1). */
export function randomBigInt(bits: number): bigint {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(Math.ceil(bits / 8)));
  let value = bytesToBigInt(bytes);
  value &= (1n << BigInt(bits)) - 1n;
  return value | (1n << BigInt(bits - 1));
}

/** Entero aleatorio en el rango [min, max]. */
function randomBetween(min: bigint, max: bigint): bigint {
  const range = max - min + 1n;
  return min + (randomBigInt(bitLength(range) + 64) % range);
}

/** Prueba de primalidad de Miller-Rabin precedida de division por primos pequenos. */
export function isProbablePrime(candidate: bigint, rounds = 40): boolean {
  if (candidate < 2n) return false;

  for (const prime of SMALL_PRIMES) {
    if (candidate === prime) return true;
    if (candidate % prime === 0n) return false;
  }

  // candidate - 1 = d * 2^s con d impar
  let d = candidate - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  for (let round = 0; round < rounds; round++) {
    const a = randomBetween(2n, candidate - 2n);
    let x = modPow(a, d, candidate);
    if (x === 1n || x === candidate - 1n) continue;

    let composite = true;
    for (let i = 1; i < s; i++) {
      x = (x * x) % candidate;
      if (x === candidate - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }

  return true;
}

/** Genera un primo probable de exactamente `bits` bits. */
export function generatePrime(bits: number): bigint {
  for (;;) {
    const candidate = randomBigInt(bits) | 1n;
    if (isProbablePrime(candidate)) return candidate;
  }
}
