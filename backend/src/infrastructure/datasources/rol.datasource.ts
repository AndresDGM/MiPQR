import { Rol, RolNombre } from '../../domain/entities/rol.entity.js';
import { pool } from '../database/postgres.js';

interface RolRow {
  id_rol: number;
  nombre: RolNombre;
  descripcion: string;
}

export class RolDatasource {
  private toEntity(row: RolRow): Rol {
    return new Rol(row.id_rol, row.nombre, row.descripcion);
  }

  async getAll(): Promise<Rol[]> {
    const { rows } = await pool.query<RolRow>('SELECT * FROM rol ORDER BY id_rol');
    return rows.map((r) => this.toEntity(r));
  }

  async getById(idRol: number): Promise<Rol | null> {
    const { rows } = await pool.query<RolRow>('SELECT * FROM rol WHERE id_rol = $1', [idRol]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async getByNombre(nombre: string): Promise<Rol | null> {
    const { rows } = await pool.query<RolRow>(
      'SELECT * FROM rol WHERE LOWER(nombre) = LOWER($1)',
      [nombre.trim()]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}
