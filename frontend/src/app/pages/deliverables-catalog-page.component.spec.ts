import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ContractItem, Deliverable } from '../core/models';
import { DeliverablesCatalogPageComponent } from './deliverables-catalog-page.component';

describe('DeliverablesCatalogPageComponent', () => {
  let fixture: ComponentFixture<DeliverablesCatalogPageComponent>;
  let component: DeliverablesCatalogPageComponent;

  const contracts: ContractItem[] = [
    {
      id: 'c1',
      supplierId: 's1',
      contractNumber: 'CT-001',
      title: 'Contrato Uno',
      startDate: '2026-01-01',
      endDate: null,
      retentionPercentage: 10
    }
  ];

  const deliverables: Deliverable[] = [
    { id: 'd1', contractId: 'c1', name: 'Entregable Uno', description: 'Descripcion' }
  ];

  const apiMock = {
    getContracts: jasmine.createSpy('getContracts').and.returnValue(of(contracts)),
    getDeliverables: jasmine.createSpy('getDeliverables').and.returnValue(of(deliverables)),
    createDeliverable: jasmine.createSpy('createDeliverable').and.returnValue(of(deliverables[0]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliverablesCatalogPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeliverablesCatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps deliverable modal closed by default and opens it on demand', () => {
    expect(component.showModal()).toBeFalse();

    component.openModal();

    expect(component.showModal()).toBeTrue();
  });

  it('filters deliverables by search term', () => {
    component.searchTerm.set('contrato uno');

    expect(component.filteredDeliverables().map(item => item.id)).toEqual(['d1']);
  });
});
