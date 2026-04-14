import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';
import mermaid from 'mermaid';

type SeccionActiva = 'codigo' | 'diagramas';
type TabCodigo     = 'frontend' | 'backend' | 'database';
type TipoDiagrama  = 'paquetes' | 'clases' | 'secuencia' | 'casos_uso';

interface CodigoGenerado {
  frontend: string;
  backend:  string;
  database: string;
}

interface DiagramaGenerado {
  codigo_mermaid: string;
  svg?: SafeHtml;
}

@Component({
  selector: 'app-generador-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generador-ia.component.html',
  styleUrls: ['./generador-ia.component.css']
})
export class GeneradorIaComponent implements OnInit, OnDestroy, AfterViewChecked {

  private readonly BASE_URL = 'http://localhost:8000';

  @ViewChild('diagramaContainer') diagramaContainerRef!: ElementRef;

  proyectoId:     number | null = null;
  proyectoNombre  = '';

  // Sección activa
  seccionActiva: SeccionActiva = 'codigo';
  tabCodigo:     TabCodigo     = 'frontend';
  tabDiagrama:   TipoDiagrama  = 'clases';

  // Código generado
  codigoGenerado: CodigoGenerado | null = null;
  isGenerandoCodigo = false;

  // Diagramas generados
  diagramas: Partial<Record<TipoDiagrama, DiagramaGenerado>> = {};
  isGenerandoDiagrama: Partial<Record<TipoDiagrama, boolean>> = {};

  // Control para re-render de Mermaid
  private pendingRender: TipoDiagrama | null = null;

  // Mensajes
  successMsg = '';
  errorMsg   = '';

  // Copiar al portapapeles
  copiadoMsg = '';

  readonly tiposDiagrama: { key: TipoDiagrama; label: string; icono: string }[] = [
    { key: 'clases',    label: 'Clases',           icono: '🔷' },
    { key: 'secuencia', label: 'Secuencia',         icono: '🔁' },
    { key: 'paquetes',  label: 'Paquetes',          icono: '📦' },
    { key: 'casos_uso', label: 'Casos de Uso',      icono: '👤' },
  ];

