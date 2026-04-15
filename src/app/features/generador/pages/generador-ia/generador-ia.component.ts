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

  // ── Descarga como aplicación ejecutable (ZIP) ────────────────────────────

  isDescargando = false;

  /** Parsea un bloque de código en archivos individuales usando @@FILE: ruta@@ */
  private parsearArchivos(bloque: string): { ruta: string; contenido: string }[] {
    const archivos: { ruta: string; contenido: string }[] = [];
    const partes = bloque.split(/@@FILE:\s*/);
    for (const parte of partes) {
      if (!parte.trim()) continue;
      const saltoLinea = parte.indexOf('\n');
      if (saltoLinea === -1) continue;
      const ruta     = parte.substring(0, saltoLinea).replace(/@@$/, '').trim();
      const contenido = parte.substring(saltoLinea + 1).trim();
      if (ruta && contenido) archivos.push({ ruta, contenido });
    }
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
      const zip   = new JSZip();
      const slug  = (this.proyectoNombre || 'proyecto').toLowerCase().replace(/\s+/g, '-');
      const dbName = slug.replace(/-/g, '_');
      const raiz  = zip.folder(slug)!;

      // ── Archivos generados por IA ──────────────────────────────────
      const frontFolder = raiz.folder('frontend')!;
      for (const arch of this.parsearArchivos(this.codigoGenerado.frontend)) {
        frontFolder.file(arch.ruta, arch.contenido);
      }

      const backFolder = raiz.folder('backend')!;
      for (const arch of this.parsearArchivos(this.codigoGenerado.backend)) {
        backFolder.file(arch.ruta, arch.contenido);
      }
      // .env con la password estándar que usan los scripts
      backFolder.file('.env',
        `DATABASE_URL=mysql+pymysql://root:Admin1234!@localhost/${dbName}\nDEBUG=True\nHOST=0.0.0.0\nPORT=8000\n`
      );

      const dbFolder = raiz.folder('database')!;
      for (const arch of this.parsearArchivos(this.codigoGenerado.database)) {
        dbFolder.file(arch.ruta, arch.contenido);
      }

      // ── Diagramas ──────────────────────────────────────────────────
      if (Object.values(this.diagramas).some(d => d?.codigo_mermaid)) {
        const diagFolder = raiz.folder('diagramas')!;
        for (const d of this.tiposDiagrama) {
          if (this.diagramas[d.key]?.codigo_mermaid) {
            diagFolder.file(`${d.key}.mmd`, this.diagramas[d.key]!.codigo_mermaid);
          }
        }
      }

      // ── Dockerfiles + nginx ────────────────────────────────────────
      backFolder.file('Dockerfile', this.dockerfileBackend());
      frontFolder.file('Dockerfile', this.dockerfileFrontend(slug));
      frontFolder.file('nginx.conf', this.nginxConf());

      // ── docker-compose.yml ─────────────────────────────────────────
      raiz.file('docker-compose.yml', this.dockerCompose(slug, dbName));

      // ── Scripts de un clic ─────────────────────────────────────────
      raiz.file('INICIAR.bat',   this.scriptWindows(slug, dbName));
      raiz.file('INICIAR.sh',    this.scriptUnix(slug, dbName));
      raiz.file('DETENER.bat',   this.scriptDetenerWindows());
      raiz.file('setup_db.py',   this.setupDbPython(dbName));

      // ── README principal ───────────────────────────────────────────
      raiz.file('README.md', this.readmePrincipal(slug, dbName));

      // ── Descargar ZIP ──────────────────────────────────────────────
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${slug}-app.zip`;
      a.click();
      URL.revokeObjectURL(url);

      this.successMsg = `✓ Aplicación descargada: ${slug}-app.zip — abre la carpeta y ejecuta INICIAR.bat`;
      setTimeout(() => { this.successMsg = ''; }, 7000);
    } catch (err) {
      console.error(err);
      this.errorMsg = 'Error al generar el ZIP. Intenta de nuevo.';
      setTimeout(() => { this.errorMsg = ''; }, 5000);
    } finally {
      this.isDescargando = false;
    }
  }

  // ── Generadores de archivos de infraestructura ──────────────────────────

  private scriptWindows(slug: string, dbName: string): string {
    const proyecto = this.proyectoNombre || slug;
    const fecha    = new Date().toLocaleDateString('es-MX');
    return `@echo off
setlocal EnableDelayedExpansion
title Iniciando ${proyecto}
color 0A
cls

echo.
echo  ============================================================
echo    INICIANDO APLICACION: ${proyecto}
echo    Generado con Gemini AI  -  ${fecha}
echo    Script version: v3-debug (${Date.now()})
echo  ============================================================
echo.

REM ════════════════════════════════════════════════════════════
REM  PASO 1 - Verificar Python
REM ════════════════════════════════════════════════════════════
echo [PASO 1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
  color 0C
  echo.
  echo  [ERROR] Python NO esta instalado o no esta en el PATH.
  echo.
  echo  Solucion:
  echo    1. Ve a: https://www.python.org/downloads/
  echo    2. Descarga Python 3.10 o superior
  echo    3. Durante la instalacion marca: "Add Python to PATH"
  echo    4. Cierra esta ventana y vuelve a ejecutar INICIAR.bat
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo    OK - %%v encontrado
echo.

REM ════════════════════════════════════════════════════════════
REM  PASO 2 - Verificar Node.js (busca en ubicaciones comunes)
REM ════════════════════════════════════════════════════════════
echo [PASO 2/4] Verificando Node.js...

REM Intento 1: node en el PATH
node --version >nul 2>&1
if not errorlevel 1 goto :node_ok

REM Intento 2: ubicaciones comunes de instalacion
set "NODE_DIR="
if exist "%ProgramFiles%\\nodejs\\node.exe"       set "NODE_DIR=%ProgramFiles%\\nodejs"
if exist "%ProgramFiles(x86)%\\nodejs\\node.exe"  set "NODE_DIR=%ProgramFiles(x86)%\\nodejs"
if exist "%LOCALAPPDATA%\\Programs\\node\\node.exe" set "NODE_DIR=%LOCALAPPDATA%\\Programs\\node"
if exist "%APPDATA%\\npm\\node.exe"               set "NODE_DIR=%APPDATA%\\npm"

if defined NODE_DIR (
  echo    Node.js encontrado en: !NODE_DIR!
  echo    Agregando al PATH de esta sesion...
  set "PATH=!NODE_DIR!;%PATH%"
  node --version >nul 2>&1
  if not errorlevel 1 goto :node_ok
)

REM No se encontro Node.js en ninguna ubicacion
color 0C
echo.
echo  [ERROR] Node.js NO esta instalado o no se pudo encontrar.
echo.
echo  Diagnostico:
echo    - Se busco 'node' en el PATH  --- NO ENCONTRADO
echo    - Se busco en %ProgramFiles%\\nodejs  --- NO ENCONTRADO
echo    - Se busco en %LOCALAPPDATA%\\Programs\\node  --- NO ENCONTRADO
echo.
echo  Solucion paso a paso:
echo    1. Ve a: https://nodejs.org
echo    2. Descarga el instalador .msi de la version LTS
echo    3. Al instalar, asegurate de que esta marcada:
echo       "Add to PATH" (deberia estarlo por defecto)
echo    4. IMPORTANTE: Cierra TODAS las ventanas de terminal
echo    5. Abre una nueva ventana y escribe:  node --version
echo       Si muestra una version, ejecuta INICIAR.bat de nuevo
echo.
echo  Si ya tienes Node instalado, verifica abriendo CMD y ejecutando:
echo       where node
echo    Si no muestra nada, reinstala Node marcando "Add to PATH"
echo.
pause
exit /b 1

:node_ok
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo    OK - Node %%v encontrado
echo.

REM ════════════════════════════════════════════════════════════
REM  PASO 3 - Configurar base de datos
REM ════════════════════════════════════════════════════════════
echo [PASO 3/4] Configurando base de datos MySQL...
echo.

REM ── Delegamos TODO a Python (mucho mas robusto que batch) ───
REM  setup_db.py se encarga de: encontrar MySQL, pedir contrasena,
REM  crear la base de datos, cargar schema.sql y actualizar .env.
python setup_db.py
if errorlevel 2 (
  echo.
  echo    [AVISO] No se pudo configurar la base de datos automaticamente.
  echo    El backend arrancara igual; puedes configurar MySQL manualmente.
  echo.
  echo    Presiona una tecla para continuar...
  pause >nul
)

goto :db_done

:mysql_missing
echo    [AVISO] No se encontro MySQL en ubicaciones comunes:
echo       - PATH del sistema
echo       - %ProgramFiles%\\MySQL\\MySQL Server X.X
echo       - C:\\xampp\\mysql, C:\\laragon\\bin\\mysql
echo.
echo    El backend arrancara pero las funciones de BD fallaran.
echo    Instala MySQL:  https://dev.mysql.com/downloads/installer/
echo.
echo    Presiona una tecla para continuar de todos modos...
pause >nul
goto :db_done

:mysql_manual
echo    [AVISO] MySQL se encontro pero no se pudo conectar con
echo    usuario 'root' y la contrasena proporcionada.
echo.
echo    Opciones:
echo      A) Vuelve a ejecutar INICIAR.bat e introduce la contrasena correcta
echo      B) Edita backend\\.env manualmente
echo      C) Carga database\\schema.sql en MySQL Workbench
echo.
echo    Presiona una tecla para continuar...
pause >nul

