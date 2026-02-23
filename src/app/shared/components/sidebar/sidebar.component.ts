import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = true;
  @Output() closeSidebar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  menuItems = [
    {
      label: 'Proyecto',
      icon: 'home',
      route: '/proyecto'
    },
    {
      label: 'Stakeholders',
      icon: 'stakeholders',
      route: '/stakeholders'
    },
    {
      label: 'Elicitación',
      icon: 'elicitacion',
      route: '/elicitacion'
    },
    {
      label: 'Requerimientos',
      icon: 'requerimientos',
      route: '/requerimientos'
    },
    {
      label: 'Negociación',
      icon: 'negociacion',
      route: '/negociacion'
    },
    {
      label: 'SRS',
      icon: 'srs',
      route: '/srs'
    },
    {
      label: 'Validación',
      icon: 'validacion',
      route: '/validacion'
    },
    {
      label: 'Historial',
      icon: 'historial',
      route: '/historial'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Lógica adicional si es necesaria
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      home: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>`,
      stakeholders: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>`,
      elicitacion: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>`,
      requerimientos: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
      negociacion: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 8c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"/>
        <path d="M12 14c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4z"/>
      </svg>`,
      srs: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 6.253v13m0-13C6.507 6.253 3 9.064 3 12.756c0 3.692 3.507 6.503 9 6.503m0-13c5.493 0 9 2.811 9 6.503 0 3.692-3.507 6.503-9 6.503m0-13v13m0-13c-5.493 0-9 2.811-9 6.503 0 3.692 3.507 6.503 9 6.503m0-13c5.493 0 9 2.811 9 6.503 0 3.692-3.507 6.503-9 6.503"/>
      </svg>`,
      validacion: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      historial: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>`
    };
    return icons[iconName] || '';
  }
}