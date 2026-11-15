import { CreateDocumentoAdjuntoData } from '../../domain/repositories/documento-adjunto.repository.js';
import { DocumentoAdjunto } from '../../domain/entities/documento-adjunto.entity.js';
import { pool } from '../database/postgres.js';

interface DocumentoAdjuntoRow {
  id_adjunto: number;
  id_pqr: number;
  nombre_original: string;
  nombre_interno: string;
  extension: string;
  mime_type: string;
  tamano_bytes: string | number;
  ruta_archivo: string;
  id_usuario: number | null;
  fecha_carga: string | Date;
  nombre_usuario?: string | null;
}

/**
 * Datasource para persistencia de metadatos de documentos adjuntos en PostgreSQL.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class DocumentoAdjuntoDatasource {
  private toEntity(row: DocumentoAdjuntoRow): DocumentoAdjunto {
    return new DocumentoAdjunto(
      row.id_adjunto,
      row.id_pqr,
      row.nombre_original,
      row.nombre_interno,
      row.extension,
      row.mime_type,
      Number(row.tamano_bytes),
      row.ruta_archivo,
      new Date(row.fecha_carga),
      row.id_usuario,
      row.nombre_usuario ?? null
    );
  }

  async create(data: CreateDocumentoAdjuntoData): Promise<DocumentoAdjunto> {
    const { rows } = await pool.query<DocumentoAdjuntoRow>(
      `INSERT INTO documento_adjunto (
         id_pqr, nombre_original, nombre_interno, extension, mime_type, tamano_bytes, ruta_archivo, id_usuario
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.idPqr,
        data.nombreOriginal,
        data.nombreInterno,
        data.extension,
        data.mimeType,
        data.tamanoBytes,
        data.rutaArchivo,
        data.idUsuario ?? null,
      ]
    );

    const createdRow = rows[0]!;

    // Si tiene usuario, obtenemos el nombre para conveniencia de la UI
    if (createdRow.id_usuario) {
      const uRes = await pool.query<{ nombre: string }>(
        'SELECT nombre FROM usuario WHERE id_usuario = $1',
        [createdRow.id_usuario]
      );
      if (uRes.rows[0]) {
        createdRow.nombre_usuario = uRes.rows[0].nombre;
      }
    }

    return this.toEntity(createdRow);
  }

  async findByPqrId(idPqr: number): Promise<DocumentoAdjunto[]> {
    const { rows } = await pool.query<DocumentoAdjuntoRow>(
      `SELECT d.*, u.nombre AS nombre_usuario
       FROM documento_adjunto d
       LEFT JOIN usuario u ON d.id_usuario = u.id_usuario
       WHERE d.id_pqr = $1
       ORDER BY d.fecha_carga ASC`,
      [idPqr]
    );
    return rows.map((r) => this.toEntity(r));
  }

  async findById(idAdjunto: number): Promise<DocumentoAdjunto | null> {
    const { rows } = await pool.query<DocumentoAdjuntoRow>(
      `SELECT d.*, u.nombre AS nombre_usuario
       FROM documento_adjunto d
       LEFT JOIN usuario u ON d.id_usuario = u.id_usuario
       WHERE d.id_adjunto = $1`,
      [idAdjunto]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async delete(idAdjunto: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM documento_adjunto WHERE id_adjunto = $1',
      [idAdjunto]
    );
    return (rowCount ?? 0) > 0;
  }
}
