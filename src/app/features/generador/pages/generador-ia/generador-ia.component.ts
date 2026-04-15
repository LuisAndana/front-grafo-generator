import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ElementRef, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
}

interface ContextoResumen {
  requerimientos: number;
  stakeholders:   number;
  entrevistas:    number;
  procesos:       number;
  necesidades:    number;
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
  private pendingRenderQueue: TipoDiagrama[] = [];

  // Mensajes
  successMsg = '';
  errorMsg   = '';
  copiadoMsg = '';

  // Contexto del proyecto (datos recopilados)
  contextoResumen: ContextoResumen | null = null;
  isLoadingContexto = false;

  // Fechas de última generación
  fechaCodigoGenerado: string | null = null;
  fechasDiagramas: Partial<Record<TipoDiagrama, string>> = {};

  readonly tiposDiagrama: { key: TipoDiagrama; label: string; icono: string }[] = [
    { key: 'clases',    label: 'Clases',       icono: '🔷' },
    { key: 'secuencia', label: 'Secuencia',     icono: '🔁' },
    { key: 'paquetes',  label: 'Paquetes',      icono: '📦' },
    { key: 'casos_uso', label: 'Casos de Uso',  icono: '👤' },
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
    this.proyectoId     = this.proyectoActivoSvc.proyectoId;
    this.proyectoNombre = this.proyectoActivoSvc.proyecto?.nombre ?? '';

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });

    if (this.proyectoId) {
      this.cargarDesdeStorage();
      this.cargarContexto();
    }
  }

  ngAfterViewChecked(): void {
    // Procesar cola de renders pendientes (diagramas cargados del storage)
    if (this.pendingRenderQueue.length > 0) {
      const tipo = this.pendingRenderQueue.shift()!;
      this.renderMermaid(tipo);
    }
    if (this.pendingRender) {
      const tipo = this.pendingRender;
      this.pendingRender = null;
      this.renderMermaid(tipo);
    }
  }

  ngOnDestroy(): void {}

  // ── Persistencia en localStorage ──────────────────────────────────────────

  private storageKeyCode      = (id: number) => `generador_codigo_${id}`;
  private storageKeyDiagramas = (id: number) => `generador_diagramas_${id}`;
  private storageKeyFechas    = (id: number) => `generador_fechas_${id}`;

  private cargarDesdeStorage(): void {
    const id = this.proyectoId!;

    // Cargar código generado
    try {
      const raw = localStorage.getItem(this.storageKeyCode(id));
      if (raw) {
        const parsed = JSON.parse(raw);
        this.codigoGenerado      = parsed.codigo ?? null;
        this.fechaCodigoGenerado = parsed.fecha  ?? null;
      }
    } catch { /* ignorar datos corruptos */ }

    // Cargar diagramas generados
    try {
      const raw = localStorage.getItem(this.storageKeyDiagramas(id));
      if (raw) {
        const parsed = JSON.parse(raw);
        this.diagramas = parsed;
        // Encolar renders para todos los diagramas guardados
        Object.keys(parsed).forEach(tipo => {
          if (parsed[tipo]?.codigo_mermaid) {
            this.pendingRenderQueue.push(tipo as TipoDiagrama);
          }
        });
      }
    } catch { /* ignorar */ }

    // Cargar fechas de diagramas
    try {
      const raw = localStorage.getItem(this.storageKeyFechas(id));
      if (raw) { this.fechasDiagramas = JSON.parse(raw); }
    } catch { /* ignorar */ }
  }

  private guardarCodigoEnStorage(): void {
    if (!this.proyectoId || !this.codigoGenerado) return;
    const ahora = new Date().toLocaleString('es-MX');
    this.fechaCodigoGenerado = ahora;
    localStorage.setItem(
      this.storageKeyCode(this.proyectoId),
      JSON.stringify({ codigo: this.codigoGenerado, fecha: ahora })
    );
  }

  private guardarDiagramaEnStorage(tipo: TipoDiagrama): void {
    if (!this.proyectoId) return;
    localStorage.setItem(
      this.storageKeyDiagramas(this.proyectoId),
      JSON.stringify(this.diagramas)
    );
    const ahora = new Date().toLocaleString('es-MX');
    this.fechasDiagramas[tipo] = ahora;
    localStorage.setItem(
      this.storageKeyFechas(this.proyectoId),
      JSON.stringify(this.fechasDiagramas)
    );
  }

  limpiarStorage(): void {
    if (!this.proyectoId) return;
    localStorage.removeItem(this.storageKeyCode(this.proyectoId));
    localStorage.removeItem(this.storageKeyDiagramas(this.proyectoId));
    localStorage.removeItem(this.storageKeyFechas(this.proyectoId));
    this.codigoGenerado      = null;
    this.diagramas           = {};
    this.fechaCodigoGenerado = null;
    this.fechasDiagramas     = {};
    this.successMsg = '✓ Datos locales eliminados correctamente';
    setTimeout(() => { this.successMsg = ''; }, 3500);
  }

  // ── Contexto del proyecto ──────────────────────────────────────────────────

  cargarContexto(): void {
    if (!this.proyectoId) return;
    this.isLoadingContexto = true;

    forkJoin({
      rfs: this.http
        .get<any[]>(`${this.BASE_URL}/requerimientos-funcionales/?proyecto_id=${this.proyectoId}`)
        .pipe(catchError(() => of([]))),
      stakeholders: this.http
        .get<any[]>(`${this.BASE_URL}/stakeholders/?proyecto_id=${this.proyectoId}`)
        .pipe(catchError(() => of([]))),
      resumen: this.http
        .get<any>(`${this.BASE_URL}/elicitacion/resumen?proyecto_id=${this.proyectoId}`)
        .pipe(catchError(() => of({ total_entrevistas: 0, total_procesos: 0, total_necesidades: 0 }))),
    }).subscribe({
      next: ({ rfs, stakeholders, resumen }) => {
        this.contextoResumen = {
          requerimientos: Array.isArray(rfs) ? rfs.length : 0,
          stakeholders:   Array.isArray(stakeholders) ? stakeholders.length : 0,
          entrevistas:    resumen?.total_entrevistas  ?? 0,
          procesos:       resumen?.total_procesos     ?? 0,
          necesidades:    resumen?.total_necesidades  ?? 0,
        };
        this.isLoadingContexto = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingContexto = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalContexto(): number {
    if (!this.contextoResumen) return 0;
    const c = this.contextoResumen;
    return c.requerimientos + c.stakeholders + c.entrevistas + c.procesos + c.necesidades;
  }

  get totalDiagramasGuardados(): number {
    return this.tiposDiagrama.filter(d => !!this.diagramas[d.key]?.codigo_mermaid).length;
  }

  // ── Descarga como aplicación (ZIP) ────────────────────────────────────────

  isDescargando = false;

  /** Parsea un bloque de código en archivos individuales usando @@FILE: ruta@@ */
  private parsearArchivos(bloque: string): { ruta: string; contenido: string }[] {
    const archivos: { ruta: string; contenido: string }[] = [];
    const partes = bloque.split(/@@FILE:\s*/);
    for (const parte of partes) {
      if (!parte.trim()) continue;
      const saltoLinea = parte.indexOf('\n');
      if (saltoLinea === -1) continue;
      const ruta = parte.substring(0, saltoLinea).replace(/@@$/, '').trim();
      const contenido = parte.substring(saltoLinea + 1).trim();
      if (ruta && contenido) {
        archivos.push({ ruta, contenido });
      }
    }
    // Si no hay marcadores @@FILE, guardar como un único archivo
    if (archivos.length === 0 && bloque.trim()) {
      archivos.push({ ruta: '_codigo.txt', contenido: bloque.trim() });
    }
    return archivos;
  }

  async descargarAplicacion(): Promise<void> {
    if (!this.codigoGenerado || this.isDescargando) return;
    this.isDescargando = true;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const nombre = (this.proyectoNombre || 'proyecto')
        .toLowerCase().replace(/\s+/g, '-');
      const raiz = zip.folder(nombre)!;

      // ── Frontend ────────────────────────────────────────────────────
      const frontFolder = raiz.folder('frontend')!;
      const archivosFront = this.parsearArchivos(this.codigoGenerado.frontend);
      for (const arch of archivosFront) {
        frontFolder.file(arch.ruta, arch.contenido);
      }
      frontFolder.file('INSTRUCCIONES.md', this.readmeFrontend(nombre));

      // ── Backend ─────────────────────────────────────────────────────
      const backFolder = raiz.folder('backend')!;
      const archivosBack = this.parsearArchivos(this.codigoGenerado.backend);
      for (const arch of archivosBack) {
        backFolder.file(arch.ruta, arch.contenido);
      }
      backFolder.file('INSTRUCCIONES.md', this.readmeBackend());

      // ── Database ────────────────────────────────────────────────────
      const dbFolder = raiz.folder('database')!;
      const archivosDb = this.parsearArchivos(this.codigoGenerado.database);
      for (const arch of archivosDb) {
        dbFolder.file(arch.ruta, arch.contenido);
      }
      dbFolder.file('INSTRUCCIONES.md', this.readmeDatabase(nombre));

      // ── Diagramas ───────────────────────────────────────────────────
      const tienesDiagramas = Object.values(this.diagramas).some(d => d?.codigo_mermaid);
      if (tienesDiagramas) {
        const diagFolder = raiz.folder('diagramas')!;
        for (const d of this.tiposDiagrama) {
          if (this.diagramas[d.key]?.codigo_mermaid) {
            diagFolder.file(`${d.key}.mmd`, this.diagramas[d.key]!.codigo_mermaid);
          }
        }
      }

      // ── README raíz ─────────────────────────────────────────────────
      raiz.file('README.md', this.readmeRaiz(nombre));

      // ── Generar y descargar ──────────────────────────────────────────
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombre}-app.zip`;
      a.click();
      URL.revokeObjectURL(url);

      this.successMsg = `✓ Aplicación descargada como ${nombre}-app.zip`;
      setTimeout(() => { this.successMsg = ''; }, 5000);
    } catch (err) {
      console.error(err);
      this.errorMsg = 'Error al generar el ZIP. Intenta de nuevo.';
      setTimeout(() => { this.errorMsg = ''; }, 5000);
    } finally {
      this.isDescargando = false;
    }
  }

  private readmeRaiz(nombre: string): string {
    return `# ${this.proyectoNombre || nombre} — Aplicación Generada por IA

Generado el ${new Date().toLocaleString('es-MX')} usando Gemini 2.5 Flash.

## Estructura del proyecto

\`\`\`
${nombre}/
├── frontend/        → Aplicación Angular 18
├── backend/         → API REST con FastAPI + SQLAlchemy
├── database/        → Script SQL de la base de datos
└── diagramas/       → Diagramas UML en formato Mermaid
\`\`\`

## Pasos para ejecutar

### 1. Base de datos
Sigue las instrucciones en \`database/INSTRUCCIONES.md\`

### 2. Backend
Sigue las instrucciones en \`backend/INSTRUCCIONES.md\`

### 3. Frontend
Sigue las instrucciones en \`frontend/INSTRUCCIONES.md\`
`;
  }

  private readmeFrontend(nombre: string): string {
    return `# Frontend — Angular 18

## Requisitos
- Node.js 18+
- Angular CLI: \`npm install -g @angular/cli\`

## Instalación y ejecución

\`\`\`bash
# 1. Crear nuevo proyecto Angular
ng new ${nombre}-frontend --standalone --routing --style=css

# 2. Copiar los archivos generados dentro de src/app/
#    Reemplaza los archivos existentes con los de esta carpeta

# 3. Instalar dependencias adicionales (si aplica)
cd ${nombre}-frontend
npm install

# 4. Ejecutar en modo desarrollo
ng serve

# La aplicación estará en http://localhost:4200
\`\`\`

## Notas
- El frontend se conecta al backend en http://localhost:8000
- Asegúrate de que el backend esté corriendo antes de usar la app
`;
  }

  private readmeBackend(): string {
    return `# Backend — FastAPI + SQLAlchemy

## Requisitos
- Python 3.10+

## Instalación y ejecución

\`\`\`bash
# 1. Crear entorno virtual
python -m venv venv

# En Windows:
venv\\Scripts\\activate
# En Mac/Linux:
source venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar base de datos en .env
# Edita el archivo .env con tus credenciales MySQL

# 4. Ejecutar el servidor
uvicorn main:app --reload --port 8000

# La API estará en http://localhost:8000
# Documentación interactiva: http://localhost:8000/docs
\`\`\`
`;
  }

  private readmeDatabase(nombre: string): string {
    return `# Base de datos — MySQL

## Requisitos
- MySQL 8.0+

## Instalación

\`\`\`bash
# 1. Acceder a MySQL
mysql -u root -p

# 2. Ejecutar el script SQL
source schema.sql;

# O desde terminal:
mysql -u root -p < schema.sql
\`\`\`

## Conexión
Actualiza la variable DATABASE_URL en el archivo \`backend/.env\`:
\`\`\`
DATABASE_URL=mysql+pymysql://root:tu_password@localhost/${nombre.replace(/-/g, '_')}
\`\`\`
`;
  }

  // ── Navegación ─────────────────────────────────────────────────────────────

  setSeccion(s: SeccionActiva): void { this.seccionActiva = s; }
  setTabCodigo(t: TabCodigo): void   { this.tabCodigo = t; }

  setTabDiagrama(t: TipoDiagrama): void {
    this.tabDiagrama = t;
    if (this.diagramas[t]?.codigo_mermaid) {
      setTimeout(() => this.renderMermaid(t), 80);
    }
  }

  // ── Generación de código ───────────────────────────────────────────────────

  generarCodigo(): void {
    if (!this.proyectoId || this.isGenerandoCodigo) return;

    this.isGenerandoCodigo = true;
    this.errorMsg = '';

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
          this.guardarCodigoEnStorage();
          this.successMsg = '✓ Código generado y guardado localmente';
          setTimeout(() => { this.successMsg = ''; }, 4000);
        },
        error: (err) => {
          this.isGenerandoCodigo = false;
          this.errorMsg = err?.error?.detail ?? 'Error al generar el código. Verifica que GOOGLE_API_KEY esté configurada en el backend.';
          setTimeout(() => { this.errorMsg = ''; }, 7000);
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
        this.guardarDiagramaEnStorage(tipo);
        this.pendingRender = tipo;
        this.cdr.detectChanges();
        this.successMsg = `✓ ${this.labelsDiagrama[tipo]} generado y guardado`;
        setTimeout(() => { this.successMsg = ''; }, 4000);
      },
      error: (err) => {
        this.isGenerandoDiagrama[tipo] = false;
        this.errorMsg = err?.error?.detail ?? 'Error al generar el diagrama.';
        setTimeout(() => { this.errorMsg = ''; }, 7000);
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
