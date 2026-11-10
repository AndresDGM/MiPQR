import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  it('debe crear el componente de carga de archivos', async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(FileUploadComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
    expect(comp.selectedFiles().length).toBe(0);
  });

  it('debe inicializar con las extensiones autorizadas', async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(FileUploadComponent);
    const comp = fixture.componentInstance;

    expect(comp.allowedExtensions).toContain('.pdf');
    expect(comp.allowedExtensions).toContain('.docx');
    expect(comp.allowedExtensions).toContain('.jpg');
    expect(comp.allowedExtensions).toContain('.png');
  });
});
