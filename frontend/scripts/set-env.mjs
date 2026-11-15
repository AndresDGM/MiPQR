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

writeFileSync(envFilePath, updated, 'utf8');
console.log(`environment.ts actualizado con baseUrlNode: ${baseUrl}`);
