import { Pool } from 'pg';
import { envs } from '../../config/envs.js';
import { CipherService } from '../../domain/services/cipher.service.js';
import { RSA_FORMAT_PREFIX } from '../services/rsa-cipher.adapter.js';
import { schemaSql, seedSql } from './schema.js';

export const pool = new Pool({
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  user: envs.DB_USER,
  password: envs.DB_PASSWORD,
  database: envs.DB_NAME,
});

/** Contrasena de los usuarios de ejemplo (se guarda cifrada) */
const SEED_PASSWORD = '1234';

const USUARIOS_SEED: [number, number, string, string, string, boolean][] = [
  [1, 2, 'Carolina Gomez', 'carolina.gomez@dolormed.com', '1010101001', true],
  [2, 3, 'Fernando Salazar', 'fernando.salazar@dolormed.com', '1010101002', true],
  [3, 3, 'Laura Ortiz', 'laura.ortiz@dolormed.com', '1010101003', true],
  [4, 4, 'Maria Valencia', 'maria.valencia@dolormed.com', '1010101004', true],
  [5, 1, 'Carlos Restrepo', 'carlos.restrepo@gmail.com', '1010101005', true],
  [6, 1, 'Ana Torres', 'ana.torres@gmail.com', '1010101006', false],
];

/**
 * Crea las tablas si no existen, carga los datos iniciales y protege las contrasenas.
 * Es idempotente: puede ejecutarse en cada arranque sin duplicar informacion.
 */
export async function initDatabase(passwordCipher: CipherService): Promise<void> {
  await pool.query(schemaSql);
  await pool.query(seedSql);
  await seedUsuarios(passwordCipher);
  await encryptLegacyPasswords(passwordCipher);
}

/** Inserta los usuarios de ejemplo con la contrasena cifrada (solo si no existen). */
async function seedUsuarios(passwordCipher: CipherService): Promise<void> {
  const { rows } = await pool.query<{ total: string }>('SELECT COUNT(*) AS total FROM usuario');
  if (Number(rows[0].total) === 0) {
    for (const [id, idRol, nombre, correo, identificacion, activo] of USUARIOS_SEED) {
      await pool.query(
        `INSERT INTO usuario (id_usuario, id_rol, nombre, correo, identificacion, password, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id_usuario) DO NOTHING`,
        [id, idRol, nombre, correo, identificacion, passwordCipher.encrypt(SEED_PASSWORD), activo]
      );
    }
  }

  // Alinea la secuencia con los ids insertados a mano
  await pool.query(
    `SELECT setval(
       pg_get_serial_sequence('usuario', 'id_usuario'),
       GREATEST((SELECT COALESCE(MAX(id_usuario), 1) FROM usuario), 1)
     )`
  );
}

/** Cifra las contrasenas que todavia estan en texto plano (bases anteriores al cifrado). */
async function encryptLegacyPasswords(passwordCipher: CipherService): Promise<void> {
  const { rows } = await pool.query<{ id_usuario: number; password: string }>(
    'SELECT id_usuario, password FROM usuario WHERE password NOT LIKE $1',
    [`${RSA_FORMAT_PREFIX}%`]
  );

  for (const { id_usuario, password } of rows) {
    await pool.query('UPDATE usuario SET password = $2 WHERE id_usuario = $1', [
      id_usuario,
      passwordCipher.encrypt(password),
    ]);
  }

  if (rows.length > 0) {
    console.log(`Se cifraron ${rows.length} contrasenas que estaban en texto plano`);
  }
}