:db_done
echo.

REM ════════════════════════════════════════════════════════════
REM  PASO 4a - Backend
REM ════════════════════════════════════════════════════════════
echo [PASO 4/4] Iniciando Backend y Frontend...
echo.

if not exist "backend\\requirements.txt" (
  color 0E
  echo  [AVISO] No se encontro backend\\requirements.txt
  echo  Verifica que la carpeta backend contenga los archivos generados.
  echo.
)

cd backend

if not exist venv (
  echo    Creando entorno Python (solo la primera vez)...
  python -m venv venv
  if errorlevel 1 (
    color 0C
    echo    [ERROR] Fallo al crear el entorno virtual.
    cd ..
    pause
    exit /b 1
  )
)

echo    Instalando dependencias Python...
venv\\Scripts\\pip install -r requirements.txt --quiet 2>nul
if errorlevel 1 (
  echo    Reintentando instalacion visible...
  venv\\Scripts\\pip install -r requirements.txt
)

echo    Iniciando servidor backend...
start "Backend ^| ${proyecto} ^| :8000" cmd /k "color 0B && echo Backend corriendo en http://localhost:8000 && echo Documentacion: http://localhost:8000/docs && echo. && venv\\Scripts\\uvicorn main:app --reload --port 8000"
cd ..

echo    Esperando que el backend arranque...
timeout /t 5 /nobreak >nul

