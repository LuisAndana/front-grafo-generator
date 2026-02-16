import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface Stakeholder {
  name: string;
  role: string;
  responsibility: string;
}

export interface User {
  userId: string;
  userType: string;
  description: string;
}

export interface FunctionalRequirement {
  rfId: string;
  description: string;
  priority: string;
}

export interface NonFunctionalRequirement {
  rnfId: string;
  category: string;
  description: string;
}

export interface UseCase {
  useCase: string;
  actors: string[];
  description: string;
  steps: string[];
}

export interface Constraint {
  constraintId: string;
  description: string;
  type: string;
}

export interface SRSDocument {
  projectName: string;
  introduction: string;
  stakeholders: Stakeholder[];
  users: User[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  useCases: UseCase[];
  constraints: Constraint[];
}

@Injectable({
  providedIn: 'root'
})
export class SrsGeneratorService {

  private readonly MARGIN_LEFT = 15;
  private readonly MARGIN_TOP = 15;
  private readonly MARGIN_RIGHT = 15;
  private readonly BOTTOM_MARGIN = 20;
  private readonly LINE_HEIGHT = 7;

  // 🔥 FUNCIÓN SEGURA
  private safe(value: unknown): string {
    return typeof value === 'string' ? value : String(value ?? '');
  }

  generateSRSPdf(srsData: SRSDocument): void {

    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = this.MARGIN_TOP;

    this.addTitle(pdf, 'Documento de Especificación de Requerimientos (SRS)', y);
    y += 15;

    this.addProjectInfo(pdf, this.safe(srsData.projectName), y);
    y += 15;

    y = this.addSection(pdf, 'Introducción', this.safe(srsData.introduction), y);

    y = this.addStakeholdersSection(pdf, srsData.stakeholders ?? [], y);
    y = this.addUsersSection(pdf, srsData.users ?? [], y);
    y = this.addFunctionalRequirementsSection(pdf, srsData.functionalRequirements ?? [], y);
    y = this.addNonFunctionalRequirementsSection(pdf, srsData.nonFunctionalRequirements ?? [], y);
    y = this.addUseCasesSection(pdf, srsData.useCases ?? [], y);
    y = this.addConstraintsSection(pdf, srsData.constraints ?? [], y);

    const fileName =
      `${this.safe(srsData.projectName) || 'Proyecto'}_SRS_${new Date().toISOString().split('T')[0]}.pdf`;

    pdf.save(fileName);
  }

  private addTitle(pdf: jsPDF, title: string, y: number): void {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');

    pdf.text(this.safe(title), pdf.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  }

  private addProjectInfo(pdf: jsPDF, projectName: string, y: number): void {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    pdf.text(`Proyecto: ${this.safe(projectName)}`, this.MARGIN_LEFT, y);
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, this.MARGIN_LEFT, y + 7);
  }

  private addSection(pdf: jsPDF, title: string, content: string, y: number): number {

    y = this.checkPageBreak(pdf, y, 30);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');

    pdf.text(this.safe(title), this.MARGIN_LEFT, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');


    const maxWidth =
      pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + this.MARGIN_RIGHT);

    const lines = pdf.splitTextToSize(this.safe(content), maxWidth);

    pdf.text(lines, this.MARGIN_LEFT, y);
    y += lines.length * this.LINE_HEIGHT + 10;

    return y;
  }

  private addStakeholdersSection(pdf: jsPDF, stakeholders: Stakeholder[], y: number): number {

    if (!stakeholders.length) return y;

    y = this.addSection(pdf, 'Stakeholders', '', y);

    stakeholders.forEach((s, i) => {

      y = this.checkPageBreak(pdf, y, 20);

      pdf.setFont('helvetica', 'bold');

      pdf.text(this.safe(`${i + 1}. ${s.name}`), this.MARGIN_LEFT + 5, y);
      y += this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'normal');


      pdf.text(this.safe(`Rol: ${s.role}`), this.MARGIN_LEFT + 10, y);
      y += this.LINE_HEIGHT;

      const maxWidth =
        pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + 30);

      const lines = pdf.splitTextToSize(
        this.safe(`Responsabilidad: ${s.responsibility}`),
        maxWidth
      );

      pdf.text(lines, this.MARGIN_LEFT + 10, y);
      y += lines.length * this.LINE_HEIGHT + 5;
    });

