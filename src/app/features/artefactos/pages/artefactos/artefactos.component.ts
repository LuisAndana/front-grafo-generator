import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ProyectoActivoService } from '../../../../core/services/proyecto-activo.service';

export interface Artefacto {
  id_artefacto?: number;
  proyecto_id?: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  nombre_archivo: string;
  tipo_mime: string;
  tamanio: number;
  created_at?: string;
}

@Component({
  selector: 'app-artefactos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './artefactos.component.html',
  styleUrls: ['./artefactos.component.css']
})
export class ArtefactosComponent implements OnInit, OnDestroy {

  private readonly BASE_URL = 'http://localhost:8000';
  private sub = new Subscription();

  proyectoId: number | null = null;
  proyectoNombre = '';

  // Lista de artefactos cargados desde el backend
  artefactos: Artefacto[] = [];
  artefactosFiltrados: Artefacto[] = [];

  // Formulario de subida
  uploadForm = { nombre: '', categoria: '', descripcion: '' };
  selectedFile: File | null = null;
  dragOver = false;

  // Filtro de categoría
  filtroCategoria = 'Todos';

  readonly categorias = [
    'Diagrama ER',
    'Caso de Uso',
    'Wireframe',
    'Diagrama de Flujo',
    'Diagrama de Clases',
    'Diagrama de Secuencia',
    'Otro'
  ];

  readonly filtros = ['Todos', ...this.categorias];

  // Estados
  isLoading = false;
  isUploading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private proyectoActivoSvc: ProyectoActivoService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.proyectoId = this.proyectoActivoSvc.proyectoId;
    this.proyectoNombre = this.proyectoActivoSvc.proyecto?.nombre ?? '';
    this.cargarArtefactos();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ── Carga ────────────────────────────────────────────────────────────────

  cargarArtefactos(): void {
    if (!this.proyectoId) return;

    this.isLoading = true;
    this.http.get<any>(`${this.BASE_URL}/api/artefactos/?proyecto_id=${this.proyectoId}`)
      .subscribe({
        next: (res) => {
          this.artefactos = Array.isArray(res) ? res : res?.data ?? [];
          this.aplicarFiltro();
          this.isLoading = false;
        },
        error: () => {
          this.artefactos = [];
          this.artefactosFiltrados = [];
          this.isLoading = false;
        }
      });
  }

  // ── Filtro ───────────────────────────────────────────────────────────────

  setFiltro(cat: string): void {
    this.filtroCategoria = cat;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    this.artefactosFiltrados = this.filtroCategoria === 'Todos'
      ? [...this.artefactos]
      : this.artefactos.filter(a => a.categoria === this.filtroCategoria);
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    if (!this.uploadForm.nombre) {
      this.uploadForm.nombre = file.name.replace(/\.[^/.]+$/, '');
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  // ── Subida ───────────────────────────────────────────────────────────────

  subirArtefacto(): void {
    if (!this.selectedFile || !this.uploadForm.nombre || !this.uploadForm.categoria) return;
    if (!this.proyectoId) return;

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('archivo', this.selectedFile);
    formData.append('proyecto_id', String(this.proyectoId));
    formData.append('nombre', this.uploadForm.nombre);
    formData.append('categoria', this.uploadForm.categoria);
    formData.append('descripcion', this.uploadForm.descripcion);

    this.http.post<any>(`${this.BASE_URL}/api/artefactos/`, formData).subscribe({
      next: (res) => {
        const creado = res?.data ?? res;
        this.artefactos.unshift(creado);
        this.aplicarFiltro();
        this.resetForm();
        this.isUploading = false;
        this.successMessage = 'Artefacto subido correctamente';
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err?.error?.detail ?? 'Error al subir el artefacto';
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  // ── Eliminación ──────────────────────────────────────────────────────────

  eliminarArtefacto(artefacto: Artefacto): void {
    if (!artefacto.id_artefacto) return;

    this.http.delete(`${this.BASE_URL}/api/artefactos/${artefacto.id_artefacto}`).subscribe({
      next: () => {
        this.artefactos = this.artefactos.filter(a => a.id_artefacto !== artefacto.id_artefacto);
        this.aplicarFiltro();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail ?? 'Error al eliminar el artefacto';
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  // ── Descarga ─────────────────────────────────────────────────────────────

  descargarArtefacto(artefacto: Artefacto): void {
    if (!artefacto.id_artefacto) return;
    window.open(`${this.BASE_URL}/api/artefactos/${artefacto.id_artefacto}/descargar`, '_blank');
  }

  // ── Utilidades ───────────────────────────────────────────────────────────

  getFileIcon(tipoMime: string): 'image' | 'pdf' | 'file' {
    if (!tipoMime) return 'file';
    if (tipoMime.startsWith('image/')) return 'image';
    if (tipoMime === 'application/pdf') return 'pdf';
    return 'file';
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  get isFormValid(): boolean {
    return !!(this.selectedFile && this.uploadForm.nombre && this.uploadForm.categoria);
  }

  private resetForm(): void {
    this.uploadForm = { nombre: '', categoria: '', descripcion: '' };
    this.selectedFile = null;
  }

  contarPorCategoria(cat: string): number {
    if (cat === 'Todos') return this.artefactos.length;
    return this.artefactos.filter(a => a.categoria === cat).length;
  }
}