REM ════════════════════════════════════════════════════════════
REM  PASO 4b - Frontend
REM ════════════════════════════════════════════════════════════
if not exist "frontend\\package.json" (
  color 0E
  echo  [AVISO] No se encontro frontend\\package.json
  echo  Verifica que la carpeta frontend contenga los archivos generados.
  echo.
)

cd frontend

if not exist node_modules (
  echo    Instalando dependencias npm (primera vez ~2 min, ten paciencia)...
  npm install
  if errorlevel 1 (
    color 0C
    echo    [ERROR] Fallo npm install.
    cd ..
    pause
    exit /b 1
  )
)

echo    Iniciando frontend Angular...
start "Frontend ^| ${proyecto} ^| :4200" cmd /k "color 0A && echo Frontend corriendo en http://localhost:4200 && echo. && npx ng serve --open"
cd ..

REM ════════════════════════════════════════════════════════════
REM  LISTO
REM ════════════════════════════════════════════════════════════
echo.
color 0A
echo  ============================================================
echo    APLICACION INICIADA CORRECTAMENTE
echo  ============================================================
echo.
echo    Frontend:      http://localhost:4200  (abre en ~30 segundos)
echo    Backend API:   http://localhost:8000
echo    API Docs:      http://localhost:8000/docs
echo.
echo    Se abriran dos ventanas: Backend y Frontend
echo    NO las cierres mientras uses la aplicacion.
echo.
echo    Para detener todo: ejecuta DETENER.bat
echo.
echo  ============================================================
echo.
pause
`;
  }

  private scriptUnix(slug: string, dbName: string): string {
    return `#!/bin/bash
