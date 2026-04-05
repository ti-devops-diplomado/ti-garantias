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

interface FocusCard {
  eyebrow: string;
  title: string;
  detail: string;
  route: string;
  queryParams?: Record<string, string>;
  cta: string;
  tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  value: number;
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
    <section class="page-shell">
      <section class="page-hero">
        <div>
          <p class="page-hero__eyebrow">Panel principal</p>
          <h1 class="page-hero__title">{{ title() }}</h1>
          <p class="page-hero__subtitle">{{ subtitle() }}</p>
        </div>
        <div class="hero-stat-grid" *ngIf="summaryCards().length">
          <article class="hero-stat" *ngFor="let card of summaryCards()">
            <p class="hero-stat__label">{{ card.label }}</p>
            <p class="hero-stat__value">{{ card.value }}</p>
          </article>
        </div>
      </section>

      <div class="loading-state" *ngIf="loading()">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando informacion del panel...</p>
      </div>

      <mat-card class="surface-card surface-card--soft error-card" *ngIf="error() && !loading()">
        <div class="surface-card__header">
          <div>
            <p class="surface-card__eyebrow">Dashboard</p>
            <h2>No pudimos cargar el panel</h2>
            <p class="surface-card__copy">{{ error() }}</p>
          </div>
          <button mat-flat-button color="primary" (click)="loadDashboard()">Intentar de nuevo</button>
        </div>
      </mat-card>

      <ng-container *ngIf="!loading() && !error()">
        <section class="focus-grid" *ngIf="focusCards().length">
          <mat-card class="surface-card focus-card" *ngFor="let item of focusCards()" [ngClass]="'focus-card--' + item.tone">
            <p class="focus-card__eyebrow">{{ item.eyebrow }}</p>
            <strong class="focus-card__value">{{ item.value }}</strong>
            <h3>{{ item.title }}</h3>
            <p class="focus-card__detail">{{ item.detail }}</p>
            <a mat-stroked-button [routerLink]="item.route" [queryParams]="item.queryParams ?? null">{{ item.cta }}</a>
          </mat-card>
        </section>

        <section class="action-strip" *ngIf="quickActions().length">
          <a class="action-tile" *ngFor="let action of quickActions()" [routerLink]="action.route">
            <span class="action-tile__label">{{ action.label }}</span>
            <span class="action-tile__hint">{{ action.hint }}</span>
          </a>
        </section>