    return y;
  }

  private addUsersSection(pdf: jsPDF, users: User[], y: number): number {

    if (!users.length) return y;

    y = this.addSection(pdf, 'Usuarios', '', y);

    users.forEach((u, i) => {

      y = this.checkPageBreak(pdf, y, 20);

      pdf.setFont('helvetica', 'bold');

      pdf.text(
        this.safe(`${i + 1}. ${u.userType} (${u.userId})`),
        this.MARGIN_LEFT + 5,
        y
      );
      y += this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'normal');


      const maxWidth =
        pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + 30);

      const lines = pdf.splitTextToSize(
        this.safe(u.description),
        maxWidth
      );

      pdf.text(lines, this.MARGIN_LEFT + 10, y);
      y += lines.length * this.LINE_HEIGHT + 5;
    });

    return y;
  }

  private addFunctionalRequirementsSection(pdf: jsPDF, reqs: FunctionalRequirement[], y: number): number {

    if (!reqs.length) return y;

    y = this.addSection(pdf, 'Requerimientos Funcionales (RF)', '', y);

    reqs.forEach(r => {

      y = this.checkPageBreak(pdf, y, 20);

      pdf.setFont('helvetica', 'bold');

      pdf.text(this.safe(r.rfId), this.MARGIN_LEFT + 5, y);
      y += this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'normal');


      const maxWidth =
        pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + 30);

      const lines = pdf.splitTextToSize(
        this.safe(r.description),
        maxWidth
      );

      pdf.text(lines, this.MARGIN_LEFT + 10, y);
      y += lines.length * this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'italic');

      pdf.text(
        this.safe(`Prioridad: ${r.priority}`),
        this.MARGIN_LEFT + 10,
        y
      );
      y += this.LINE_HEIGHT + 5;
    });

    return y;
  }

  private addNonFunctionalRequirementsSection(pdf: jsPDF, reqs: NonFunctionalRequirement[], y: number): number {

    if (!reqs.length) return y;

    y = this.addSection(pdf, 'Requerimientos No Funcionales (RNF)', '', y);

    reqs.forEach(r => {

      y = this.checkPageBreak(pdf, y, 20);

      pdf.setFont('helvetica', 'bold');

      pdf.text(
        this.safe(`${r.rnfId} - ${r.category}`),
        this.MARGIN_LEFT + 5,
        y
      );
      y += this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'normal');


      const maxWidth =
        pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + 30);

      const lines = pdf.splitTextToSize(
        this.safe(r.description),
        maxWidth
      );

      pdf.text(lines, this.MARGIN_LEFT + 10, y);
      y += lines.length * this.LINE_HEIGHT + 5;
    });

    return y;
  }

  private addUseCasesSection(pdf: jsPDF, cases: UseCase[], y: number): number {

    if (!cases.length) return y;

    y = this.addSection(pdf, 'Casos de Uso', '', y);

    cases.forEach((c, i) => {

      y = this.checkPageBreak(pdf, y, 25);

      pdf.setFont('helvetica', 'bold');

      pdf.text(this.safe(`${i + 1}. ${c.useCase}`), this.MARGIN_LEFT + 5, y);
      y += this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'normal');

      pdf.text(
        this.safe(`Actores: ${c.actors?.join(', ')}`),
        this.MARGIN_LEFT + 10,
        y
      );
      y += this.LINE_HEIGHT;

      const maxWidth =
        pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + 30);

      const descLines = pdf.splitTextToSize(
        this.safe(c.description),
        maxWidth
      );

      pdf.text(descLines, this.MARGIN_LEFT + 10, y);
      y += descLines.length * this.LINE_HEIGHT + 5;
    });

    return y;
  }

  private addConstraintsSection(pdf: jsPDF, cons: Constraint[], y: number): number {

    if (!cons.length) return y;

    y = this.addSection(pdf, 'Restricciones', '', y);

    cons.forEach(c => {

      y = this.checkPageBreak(pdf, y, 20);

      pdf.setFont('helvetica', 'bold');

      pdf.text(
        this.safe(`${c.constraintId} (${c.type})`),
        this.MARGIN_LEFT + 5,
        y
      );
      y += this.LINE_HEIGHT;

      pdf.setFont('helvetica', 'normal');


      const maxWidth =
        pdf.internal.pageSize.getWidth() - (this.MARGIN_LEFT + 30);

      const lines = pdf.splitTextToSize(
        this.safe(c.description),
        maxWidth
      );

      pdf.text(lines, this.MARGIN_LEFT + 10, y);
      y += lines.length * this.LINE_HEIGHT + 5;
    });

    return y;
  }

  private checkPageBreak(pdf: jsPDF, y: number, needed: number): number {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + needed > pageHeight - this.BOTTOM_MARGIN) {
      pdf.addPage();
      return this.MARGIN_TOP;
    }
    return y;
  }
}
