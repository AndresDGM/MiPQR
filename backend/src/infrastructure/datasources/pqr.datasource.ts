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
  categoria_sugerida_ia?: string | null;
  confianza_ia?: number | null;
  estado_revision_ia?: string | null;
  fecha_clasificacion_ia?: string | Date | null;
  version_modelo_ia?: string | null;
  id_usuario_revision_ia?: number | null;
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
      categoriaSugeridaIa: row.categoria_sugerida_ia ?? null,
      confianzaIa: row.confianza_ia !== undefined && row.confianza_ia !== null ? Number(row.confianza_ia) : null,
      estadoRevisionIa: (row.estado_revision_ia as any) || 'PENDIENTE',
      fechaClasificacionIa: row.fecha_clasificacion_ia ? new Date(row.fecha_clasificacion_ia) : null,
      versionModeloIa: row.version_modelo_ia ?? null,
      idUsuarioRevisionIa: row.id_usuario_revision_ia ?? null,
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
    // Generar código de seguimiento PQR-YYYY-XXXX
    const { rows: countRows } = await pool.query<{ total: string }>('SELECT COUNT(*) AS total FROM pqr');
    const seq = Number(countRows[0]?.total ?? 0) + 1;
    const year = new Date().getFullYear();
    const codigo = `PQR-${year}-${String(seq).padStart(4, '0')}`;

    const hasIa = !!data.categoriaSugeridaIa;
    const { rows } = await pool.query<PqrRow>(
      `INSERT INTO pqr (
         codigo_seguimiento, id_solicitante, nombre_solicitante, correo_solicitante,
         identificacion_solicitante, id_categoria, categoria, id_estado, estado,
         tipo_pqr, asunto, descripcion, fecha_registro,
         categoria_sugerida_ia, confianza_ia, estado_revision_ia, fecha_clasificacion_ia, version_modelo_ia
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 'Recibida', $8, $9, $10, NOW(), $11, $12, $13, $14, $15)
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
        data.categoriaSugeridaIa ?? null,
        data.confianzaIa ?? null,
        hasIa ? 'PENDIENTE' : null,
        hasIa ? new Date() : null,
        data.versionModeloIa ?? null,
      ]
    );

    return this.toRecord(rows[0]!);
  }

  async updateCategoria(
    idPqr: number,
    idCategoria: number,
    categoria: string,
    estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA',
    idUsuarioRevision?: number | null
  ): Promise<PqrRecord> {
    const { rows } = await pool.query<PqrRow>(
      `UPDATE pqr
       SET id_categoria = $1,
           categoria = $2,
           estado_revision_ia = $3,
           id_usuario_revision_ia = $4
       WHERE id_pqr = $5
       RETURNING *`,
      [idCategoria, categoria, estadoRevisionIa, idUsuarioRevision ?? null, idPqr]
    );

    if (!rows[0]) {
      throw new Error(`PQR con ID ${idPqr} no encontrada`);
    }

    const record = await this.findById(idPqr);
    return record || this.toRecord(rows[0]);
  }
}
