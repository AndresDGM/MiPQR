import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toHex } from '../src/infrastructure/services/rsa/bigint-utils.js';
import { RsaAlgorithm } from '../src/infrastructure/services/rsa/rsa.algorithm.js';

/**
 * Genera un par de claves RSA de 1024 bits y las agrega a .env.
 *
 * Si ya existen claves en .env no las reemplaza: las contrasenas guardadas con
 * la clave anterior dejarian de poder leerse.
 */
const envPath = resolve(process.cwd(), '.env');
const current = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';

if (/^RSA_N=/m.test(current)) {
  console.error('Ya existen claves RSA en .env. Eliminelas manualmente solo si acepta perder las contrasenas guardadas.');
  process.exit(1);
}

console.log('Generando claves RSA de 1024 bits...');
const { publicKey, privateKey } = RsaAlgorithm.generateKeyPair(1024);

const lines = [
  '',
  '# Claves RSA (hexadecimal) con las que se protegen las contrasenas en la base de datos',
  `RSA_N=${toHex(publicKey.n)}`,
  `RSA_E=${toHex(publicKey.e)}`,
  `RSA_D=${toHex(privateKey.d)}`,
  '',
];
appendFileSync(envPath, lines.join('\n'));
console.log('Claves agregadas a .env (RSA_N, RSA_E, RSA_D). No las versione ni las comparta.');
