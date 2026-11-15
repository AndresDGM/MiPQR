import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './presentation/components/layout/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = signal('MiPQR');
}
