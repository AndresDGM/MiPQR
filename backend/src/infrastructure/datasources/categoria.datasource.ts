import { Categoria } from '../../domain/entities/categoria.entity.js';
import { pool } from '../database/postgres.js';

interface CategoriaRow {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export class CategoriaDatasource {
  private toEntity(row: CategoriaRow): Categoria {
    return new Categoria({
      idCategoria: row.id_categoria,
      nombre: row.nombre,
      descripcion: row.descripcion,
      activa: row.activa,
    });
  }

  async getAll(): Promise<Categoria[]> {
    const { rows } = await pool.query<CategoriaRow>(
      'SELECT id_categoria, nombre, descripcion, activa FROM categoria WHERE activa = TRUE ORDER BY id_categoria'
    );
    return rows.map((row) => this.toEntity(row));
  }

  async getById(idCategoria: number): Promise<Categoria | null> {
    const { rows } = await pool.query<CategoriaRow>(
      'SELECT id_categoria, nombre, descripcion, activa FROM categoria WHERE id_categoria = $1',
      [idCategoria]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }
}
