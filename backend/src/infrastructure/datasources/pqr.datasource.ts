import { CreatePqrData, PqrRecord } from '../../domain/repositories/pqr.repository.js';
import { pool } from '../database/postgres.js';

interface PqrRow {
  id_pqr: number;
  codigo_seguimiento: string;
  id_solicitante: number | null;
  nombre_solicitante: string | null;
  correo_solicitante: string | null;
  identificacion_solicitante: string | null;
  id_categoria: number;
  categoria: string;
  id_estado: number;
  estado: string;
  id_responsable: number | null;
  nombre_responsable?: string | null;
  tipo_pqr: string;
  asunto: string;
  descripcion: string;
  fecha_registro: string | Date;
  fecha_cierre: string | Date | null;
}

/**
 * Datasource de persistencia para la entidad PQR en PostgreSQL.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class PqrDatasource {
  private toRecord(row: PqrRow): PqrRecord {
    return {
      idPqr: row.id_pqr,
      codigoSeguimiento: row.codigo_seguimiento,
      idSolicitante: row.id_solicitante,
      nombreSolicitante: row.nombre_solicitante,
      correoSolicitante: row.correo_solicitante,
      identificacionSolicitante: row.identificacion_solicitante,
      idCategoria: row.id_categoria,
      categoria: row.categoria,
      idEstado: row.id_estado,
      estado: row.estado,
      idResponsable: row.id_responsable,
      nombreResponsable: row.nombre_responsable,
      tipoPqr: row.tipo_pqr,
      asunto: row.asunto,
      descripcion: row.descripcion,
      fechaRegistro: new Date(row.fecha_registro),
      fechaCierre: row.fecha_cierre ? new Date(row.fecha_cierre) : null,
    };
  }

  async getAll(limit?: number): Promise<PqrRecord[]> {
    const query = `
      SELECT p.*, r.nombre AS nombre_responsable
      FROM pqr p
      LEFT JOIN usuario r ON p.id_responsable = r.id_usuario
      ORDER BY p.id_pqr DESC
      ${limit ? 'LIMIT $1' : ''}
    `;
    const params = limit ? [limit] : [];
    const { rows } = await pool.query<PqrRow>(query, params);
    return rows.map((r) => this.toRecord(r));
  }

  async findById(idPqr: number): Promise<PqrRecord | null> {
    const { rows } = await pool.query<PqrRow>(
      `SELECT p.*, r.nombre AS nombre_responsable
       FROM pqr p
       LEFT JOIN usuario r ON p.id_responsable = r.id_usuario
       WHERE p.id_pqr = $1`,
      [idPqr]
    );
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findByCodigo(codigo: string): Promise<PqrRecord | null> {
    const clean = codigo.trim().toUpperCase();
    const { rows } = await pool.query<PqrRow>(
      `SELECT p.*, r.nombre AS nombre_responsable
       FROM pqr p
       LEFT JOIN usuario r ON p.id_responsable = r.id_usuario
       WHERE UPPER(p.codigo_seguimiento) = $1`,
      [clean]
    );
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async create(data: CreatePqrData): Promise<PqrRecord> {
    // Generar código de seguimiento atómico y seguro contra concurrencia: PQR-YYYY-XXXX
    const year = new Date().getFullYear();
    let seq: number;
    try {
      const { rows: seqRows } = await pool.query<{ seq: string }>(
        "SELECT nextval('pqr_codigo_seq') AS seq"
      );
      seq = Number(seqRows[0]?.seq ?? 1);
    } catch {
      const { rows: countRows } = await pool.query<{ total: string }>('SELECT COUNT(*) AS total FROM pqr');
      seq = Number(countRows[0]?.total ?? 0) + 1;
    }
    const codigo = `PQR-${year}-${String(seq).padStart(4, '0')}`;

    const { rows } = await pool.query<PqrRow>(
      `INSERT INTO pqr (
         codigo_seguimiento, id_solicitante, nombre_solicitante, correo_solicitante,
         identificacion_solicitante, id_categoria, categoria, id_estado, estado,
         tipo_pqr, asunto, descripcion, fecha_registro
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'Recibida', $8, $9, $10, NOW())
       RETURNING *`,
      [
        codigo,
        data.idSolicitante ?? null,
        data.nombreSolicitante,
        data.correoSolicitante,
        data.identificacionSolicitante,
        data.idCategoria,
        'General',
        data.tipoPqr,
        data.asunto,
        data.descripcion,
      ]
    );

    return this.toRecord(rows[0]!);
  }

  async assignResponsable(idPqr: number, idResponsable: number): Promise<PqrRecord> {
    const { rowCount } = await pool.query(
      `UPDATE pqr
       SET id_responsable = $1,
           id_estado = CASE WHEN id_estado IN (1, 2) THEN 3 ELSE id_estado END,
           estado = CASE WHEN estado IN ('Recibida', 'En revision') THEN 'Asignada' ELSE estado END
       WHERE id_pqr = $2 AND estado != 'Cerrada'`,
      [idResponsable, idPqr]
    );

    if (rowCount === 0) {
      const current = await this.findById(idPqr);
      if (!current) {
        throw new Error(`PQR con ID ${idPqr} no encontrada`);
      }
      if (current.estado === 'Cerrada') {
        throw new Error(`No es posible reasignar una PQR que ya se encuentra cerrada`);
      }
    }

    const updated = await this.findById(idPqr);
    if (!updated) {
      throw new Error(`PQR con ID ${idPqr} no encontrada`);
    }
    return updated;
  }
}
