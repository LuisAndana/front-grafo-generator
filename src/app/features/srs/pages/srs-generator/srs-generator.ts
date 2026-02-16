import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SrsGeneratorService, SRSDocument } from './services/srs-generator.service';

@Component({
  selector: 'app-srs-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './srs-generator.component.html',
  styleUrls: ['./srs-generator.component.css']
})
export class SrsGeneratorComponent implements OnInit {

  srsData: SRSDocument = {
    projectName: '',
    introduction: '',
    stakeholders: [],
    users: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    useCases: [],
    constraints: []
  };

  activeTab: string = 'introduction';
  showForm = false;

  constructor(private srsService: SrsGeneratorService) {}

  ngOnInit(): void {
    this.initializeSampleData();
  }

  initializeSampleData(): void {
    this.srsData = {
      projectName: 'Mi Proyecto',
      introduction: 'Este documento especifica los requerimientos del sistema...',
      stakeholders: [
        {
          name: 'Gerente de Proyecto',
          role: 'Supervisor',
          responsibility: 'Supervisar el progreso del proyecto'
        }
      ],
      users: [
        {
          userId: 'U001',
          userType: 'Administrador',
          description: 'Usuario con acceso total al sistema'
        }
      ],
      functionalRequirements: [
        {
          rfId: 'RF-001',
          description: 'El sistema debe permitir crear nuevos proyectos',
          priority: 'Alta'
        }
      ],
      nonFunctionalRequirements: [
        {
          rnfId: 'RNF-001',
          category: 'Rendimiento',
          description: 'El sistema debe cargar en menos de 3 segundos'
        }
      ],
      useCases: [
        {
          useCase: 'Crear Proyecto',
          actors: ['Administrador', 'Usuario'],
          description: 'El usuario puede crear un nuevo proyecto',
          steps: [
            'Ingresar al menú principal',
            'Seleccionar "Crear Proyecto"',
            'Completar formulario',
            'Guardar cambios'
          ]
        }
      ],
      constraints: [
        {
          constraintId: 'C-001',
          type: 'Técnica',
          description: 'Debe ser compatible con navegadores modernos'
        }
      ]
    };
  }

  addStakeholder(): void {
    this.srsData.stakeholders.push({
      name: '',
      role: '',
      responsibility: ''
    });
  }

  removeStakeholder(index: number): void {
    this.srsData.stakeholders.splice(index, 1);
  }

  addUser(): void {
    this.srsData.users.push({
      userId: '',
      userType: '',
      description: ''
    });
  }

  removeUser(index: number): void {
    this.srsData.users.splice(index, 1);
  }

  addFunctionalRequirement(): void {
    this.srsData.functionalRequirements.push({
      rfId: '',
      description: '',
      priority: 'Media'
    });
  }

  removeFunctionalRequirement(index: number): void {
    this.srsData.functionalRequirements.splice(index, 1);
  }

  addNonFunctionalRequirement(): void {
    this.srsData.nonFunctionalRequirements.push({
      rnfId: '',
      category: '',
      description: ''
    });
  }

  removeNonFunctionalRequirement(index: number): void {
    this.srsData.nonFunctionalRequirements.splice(index, 1);
  }

  addUseCase(): void {
    this.srsData.useCases.push({
      useCase: '',
      actors: [],
      description: '',
      steps: []
    });
  }

  removeUseCase(index: number): void {
    this.srsData.useCases.splice(index, 1);
  }

  addConstraint(): void {
    this.srsData.constraints.push({
      constraintId: '',
      type: '',
      description: ''
    });
  }

  removeConstraint(index: number): void {
    this.srsData.constraints.splice(index, 1);
  }

  generatePDF(): void {
    if (!this.srsData.projectName.trim()) {
      alert('Por favor, ingresa el nombre del proyecto');
      return;
    }
    this.srsService.generateSRSPdf(this.srsData);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}