import { CreateUsuarioDto } from '../../domain/dtos/create-usuario.dto.js';
import { UpdateUsuarioDto } from '../../domain/dtos/update-usuario.dto.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { CustomError } from '../../domain/errors/custom.error.js';
import { pool } from '../database/postgres.js';

interface UsuarioRow {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  correo: string;
  identificacion: string;
  password: string;
  activo: boolean;
}

const UNIQUE_VIOLATION = '23505';

export class UsuarioDatasource {
  private toEntity(row: UsuarioRow): Usuario {
    return new Usuario(
      row.id_usuario,
      row.id_rol,
      row.nombre,
      row.correo,
      row.identificacion,
      row.password,
      row.activo
    );
  }

  /** Traduce la violacion de unicidad de la base a un error de dominio. */
  private handleError(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const { code, constraint } = error as { code: string; constraint?: string };
      if (code === UNIQUE_VIOLATION) {
        if (constraint?.includes('identificacion')) {
          throw CustomError.conflict('La identificacion ya se encuentra registrada');
        }
        throw CustomError.conflict('El correo ya se encuentra registrado');
      }
    }
    throw error;
  }

  async getAll(count?: number): Promise<Usuario[]> {
    const hasLimit = typeof count === 'number' && count > 0;
    const { rows } = hasLimit
      ? await pool.query<UsuarioRow>('SELECT * FROM usuario ORDER BY id_usuario LIMIT $1', [count])
      : await pool.query<UsuarioRow>('SELECT * FROM usuario ORDER BY id_usuario');
    return rows.map((r) => this.toEntity(r));
  }

  async getById(idUsuario: number): Promise<Usuario | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuario WHERE id_usuario = $1',
      [idUsuario]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async getByCorreo(correo: string): Promise<Usuario | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async getByIdentificacion(identificacion: string): Promise<Usuario | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuario WHERE identificacion = $1',
      [identificacion.trim()]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async getByRol(idRol: number): Promise<Usuario[]> {
    const { rows } = await pool.query<UsuarioRow>(
      'SELECT * FROM usuario WHERE id_rol = $1 ORDER BY id_usuario',
      [idRol]
    );
    return rows.map((r) => this.toEntity(r));
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    try {
      const { rows } = await pool.query<UsuarioRow>(
        `INSERT INTO usuario (id_rol, nombre, correo, identificacion, password, activo)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING *`,
        [dto.idRol, dto.nombre, dto.correo, dto.identificacion, dto.password]
      );
      return this.toEntity(rows[0]);
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(idUsuario: number, dto: UpdateUsuarioDto): Promise<Usuario | null> {
    try {
      // COALESCE conserva el valor actual de los campos que no se envian
      const { rows } = await pool.query<UsuarioRow>(
        `UPDATE usuario SET
           id_rol         = COALESCE($2, id_rol),
           nombre         = COALESCE($3, nombre),
           correo         = COALESCE($4, correo),
           identificacion = COALESCE($5, identificacion)
         WHERE id_usuario = $1
         RETURNING *`,
        [idUsuario, dto.idRol ?? null, dto.nombre ?? null, dto.correo ?? null, dto.identificacion ?? null]
      );
      return rows[0] ? this.toEntity(rows[0]) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async setActivo(idUsuario: number, activo: boolean): Promise<Usuario | null> {
    const { rows } = await pool.query<UsuarioRow>(
      'UPDATE usuario SET activo = $2 WHERE id_usuario = $1 RETURNING *',
      [idUsuario, activo]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}