  readonly labelsDiagrama: Record<TipoDiagrama, string> = {
    clases:    'Diagrama de Clases',
    secuencia: 'Diagrama de Secuencia',
    paquetes:  'Diagrama de Paquetes',
    casos_uso: 'Diagrama de Casos de Uso'
  };

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private proyectoActivoSvc: ProyectoActivoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.proyectoId    = this.proyectoActivoSvc.proyectoId;
    this.proyectoNombre = this.proyectoActivoSvc.proyecto?.nombre ?? '';

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });
  }

  ngAfterViewChecked(): void {
    if (this.pendingRender) {
      const tipo = this.pendingRender;
      this.pendingRender = null;
      this.renderMermaid(tipo);
    }
  }

  ngOnDestroy(): void {}

  // ── Navegación ─────────────────────────────────────────────────────────────

  setSeccion(s: SeccionActiva): void { this.seccionActiva = s; }
  setTabCodigo(t: TabCodigo): void   { this.tabCodigo = t; }

  setTabDiagrama(t: TipoDiagrama): void {
    this.tabDiagrama = t;
    if (this.diagramas[t]?.codigo_mermaid) {
      setTimeout(() => this.renderMermaid(t), 50);
    }
  }

  // ── Generación de código ───────────────────────────────────────────────────

  generarCodigo(): void {
    if (!this.proyectoId || this.isGenerandoCodigo) return;

    this.isGenerandoCodigo = true;
    this.errorMsg = '';
    this.codigoGenerado = null;

    this.http.post<any>(`${this.BASE_URL}/api/generador/codigo/${this.proyectoId}`, {})
      .subscribe({
        next: (res) => {
          const data = res?.data ?? res;
          this.codigoGenerado = {
            frontend: data.frontend ?? '// Sin contenido generado',
            backend:  data.backend  ?? '# Sin contenido generado',
            database: data.database ?? '-- Sin contenido generado'
          };
          this.isGenerandoCodigo = false;
          this.successMsg = '✓ Código generado correctamente';
          setTimeout(() => { this.successMsg = ''; }, 3500);
        },
        error: (err) => {
          this.isGenerandoCodigo = false;
          this.errorMsg = err?.error?.detail ?? 'Error al generar el código. Verifica que el backend esté configurado con la API key de Anthropic.';
          setTimeout(() => { this.errorMsg = ''; }, 6000);
        }
      });
  }

  // ── Generación de diagramas ────────────────────────────────────────────────

  generarDiagrama(tipo: TipoDiagrama): void {
    if (!this.proyectoId || this.isGenerandoDiagrama[tipo]) return;

    this.isGenerandoDiagrama[tipo] = true;
    this.errorMsg = '';

    this.http.post<any>(
      `${this.BASE_URL}/api/generador/diagrama/${this.proyectoId}`,
      { tipo }
    ).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const codigo = data.codigo_mermaid ?? '';
        this.diagramas[tipo] = { codigo_mermaid: codigo };
        this.isGenerandoDiagrama[tipo] = false;
        this.pendingRender = tipo;
        this.cdr.detectChanges();
        this.successMsg = `✓ ${this.labelsDiagrama[tipo]} generado`;
        setTimeout(() => { this.successMsg = ''; }, 3500);
      },
      error: (err) => {
        this.isGenerandoDiagrama[tipo] = false;
        this.errorMsg = err?.error?.detail ?? 'Error al generar el diagrama.';
        setTimeout(() => { this.errorMsg = ''; }, 6000);
      }
    });
  }

  // ── Render Mermaid ─────────────────────────────────────────────────────────

  private async renderMermaid(tipo: TipoDiagrama): Promise<void> {
    const diagrama = this.diagramas[tipo];
    if (!diagrama?.codigo_mermaid) return;

    const containerId = `mermaid-${tipo}`;
    const container   = document.getElementById(containerId);
    if (!container) return;

    try {
      const uniqueId = `mermaid-render-${tipo}-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, diagrama.codigo_mermaid);
      container.innerHTML = svg;
    } catch (err) {
      console.error('Error rendering mermaid:', err);
      if (container) {
        container.innerHTML = `<p class="mermaid-error">⚠️ Error al renderizar el diagrama. Revisa el código Mermaid.</p>`;
      }
    }
  }

  // ── Utilidades ─────────────────────────────────────────────────────────────

  get codigoActual(): string {
    if (!this.codigoGenerado) return '';
    return this.codigoGenerado[this.tabCodigo] ?? '';
  }

  get lenguajeActual(): string {
    const map: Record<TabCodigo, string> = {
      frontend: 'TypeScript / Angular',
      backend:  'Python / FastAPI',
      database: 'SQL'
    };
    return map[this.tabCodigo];
  }

  copiarCodigo(texto: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.copiadoMsg = '¡Copiado!';
      setTimeout(() => { this.copiadoMsg = ''; }, 2000);
    });
  }

  descargarCodigo(texto: string, tipo: TabCodigo): void {
    const ext: Record<TabCodigo, string> = {
      frontend: 'ts',
      backend:  'py',
      database: 'sql'
    };
    const blob = new Blob([texto], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${this.proyectoNombre || 'proyecto'}-${tipo}.${ext[tipo]}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  descargarDiagrama(tipo: TipoDiagrama): void {
    const codigo = this.diagramas[tipo]?.codigo_mermaid;
    if (!codigo) return;
    const blob = new Blob([codigo], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${this.proyectoNombre || 'proyecto'}-${tipo}.mmd`;
    a.click();
    URL.revokeObjectURL(url);
  }

  descargarSvg(tipo: TipoDiagrama): void {
    const container = document.getElementById(`mermaid-${tipo}`);
    if (!container) return;
    const svg  = container.innerHTML;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${this.proyectoNombre || 'proyecto'}-${tipo}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
