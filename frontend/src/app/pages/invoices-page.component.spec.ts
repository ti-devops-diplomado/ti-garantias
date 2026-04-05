import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { InvoicesPageComponent } from './invoices-page.component';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ContractItem, Deliverable, InvoiceItem, Supplier, UserSummary } from '../core/models';

describe('InvoicesPageComponent', () => {
  let fixture: ComponentFixture<InvoicesPageComponent>;
  let component: InvoicesPageComponent;

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
    },
    {
      id: 'c2',
      supplierId: 's2',
      contractNumber: 'CT-002',
      title: 'Contrato Dos',
      startDate: '2026-01-01',
      endDate: null,
      retentionPercentage: 10
    }
  ];

  const deliverables: Deliverable[] = [
    { id: 'd1', contractId: 'c1', name: 'Entregable 1', description: '' }
  ];

  const users: UserSummary[] = [
    { id: 'u-admin', email: 'admin@test.local', fullName: 'Admin Demo', isActive: true, roles: ['Admin'] },
    { id: 'u-manager', email: 'gestor@test.local', fullName: 'Gestor Demo', isActive: true, roles: ['Gestor'] }
  ];

  const invoices: InvoiceItem[] = [
    {
      id: 'i1',
      contractId: 'c1',
      contractNumber: 'CT-001',
      contractTitle: 'Contrato Uno',
      supplierId: 's1',
      supplierName: 'Proveedor Uno',
      invoiceNumber: '001-001-123456789',
      invoiceDate: '2026-02-01',
      invoiceAmount: 1000,
      purchaseOrder: '',
      retainedAmount: 100,
      guaranteeRefundable: true,
      estimatedRefundDate: '2026-05-02',
      refundManagedDate: null,
      refundManagerUserId: 'u-manager',
      refundManagerName: 'Gestor Demo',
      status: 'Por_Vencer',
      createdByUserName: 'Registrador Demo',
      deliverableIds: ['d1'],
      attachments: []
    },
    {
      id: 'i2',
      contractId: 'c2',
      contractNumber: 'CT-002',
      contractTitle: 'Contrato Dos',
      supplierId: 's2',
      supplierName: 'Proveedor Dos',
      invoiceNumber: '002-002-987654321',
      invoiceDate: '2026-01-15',
      invoiceAmount: 2000,
      purchaseOrder: 'OC-55',
      retainedAmount: 200,
      guaranteeRefundable: true,
      estimatedRefundDate: '2026-04-15',
      refundManagedDate: null,
      refundManagerUserId: 'u-manager',
      refundManagerName: 'Gestor Demo',
      status: 'Gestionada',
      createdByUserName: 'Registrador Demo',
      deliverableIds: [],
      attachments: []
    },
    {
      id: 'i3',
      contractId: 'c1',
      contractNumber: 'CT-001',
      contractTitle: 'Contrato Uno',
      supplierId: 's1',
      supplierName: 'Proveedor Uno',
      invoiceNumber: '003-003-111111111',
      invoiceDate: '2026-02-10',
      invoiceAmount: 900,
      purchaseOrder: 'OC-90',
      retainedAmount: 90,
      guaranteeRefundable: true,
      estimatedRefundDate: '2026-05-11',
      refundManagedDate: null,
      refundManagerUserId: null,
      refundManagerName: null,
      status: 'Registrada',
      createdByUserName: 'Registrador Demo',
      deliverableIds: ['d1'],
      attachments: []
    }
  ];

  const apiMock = {
    getUsers: jasmine.createSpy('getUsers').and.returnValue(of(users)),
    getSuppliers: jasmine.createSpy('getSuppliers').and.returnValue(of(suppliers)),
    getContracts: jasmine.createSpy('getContracts').and.returnValue(of(contracts)),
    getDeliverables: jasmine.createSpy('getDeliverables').and.returnValue(of(deliverables)),
    getInvoices: jasmine.createSpy('getInvoices').and.returnValue(of(invoices)),
    saveInvoice: jasmine.createSpy('saveInvoice').and.returnValue(of(invoices[0])),
    manageRefund: jasmine.createSpy('manageRefund').and.returnValue(of(invoices[0])),
    uploadAttachment: jasmine.createSpy('uploadAttachment').and.returnValue(of({})),
    getAttachmentPreview: jasmine.createSpy('getAttachmentPreview').and.returnValue(of({ blob: new Blob(), contentType: 'application/pdf' }))
  };

  const authMock = {
    hasAnyRole: (roles: string[]) => roles.includes('Registrador') || roles.includes('Admin'),
    user: () => ({ id: 'u1', email: 'demo@test.local', fullName: 'Demo', isActive: true, roles: ['Registrador', 'Admin'] })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesPageComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: ApiService, useValue: apiMock },
        { provide: AuthService, useValue: authMock },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { scope: 'all' }, queryParamMap: new Map() } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the form modal hidden on first load and opens it for new invoices', () => {
    expect(component.showFormModal()).toBeFalse();

    component.openCreateModal();

    expect(component.showFormModal()).toBeTrue();
    expect(component.editingInvoiceId()).toBeNull();
  });

  it('filters invoices by search term, supplier and status', () => {
    expect(component.filteredInvoices().length).toBe(3);

    component.searchTerm.set('987654321');
    expect(component.filteredInvoices().map(item => item.id)).toEqual(['i2']);

    component.searchTerm.set('');
    component.supplierFilter.set('s1');
    expect(component.filteredInvoices().map(item => item.id)).toEqual(['i1', 'i3']);

    component.supplierFilter.set('');
    component.statusFilter.set('Gestionada');
    expect(component.filteredInvoices().map(item => item.id)).toEqual(['i2']);
  });

  it('filters invoices without assigned manager', () => {
    component.managerFilter.set('unassigned');

    expect(component.filteredInvoices().map(item => item.id)).toEqual(['i3']);
  });

  it('saves the selected manager when updating an invoice', () => {
    component.startEdit(invoices[2]);
    component.form.patchValue({
      supplierId: 's1',
      contractId: 'c1',
      invoiceNumber: '003-003-111111111',
      invoiceDate: new Date('2026-02-10'),
      invoiceAmount: 900,
      purchaseOrder: 'OC-90',
      retainedAmount: 90,
      guaranteeRefundable: true,
      estimatedRefundDate: '2026-05-11',
      deliverableIds: ['d1'],
      refundManagerUserId: 'u-manager'
    });

    component.saveInvoice();

    expect(apiMock.saveInvoice).toHaveBeenCalledWith(jasmine.objectContaining({
      refundManagerUserId: 'u-manager'
    }), 'i3');
  });
});
