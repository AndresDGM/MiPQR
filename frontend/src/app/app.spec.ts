import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { provideMipqrAdapter } from './core/application/providers/mipqr.adapter';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideMipqrAdapter(environment.adapter),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'MiPQR' title signal`, () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.title()).toEqual('MiPQR');
  });
});
