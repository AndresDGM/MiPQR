import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carga variables desde `.env` si existe, manteniendo prioridad
 * para las variables de entorno ya definidas en el sistema (CI/CD).
 */
function loadDotEnv(envPath) {
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(resolve(process.cwd(), '.env'));

const domain = process.env.DOMAIN?.trim();
const apiPrefix = (process.env.API_PREFIX ?? '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');

let baseUrl = process.env.BASE_URL?.trim();
if (!baseUrl && domain) {
  baseUrl = apiPrefix ? `https://${domain}/${apiPrefix}` : `https://${domain}`;
}
baseUrl = (baseUrl || 'http://localhost:3000').replace(/\/+$/, '');

const envFilePath = resolve(process.cwd(), 'src/environments/environment.ts');
let updated = readFileSync(envFilePath, 'utf8').replace(
  /baseUrlNode:\s*['"][^'"]*['"]/,
  `baseUrlNode: '${baseUrl}'`
);

const desKey = process.env.DES_KEY?.trim();
if (desKey) {
  updated = updated.replace(/desKey:\s*['"][^'"]*['"]/, `desKey: '${desKey}'`);
}

const VALID_ADAPTERS = new Set(['local', 'node']);
const globalAdapter = process.env.ADAPTER_MODE?.trim().toLowerCase();
const adapterModules = [
  ['auth', process.env.ADAPTER_AUTH],
  ['users', process.env.ADAPTER_USERS],
  ['pqrs', process.env.ADAPTER_PQRS],
  ['categories', process.env.ADAPTER_CATEGORIES],
  ['attachments', process.env.ADAPTER_ATTACHMENTS],
];

for (const [moduleName, rawValue] of adapterModules) {
  const value = (rawValue?.trim().toLowerCase() || globalAdapter);
  if (value && VALID_ADAPTERS.has(value)) {
    const pattern = new RegExp(`(${moduleName}:\\s*)['"](?:local|node)['"](\\s*as const)`);
    updated = updated.replace(pattern, `$1'${value}'$2`);
  }
}

writeFileSync(envFilePath, updated, 'utf8');
console.log(`environment.ts actualizado con baseUrlNode: ${baseUrl}`);
