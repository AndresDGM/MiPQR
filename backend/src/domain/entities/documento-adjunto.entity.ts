export class DocumentoAdjunto {
  constructor(
    public readonly idAdjunto: number,
    public readonly idPqr: number,
    public readonly nombreOriginal: string,
    public readonly nombreInterno: string,
    public readonly extension: string,
    public readonly mimeType: string,
    public readonly tamanoBytes: number,
    public readonly rutaArchivo: string,
    public readonly fechaCarga: Date,
    public readonly idUsuario?: number | null,
    public readonly nombreUsuario?: string | null
  ) {}
}