set -e
echo ""
echo "============================================================"
echo "  INICIANDO APLICACION: ${this.proyectoNombre || slug}"
echo "============================================================"
echo ""

# ── Verificar requisitos ──────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || { echo "ERROR: Python3 no instalado. Visita https://python.org"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "ERROR: Node.js no instalado. Visita https://nodejs.org"; exit 1; }

# ── Base de datos ─────────────────────────────────────────────────
echo "[1/4] Configurando base de datos..."
mysql -u root -pAdmin1234! -e "CREATE DATABASE IF NOT EXISTS ${dbName};" 2>/dev/null \\
  && mysql -u root -pAdmin1234! ${dbName} < database/schema.sql 2>/dev/null \\
  && echo "  OK - Base de datos configurada." \\
  || echo "  AVISO: Ejecuta database/schema.sql manualmente en MySQL."
echo ""

# ── Backend ───────────────────────────────────────────────────────
echo "[2/4] Instalando dependencias del backend..."
cd backend
[ ! -d venv ] && python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -q
echo "  OK"
echo ""

echo "[3/4] Iniciando backend..."
uvicorn main:app --reload --port 8000 &
BACK_PID=$!
cd ..
sleep 3

# ── Frontend ──────────────────────────────────────────────────────
echo "[4/4] Iniciando frontend..."
cd frontend
[ ! -d node_modules ] && npm install -q
npx ng serve --open &
FRONT_PID=$!
cd ..

echo ""
echo "============================================================"
echo "  Aplicacion lista!"
echo "  Frontend:    http://localhost:4200"
echo "  Backend:     http://localhost:8000"
echo "  API Docs:    http://localhost:8000/docs"
echo ""
echo "  Presiona Ctrl+C para detener."
echo "============================================================"

wait $BACK_PID $FRONT_PID
`;
  }

  private scriptDetenerWindows(): string {
    return `@echo off
echo Deteniendo la aplicacion...
taskkill /FI "WINDOWTITLE eq Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend*" /F >nul 2>&1
echo Aplicacion detenida.
pause
`;
  }

  private setupDbPython(dbName: string): string {
    return `"""
setup_db.py - Configura MySQL para la aplicacion generada.

Busca mysql.exe en ubicaciones comunes, pide la contrasena al usuario,
crea la base de datos, carga schema.sql y actualiza backend/.env.

Codigos de salida:
  0 = todo OK
  2 = no se pudo configurar (el .bat mostrara un aviso y continuara)
"""
import os
import sys
import glob
import subprocess
from pathlib import Path

DB_NAME = "${dbName}"
DEFAULT_PWD = "Admin1234!"

ROOT = Path(__file__).parent.resolve()


