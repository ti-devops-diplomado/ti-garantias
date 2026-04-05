import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { InvoiceItem, UserSummary } from '../core/models';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;

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
      purchaseOrder: 'OC-01',
      retainedAmount: 100,
      guaranteeRefundable: true,
      estimatedRefundDate: '2026-05-02',
      refundManagedDate: null,
      refundManagerUserId: null,
      refundManagerName: null,
      status: 'Registrada',
      createdByUserName: 'Registrador Demo',
      deliverableIds: [],
      attachments: []
    }
  ];

  const users: UserSummary[] = [
    { id: 'u1', email: 'admin@test.local', fullName: 'Admin Demo', isActive: true, roles: ['Admin'] },
    { id: 'u2', email: 'gestor@test.local', fullName: 'Gestor Demo', isActive: true, roles: ['Gestor'] }
  ];

  const apiMock = {
    getInvoices: jasmine.createSpy('getInvoices').and.returnValue(of(invoices)),
    getUsers: jasmine.createSpy('getUsers').and.returnValue(of(users))
  };

  const authMock = {
    user: () => ({ id: 'u1', email: 'admin@test.local', fullName: 'Admin Demo', isActive: true, roles: ['Admin'] })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ApiService, useValue: apiMock },
        { provide: AuthService, useValue: authMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sends admins from coverage card to unassigned invoices', () => {
    const coverageCard = component.focusCards().find(item => item.title === 'Sin gestor asignado');

    expect(coverageCard).toEqual(jasmine.objectContaining({
      route: '/facturas',
      queryParams: { manager: 'unassigned' },
      value: 1
    }));
  });
});
