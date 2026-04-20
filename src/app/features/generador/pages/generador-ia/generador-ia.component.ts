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

    // ── Estrategia 1: Marcadores @@FILE: ruta@@ ──────────────────────
    if (bloque.includes('@@FILE:')) {
      const partes = bloque.split(/@@FILE:\s*/);
      for (const parte of partes) {
        if (!parte.trim()) continue;
        const saltoLinea = parte.indexOf('\n');
        if (saltoLinea === -1) continue;
        const ruta      = parte.substring(0, saltoLinea).replace(/@@$/, '').trim();
        let contenido   = parte.substring(saltoLinea + 1);
        // Quitar fences ``` residuales al principio y al final
        contenido = contenido.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();
        if (ruta && contenido) archivos.push({ ruta, contenido });
      }
      if (archivos.length > 0) return archivos;
    }

    // ── Estrategia 2: Bloques markdown con nombre de archivo ────────
    //   Busca patrones como:
    //     **archivo.py** / # archivo.py / FILE: archivo.py
    //     seguido de ```python ... ```
    const fenceRegex = /(?:^|\n)(?:\s*(?:\*\*|##?|\/\/|#|FILE:|File:|ARCHIVO:)?\s*([A-Za-z0-9_./\\-]+\.[a-zA-Z0-9]{1,6})[\s\S]{0,80}?\n)?\`\`\`([a-zA-Z]*)\n([\s\S]*?)\n\`\`\`/g;
    let match: RegExpExecArray | null;
    let contador = 0;
    while ((match = fenceRegex.exec(bloque)) !== null) {
      const rutaExplicita = match[1];
      const lang          = (match[2] || '').toLowerCase();
      const contenido     = match[3].trim();
      if (!contenido) continue;

      let ruta = rutaExplicita;
      if (!ruta) {
        // Heuristica: primer comentario de ruta dentro del contenido
        const hintMatch = contenido.match(/^\s*(?:#|\/\/|--)\s*([A-Za-z0-9_./\\-]+\.[a-zA-Z0-9]{1,6})/);
        if (hintMatch) {
          ruta = hintMatch[1];
        } else {
          const ext: Record<string, string> = {
            python: 'py', py: 'py', typescript: 'ts', ts: 'ts',
            javascript: 'js', js: 'js', html: 'html', css: 'css',
            sql: 'sql', json: 'json', yaml: 'yml', yml: 'yml',
            bash: 'sh', sh: 'sh', dockerfile: 'Dockerfile',
          };
          const sufijo = ext[lang] || 'txt';
          contador++;
          ruta = sufijo === 'Dockerfile' ? 'Dockerfile' : `archivo_${contador}.${sufijo}`;
        }
      }
      archivos.push({ ruta, contenido });
    }
    if (archivos.length > 0) return archivos;

    // ── Fallback: guardar todo como un solo archivo de texto ────────
    if (bloque.trim()) {
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
      raiz.file('iniciar.py',    this.iniciarPython(slug, dbName));

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
    return `@echo off
title Iniciando ${proyecto}
color 0A
cls

echo.
echo  ============================================================
echo    INICIANDO APLICACION: ${proyecto}
echo  ============================================================
echo.
echo  El script "iniciar.py" se encargara de todo:
echo    - Verificar Python, Node, MySQL
echo    - Crear entorno virtual + instalar dependencias
echo    - Configurar base de datos
echo    - Arrancar backend (puerto 8000) y frontend (puerto 4200)
echo.
echo  Si algo falla, veras el error exacto. La ventana NO se cerrara
echo  sola. Al final tendras que pulsar una tecla.
echo.

REM ── Verificar Python primero (sin el, nada funciona) ────────
python --version >nul 2>&1
if errorlevel 1 (
  color 0C
  echo  [ERROR] Python no esta instalado o no esta en el PATH.
  echo  Descarga: https://www.python.org/downloads/  ^(marcar "Add to PATH"^)
  echo.
  pause
  exit /b 1
)

REM ── Delegamos todo a Python ────────────────────────────────
python "%~dp0iniciar.py"
set "PY_EXIT=%errorlevel%"

echo.
echo  ============================================================
if "%PY_EXIT%"=="0" (
  echo    FIN. Backend y Frontend corriendo en ventanas aparte.
) else (
  color 0C
  echo    ERROR. iniciar.py devolvio codigo %PY_EXIT%.
  echo    Revisa el mensaje de error arriba para saber que fallo.
)
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

  private iniciarPython(slug: string, dbName: string): string {
    const proyecto = this.proyectoNombre || slug;
    return `"""
iniciar.py - Orquestador de arranque de la aplicacion "${proyecto}".

Pasos:
  1. Verificar que Node este instalado (Python ya fue verificado por el .bat)
  2. Configurar la base de datos via setup_db.py
  3. Crear venv + instalar requirements.txt
  4. Instalar dependencias npm
  5. Arrancar backend (puerto 8000) en una ventana nueva
  6. Arrancar frontend (puerto 4200) en otra ventana nueva
  7. Abrir el navegador en http://localhost:4200

Cualquier error se muestra con traceback completo y el .bat conserva
la ventana abierta gracias al pause final.
"""
import os
import sys
import time
import shutil
import subprocess
import traceback
import webbrowser
from pathlib import Path

ROOT      = Path(__file__).parent.resolve()
BACKEND   = ROOT / "backend"
FRONTEND  = ROOT / "frontend"
PROJECT   = "${proyecto}"
IS_WIN    = os.name == "nt"

GREEN  = "\\033[92m" if not IS_WIN else ""
RED    = "\\033[91m" if not IS_WIN else ""
YELLOW = "\\033[93m" if not IS_WIN else ""
RESET  = "\\033[0m"  if not IS_WIN else ""


def banner(texto):
    print()
    print("  " + "─" * 58)
    print(f"  {texto}")
    print("  " + "─" * 58)


def _find_node():
    """Devuelve la ruta a node.exe o None."""
    exe = shutil.which("node")
    if exe:
        return exe
    if IS_WIN:
        candidatos = [
            os.path.join(os.environ.get("ProgramFiles", r"C:\\\\Program Files"), "nodejs", "node.exe"),
            os.path.join(os.environ.get("ProgramFiles(x86)", r"C:\\\\Program Files (x86)"), "nodejs", "node.exe"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "node", "node.exe"),
        ]
        for c in candidatos:
            if os.path.isfile(c):
                # Agregar al PATH de este proceso y los hijos
                os.environ["PATH"] = os.path.dirname(c) + os.pathsep + os.environ.get("PATH", "")
                return c
    return None


def paso_1_verificar_node():
    banner("PASO 1/5 - Verificando Node.js")
    node = _find_node()
    if not node:
        print("  [ERROR] Node.js no esta instalado o no esta en el PATH.")
        print("  Descarga:  https://nodejs.org  (version LTS)")
        sys.exit(1)
    rc = subprocess.run([node, "--version"], capture_output=True, text=True)
    print(f"  OK - Node {rc.stdout.strip()} en {node}")


def paso_2_configurar_bd():
    banner("PASO 2/5 - Configurando base de datos MySQL")
    setup = ROOT / "setup_db.py"
    if not setup.is_file():
        print("  [AVISO] setup_db.py no existe; salto configuracion de BD.")
        return
    rc = subprocess.run([sys.executable, str(setup)], cwd=str(ROOT))
    if rc.returncode != 0:
        print(f"  [AVISO] setup_db.py devolvio {rc.returncode}. El backend puede")
        print("  fallar en los endpoints que usen BD hasta que lo arregles.")
        print("  (Presiona ENTER para continuar igualmente)")
        try:
            input()
        except (EOFError, KeyboardInterrupt):
            pass


def paso_3_backend_deps():
    banner("PASO 3/5 - Preparando backend (FastAPI)")
    if not BACKEND.is_dir():
        print(f"  [ERROR] No existe la carpeta backend/ en {ROOT}")
        sys.exit(1)

    req = BACKEND / "requirements.txt"
    if not req.is_file():
        print(f"  [ERROR] No se encontro backend/requirements.txt")
        print("  La generacion del codigo con IA esta incompleta.")
        print("  Vuelve al Generador IA y pulsa 'Generar Codigo' de nuevo.")
        sys.exit(1)

    venv = BACKEND / "venv"
    if not venv.is_dir():
        print("  Creando entorno virtual (solo la primera vez)...")
        rc = subprocess.run([sys.executable, "-m", "venv", "--upgrade-deps", "venv"], cwd=str(BACKEND))
        if rc.returncode != 0:
            # Reintentar sin --upgrade-deps (Python < 3.9)
            rc = subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=str(BACKEND))
            if rc.returncode != 0:
                print("  [ERROR] Fallo al crear el venv.")
                sys.exit(1)

    # Usar python del venv con -m pip (mas robusto que llamar pip.exe directo)
    py_exe = venv / ("Scripts" if IS_WIN else "bin") / ("python.exe" if IS_WIN else "python")
    if not py_exe.is_file():
        print(f"  [ERROR] No se encontro python en el venv: {py_exe}")
        print("  Borrando venv corrupto y reintentando...")
        import shutil
        shutil.rmtree(str(venv), ignore_errors=True)
        rc = subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=str(BACKEND))
        if rc.returncode != 0:
            print("  [ERROR] No se pudo recrear el venv.")
            sys.exit(1)
        if not py_exe.is_file():
            print("  [ERROR] El venv se creo pero no contiene python.exe.")
            print("  Verifica tu instalacion de Python.")
            sys.exit(1)

    print(f"  Instalando dependencias Python (puede tardar ~1 min)...")
    rc = subprocess.run([str(py_exe), "-m", "pip", "install", "-r", str(req)], cwd=str(BACKEND))
    if rc.returncode != 0:
        print("  [ERROR] Fallo pip install. Revisa el error arriba.")
        sys.exit(1)
    print("  OK - Backend listo.")


def paso_4_frontend_deps():
    banner("PASO 4/5 - Preparando frontend (Angular)")
    if not FRONTEND.is_dir():
        print(f"  [ERROR] No existe la carpeta frontend/ en {ROOT}")
        sys.exit(1)

    pkg = FRONTEND / "package.json"
    if not pkg.is_file():
        print(f"  [ERROR] No se encontro frontend/package.json")
        print("  La generacion del codigo con IA esta incompleta.")
        print("  Vuelve al Generador IA y pulsa 'Generar Codigo' de nuevo.")
        sys.exit(1)

    node_modules = FRONTEND / "node_modules"
    if not node_modules.is_dir():
        print("  Instalando dependencias npm (primera vez ~2-5 min, paciencia)...")
        npm = shutil.which("npm") or "npm"
        rc = subprocess.run([npm, "install"], cwd=str(FRONTEND), shell=IS_WIN)
        if rc.returncode != 0:
            print("  [ERROR] Fallo npm install. Revisa el error arriba.")
            sys.exit(1)
    print("  OK - Frontend listo.")


def _abrir_ventana(titulo, comando_str, cwd):
    """Abre una nueva ventana de consola que ejecuta el comando."""
    if IS_WIN:
        # cmd /k mantiene la ventana abierta mostrando logs en vivo
        subprocess.Popen(
            f'start "{titulo}" cmd /k "{comando_str}"',
            cwd=str(cwd),
            shell=True,
        )
    else:
        # En Linux/Mac simplemente lanzamos en background
        subprocess.Popen(comando_str, cwd=str(cwd), shell=True)


def paso_5_arrancar():
    banner("PASO 5/5 - Arrancando servidores")

    # Backend — usar python -m uvicorn (mas robusto que llamar uvicorn.exe directo)
    if IS_WIN:
        uvicorn_cmd = r"venv\\\\Scripts\\\\python.exe -m uvicorn main:app --reload --port 8000"
    else:
        uvicorn_cmd = "venv/bin/python -m uvicorn main:app --reload --port 8000"
    print("  -> Abriendo ventana Backend (puerto 8000)...")
    _abrir_ventana(f"Backend | {PROJECT} | :8000", uvicorn_cmd, BACKEND)

    print("  Esperando 5s a que el backend arranque...")
    time.sleep(5)

    # Frontend
    ng_cmd = "npx ng serve --open" if IS_WIN else "npx ng serve --open"
    print("  -> Abriendo ventana Frontend (puerto 4200)...")
    _abrir_ventana(f"Frontend | {PROJECT} | :4200", ng_cmd, FRONTEND)

    print("  Esperando 15s a que Angular compile...")
    time.sleep(15)

    print()
    print("  ============================================================")
    print(f"    APLICACION {PROJECT.upper()} INICIADA")
    print("  ============================================================")
    print("    Frontend:      http://localhost:4200")
    print("    Backend API:   http://localhost:8000")
    print("    API Docs:      http://localhost:8000/docs")
    print("  ============================================================")

    try:
        webbrowser.open("http://localhost:4200")
    except Exception:
        pass


def main():
    print(f"  Directorio de trabajo: {ROOT}")
    paso_1_verificar_node()
    paso_2_configurar_bd()
    paso_3_backend_deps()
    paso_4_frontend_deps()
    paso_5_arrancar()
    print()
    print("  Las ventanas de Backend y Frontend quedan abiertas. Para detener")
    print("  la aplicacion cierralas (o ejecuta DETENER.bat).")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        print()
        print("  [ERROR INESPERADO]")
        traceback.print_exc()
        sys.exit(1)
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
