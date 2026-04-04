import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ContractItem, Supplier } from '../core/models';
import { ContractsCatalogPageComponent } from './contracts-catalog-page.component';

describe('ContractsCatalogPageComponent', () => {
  let fixture: ComponentFixture<ContractsCatalogPageComponent>;
  let component: ContractsCatalogPageComponent;

  const suppliers: Supplier[] = [
    { id: 's1', name: 'Proveedor Uno', taxId: '9001', contactEmail: 'uno@test.local' }
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

  const apiMock = {
    getSuppliers: jasmine.createSpy('getSuppliers').and.returnValue(of(suppliers)),
    getContracts: jasmine.createSpy('getContracts').and.returnValue(of(contracts)),
    createContract: jasmine.createSpy('createContract').and.returnValue(of(contracts[0])),
    updateContract: jasmine.createSpy('updateContract').and.returnValue(of(contracts[0]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractsCatalogPageComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: ApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsCatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps contract modal closed by default and opens it on demand', () => {
    expect(component.showModal()).toBeFalse();

    component.openContractModal();

    expect(component.showModal()).toBeTrue();
  });

  it('filters contracts by number, title or supplier name', () => {
    component.searchTerm.set('proveedor uno');

    expect(component.filteredContracts().map(item => item.id)).toEqual(['c1']);
  });
});
