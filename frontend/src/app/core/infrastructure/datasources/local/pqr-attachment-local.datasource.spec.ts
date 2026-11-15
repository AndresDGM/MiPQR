import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { PqrAttachmentLocalDatasource } from './pqr-attachment-local.datasource';

describe('PqrAttachmentLocalDatasource', () => {
  it('debe iniciar con datos simulados sembrados para pruebas', async () => {
    const ds = new PqrAttachmentLocalDatasource();
    const attachments = await firstValueFrom(ds.getByPqrId(1));

    expect(attachments.length).toBeGreaterThanOrEqual(2);
    expect(attachments[0].idPqr).toBe(1);
    expect(attachments[0].nombreOriginal).toContain('.pdf');
  });

  it('debe permitir subir un archivo y recuperarlo', async () => {
    const ds = new PqrAttachmentLocalDatasource();
    const fakeFile = new File(['contenido pdf de prueba'], 'tutela_ejemplo.pdf', {
      type: 'application/pdf',
    });

    const uploaded = await firstValueFrom(ds.upload(99, [fakeFile]));

    expect(uploaded.length).toBe(1);
    expect(uploaded[0].idPqr).toBe(99);
    expect(uploaded[0].nombreOriginal).toBe('tutela_ejemplo.pdf');
    expect(uploaded[0].extension).toBe('.pdf');

    const pqrFiles = await firstValueFrom(ds.getByPqrId(99));
    expect(pqrFiles.length).toBe(1);
  });

  it('debe permitir eliminar un archivo previamente cargado', async () => {
    const ds = new PqrAttachmentLocalDatasource();
    const fakeFile = new File(['temp'], 'temporal.png', { type: 'image/png' });

    const uploaded = await firstValueFrom(ds.upload(50, [fakeFile]));
    const createdId = uploaded[0].idAdjunto;

    const deleted = await firstValueFrom(ds.delete(createdId));
    expect(deleted).toBe(true);

    const list = await firstValueFrom(ds.getByPqrId(50));
    expect(list.length).toBe(0);
  });
});
