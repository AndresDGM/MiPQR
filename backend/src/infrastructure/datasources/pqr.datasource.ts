import {
  CreatePqrData,
  PqrHistoryRecord,
  PqrRecord,
  PqrResponseRecord,
  PqrStatusName,
} from '../../domain/repositories/pqr.repository.js';
import { pool } from '../database/postgres.js';

interface PqrRow {
  id_pqr: number;
  codigo_seguimiento: string;
  id_solicitante: number | null;
  nombre_solicitante: string | null;
  correo_solicitante: string | null;
  identificacion_solicitante: string | null;
  telefono_solicitante?: string | null;
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
  fecha_limite?: string | Date | null;
  fecha_cierre: string | Date | null;
  alerta_vencimiento_enviada?: boolean;
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
      telefonoSolicitante: row.telefono_solicitante ?? null,
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
      fechaLimite: row.fecha_limite ? new Date(row.fecha_limite) : null,
      fechaCierre: row.fecha_cierre ? new Date(row.fecha_cierre) : null,
      alertaVencimientoEnviada: Boolean(row.alerta_vencimiento_enviada),
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

    const hasIa = !!data.categoriaSugeridaIa;
    const catResult = await pool.query<{ nombre: string }>(
      'SELECT nombre FROM categoria WHERE id_categoria = $1',
      [data.idCategoria]
    );
    const nombreCategoria = catResult.rows[0]?.nombre ?? 'General';