def _find_mysql():
    """Devuelve la ruta a mysql.exe o None si no se encuentra."""
    # 1) En el PATH
    from shutil import which
    exe = which("mysql")
    if exe:
        return exe

    # 2) Ubicaciones comunes en Windows
    candidates = []
    if os.name == "nt":
        pf = os.environ.get("ProgramFiles", r"C:\\Program Files")
        pf86 = os.environ.get("ProgramFiles(x86)", r"C:\\Program Files (x86)")
        candidates += glob.glob(os.path.join(pf,   "MySQL", "MySQL Server *", "bin", "mysql.exe"))
        candidates += glob.glob(os.path.join(pf86, "MySQL", "MySQL Server *", "bin", "mysql.exe"))
        candidates += glob.glob(r"C:\\xampp\\mysql\\bin\\mysql.exe")
        candidates += glob.glob(r"C:\\wamp64\\bin\\mysql\\mysql*\\bin\\mysql.exe")
        candidates += glob.glob(r"C:\\laragon\\bin\\mysql\\mysql-*\\bin\\mysql.exe")
    else:
        candidates += ["/usr/bin/mysql", "/usr/local/bin/mysql", "/opt/homebrew/bin/mysql"]

    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def _run_mysql(exe, password, sql=None, stdin_file=None, db=None):
    """Ejecuta un comando mysql. Retorna (returncode, stdout, stderr)."""
    cmd = [exe, "-u", "root", f"-p{password}"]
    if db:
        cmd.append(db)
    if sql:
        cmd += ["-e", sql]

    stdin = None
    if stdin_file:
        stdin = open(stdin_file, "rb")

    try:
        result = subprocess.run(
            cmd,
            stdin=stdin,
            capture_output=True,
            text=True,
            timeout=60,
        )
        return result.returncode, result.stdout, result.stderr
    finally:
        if stdin:
            stdin.close()


def _update_env(password):
    env_path = ROOT / "backend" / ".env"
    if not env_path.is_file():
        return False
    try:
        content = env_path.read_text(encoding="utf-8")
        new_content = content.replace(DEFAULT_PWD, password)
        if new_content != content:
            env_path.write_text(new_content, encoding="utf-8")
        return True
    except Exception as e:
        print(f"    [AVISO] No se pudo editar backend/.env: {e}")
        return False


def main():
    print("    Buscando MySQL en el sistema...")
    exe = _find_mysql()
    if not exe:
        print("    [ERROR] No se encontro mysql.exe en:")
        print("      - PATH del sistema")
        print("      - Program Files\\\\MySQL\\\\MySQL Server *")
        print("      - XAMPP, WampServer, Laragon")
        print()
        print("    Instala MySQL Community Server:")
        print("      https://dev.mysql.com/downloads/installer/")
        sys.exit(2)

    print(f"    MySQL encontrado: {exe}")
    print()
    print("    Introduce la contrasena de MySQL (usuario 'root').")
    print(f"    Si no la cambiaste pulsa ENTER (se usara '{DEFAULT_PWD}').")
    try:
        password = input(f"    Contrasena [{DEFAULT_PWD}]: ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        sys.exit(2)
    if not password:
        password = DEFAULT_PWD

    # Probar conexion
    print("    Probando conexion...")
    rc, out, err = _run_mysql(exe, password, sql="SELECT 1;")
    if rc != 0:
        print("    [ERROR] No se pudo conectar a MySQL:")
        print(f"      {err.strip() or 'codigo ' + str(rc)}")
        print()
        print("    Verifica que:")
        print("      1. El servicio MySQL este corriendo (services.msc)")
        print("      2. La contrasena de 'root' sea la que escribiste")
        sys.exit(2)

    # Crear base de datos
    print(f"    Creando base de datos '{DB_NAME}'...")
    rc, out, err = _run_mysql(
        exe, password,
        sql=f"CREATE DATABASE IF NOT EXISTS \`{DB_NAME}\` CHARACTER SET utf8mb4;",
    )
    if rc != 0:
        print(f"    [AVISO] No se pudo crear la BD: {err.strip()}")

    # Cargar schema.sql si existe
    schema = ROOT / "database" / "schema.sql"
    if schema.is_file():
        print(f"    Cargando schema.sql en '{DB_NAME}'...")
        rc, out, err = _run_mysql(exe, password, stdin_file=str(schema), db=DB_NAME)
        if rc != 0:
            print(f"    [AVISO] schema.sql devolvio errores (puede estar bien si ya existia):")
            if err.strip():
                print(f"      {err.strip()[:200]}")

    # Actualizar backend/.env
    if _update_env(password):
        print("    OK - backend/.env sincronizado con tu contrasena.")

    print("    OK - Base de datos lista.")
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"    [ERROR] {e}")
        sys.exit(2)
