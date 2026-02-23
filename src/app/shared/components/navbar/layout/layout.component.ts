import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <div class="app-layout">
      <app-navbar></app-navbar>
      <main class="layout-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .layout-main {
      flex: 1;
      min-height: calc(100vh - 64px);
      padding: 0;
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {}