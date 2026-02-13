import { TestBed } from '@angular/core/testing';
import { StakeholderService, Stakeholder } from '../../../../core/services/stakeholder.service';

describe('StakeholderService', () => {
  let service: StakeholderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StakeholderService);
    // Limpiar localStorage antes de cada test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save stakeholder', () => {
    const stakeholder = {
      nombre: 'Juan Pérez',
      rol: 'Gerente',
      tipo: 'Stakeholder' as const,
      area: 'Operaciones',
      nivelInfluencia: 'Alto' as const,
      interesSistema: 'Mejorar procesos'
    };

    service.saveStakeholder(stakeholder);
    const all = service.getAllStakeholders();
    expect(all.length).toBe(1);
    expect(all[0].nombre).toBe('Juan Pérez');
  });

  it('should filter stakeholders by type', () => {
    const stakeholder1 = {
      nombre: 'Juan',
      rol: 'Gerente',
      tipo: 'Stakeholder' as const,
      area: 'Ops',
      nivelInfluencia: 'Alto' as const,
      interesSistema: 'Test'
    };

    const stakeholder2 = {
      nombre: 'María',
      rol: 'Usuario',
      tipo: 'Usuario' as const,
      area: 'Ventas',
      nivelInfluencia: 'Medio' as const,
      interesSistema: 'Test'
    };

    service.saveStakeholder(stakeholder1);
    service.saveStakeholder(stakeholder2);

    const stakeholders = service.getStakeholdersByType('Stakeholder');
    expect(stakeholders.length).toBe(1);
    expect(stakeholders[0].nombre).toBe('Juan');
  });
});