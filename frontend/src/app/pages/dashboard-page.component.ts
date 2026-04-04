import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { InvoiceItem, UserSummary } from '../core/models';

type DashboardRole = 'registrar' | 'manager' | 'admin' | 'generic';

interface SummaryCard {
  label: string;
  value: number;
  tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
}

interface QuickAction {
  label: string;
  route: string;
  hint: string;
}

interface ManagerLoadRow {
  managerName: string;
  assigned: number;
  pending: number;
  managed: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Panel principal</p>
        <h1>{{ title() }}</h1>
        <p class="subtitle">{{ subtitle() }}</p>
      </div>
      <div class="quick-actions" *ngIf="quickActions().length">
        <a mat-flat-button *ngFor="let action of quickActions()" [routerLink]="action.route">
          {{ action.label }}
        </a>
      </div>
    </section>

    <div class="loading-state" *ngIf="loading()">
      <mat-spinner diameter="42"></mat-spinner>
      <p>Cargando información del panel...</p>
    </div>

    <mat-card class="error-card" *ngIf="error() && !loading()">
      <h2>No pudimos cargar el dashboard</h2>
      <p>{{ error() }}</p>
      <button mat-flat-button (click)="loadDashboard()">Intentar de nuevo</button>
    </mat-card>

    <ng-container *ngIf="!loading() && !error()">
      <section class="summary-grid" *ngIf="summaryCards().length">
        <mat-card class="summary-card" *ngFor="let card of summaryCards()" [ngClass]="card.tone">
          <p>{{ card.label }}</p>
          <strong>{{ card.value }}</strong>
        </mat-card>
      </section>

