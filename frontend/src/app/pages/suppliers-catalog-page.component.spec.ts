import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Supplier } from '../core/models';
import { SuppliersCatalogPageComponent } from './suppliers-catalog-page.component';

describe('SuppliersCatalogPageComponent', () => {
  let fixture: ComponentFixture<SuppliersCatalogPageComponent>;
  let component: SuppliersCatalogPageComponent;

  const suppliers: Supplier[] = [
    { id: 's1', name: 'Proveedor Uno', taxId: '9001', contactEmail: 'uno@test.local' },
    { id: 's2', name: 'Proveedor Dos', taxId: '9002', contactEmail: 'dos@test.local' }
  ];

  const apiMock = {
    getSuppliers: jasmine.createSpy('getSuppliers').and.returnValue(of(suppliers)),
    createSupplier: jasmine.createSpy('createSupplier').and.returnValue(of(suppliers[0])),
    updateSupplier: jasmine.createSpy('updateSupplier').and.returnValue(of(suppliers[0]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliersCatalogPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SuppliersCatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps supplier modal closed by default and opens it on demand', () => {
    expect(component.showModal()).toBeFalse();

    component.openSupplierModal();

    expect(component.showModal()).toBeTrue();
  });

  it('filters suppliers by search term', () => {
    component.searchTerm.set('dos');

    expect(component.filteredSuppliers().map(item => item.id)).toEqual(['s2']);
  });
});