    const { rows } = await pool.query<PqrRow>(
      `INSERT INTO pqr (
         codigo_seguimiento, id_solicitante, nombre_solicitante, correo_solicitante,
         identificacion_solicitante, telefono_solicitante, id_categoria, categoria, id_estado, estado,
         tipo_pqr, asunto, descripcion, fecha_registro, fecha_limite,
         categoria_sugerida_ia, confianza_ia, estado_revision_ia, fecha_clasificacion_ia, version_modelo_ia
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 'Recibida', $9, $10, $11, NOW(), $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        codigo,
        data.idSolicitante ?? null,
        data.nombreSolicitante,
        data.correoSolicitante,
        data.identificacionSolicitante,
        data.telefonoSolicitante ?? null,
        data.idCategoria,
        nombreCategoria,
        data.tipoPqr,
        data.asunto,
        data.descripcion,
        data.fechaLimite ?? new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        data.categoriaSugeridaIa ?? null,
        data.confianzaIa ?? null,
        hasIa ? 'PENDIENTE' : null,
        hasIa ? new Date() : null,
        data.versionModeloIa ?? null,
      ]
    );

    const created = this.toRecord(rows[0]!);

    await pool.query(
      `INSERT INTO historial_pqr (id_pqr, id_usuario, id_estado, estado, accion, observacion)
       VALUES ($1, $2, 1, 'Recibida', 'Radicación', $3)`,
      [created.idPqr, data.idSolicitante ?? null, `Solicitud radicada con código ${codigo}.`]
    );

    return created;
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
           id_usuario_revision_ia = $4,
           fecha_clasificacion_ia = NOW()
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

    await pool.query(
      `INSERT INTO historial_pqr (id_pqr, id_usuario, id_estado, estado, accion, observacion)
       VALUES ($1, $2, $3, $4, 'Asignación de responsable', $5)`,
      [
        idPqr,
        idResponsable,
        updated.idEstado,
        updated.estado,
        `Caso asignado a ${updated.nombreResponsable ?? `usuario #${idResponsable}`}.`,
      ]
    );

    return updated;
  }

  async updateEstado(
    idPqr: number,
    idEstado: number,
    estado: PqrStatusName,
    idUsuario?: number | null,
    observacion?: string
  ): Promise<PqrRecord> {
    const fechaCierreSql = estado === 'Cerrada' ? ', fecha_cierre = NOW()' : '';
    const { rowCount } = await pool.query(
      `UPDATE pqr
       SET id_estado = $1,
           estado = $2
           ${fechaCierreSql}
       WHERE id_pqr = $3`,
      [idEstado, estado, idPqr]
    );

    if (rowCount === 0) {
      throw new Error(`PQR con ID ${idPqr} no encontrada`);
    }

    await pool.query(
      `INSERT INTO historial_pqr (id_pqr, id_usuario, id_estado, estado, accion, observacion)
       VALUES ($1, $2, $3, $4, 'Cambio de estado', $5)`,
      [idPqr, idUsuario ?? null, idEstado, estado, observacion?.trim() || `Estado actualizado a "${estado}".`]
    );

    const updated = await this.findById(idPqr);
    if (!updated) {
      throw new Error(`PQR con ID ${idPqr} no encontrada`);
    }
    return updated;
  }

  async getHistorial(idPqr: number): Promise<PqrHistoryRecord[]> {
    const { rows } = await pool.query<{
      id_historial: number;
      id_pqr: number;
      id_usuario: number | null;
      nombre_usuario: string | null;
      id_estado: number;
      estado: PqrStatusName;
      accion: string;
      observacion: string;
      fecha: string | Date;
    }>(
      `SELECT h.id_historial, h.id_pqr, h.id_usuario, u.nombre AS nombre_usuario,
              h.id_estado, h.estado, h.accion, h.observacion, h.fecha
       FROM historial_pqr h
       LEFT JOIN usuario u ON h.id_usuario = u.id_usuario
       WHERE h.id_pqr = $1
       ORDER BY h.fecha ASC, h.id_historial ASC`,
      [idPqr]
    );

    return rows.map((row) => ({
      idHistorial: row.id_historial,
      idPqr: row.id_pqr,
      idUsuario: row.id_usuario,
      nombreUsuario: row.nombre_usuario,
      idEstado: row.id_estado,
      estado: row.estado,
      accion: row.accion,
      observacion: row.observacion,
      fecha: new Date(row.fecha),
    }));
  }

  async responder(idPqr: number, idUsuario: number, contenido: string): Promise<PqrResponseRecord> {
    const { rows } = await pool.query<{
      id_respuesta: number;
      id_pqr: number;
      id_usuario: number | null;
      contenido: string;
      fecha_respuesta: string | Date;
    }>(
      `INSERT INTO respuesta_pqr (id_pqr, id_usuario, contenido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [idPqr, idUsuario, contenido]
    );

    await pool.query(
      `UPDATE pqr
       SET id_estado = 5,
           estado = 'Respondida'
       WHERE id_pqr = $1 AND estado != 'Cerrada'`,
      [idPqr]
    );

    await pool.query(
      `INSERT INTO historial_pqr (id_pqr, id_usuario, id_estado, estado, accion, observacion)
       VALUES ($1, $2, 5, 'Respondida', 'Respuesta emitida', $3)`,
      [idPqr, idUsuario, contenido]
    );

    const userRes = await pool.query<{ nombre: string }>(
      'SELECT nombre FROM usuario WHERE id_usuario = $1',
      [idUsuario]
    );

    const created = rows[0]!;
    return {
      idRespuesta: created.id_respuesta,
      idPqr: created.id_pqr,
      idUsuario: created.id_usuario,
      nombreUsuario: userRes.rows[0]?.nombre ?? null,
      contenido: created.contenido,
      fechaRespuesta: new Date(created.fecha_respuesta),
    };
  }

  async findProximasAVencer(horasRestantes: number): Promise<PqrRecord[]> {
    const { rows } = await pool.query<PqrRow>(
      `SELECT p.*, r.nombre AS nombre_responsable
       FROM pqr p
       LEFT JOIN usuario r ON p.id_responsable = r.id_usuario
       WHERE p.estado NOT IN ('Respondida', 'Cerrada')
         AND p.alerta_vencimiento_enviada = FALSE
         AND p.fecha_limite IS NOT NULL
         AND p.fecha_limite <= NOW() + ($1 * INTERVAL '1 hour')
       ORDER BY p.fecha_limite ASC`,
      [horasRestantes]
    );
    return rows.map((row) => this.toRecord(row));
  }

  async markAlertaVencimientoEnviada(idPqr: number): Promise<void> {
    await pool.query(
      'UPDATE pqr SET alerta_vencimiento_enviada = TRUE WHERE id_pqr = $1',
      [idPqr]
    );
  }
}