        <section class="content-grid" *ngIf="role() === 'registrar'">
          <mat-card class="surface-card">
            <div class="surface-card__header">
              <div>
                <p class="surface-card__eyebrow">Prioridad</p>
                <h2>Alertas de vencimiento</h2>
                <p class="surface-card__copy">Facturas propias que requieren atencion por fecha.</p>
              </div>
              <a mat-stroked-button routerLink="/mis-registros">Ver mis registros</a>
            </div>
            <div class="app-table-wrap" *ngIf="registrarAlerts().length; else noRegistrarAlerts">
              <table class="data-table">
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
                    <td data-label="Estado">
                      <span class="status-badge" [ngClass]="statusClass(item.status)">{{ item.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noRegistrarAlerts>
              <p class="empty-state">No tienes facturas por vencer o vencidas en este momento.</p>
            </ng-template>
          </mat-card>

          <mat-card class="surface-card surface-card--accent">
            <div class="surface-card__header">
              <div>
                <p class="surface-card__eyebrow">Completitud</p>
                <h2>Completar informacion</h2>
                <p class="surface-card__copy">Facturas propias con datos o soportes pendientes.</p>
              </div>
              <a mat-stroked-button routerLink="/mis-registros">Completar datos</a>
            </div>
            <div class="app-table-wrap" *ngIf="registrarMissingInfo().length; else noRegistrarMissingInfo">
              <table class="data-table">
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
                    <td data-label="Faltantes">
                      <span class="info-badge">{{ missingInfoLabel(item) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noRegistrarMissingInfo>
              <p class="empty-state">Tus facturas no tienen faltantes criticos de informacion.</p>
            </ng-template>
          </mat-card>
        </section>

        <section class="content-grid" *ngIf="role() === 'manager'">
          <mat-card class="surface-card">
            <div class="surface-card__header">
              <div>
                <p class="surface-card__eyebrow">Gestion</p>
                <h2>Pendientes por gestionar</h2>
                <p class="surface-card__copy">Facturas asignadas al gestor actual y aun no gestionadas.</p>
              </div>
              <a mat-stroked-button routerLink="/pendientes-gestion">Abrir pendientes</a>
            </div>
            <div class="app-table-wrap" *ngIf="managerPending().length; else noManagerPending">
              <table class="data-table">
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
                    <td data-label="Estado">
                      <span class="status-badge" [ngClass]="statusClass(item.status)">{{ item.status }}</span>
                    </td>
                    <td data-label="Vencimiento">{{ item.estimatedRefundDate || 'Pendiente' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noManagerPending>
              <p class="empty-state">No hay facturas asignadas pendientes por gestionar.</p>
            </ng-template>
          </mat-card>

          <mat-card class="surface-card surface-card--accent">
            <div class="surface-card__header">
              <div>
                <p class="surface-card__eyebrow">Detalle</p>
                <h2>Faltantes de informacion</h2>
                <p class="surface-card__copy">Facturas asignadas con OC, fechas o soportes pendientes.</p>
              </div>
              <a mat-stroked-button routerLink="/pendientes-gestion">Completar informacion</a>
            </div>
            <div class="app-table-wrap" *ngIf="managerMissingInfo().length; else noManagerMissingInfo">
              <table class="data-table">
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
                    <td data-label="Faltantes">
                      <span class="info-badge">{{ missingInfoLabel(item) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noManagerMissingInfo>
              <p class="empty-state">Las facturas asignadas tienen la informacion clave completa.</p>
            </ng-template>
          </mat-card>
        </section>

        <section class="content-grid" *ngIf="role() === 'admin'">
          <mat-card class="surface-card">
            <div class="surface-card__header">
              <div>
                <p class="surface-card__eyebrow">Visibilidad</p>
                <h2>Vision global</h2>
                <p class="surface-card__copy">Estado general del ciclo de facturas en la plataforma.</p>
              </div>
              <a mat-stroked-button routerLink="/facturas">Ver facturas</a>
            </div>
            <div class="app-table-wrap" *ngIf="adminAlerts().length; else noAdminAlerts">
              <table class="data-table">
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
                    <td data-label="Estado">
                      <span class="status-badge" [ngClass]="statusClass(item.status)">{{ item.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noAdminAlerts>
              <p class="empty-state">No hay alertas globales criticas en este momento.</p>
            </ng-template>
          </mat-card>

          <mat-card class="surface-card surface-card--accent">
            <div class="surface-card__header">
              <div>
                <p class="surface-card__eyebrow">Capacidad</p>
                <h2>Carga por gestor</h2>
                <p class="surface-card__copy">Distribucion actual de facturas asignadas por responsable.</p>
              </div>
              <a mat-stroked-button routerLink="/admin/usuarios">Administrar usuarios</a>
            </div>
            <div class="app-table-wrap" *ngIf="managerLoad().length; else noManagerLoad">
              <table class="data-table">
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
            </div>
            <ng-template #noManagerLoad>
              <p class="empty-state">Todavia no hay gestores o asignaciones para mostrar.</p>
            </ng-template>
          </mat-card>
        </section>

        <mat-card class="surface-card" *ngIf="role() === 'generic'">
          <div class="surface-card__header">
            <div>
              <p class="surface-card__eyebrow">Acceso</p>
              <h2>Bienvenido</h2>
              <p class="surface-card__copy">No encontramos un dashboard especifico para tu rol actual. Usa el menu lateral para continuar.</p>
            </div>
          </div>
        </mat-card>
      </ng-container>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .loading-state {
      display: grid;
      place-items: center;
      gap: 16px;
      min-height: 240px;
      color: var(--color-ink-soft);
    }

    .action-strip {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    }

    .focus-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .focus-card {
      display: grid;
      gap: 10px;
    }

    .focus-card__eyebrow,
    .focus-card__value,
    .focus-card h3,
    .focus-card__detail {
      margin: 0;
    }

    .focus-card__eyebrow {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 800;
      color: var(--color-ink-muted);
    }

    .focus-card__value {
      font-size: 2.4rem;
      line-height: 1;
      color: var(--color-accent-strong);
    }

    .focus-card__detail {
      color: var(--color-ink-soft);
    }

    .focus-card--warning {
      background: linear-gradient(180deg, #fff8e8, #fff1d4);
    }

    .focus-card--danger {
      background: linear-gradient(180deg, #fff3ef, #fdece7);
    }

    .focus-card--info {
      background: linear-gradient(180deg, #eff7fd, #dceffd);
    }

    .focus-card--success {
      background: linear-gradient(180deg, #eef8f3, #e6f4ee);
    }

    .action-tile {
      display: block;
      padding: 18px 20px;
      border: 1px solid rgba(23, 50, 77, 0.08);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.72);
      text-decoration: none;
      box-shadow: var(--shadow-soft);
      transition: transform 150ms ease, box-shadow 150ms ease;
    }

    .action-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 36px rgba(15, 31, 48, 0.1);
    }

    .action-tile__label,
    .action-tile__hint {
      display: block;
      margin: 0;
    }

    .action-tile__label {
      font-weight: 800;
      color: var(--color-accent-strong);
    }

    .action-tile__hint {
      margin-top: 6px;
      color: var(--color-ink-soft);
    }

    .content-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 960px) {
      .action-strip,
      .focus-grid {
        grid-template-columns: 1fr;
      }

      .action-tile,
      .focus-card {
        border-radius: 20px;
      }

      .focus-card__value {
        font-size: 2rem;
      }

      .content-grid {
        grid-template-columns: 1fr;
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
          { label: 'Catálogos', route: '/catalogos/proveedores', hint: 'Actualizar maestros' }
        ];
      case 'manager':
        return [
          { label: 'Pendientes', route: '/pendientes-gestion', hint: 'Gestionar facturas asignadas' },
          { label: 'Catálogos', route: '/catalogos/proveedores', hint: 'Consultar contratos y entregables' }
        ];
      case 'admin':
        return [
          { label: 'Facturas', route: '/facturas', hint: 'Vista global' },
          { label: 'Pendientes', route: '/pendientes-gestion', hint: 'Revisar gestión' },
          { label: 'Usuarios', route: '/admin/usuarios', hint: 'Administrar accesos' },
          { label: 'Catálogos', route: '/catalogos/proveedores', hint: 'Mantener maestros' }
        ];
      default:
        return [];
    }
  });

  readonly focusCards = computed<FocusCard[]>(() => {
    const invoices = this.invoices();

    switch (this.role()) {
      case 'registrar':
        return [
          {
            eyebrow: 'Atiende hoy',
            title: 'Facturas por vencer',
            detail: 'Prioriza las facturas con fecha mas cercana para evitar atrasos.',
            route: '/mis-registros',
            cta: 'Abrir registros',
            tone: 'warning',
            value: invoices.filter(item => item.status === 'Por_Vencer').length
          },
          {
            eyebrow: 'Completa datos',
            title: 'Registros con faltantes',
            detail: 'Actualiza OC, fecha de vencimiento o soportes en los casos incompletos.',
            route: '/mis-registros',
            cta: 'Completar informacion',
            tone: 'info',
            value: invoices.filter(item => this.hasMissingInfo(item)).length
          },
          {
            eyebrow: 'Seguimiento',
            title: 'Facturas vencidas',
            detail: 'Revisa primero las facturas ya vencidas para destrabar su gestion.',
            route: '/mis-registros',
            cta: 'Revisar vencidas',
            tone: 'danger',
            value: invoices.filter(item => item.status === 'Vencida').length
          }
        ];
      case 'manager':
        return [
          {
            eyebrow: 'Cola de trabajo',
            title: 'Pendientes de gestion',
            detail: 'Facturas asignadas que aun requieren revision o cierre.',
            route: '/pendientes-gestion',
            cta: 'Abrir pendientes',
            tone: 'warning',
            value: this.pendingManagedInvoices(invoices).length
          },
          {
            eyebrow: 'Bloqueos',
            title: 'Sin soportes',
            detail: 'Casos que no podran cerrarse hasta recibir adjuntos.',
            route: '/pendientes-gestion',
            cta: 'Completar soportes',
            tone: 'danger',
            value: invoices.filter(item => !item.attachments.length).length
          },
          {
            eyebrow: 'Completitud',
            title: 'Sin fecha estimada',
            detail: 'Ajusta la fecha de vencimiento para mejorar el seguimiento.',
            route: '/pendientes-gestion',
            cta: 'Actualizar fechas',
            tone: 'info',
            value: invoices.filter(item => !this.hasValue(item.estimatedRefundDate)).length
          }
        ];
      case 'admin':
        return [
          {
            eyebrow: 'Riesgo',
            title: 'Facturas vencidas',
            detail: 'Casos vencidos que requieren visibilidad y destrabe inmediato.',
            route: '/facturas',
            cta: 'Ver facturas',
            tone: 'danger',
            value: invoices.filter(item => item.status === 'Vencida').length
          },
          {
            eyebrow: 'Cobertura',
            title: 'Sin gestor asignado',
            detail: 'Facturas sin responsable claro para avanzar el proceso.',
            route: '/facturas',
            queryParams: { manager: 'unassigned' },
            cta: 'Asignar responsables',
            tone: 'warning',
            value: invoices.filter(item => !this.hasValue(item.refundManagerName)).length
          },
          {
            eyebrow: 'Capacidad',
            title: 'Gestores con alta carga',
            detail: 'Responsables con cinco o mas pendientes que podrian requerir apoyo.',
            route: '/admin/usuarios',
            cta: 'Revisar carga',
            tone: 'info',
            value: this.managerLoad().filter(item => item.pending >= 5).length
          }
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

  statusClass(status: string) {
    switch (status) {
      case 'Por_Vencer':
        return 'status-badge--warning';
      case 'Vencida':
        return 'status-badge--danger';
      case 'Gestionada':
        return 'status-badge--success';
      case 'Registrada':
      case 'En_Gestion':
        return 'status-badge--info';
      default:
        return 'status-badge--neutral';
    }
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
