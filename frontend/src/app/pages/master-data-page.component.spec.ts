import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ContractItem, Deliverable, Supplier } from '../core/models';
import { MasterDataPageComponent } from './master-data-page.component';

describe('MasterDataPageComponent', () => {
  let fixture: ComponentFixture<MasterDataPageComponent>;
  let component: MasterDataPageComponent;

  const suppliers: Supplier[] = [
    { id: 's1', name: 'Proveedor Uno', taxId: '9001', contactEmail: 'uno@test.local' },
    { id: 's2', name: 'Proveedor Dos', taxId: '9002', contactEmail: 'dos@test.local' }
  ];

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
    getSuppliers: jasmine.createSpy('getSuppliers').and.returnValue(of(suppliers)),
    getContracts: jasmine.createSpy('getContracts').and.returnValue(of(contracts)),
    getDeliverables: jasmine.createSpy('getDeliverables').and.returnValue(of(deliverables)),
    createSupplier: jasmine.createSpy('createSupplier').and.returnValue(of(suppliers[0])),
    updateSupplier: jasmine.createSpy('updateSupplier').and.returnValue(of(suppliers[0])),
    createContract: jasmine.createSpy('createContract').and.returnValue(of(contracts[0])),
    updateContract: jasmine.createSpy('updateContract').and.returnValue(of(contracts[0])),
    createDeliverable: jasmine.createSpy('createDeliverable').and.returnValue(of(deliverables[0]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDataPageComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: ApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MasterDataPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps supplier modal closed by default and opens it on demand', () => {
    expect(component.showSupplierModal()).toBeFalse();

    component.openSupplierModal();

    expect(component.showSupplierModal()).toBeTrue();
  });

  it('filters supplier, contract and deliverable lists by search terms', () => {
    component.supplierSearch.set('uno');
    expect(component.filteredSuppliers().map(item => item.id)).toEqual(['s1']);

    component.contractSearch.set('ct-001');
    expect(component.filteredContracts().map(item => item.id)).toEqual(['c1']);

    component.deliverableSearch.set('entregable');
    expect(component.filteredDeliverables().map(item => item.id)).toEqual(['d1']);
  });
});