`;
  }

  private dockerCompose(slug: string, dbName: string): string {
    return `# docker-compose.yml — Levanta toda la aplicacion con: docker compose up --build
# Requiere: Docker Desktop instalado (https://www.docker.com/products/docker-desktop)

services:

  database:
    image: mysql:8.0
    container_name: ${slug}_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: Admin1234!
      MYSQL_DATABASE: ${dbName}
    ports:
      - "3306:3306"
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-pAdmin1234!"]
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    container_name: ${slug}_backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: mysql+pymysql://root:Admin1234!@database/${dbName}
    depends_on:
      database:
        condition: service_healthy

  frontend:
    build: ./frontend
    container_name: ${slug}_frontend
    restart: unless-stopped
    ports:
      - "4200:80"
    depends_on:
      - backend

volumes:
  db_data:
`;
  }

  private dockerfileBackend(): string {
    return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
  }

  private dockerfileFrontend(slug: string): string {
    return `# Etapa 1: build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servir con nginx
FROM nginx:alpine
COPY --from=builder /app/dist/${slug}/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
`;
  }

  private nginxConf(): string {
    return `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Angular routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
`;
  }

  private readmePrincipal(slug: string, dbName: string): string {
    const fecha = new Date().toLocaleString('es-MX');
    return `# ${this.proyectoNombre || slug}
> Aplicación generada automáticamente con Gemini AI — ${fecha}

---

## ⚡ OPCIÓN A — Un solo clic (Windows)

1. Descomprime este ZIP
2. Abre la carpeta \`${slug}\`
3. Haz **doble clic** en \`INICIAR.bat\`
4. Espera ~2 minutos la primera vez (instala dependencias)
5. El navegador se abre solo en **http://localhost:4200** ✅

**Requisitos previos:**
- [Python 3.10+](https://www.python.org/downloads/) — marca ✅ "Add to PATH"
- [Node.js LTS](https://nodejs.org)
- MySQL corriendo en tu equipo (contraseña: \`Admin1234!\`)

> Para Mac/Linux usa \`INICIAR.sh\` (ejecuta \`chmod +x INICIAR.sh && ./INICIAR.sh\`)

---

## 🐳 OPCIÓN B — Docker (recomendado, sin instalar Python/Node)

1. Instala [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Abre una terminal en la carpeta \`${slug}\`
3. Ejecuta:
\`\`\`bash
docker compose up --build
\`\`\`
4. Abre el navegador en **http://localhost:4200** ✅

Todo conectado automáticamente: base de datos + backend + frontend.

---

## 📁 Estructura

\`\`\`
${slug}/
├── INICIAR.bat          ← Doble clic para iniciar (Windows)
├── INICIAR.sh           ← Iniciar en Mac/Linux
├── DETENER.bat          ← Detener la aplicación
├── docker-compose.yml   ← Iniciar con Docker
├── frontend/            ← Angular 18
├── backend/             ← FastAPI + SQLAlchemy
├── database/            ← Script SQL (MySQL)
└── diagramas/           ← Diagramas UML Mermaid
\`\`\`

## 🔗 URLs

| Servicio       | URL                              |
|----------------|----------------------------------|
| Aplicación     | http://localhost:4200            |
| API REST       | http://localhost:8000            |
| Documentación  | http://localhost:8000/docs       |

## 🛠️ Base de datos
- **Nombre:** \`${dbName}\`
- **Usuario:** \`root\`
- **Contraseña:** \`Admin1234!\`

Para cambiar la contraseña, edita \`backend/.env\` antes de iniciar.
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