      <section class="content-grid" *ngIf="role() === 'registrar'">
        <mat-card>
          <div class="section-head">
            <div>
              <h2>Alertas de vencimiento</h2>
              <p>Facturas propias que requieren atención por fecha.</p>
            </div>
            <a mat-stroked-button routerLink="/mis-registros">Ver mis registros</a>
          </div>
          <table class="table" *ngIf="registrarAlerts().length; else noRegistrarAlerts">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Contrato</th>
                <th>Proveedor</th>
                <th>Vencimiento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of registrarAlerts()">
                <td data-label="Factura">{{ item.invoiceNumber }}</td>
                <td data-label="Contrato">{{ contractLabel(item) }}</td>
                <td data-label="Proveedor">{{ item.supplierName }}</td>
                <td data-label="Vencimiento">{{ item.estimatedRefundDate || 'Pendiente' }}</td>
                <td data-label="Estado">{{ item.status }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noRegistrarAlerts>
            <p class="empty">No tienes facturas por vencer o vencidas en este momento.</p>
          </ng-template>
        </mat-card>

        <mat-card>
          <div class="section-head">
            <div>
              <h2>Completar información</h2>
              <p>Facturas propias con datos o soportes pendientes.</p>
            </div>
            <a mat-stroked-button routerLink="/mis-registros">Completar datos</a>
          </div>
          <table class="table" *ngIf="registrarMissingInfo().length; else noRegistrarMissingInfo">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Contrato</th>
                <th>Faltantes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of registrarMissingInfo()">
                <td data-label="Factura">{{ item.invoiceNumber }}</td>
                <td data-label="Contrato">{{ contractLabel(item) }}</td>
                <td data-label="Faltantes">{{ missingInfoLabel(item) }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noRegistrarMissingInfo>
            <p class="empty">Tus facturas no tienen faltantes críticos de información.</p>
          </ng-template>
        </mat-card>
      </section>

      <section class="content-grid" *ngIf="role() === 'manager'">
        <mat-card>
          <div class="section-head">
            <div>
              <h2>Pendientes por gestionar</h2>
              <p>Facturas asignadas al gestor actual y aún no gestionadas.</p>
            </div>
            <a mat-stroked-button routerLink="/pendientes-gestion">Abrir pendientes</a>
          </div>
          <table class="table" *ngIf="managerPending().length; else noManagerPending">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Contrato</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of managerPending()">
                <td data-label="Factura">{{ item.invoiceNumber }}</td>
                <td data-label="Contrato">{{ contractLabel(item) }}</td>
                <td data-label="Proveedor">{{ item.supplierName }}</td>
                <td data-label="Estado">{{ item.status }}</td>
                <td data-label="Vencimiento">{{ item.estimatedRefundDate || 'Pendiente' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noManagerPending>
            <p class="empty">No hay facturas asignadas pendientes por gestionar.</p>
          </ng-template>
        </mat-card>

        <mat-card>
          <div class="section-head">
            <div>
              <h2>Faltantes de información</h2>
              <p>Facturas asignadas con OC, fechas o soportes pendientes.</p>
            </div>
            <a mat-stroked-button routerLink="/pendientes-gestion">Completar información</a>
          </div>
          <table class="table" *ngIf="managerMissingInfo().length; else noManagerMissingInfo">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Contrato</th>
                <th>Faltantes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of managerMissingInfo()">
                <td data-label="Factura">{{ item.invoiceNumber }}</td>
                <td data-label="Contrato">{{ contractLabel(item) }}</td>
                <td data-label="Faltantes">{{ missingInfoLabel(item) }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noManagerMissingInfo>
            <p class="empty">Las facturas asignadas tienen la información clave completa.</p>
          </ng-template>
        </mat-card>
      </section>

      <section class="content-grid admin-grid" *ngIf="role() === 'admin'">
        <mat-card>
          <div class="section-head">
            <div>
              <h2>Visión global</h2>
              <p>Estado general del ciclo de facturas en la plataforma.</p>
            </div>
            <a mat-stroked-button routerLink="/facturas">Ver facturas</a>
          </div>
          <table class="table" *ngIf="adminAlerts().length; else noAdminAlerts">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Contrato</th>
                <th>Proveedor</th>
                <th>Gestor</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of adminAlerts()">
                <td data-label="Factura">{{ item.invoiceNumber }}</td>
                <td data-label="Contrato">{{ contractLabel(item) }}</td>
                <td data-label="Proveedor">{{ item.supplierName }}</td>
                <td data-label="Gestor">{{ item.refundManagerName || 'Sin asignar' }}</td>
                <td data-label="Estado">{{ item.status }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noAdminAlerts>
            <p class="empty">No hay alertas globales críticas en este momento.</p>
          </ng-template>
        </mat-card>

        <mat-card>
          <div class="section-head">
            <div>
              <h2>Carga por gestor</h2>
              <p>Distribución actual de facturas asignadas por responsable.</p>
            </div>
            <a mat-stroked-button routerLink="/admin/usuarios">Administrar usuarios</a>
          </div>
          <table class="table" *ngIf="managerLoad().length; else noManagerLoad">
            <thead>
              <tr>
                <th>Gestor</th>
                <th>Asignadas</th>
                <th>Pendientes</th>
                <th>Gestionadas</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of managerLoad()">
                <td data-label="Gestor">{{ row.managerName }}</td>
                <td data-label="Asignadas">{{ row.assigned }}</td>
                <td data-label="Pendientes">{{ row.pending }}</td>
                <td data-label="Gestionadas">{{ row.managed }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noManagerLoad>
            <p class="empty">Todavía no hay gestores o asignaciones para mostrar.</p>
          </ng-template>
        </mat-card>
      </section>

      <mat-card *ngIf="role() === 'generic'">
        <h2>Bienvenido</h2>
        <p>No encontramos un dashboard específico para tu rol actual. Usa el menú lateral para continuar.</p>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    :host { display: block; }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-size: 12px;
      color: #7c5e2a;
      font-weight: 700;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 32px;
      line-height: 1.1;
      color: #17324d;
    }
    .subtitle {
      margin: 0;
      max-width: 720px;
      color: #4e5f73;
    }
    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: flex-end;
    }
    .loading-state {
      display: grid;
      place-items: center;
      gap: 16px;
      min-height: 240px;
      color: #4e5f73;
    }
    .error-card { margin-bottom: 24px; }
    .summary-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      margin-bottom: 24px;
    }
    .summary-card {
      border-radius: 18px;
      box-shadow: none;
      border: 1px solid #e5dfd3;
    }
    .summary-card p {
      margin: 0 0 12px;
      color: #4e5f73;
      font-size: 14px;
    }
    .summary-card strong {
      font-size: 34px;
      line-height: 1;
      color: #17324d;
    }
    .summary-card.info { background: #eff5ff; }
    .summary-card.warning { background: #fff7e8; }
    .summary-card.danger { background: #fff0ed; }
    .summary-card.success { background: #eef8ef; }
    .summary-card.neutral { background: #ffffff; }
    .content-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .admin-grid { margin-bottom: 24px; }
    .section-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .section-head h2 {
      margin: 0 0 6px;
      font-size: 22px;
      color: #17324d;
    }
    .section-head p {
      margin: 0;
      color: #4e5f73;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th,
    .table td {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 1px solid #ece7dc;
      vertical-align: top;
    }
    .table th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: #6b7b8c;
    }
    .table td {
      color: #22384f;
    }
    .empty {
      margin: 0;
      padding: 12px 0 4px;
      color: #5f6f81;
    }
    @media (max-width: 960px) {
      .hero,
      .section-head {
        flex-direction: column;
      }
      .content-grid {
        grid-template-columns: 1fr;
      }
      .table,
      .table thead,
      .table tbody,
      .table tr,
      .table th,
      .table td {
        display: block;
      }
      .table thead {
        display: none;
      }
      .table tr {
        padding: 12px;
        border: 1px solid #ece7dc;
        border-radius: 14px;
        background: #fff;
        margin-bottom: 12px;
      }
      .table td {
        border-bottom: none;
        padding: 6px 0;
      }
      .table td::before {
        content: attr(data-label);
        display: block;
        margin-bottom: 2px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .04em;
        color: #7b8795;
      }
      .quick-actions {
        justify-content: flex-start;
      }
    }
  `]
})
export class DashboardPageComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly invoices = signal<InvoiceItem[]>([]);
  readonly users = signal<UserSummary[]>([]);

  readonly role = computed<DashboardRole>(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('Admin')) {
      return 'admin';
    }
    if (roles.includes('Gestor')) {
      return 'manager';
    }
    if (roles.includes('Registrador')) {
      return 'registrar';
    }
    return 'generic';
  });

  readonly title = computed(() => {
    switch (this.role()) {
      case 'registrar':
        return 'Tu tablero de facturas';
      case 'manager':
        return 'Panel de gestión';
      case 'admin':
        return 'Dashboard ejecutivo';
      default:
        return 'Dashboard';
    }
  });

  readonly subtitle = computed(() => {
    switch (this.role()) {
      case 'registrar':
        return 'Consulta tus facturas, prioriza vencimientos y completa la información crítica sin salir del flujo operativo.';
      case 'manager':
        return 'Enfócate en las facturas asignadas, faltantes de información y gestión pendiente del proceso de devolución.';
      case 'admin':
        return 'Monitorea el estado general del proceso, identifica riesgos y revisa la carga operativa por gestor.';
      default:
        return 'Usa este panel como punto de entrada a los flujos principales del sistema.';
    }
  });

  readonly summaryCards = computed<SummaryCard[]>(() => {
    const invoices = this.invoices();
    if (!invoices.length) {
      return [];
    }

    switch (this.role()) {
      case 'registrar':
        return [
          { label: 'Mis facturas', value: invoices.length, tone: 'neutral' },
          { label: 'Por vencer', value: this.countByStatus(invoices, 'Por_Vencer'), tone: 'warning' },
          { label: 'Vencidas', value: this.countByStatus(invoices, 'Vencida'), tone: 'danger' },
          { label: 'Con faltantes', value: invoices.filter(item => this.hasMissingInfo(item)).length, tone: 'info' }
        ];
      case 'manager':
        return [
          { label: 'Asignadas', value: invoices.length, tone: 'neutral' },
          { label: 'Pendientes', value: this.pendingManagedInvoices(invoices).length, tone: 'warning' },
          { label: 'Sin OC', value: invoices.filter(item => !this.hasValue(item.purchaseOrder)).length, tone: 'info' },
          { label: 'Sin soportes', value: invoices.filter(item => !item.attachments.length).length, tone: 'danger' }
        ];
      case 'admin':
        return [
          { label: 'Total facturas', value: invoices.length, tone: 'neutral' },
          { label: 'Por vencer', value: this.countByStatus(invoices, 'Por_Vencer'), tone: 'warning' },
          { label: 'Vencidas', value: this.countByStatus(invoices, 'Vencida'), tone: 'danger' },
          { label: 'Gestionadas', value: this.countByStatus(invoices, 'Gestionada'), tone: 'success' }
        ];
      default:
        return [];
    }
  });

  readonly quickActions = computed<QuickAction[]>(() => {
    switch (this.role()) {
      case 'registrar':
        return [
          { label: 'Mis registros', route: '/mis-registros', hint: 'Ver mis facturas' },
          { label: 'Facturas', route: '/facturas', hint: 'Consultar todo el listado' },
          { label: 'Catálogos', route: '/catalogos', hint: 'Actualizar maestros' }
        ];
      case 'manager':
        return [
          { label: 'Pendientes', route: '/pendientes-gestion', hint: 'Gestionar facturas asignadas' },
          { label: 'Catálogos', route: '/catalogos', hint: 'Consultar contratos y entregables' }
        ];
      case 'admin':
        return [
          { label: 'Facturas', route: '/facturas', hint: 'Vista global' },
          { label: 'Pendientes', route: '/pendientes-gestion', hint: 'Revisar gestión' },
          { label: 'Usuarios', route: '/admin/usuarios', hint: 'Administrar accesos' },
          { label: 'Catálogos', route: '/catalogos', hint: 'Mantener maestros' }
        ];
      default:
        return [];
    }
  });

  readonly registrarAlerts = computed(() =>
    this.sortByEstimatedRefundDate(
      this.invoices().filter(item => item.status === 'Por_Vencer' || item.status === 'Vencida')
    ).slice(0, 8)
  );

  readonly registrarMissingInfo = computed(() =>
    this.sortByInvoiceDateDesc(this.invoices().filter(item => this.hasMissingInfo(item))).slice(0, 8)
  );

  readonly managerPending = computed(() =>
    this.sortByEstimatedRefundDate(this.pendingManagedInvoices(this.invoices())).slice(0, 8)
  );

  readonly managerMissingInfo = computed(() =>
    this.sortByInvoiceDateDesc(this.invoices().filter(item => this.hasMissingInfo(item))).slice(0, 8)
  );

  readonly adminAlerts = computed(() =>
    this.sortByEstimatedRefundDate(
      this.invoices().filter(item => item.status === 'Vencida' || item.status === 'Por_Vencer')
    ).slice(0, 10)
  );

  readonly managerLoad = computed<ManagerLoadRow[]>(() => {
    const invoices = this.invoices();
    const managers = this.users().filter(user => user.roles.includes('Gestor'));

    return managers.map(manager => {
      const assigned = invoices.filter(item => item.refundManagerUserId === manager.id);
      return {
        managerName: manager.fullName,
        assigned: assigned.length,
        pending: this.pendingManagedInvoices(assigned).length,
        managed: assigned.filter(item => item.status === 'Gestionada').length
      };
    }).sort((left, right) => right.pending - left.pending || right.assigned - left.assigned);
  });

  constructor() {
    effect(() => {
      const currentUser = this.auth.user();
      if (currentUser) {
        this.loadDashboard();
      }
    });
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set(null);

    switch (this.role()) {
      case 'admin':
        forkJoin({
          invoices: this.api.getInvoices('all'),
          users: this.api.getUsers()
        }).subscribe({
          next: ({ invoices, users }) => {
            this.invoices.set(invoices);
            this.users.set(users);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('No fue posible cargar la información global del panel.');
            this.loading.set(false);
          }
        });
        break;
      case 'manager':
        this.api.getInvoices('managed').subscribe({
          next: invoices => {
            this.invoices.set(invoices);
            this.users.set([]);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('No fue posible cargar tus facturas asignadas.');
            this.loading.set(false);
          }
        });
        break;
      case 'registrar':
        this.api.getInvoices('mine').subscribe({
          next: invoices => {
            this.invoices.set(invoices);
            this.users.set([]);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('No fue posible cargar tus facturas.');
            this.loading.set(false);
          }
        });
        break;
      default:
        this.invoices.set([]);
        this.users.set([]);
        this.loading.set(false);
        break;
    }
  }

  contractLabel(item: InvoiceItem) {
    return [item.contractNumber, item.contractTitle].filter(part => this.hasValue(part)).join(' - ');
  }

  missingInfoLabel(item: InvoiceItem) {
    const missing: string[] = [];
    if (!this.hasValue(item.purchaseOrder)) {
      missing.push('OC');
    }
    if (!this.hasValue(item.estimatedRefundDate)) {
      missing.push('fecha de vencimiento');
    }
    if (!item.attachments.length) {
      missing.push('adjuntos');
    }
    return missing.join(', ');
  }

  private pendingManagedInvoices(invoices: InvoiceItem[]) {
    return invoices.filter(item => item.guaranteeRefundable && item.status !== 'Gestionada');
  }

  private countByStatus(invoices: InvoiceItem[], status: string) {
    return invoices.filter(item => item.status === status).length;
  }

  private hasMissingInfo(item: InvoiceItem) {
    return !this.hasValue(item.purchaseOrder)
      || !this.hasValue(item.estimatedRefundDate)
      || !item.attachments.length;
  }

  private hasValue(value: string | null | undefined) {
    return !!value && value.trim().length > 0;
  }

  private sortByEstimatedRefundDate(invoices: InvoiceItem[]) {
    return [...invoices].sort((left, right) => {
      const leftDate = this.toTime(left.estimatedRefundDate) ?? Number.MAX_SAFE_INTEGER;
      const rightDate = this.toTime(right.estimatedRefundDate) ?? Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    });
  }

  private sortByInvoiceDateDesc(invoices: InvoiceItem[]) {
    return [...invoices].sort((left, right) => (this.toTime(right.invoiceDate) ?? 0) - (this.toTime(left.invoiceDate) ?? 0));
  }

  private toTime(value: string | null | undefined) {
    if (!value) {
      return null;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
