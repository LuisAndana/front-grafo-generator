// src/app/features/srs/pages/srs-generator/srs-generator.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SrsGeneratorService, SRSDocument } from '../../services/srs-generator.service';

@Component({
  selector: 'app-srs-generator',
  standalone: false,
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

  constructor(private srsService: SrsGeneratorService) {}

  ngOnInit(): void {
    // No inicializa datos de ejemplo
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

  addStep(useCaseIndex: number): void {
    this.srsData.useCases[useCaseIndex].steps.push('');
  }

  removeStep(useCaseIndex: number, stepIndex: number): void {
    this.srsData.useCases[useCaseIndex].steps.splice(stepIndex, 1);
  }

  updateActors(useCaseIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.srsData.useCases[useCaseIndex].actors = input.value
      .split(',')
      .map(actor => actor.trim())
      .filter(actor => actor.length > 0);
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