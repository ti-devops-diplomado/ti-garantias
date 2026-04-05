import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { FeedbackService } from '../core/feedback.service';
import { ContractItem, Deliverable, InvoiceItem, InvoiceTimelineEvent, Supplier, UserSummary } from '../core/models';

type InvoiceBlockerId = 'missing-po' | 'missing-date' | 'missing-manager';

interface InvoiceBlocker {
  id: InvoiceBlockerId;
  label: string;
  icon: string;
  tone: 'warning' | 'info' | 'accent';
}

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page-shell">
      <section class="page-hero">
        <div>
          <p class="page-hero__eyebrow">{{ pageEyebrow }}</p>
          <h1 class="page-hero__title">{{ title }}</h1>
          <p class="page-hero__subtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="hero-stat-grid">
          <article class="hero-stat" *ngFor="let stat of headlineStats()">
            <p class="hero-stat__label">{{ stat.label }}</p>
            <p class="hero-stat__value">{{ stat.value }}</p>
          </article>
        </div>
      </section>

      <ng-container *ngIf="scope !== 'mine'; else mineLayout">
      <mat-card class="surface-card">
        <div class="section-header">
          <div>
            <h2>{{ title }}</h2>
            <p class="section-help">{{ tableDescription }}</p>
          </div>
          <button mat-flat-button color="primary" type="button" *ngIf="canCreateInvoices" (click)="openCreateModal()">
            Nueva factura
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <input matInput [value]="searchTerm()" (input)="updateSearchTerm($event)" placeholder="Factura, proveedor o contrato" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <mat-select [value]="supplierFilter()" (selectionChange)="supplierFilter.set($event.value || '')">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let item of suppliers()" [value]="item.id">{{ item.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value || '')">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let item of availableStatuses()" [value]="item">{{ statusLabel(item) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="canAssignManagers">
            <mat-label>Gestor</mat-label>
            <mat-select [value]="managerFilter()" (selectionChange)="managerFilter.set($event.value || '')">
              <mat-option value="">Todos</mat-option>
              <mat-option value="unassigned">Sin asignar</mat-option>
              <mat-option *ngFor="let item of managerUsers()" [value]="item.id">{{ item.fullName }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Bloqueo</mat-label>
            <mat-select [value]="blockerFilter()" (selectionChange)="blockerFilter.set($event.value || '')">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let blocker of availableBlockers()" [value]="blocker.id">{{ blocker.label }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="list-toolbar">
          <p>{{ filteredInvoices().length }} de {{ invoices().length }} facturas visibles</p>
          <button mat-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Limpiar filtros</button>
        </div>

        <div class="empty-panel" *ngIf="!filteredInvoices().length">
          <div>
            <h3>{{ emptyListTitle() }}</h3>
            <p>{{ emptyListMessage() }}</p>
          </div>
          <button mat-stroked-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Ver todo</button>
        </div>

        <div class="workspace-grid" *ngIf="filteredInvoices().length">
          <div class="table-wrap desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>Contrato</th>
                  <th>Fecha inicio</th>
                  <th>Fecha vencimiento</th>
                  <th>OC</th>
                  <th>Retenido</th>
                  <th>Estado</th>
                  <th>Gestor</th>
                  <th>Bloqueos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of filteredInvoices()" (click)="selectInvoice(item.id)" [ngClass]="[selectedInvoiceId() === item.id ? 'row-selected' : '', rowPriorityClass(item)]">
                  <td>
                    <div class="invoice-primary">
                      <strong>{{ item.invoiceNumber }}</strong>
                      <small>Creada por {{ item.createdByUserName }}</small>
                    </div>
                  </td>
                  <td>{{ item.supplierName }}</td>
                  <td>{{ invoiceContractLabel(item) }}</td>
                  <td>{{ item.invoiceDate }}</td>
                  <td>{{ item.estimatedRefundDate || 'Pendiente' }}</td>
                  <td>{{ item.purchaseOrder || 'Sin OC' }}</td>
                  <td>{{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</td>
                  <td>
                    <span class="status-badge status-badge--with-icon" [ngClass]="statusClass(item.status)">
                      <mat-icon>{{ statusIcon(item.status) }}</mat-icon>
                      {{ statusLabel(item.status) }}
                    </span>
                  </td>
                  <td>{{ item.refundManagerName || 'Sin asignar' }}</td>
                  <td class="blocker-stack">
                    <span class="info-badge" [ngClass]="'info-badge--' + blocker.tone" *ngFor="let blocker of blockerBadges(item)">
                      <mat-icon>{{ blocker.icon }}</mat-icon>
                      {{ blocker.label }}
                    </span>
                    <span class="info-badge info-badge--quiet" *ngIf="!blockerBadges(item).length">Sin bloqueos</span>
                  </td>
                  <td class="actions">
                    <button mat-stroked-button type="button" *ngIf="canAssignManagers && !item.refundManagerUserId" (click)="startAssignManager(item)" [disabled]="isInvoiceBusy(item.id) || savingForm()">
                      Asignar gestor
                    </button>
                    <button mat-stroked-button type="button" *ngIf="canEditInvoices" (click)="startEdit(item)" [disabled]="isInvoiceBusy(item.id) || savingForm()">
                      {{ scope === 'managed' ? 'Completar datos' : 'Editar' }}
                    </button>
                    <button mat-stroked-button type="button" *ngIf="canManageInvoices && !isManaged(item)" (click)="manage(item)" [disabled]="isInvoiceBusy(item.id) || savingForm()">
                      {{ isInvoiceBusy(item.id) ? 'Procesando...' : 'Marcar gestión' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <aside class="detail-panel desktop-only" *ngIf="selectedInvoice() as selected; else selectInvoicePrompt">
            <p class="detail-panel__eyebrow">Factura seleccionada</p>
            <h3>{{ selected.invoiceNumber }}</h3>
            <p class="detail-panel__subtitle">{{ selected.supplierName }}</p>
            <p class="detail-panel__copy">{{ invoiceContractLabel(selected) }}</p>

            <section class="detail-priority" [ngClass]="detailPriorityClass(selected)">
              <p class="detail-priority__eyebrow">{{ priorityLabel(selected) }}</p>
              <strong>{{ priorityHeadline(selected) }}</strong>
              <p>{{ suggestedAction(selected) }}</p>
            </section>

            <div class="pill-row">
              <span class="status-badge status-badge--with-icon" [ngClass]="statusClass(selected.status)">
                <mat-icon>{{ statusIcon(selected.status) }}</mat-icon>
                {{ statusLabel(selected.status) }}
              </span>
              <span class="info-badge" [ngClass]="'info-badge--' + blocker.tone" *ngFor="let blocker of blockerBadges(selected)">
                <mat-icon>{{ blocker.icon }}</mat-icon>
                {{ blocker.label }}
              </span>
              <span class="info-badge info-badge--quiet" *ngIf="!blockerBadges(selected).length">Sin bloqueos operativos</span>
            </div>

            <div class="detail-panel__facts">
              <p><strong>Inicio:</strong> {{ selected.invoiceDate }}</p>
              <p><strong>Vencimiento:</strong> {{ selected.estimatedRefundDate || 'Pendiente' }}</p>
              <p><strong>OC:</strong> {{ selected.purchaseOrder || 'Sin OC' }}</p>
              <p><strong>Retenido:</strong> {{ selected.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</p>
              <p><strong>Gestor:</strong> {{ selected.refundManagerName || 'Sin asignar' }}</p>
              <p><strong>Bloqueos:</strong> {{ blockerBadges(selected).length || 'Sin bloqueos' }}</p>
            </div>

            <div class="detail-panel__actions" *ngIf="scope !== 'mine'">
              <button mat-stroked-button type="button" *ngIf="canAssignManagers" (click)="startAssignManager(selected)" [disabled]="isInvoiceBusy(selected.id) || savingForm()">
                {{ selected.refundManagerUserId ? 'Reasignar gestor' : 'Asignar gestor' }}
              </button>
              <button mat-flat-button color="primary" type="button" *ngIf="canEditInvoices" (click)="startEdit(selected)" [disabled]="isInvoiceBusy(selected.id) || savingForm()">
                {{ scope === 'managed' ? 'Completar datos' : 'Editar factura' }}
              </button>
              <button mat-stroked-button type="button" *ngIf="canManageInvoices && !isManaged(selected)" (click)="manage(selected)" [disabled]="isInvoiceBusy(selected.id) || savingForm()">
                {{ isInvoiceBusy(selected.id) ? 'Procesando...' : 'Marcar gestion' }}
              </button>
            </div>

            <div class="timeline-card">
              <strong>Actividad reciente</strong>
              <p class="timeline-card__hint" *ngIf="timelineLoading()">Cargando actividad...</p>
              <p class="timeline-card__hint" *ngIf="timelineError()">{{ timelineError() }}</p>
              <div class="timeline-list" *ngIf="!timelineLoading() && !timelineError() && selectedTimeline().length; else noSelectedTimeline">
                <article class="timeline-item" *ngFor="let event of selectedTimeline()">
                  <div>
                    <p class="timeline-item__title">{{ event.label }}</p>
                    <p class="timeline-item__meta">{{ event.actorName }} · {{ event.occurredAt | date:'short' }}</p>
                  </div>
                  <p class="timeline-item__detail">{{ event.detail }}</p>
                </article>
              </div>
            </div>
            <ng-template #noSelectedTimeline>
              <small>La factura todavia no tiene actividad registrada para mostrar.</small>
            </ng-template>
          </aside>

          <ng-template #selectInvoicePrompt>
            <aside class="detail-panel detail-panel--placeholder desktop-only">
              <p class="detail-panel__eyebrow">Detalle rapido</p>
              <h3>Selecciona una factura</h3>
              <p class="detail-panel__copy">Haz clic sobre una fila para revisar su contexto, faltantes y acciones sin perder el listado.</p>
            </aside>
          </ng-template>
        </div>

        <div class="cards mobile-only" *ngIf="filteredInvoices().length">
          <article class="invoice" *ngFor="let item of filteredInvoices()" [ngClass]="rowPriorityClass(item)">
            <div class="invoice-header">
              <div>
                <h3>{{ item.invoiceNumber }}</h3>
                <p>{{ item.supplierName }}</p>
              </div>
              <span class="status-badge status-badge--with-icon" [ngClass]="statusClass(item.status)">
                <mat-icon>{{ statusIcon(item.status) }}</mat-icon>
                {{ statusLabel(item.status) }}
              </span>
            </div>
            <p>{{ invoiceContractLabel(item) }}</p>
            <section class="mobile-priority-banner" [ngClass]="detailPriorityClass(item)">
              <p class="mobile-priority-banner__title">{{ priorityHeadline(item) }}</p>
              <p>{{ suggestedAction(item) }}</p>
            </section>
            <div class="detail-grid">
              <p><strong>Inicio:</strong> {{ item.invoiceDate }}</p>
              <p><strong>Vencimiento:</strong> {{ item.estimatedRefundDate || 'Pendiente' }}</p>
              <p><strong>OC:</strong> {{ item.purchaseOrder || 'Sin OC' }}</p>
              <p><strong>Retenido:</strong> {{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</p>
              <p><strong>Gestor:</strong> {{ item.refundManagerName || 'Sin asignar' }}</p>
              <p><strong>Bloqueos:</strong> {{ blockerBadges(item).length || 'Sin bloqueos' }}</p>
            </div>
            <div class="pill-row">
              <span class="info-badge" [ngClass]="'info-badge--' + blocker.tone" *ngFor="let blocker of blockerBadges(item)">
                <mat-icon>{{ blocker.icon }}</mat-icon>
                {{ blocker.label }}
              </span>
              <span class="info-badge info-badge--quiet" *ngIf="!blockerBadges(item).length">Sin bloqueos operativos</span>
            </div>
            <div class="actions mobile-actions">
              <button mat-stroked-button type="button" *ngIf="canAssignManagers" (click)="startAssignManager(item)" [disabled]="isInvoiceBusy(item.id) || savingForm()">
                {{ item.refundManagerUserId ? 'Reasignar gestor' : 'Asignar gestor' }}
              </button>
              <button mat-stroked-button type="button" *ngIf="canEditInvoices" (click)="startEdit(item)" [disabled]="isInvoiceBusy(item.id) || savingForm()">
                {{ scope === 'managed' ? 'Completar datos' : 'Editar' }}
              </button>
              <button mat-stroked-button type="button" *ngIf="canManageInvoices && !isManaged(item)" (click)="manage(item)" [disabled]="isInvoiceBusy(item.id) || savingForm()">
                {{ isInvoiceBusy(item.id) ? 'Procesando...' : 'Marcar gestión' }}
              </button>
            </div>

            <div class="mobile-detail-toggle">
              <button mat-button type="button" (click)="toggleInvoiceSelection(item.id)">
                {{ selectedInvoiceId() === item.id ? 'Ocultar detalle' : 'Ver detalle' }}
              </button>
            </div>

            <section class="mobile-detail-panel" *ngIf="selectedInvoiceId() === item.id">
              <p><strong>Creada por:</strong> {{ item.createdByUserName }}</p>
              <p><strong>Valor factura:</strong> {{ item.invoiceAmount | currency:'USD':'symbol':'1.0-0' }}</p>
              <div class="timeline-card">
                <strong>Actividad reciente</strong>
                <p class="timeline-card__hint" *ngIf="timelineLoading()">Cargando actividad...</p>
                <p class="timeline-card__hint" *ngIf="timelineError()">{{ timelineError() }}</p>
                <div class="timeline-list" *ngIf="!timelineLoading() && !timelineError() && selectedTimeline().length; else noMobileTimeline">
                  <article class="timeline-item" *ngFor="let event of selectedTimeline()">
                    <div>
                      <p class="timeline-item__title">{{ event.label }}</p>
                      <p class="timeline-item__meta">{{ event.actorName }} · {{ event.occurredAt | date:'short' }}</p>
                    </div>
                    <p class="timeline-item__detail">{{ event.detail }}</p>
                  </article>
                </div>
                <ng-template #noMobileTimeline>
                  <small>La factura todavia no tiene actividad registrada para mostrar.</small>
                </ng-template>
              </div>
            </section>
          </article>
        </div>
      </mat-card>

      <div class="modal-shell" *ngIf="showFormModal()" (click)="requestCloseModal()">
        <mat-card class="surface-card modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ editingInvoiceId() ? (scope === 'managed' ? 'Completar factura' : 'Editar factura') : 'Nueva factura' }}</h2>
              <p>{{ scope === 'managed' ? 'Actualiza la información pendiente sin salir del listado.' : 'Completa los datos de la factura en una ventana superpuesta.' }}</p>
            </div>
            <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="requestCloseModal()" aria-label="Cerrar formulario">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="saveInvoice()">
            <div class="form-context">
              <span class="info-badge">{{ filteredContracts().length }} contratos disponibles</span>
              <span class="info-badge">{{ filteredDeliverables().length }} entregables disponibles</span>
              <span class="info-badge" *ngIf="form.controls.estimatedRefundDate.value">Vencimiento estimado: {{ form.controls.estimatedRefundDate.value }}</span>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Proveedor</mat-label>
              <mat-select formControlName="supplierId">
                <mat-option *ngFor="let item of suppliers()" [value]="item.id">{{ item.name }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Contrato</mat-label>
              <mat-select formControlName="contractId" [disabled]="!form.controls.supplierId.value">
                <mat-option *ngFor="let item of filteredContracts()" [value]="item.id">{{ contractLabel(item) }}</mat-option>
              </mat-select>
              <mat-hint>{{ form.controls.supplierId.value ? 'Selecciona el contrato que aplica a la factura.' : 'Primero elige un proveedor.' }}</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Factura</mat-label>
              <input matInput formControlName="invoiceNumber" placeholder="999-999-999999999" />
              <mat-hint>Usa el formato 000-000-000000000.</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha inicio</mat-label>
              <input
                matInput
                [matDatepicker]="invoiceDatePicker"
                formControlName="invoiceDate"
                placeholder="AAAA-MM-DD o DD/MM/AAAA" />
              <mat-datepicker-toggle matIconSuffix [for]="invoiceDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #invoiceDatePicker></mat-datepicker>
              <mat-error *ngIf="form.controls.invoiceDate.hasError('required')">
                La fecha de inicio es obligatoria.
              </mat-error>
              <mat-error *ngIf="form.controls.invoiceDate.hasError('matDatepickerParse') || form.controls.invoiceDate.hasError('invalidDate')">
                Ingresa una fecha valida en formato AAAA-MM-DD o DD/MM/AAAA, o seleccionala en el calendario.
              </mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha vencimiento</mat-label>
              <input matInput formControlName="estimatedRefundDate" readonly />
              <mat-hint>Se calcula automaticamente a 90 dias si aplica devolucion.</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Valor factura</mat-label>
              <input matInput type="number" formControlName="invoiceAmount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>OC</mat-label>
              <input matInput formControlName="purchaseOrder" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Valor retenido</mat-label>
              <input matInput type="number" formControlName="retainedAmount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Entregables</mat-label>
              <mat-select formControlName="deliverableIds" multiple [disabled]="!form.controls.contractId.value">
                <mat-option *ngFor="let item of filteredDeliverables()" [value]="item.id">{{ item.name }}</mat-option>
              </mat-select>
              <mat-hint>{{ form.controls.contractId.value ? 'Selecciona uno o varios entregables asociados.' : 'Primero elige un contrato.' }}</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline" *ngIf="canAssignManagers">
              <mat-label>Gestor responsable</mat-label>
              <mat-select formControlName="refundManagerUserId">
                <mat-option value="">Sin asignar</mat-option>
                <mat-option *ngFor="let item of managerUsers()" [value]="item.id">{{ item.fullName }}</mat-option>
              </mat-select>
              <mat-hint>{{ managerUsers().length ? 'Asigna o reasigna la factura a un gestor activo.' : 'No hay gestores activos disponibles.' }}</mat-hint>
            </mat-form-field>
            <mat-checkbox formControlName="guaranteeRefundable">Aplica devolución</mat-checkbox>
            <div class="form-actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="savingForm()">
                  {{ savingForm() ? 'Guardando...' : (scope === 'managed' ? 'Guardar cambios' : submitLabel()) }}
                </button>
                <button mat-stroked-button type="button" (click)="requestCloseModal()" [disabled]="savingForm()">
                  Cancelar
                </button>
              </div>
            </form>

          <section class="draft-warning" *ngIf="discardDraftPrompt()">
            <div>
              <p class="draft-warning__eyebrow">Cambios sin guardar</p>
              <h3>¿Cerrar sin guardar?</h3>
              <p>Perderas la informacion editada en este formulario.</p>
            </div>
            <div class="draft-warning__actions">
              <button mat-flat-button color="primary" type="button" (click)="confirmDiscardDraft()">Descartar cambios</button>
              <button mat-stroked-button type="button" (click)="discardDraftPrompt.set(false)">Seguir editando</button>
            </div>
          </section>
        </mat-card>
      </div>
    </ng-container>

    <ng-template #mineLayout>
      <mat-card class="surface-card">
        <h2>{{ title }}</h2>
        <div class="cards">
          <article class="invoice" *ngFor="let item of invoices()">
            <div class="invoice-header">
              <div>
                <h3>{{ item.invoiceNumber }}</h3>
                <p>{{ item.supplierName }} / {{ invoiceContractLabel(item) }}</p>
              </div>
              <span class="status-badge status-badge--with-icon" [ngClass]="statusClass(item.status)">
                <mat-icon>{{ statusIcon(item.status) }}</mat-icon>
                {{ statusLabel(item.status) }}
              </span>
            </div>
            <p>Inicio: {{ item.invoiceDate }} · Vencimiento: {{ item.estimatedRefundDate || 'Pendiente' }}</p>
            <p>OC: {{ item.purchaseOrder || 'Sin OC' }} · Retenido: {{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</p>
            <p>Gestor: {{ item.refundManagerName || 'Sin asignar' }}</p>
            <div class="pill-row">
              <span class="info-badge" [ngClass]="'info-badge--' + blocker.tone" *ngFor="let blocker of blockerBadges(item)">
                <mat-icon>{{ blocker.icon }}</mat-icon>
                {{ blocker.label }}
              </span>
              <span class="info-badge info-badge--quiet" *ngIf="!blockerBadges(item).length">Sin bloqueos operativos</span>
            </div>
            <div class="mobile-detail-toggle">
              <button mat-button type="button" (click)="toggleInvoiceSelection(item.id)">
                {{ selectedInvoiceId() === item.id ? 'Ocultar actividad' : 'Ver actividad' }}
              </button>
            </div>
            <section class="mobile-detail-panel" *ngIf="selectedInvoiceId() === item.id">
              <div class="timeline-card">
                <strong>Actividad reciente</strong>
                <p class="timeline-card__hint" *ngIf="timelineLoading()">Cargando actividad...</p>
                <p class="timeline-card__hint" *ngIf="timelineError()">{{ timelineError() }}</p>
                <div class="timeline-list" *ngIf="!timelineLoading() && !timelineError() && selectedTimeline().length; else noMineTimeline">
                  <article class="timeline-item" *ngFor="let event of selectedTimeline()">
                    <div>
                      <p class="timeline-item__title">{{ event.label }}</p>
                      <p class="timeline-item__meta">{{ event.actorName }} · {{ event.occurredAt | date:'short' }}</p>
                    </div>
                    <p class="timeline-item__detail">{{ event.detail }}</p>
                  </article>
                </div>
                <ng-template #noMineTimeline>
                  <small>La factura todavia no tiene actividad registrada para mostrar.</small>
                </ng-template>
              </div>
            </section>
          </article>
          <p class="empty" *ngIf="!invoices().length">No hay registros para mostrar.</p>
        </div>
      </mat-card>
    </ng-template>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .section-header h2,
    .invoice h3 {
      margin: 0;
    }
    .section-help {
      margin: 8px 0 0;
      color: var(--color-ink-soft);
      max-width: 740px;
    }
    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .list-toolbar p,
    .empty-panel h3,
    .empty-panel p,
    .draft-warning h3,
    .draft-warning p {
      margin: 0;
    }
    .workspace-grid {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1.6fr) minmax(300px, 0.9fr);
      align-items: start;
    }
    .form-context {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .empty-panel {
      margin-bottom: 8px;
    }
    .form-context {
      flex-wrap: wrap;
      margin-bottom: 8px;
      padding: 18px 20px;
      border-radius: 22px;
      border: 1px solid rgba(23, 50, 77, 0.08);
      background: rgba(245, 239, 230, 0.48);
    }
    .draft-warning {
      margin-top: 8px;
    }
    form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.82);
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(23, 50, 77, 0.08); vertical-align: top; }
    tbody tr {
      cursor: pointer;
      transition: background-color 150ms ease;
    }
    tbody tr:hover {
      background: rgba(220, 239, 253, 0.26);
    }
    tbody tr.row-selected {
      background: rgba(220, 239, 253, 0.44);
    }
    tbody tr.invoice-priority--critical td:first-child,
    .invoice.invoice-priority--critical {
      box-shadow: inset 4px 0 0 #c24d37;
    }
    tbody tr.invoice-priority--attention td:first-child,
    .invoice.invoice-priority--attention {
      box-shadow: inset 4px 0 0 #c28a2e;
    }
    tbody tr.invoice-priority--stable td:first-child,
    .invoice.invoice-priority--stable {
      box-shadow: inset 4px 0 0 rgba(23, 76, 116, 0.22);
    }
    td strong,
    td small {
      display: block;
    }
    .invoice-primary {
      display: grid;
      gap: 6px;
    }
    td small {
      margin-top: 4px;
      color: var(--color-ink-soft);
    }
    .blocker-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ink-muted);
      background: rgba(245, 239, 230, 0.66);
    }
    .detail-panel {
      position: sticky;
      top: 96px;
      padding: 22px;
      border: 1px solid var(--color-border);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: var(--shadow-soft);
    }
    .detail-panel__eyebrow {
      margin: 0 0 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-gold);
      font-weight: 800;
    }
    .detail-panel h3,
    .detail-panel p {
      margin: 0;
    }
    .detail-panel__subtitle {
      margin-top: 6px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .detail-panel__copy {
      margin-top: 6px;
      color: var(--color-ink-soft);
    }
    .detail-priority,
    .mobile-priority-banner {
      display: grid;
      gap: 6px;
      margin-top: 16px;
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px solid transparent;
    }
    .detail-priority p,
    .detail-priority strong,
    .mobile-priority-banner p {
      margin: 0;
    }
    .detail-priority__eyebrow {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 800;
      color: var(--color-ink-muted);
    }
    .detail-priority strong,
    .mobile-priority-banner__title {
      color: var(--color-accent-strong);
      font-size: 1rem;
      font-weight: 800;
    }
    .detail-priority--critical,
    .mobile-priority-banner--critical {
      background: linear-gradient(180deg, #fff2ef, #fde7e4);
      border-color: rgba(194, 77, 55, 0.18);
    }
    .detail-priority--attention,
    .mobile-priority-banner--attention {
      background: linear-gradient(180deg, #fff8ea, #fff2db);
      border-color: rgba(194, 138, 46, 0.22);
    }
    .detail-priority--stable,
    .mobile-priority-banner--stable {
      background: linear-gradient(180deg, #f6fbff, #edf5fb);
      border-color: rgba(23, 76, 116, 0.14);
    }
    .detail-panel__facts {
      display: grid;
      gap: 10px;
      margin-top: 18px;
      color: var(--color-ink-soft);
    }
    .detail-panel__actions {
      display: grid;
      gap: 10px;
      margin-top: 18px;
    }
    .detail-panel--placeholder {
      border-style: dashed;
      background: rgba(255, 255, 255, 0.6);
    }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .form-actions { display: flex; gap: 8px; align-items: center; }
    .empty { text-align: center; color: var(--color-ink-soft); }
    .cards { display: grid; gap: 14px; }
    .invoice {
      padding: 18px;
      border: 1px solid var(--color-border);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.88);
      box-shadow: var(--shadow-soft);
    }
    .invoice p { margin: 0 0 8px; }
    .invoice-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .mobile-priority-banner {
      margin-bottom: 14px;
    }
    .detail-grid { display: grid; gap: 8px; margin: 14px 0; color: var(--color-ink-soft); }
    .mobile-detail-toggle {
      margin-top: 10px;
    }
    .mobile-detail-panel {
      display: grid;
      gap: 10px;
      margin-top: 12px;
      padding-top: 14px;
      border-top: 1px solid rgba(23, 50, 77, 0.08);
      color: var(--color-ink-soft);
    }
    .timeline-card {
      display: grid;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(23, 50, 77, 0.08);
    }
    .timeline-card strong,
    .timeline-card small,
    .timeline-item__title,
    .timeline-item__meta,
    .timeline-item__detail {
      margin: 0;
    }
    .timeline-card__hint {
      margin: 0;
      color: var(--color-ink-soft);
    }
    .timeline-list {
      display: grid;
      gap: 12px;
    }
    .timeline-item {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(245, 248, 252, 0.82);
      border: 1px solid rgba(23, 50, 77, 0.08);
    }
    .timeline-item__title {
      font-weight: 800;
      color: var(--color-accent-strong);
    }
    .timeline-item__meta,
    .timeline-item__detail {
      color: var(--color-ink-soft);
    }
    .mobile-only { display: none; }
    .modal-card {
      width: min(1160px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      overflow: auto;
    }
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .modal-header h2,
    .modal-header p {
      margin: 0;
    }
    .modal-header > div {
      min-width: 0;
    }
    .modal-header p {
      margin-top: 6px;
      color: #566573;
    }
    .form-actions {
      grid-column: 1 / -1;
      justify-content: flex-end;
    }
    @media (max-width: 960px) {
      .section-header,
      .modal-header,
      form,
      .filters,
      .list-toolbar,
      .empty-panel,
      .draft-warning {
        grid-template-columns: 1fr;
        display: grid;
      }
      .workspace-grid {
        grid-template-columns: 1fr;
      }
      .section-header {
        align-items: stretch;
      }
      .desktop-only { display: none; }
      .mobile-only { display: grid; }
      .invoice-header,
      .form-actions,
      .mobile-actions {
        display: grid;
        grid-template-columns: 1fr;
      }
      .actions button {
        width: 100%;
        justify-content: center;
      }
      .modal-shell {
        padding: 12px;
        align-items: end;
      }
      .modal-card {
        width: 100%;
        max-height: min(90vh, 100%);
      }
    }
    @media (max-width: 480px) {
      .invoice {
        padding: 16px;
        border-radius: 18px;
      }
      .invoice-header {
        display: grid;
        grid-template-columns: 1fr;
      }
      .detail-grid,
      .mobile-detail-panel {
        gap: 8px;
      }
      .section-header button,
      .form-actions button {
        width: 100%;
      }
      .modal-header {
        display: grid;
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InvoicesPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(FeedbackService);
  readonly auth = inject(AuthService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly contracts = signal<ContractItem[]>([]);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly users = signal<UserSummary[]>([]);
  readonly invoices = signal<InvoiceItem[]>([]);
  readonly editingInvoiceId = signal<string | null>(null);
  readonly selectedInvoiceId = signal<string | null>(null);
  readonly showFormModal = signal(false);
  readonly discardDraftPrompt = signal(false);
  readonly savingForm = signal(false);
  readonly busyInvoiceIds = signal<string[]>([]);
  readonly timeline = signal<InvoiceTimelineEvent[]>([]);
  readonly timelineLoading = signal(false);
  readonly timelineError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly supplierFilter = signal('');
  readonly statusFilter = signal('');
  readonly managerFilter = signal(this.route.snapshot.queryParamMap.get('manager') ?? '');
  readonly blockerFilter = signal(this.route.snapshot.queryParamMap.get('blocker') ?? '');
  readonly scope = this.route.snapshot.data['scope'] as string ?? 'all';
  readonly title = this.scope === 'mine' ? 'Mis registros' : this.scope === 'managed' ? 'Pendientes por gestionar' : 'Facturas';
  readonly pageEyebrow = this.scope === 'mine' ? 'Seguimiento personal' : this.scope === 'managed' ? 'Gestion operativa' : 'Control documental';
  readonly pageSubtitle = this.scope === 'mine'
    ? 'Revisa tus facturas registradas, fechas clave y actividad reciente desde un espacio mas claro.'
    : this.scope === 'managed'
      ? 'Completa informacion pendiente y avanza la gestion sin salir del listado.'
      : 'Consulta el universo de facturas, filtra rapido y registra nuevos casos con mejor contexto.';
  readonly tableDescription = this.scope === 'managed'
    ? 'Completa y gestiona las facturas asignadas desde la misma vista, con el mismo formato operativo del listado general de facturas.'
    : this.scope === 'mine'
      ? 'Consulta tus facturas registradas y detecta bloqueos operativos sin salir del flujo.'
      : 'Explora el listado completo, filtra por proveedor o estado y actua sobre cada factura.';
  readonly canCreateInvoices = this.scope === 'all' && this.auth.hasAnyRole(['Registrador', 'Admin']);
  readonly canManageInvoices = this.auth.hasAnyRole(['Gestor', 'Admin']);
  readonly canEditInvoices = this.scope !== 'mine' && this.auth.hasAnyRole(['Registrador', 'Gestor', 'Admin']);
  readonly canAssignManagers = this.auth.hasAnyRole(['Admin']);
  readonly managerUsers = computed(() =>
    this.users()
      .filter(item => item.isActive && item.roles.includes('Gestor'))
      .sort((left, right) => left.fullName.localeCompare(right.fullName))
  );
  readonly availableBlockers = computed<InvoiceBlocker[]>(() => [
    { id: 'missing-po', label: 'Sin OC', icon: 'description', tone: 'warning' },
    { id: 'missing-date', label: 'Sin fecha estimada', icon: 'event_busy', tone: 'info' },
    { id: 'missing-manager', label: 'Sin gestor asignado', icon: 'person_off', tone: 'accent' }
  ]);
  readonly availableStatuses = computed(() => Array.from(new Set(this.invoices().map(item => this.normalizeStatus(item.status)))).sort());
  readonly selectedInvoice = computed(() => {
    const selectedId = this.selectedInvoiceId();
    if (!selectedId) {
      return null;
    }

    return this.filteredInvoices().find(item => item.id === selectedId) ?? null;
  });
  readonly selectedTimeline = computed(() => this.timeline());
  readonly hasActiveFilters = computed(() =>
    !!this.searchTerm().trim() || !!this.supplierFilter() || !!this.statusFilter() || !!this.managerFilter() || !!this.blockerFilter()
  );
  readonly emptyListTitle = computed(() => this.hasActiveFilters() ? 'No encontramos coincidencias' : 'Todavia no hay facturas');
  readonly emptyListMessage = computed(() => {
    if (this.hasActiveFilters()) {
      return 'Prueba limpiando filtros o ajustando la busqueda para ampliar los resultados.';
    }

    if (this.scope === 'managed') {
      return 'Cuando se asignen facturas para gestion apareceran aqui.';
    }

    if (this.scope === 'all') {
      return 'Crea la primera factura para empezar a trabajar el flujo.';
    }

    return 'Todavia no tienes registros para mostrar.';
  });
  readonly headlineStats = computed(() => {
    const source = this.scope === 'mine' ? this.invoices() : this.filteredInvoices();
    const data = source.length ? source : this.invoices();

    return [
      { label: this.scope === 'mine' ? 'Mis facturas' : 'Visibles', value: data.length, tone: 'neutral' },
      { label: 'Con bloqueos', value: data.filter(item => this.hasOperationalBlockers(item)).length, tone: 'info' },
      { label: 'Por vencer', value: data.filter(item => this.hasStatus(item.status, 'POR_VENCER')).length, tone: 'warning' },
      { label: 'Gestionadas', value: data.filter(item => this.isManaged(item)).length, tone: 'success' }
    ];
  });
  readonly filteredInvoices = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const supplierId = this.supplierFilter();
    const status = this.statusFilter();
    const manager = this.managerFilter();
    const blocker = this.blockerFilter();

    return this.invoices().filter(item => {
      const matchesSearch = !search || [
        item.invoiceNumber,
        item.supplierName,
        item.contractNumber,
        item.contractTitle,
        item.purchaseOrder,
        item.refundManagerName ?? ''
      ].some(value => value.toLowerCase().includes(search));
      const matchesSupplier = !supplierId || item.supplierId === supplierId;
      const matchesStatus = !status || this.normalizeStatus(item.status) === this.normalizeStatus(status);
      const matchesManager = !manager
        || (manager === 'unassigned' && !item.refundManagerUserId)
        || item.refundManagerUserId === manager;
      const matchesBlocker = !blocker || this.hasBlocker(item, blocker as InvoiceBlockerId);
      return matchesSearch && matchesSupplier && matchesStatus && matchesManager && matchesBlocker;
    });
  });

  readonly form = this.fb.nonNullable.group({
    supplierId: ['', Validators.required],
    contractId: ['', Validators.required],
    invoiceNumber: ['', [Validators.required, Validators.pattern(/^\d{3}-\d{3}-\d{9}$/)]],
    invoiceDate: [new Date(), Validators.required],
    invoiceAmount: [0, Validators.required],
    purchaseOrder: [''],
    retainedAmount: [0, Validators.required],
    guaranteeRefundable: [true],
    estimatedRefundDate: [''],
    deliverableIds: [[] as string[]],
    refundManagerUserId: ['']
  });

  constructor() {
    this.form.controls.invoiceDate.valueChanges.subscribe(() => this.recalculateEstimatedRefundDate());
    this.form.controls.guaranteeRefundable.valueChanges.subscribe(() => this.recalculateEstimatedRefundDate());
    this.form.controls.supplierId.valueChanges.subscribe(supplierId => this.syncSupplierDependentFields(supplierId));
    this.form.controls.contractId.valueChanges.subscribe(contractId => this.syncContractDependentFields(contractId));
    this.recalculateEstimatedRefundDate();
    this.reload();
  }

  filteredContracts() {
    return this.contracts().filter(item => !this.form.value.supplierId || item.supplierId === this.form.value.supplierId);
  }

  filteredDeliverables() {
    return this.deliverables().filter(item => !this.form.value.contractId || item.contractId === this.form.value.contractId);
  }

  contractLabel(item: ContractItem): string {
    return `${item.contractNumber} - ${item.title}`;
  }

  invoiceContractLabel(item: InvoiceItem): string {
    return `${item.contractNumber} - ${item.contractTitle}`;
  }

  submitLabel(): string {
    return this.editingInvoiceId() ? 'Guardar cambios' : 'Guardar factura';
  }

  statusClass(status: string) {
    switch (this.normalizeStatus(status)) {
      case 'POR_VENCER':
        return 'status-badge--warning';
      case 'VENCIDA':
        return 'status-badge--danger';
      case 'GESTIONADA':
        return 'status-badge--success';
      case 'REGISTRADA':
      case 'EN_GESTION':
        return 'status-badge--info';
      default:
        return 'status-badge--neutral';
    }
  }

  statusLabel(status: string) {
    switch (this.normalizeStatus(status)) {
      case 'POR_VENCER':
        return 'Por vencer';
      case 'VENCIDA':
        return 'Vencida';
      case 'GESTIONADA':
        return 'Gestionada';
      case 'REGISTRADA':
        return 'Registrada';
      case 'EN_GESTION':
        return 'En gestión';
      default:
        return status;
    }
  }

  statusIcon(status: string) {
    switch (this.normalizeStatus(status)) {
      case 'POR_VENCER':
        return 'schedule';
      case 'VENCIDA':
        return 'warning';
      case 'GESTIONADA':
        return 'task_alt';
      case 'REGISTRADA':
      case 'EN_GESTION':
        return 'receipt_long';
      default:
        return 'info';
    }
  }

  blockerBadges(item: InvoiceItem) {
    return this.getOperationalBlockers(item);
  }

  rowPriorityClass(item: InvoiceItem) {
    if (this.hasStatus(item.status, 'VENCIDA') || this.getOperationalBlockers(item).length >= 2) {
      return 'invoice-priority--critical';
    }

    if (this.hasStatus(item.status, 'POR_VENCER') || this.getOperationalBlockers(item).length === 1) {
      return 'invoice-priority--attention';
    }

    return 'invoice-priority--stable';
  }

  detailPriorityClass(item: InvoiceItem) {
    if (this.rowPriorityClass(item) === 'invoice-priority--critical') {
      return 'detail-priority--critical mobile-priority-banner--critical';
    }

    if (this.rowPriorityClass(item) === 'invoice-priority--attention') {
      return 'detail-priority--attention mobile-priority-banner--attention';
    }

    return 'detail-priority--stable mobile-priority-banner--stable';
  }

  priorityLabel(item: InvoiceItem) {
    if (this.rowPriorityClass(item) === 'invoice-priority--critical') {
      return 'Prioridad crítica';
    }

    if (this.rowPriorityClass(item) === 'invoice-priority--attention') {
      return 'Atención operativa';
    }

    return 'Seguimiento estable';
  }

  priorityHeadline(item: InvoiceItem) {
    if (this.hasStatus(item.status, 'VENCIDA')) {
      return 'La factura ya venció y necesita destrabe inmediato.';
    }

    if (this.getOperationalBlockers(item).length >= 2) {
      return `Tiene ${this.getOperationalBlockers(item).length} bloqueos activos.`;
    }

    if (this.hasStatus(item.status, 'POR_VENCER')) {
      return 'La fecha límite está cerca y requiere seguimiento.';
    }

    if (this.getOperationalBlockers(item).length === 1) {
      return `${this.getOperationalBlockers(item)[0].label} está frenando el avance.`;
    }

    return 'No tiene alertas operativas críticas.';
  }

  suggestedAction(item: InvoiceItem) {
    if (!item.refundManagerUserId) {
      return 'Acción sugerida: asignar un gestor responsable para que el caso tenga dueño claro.';
    }

    if (!item.purchaseOrder?.trim()) {
      return 'Acción sugerida: completar la OC para cerrar el faltante documental del proceso.';
    }

    if (item.guaranteeRefundable && !item.estimatedRefundDate?.trim()) {
      return 'Acción sugerida: definir la fecha estimada para priorizar bien la gestión.';
    }

    if (this.hasStatus(item.status, 'VENCIDA')) {
      return 'Acción sugerida: revisar la gestión y destrabar el caso cuanto antes.';
    }

    return 'Acción sugerida: mantener seguimiento normal y revisar la actividad reciente.';
  }

  openCreateModal() {
    this.editingInvoiceId.set(null);
    this.selectedInvoiceId.set(null);
    this.timeline.set([]);
    this.timelineError.set(null);
    this.discardDraftPrompt.set(false);
    this.resetFormForCreate();
    this.showFormModal.set(true);
  }

  startEdit(item: InvoiceItem) {
    this.editingInvoiceId.set(item.id);
    this.selectedInvoiceId.set(item.id);
    this.loadTimeline(item.id);
    this.discardDraftPrompt.set(false);
    this.form.reset({
      supplierId: item.supplierId,
      contractId: item.contractId,
      invoiceNumber: item.invoiceNumber,
      invoiceDate: this.parseDate(item.invoiceDate) ?? new Date(),
      invoiceAmount: item.invoiceAmount,
      purchaseOrder: item.purchaseOrder,
      retainedAmount: item.retainedAmount,
      guaranteeRefundable: item.guaranteeRefundable,
      estimatedRefundDate: item.estimatedRefundDate ?? '',
      deliverableIds: item.deliverableIds,
      refundManagerUserId: item.refundManagerUserId ?? ''
    }, { emitEvent: false });
    this.recalculateEstimatedRefundDate();
    this.form.markAsPristine();
    this.showFormModal.set(true);
  }

  startAssignManager(item: InvoiceItem) {
    this.startEdit(item);
  }

  cancelEdit() {
    this.discardDraftPrompt.set(false);
    this.editingInvoiceId.set(null);
    this.showFormModal.set(false);
    this.resetFormForCreate();
  }

  requestCloseModal() {
    if (this.savingForm()) {
      return;
    }

    if (this.form.dirty) {
      this.discardDraftPrompt.set(true);
      return;
    }

    this.cancelEdit();
  }

  confirmDiscardDraft() {
    this.cancelEdit();
  }

  updateSearchTerm(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.supplierFilter.set('');
    this.statusFilter.set('');
    this.managerFilter.set('');
    this.blockerFilter.set('');
    this.selectedInvoiceId.set(null);
    this.timeline.set([]);
    this.timelineError.set(null);
  }

  selectInvoice(id: string) {
    this.selectedInvoiceId.set(id);
    this.loadTimeline(id);
  }

  toggleInvoiceSelection(id: string) {
    if (this.selectedInvoiceId() === id) {
      this.selectedInvoiceId.set(null);
      this.timeline.set([]);
      this.timelineError.set(null);
      return;
    }

    this.selectedInvoiceId.set(id);
    this.loadTimeline(id);
  }

  saveInvoice() {
    const editingInvoiceId = this.editingInvoiceId();
    if (editingInvoiceId ? !this.canEditInvoices : !this.canCreateInvoices) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const invoiceDate = this.normalizeDateValue(rawValue.invoiceDate);
    const estimatedRefundDate = this.normalizeOptionalDateValue(rawValue.estimatedRefundDate);

    if (!invoiceDate) {
      this.form.controls.invoiceDate.setErrors({ invalidDate: true });
      this.form.controls.invoiceDate.markAsTouched();
      return;
    }

    this.savingForm.set(true);
    this.api.saveInvoice({
      ...rawValue,
      invoiceDate,
      estimatedRefundDate,
      refundManagerUserId: rawValue.refundManagerUserId || null
    }, editingInvoiceId ?? undefined).subscribe({
      next: () => {
        this.feedback.success(editingInvoiceId ? 'Factura actualizada.' : 'Factura creada.');
        this.cancelEdit();
        this.reload(editingInvoiceId ?? undefined);
      },
      error: () => this.feedback.error('No fue posible guardar la factura.'),
      complete: () => this.savingForm.set(false)
    });
  }

  manage(item: InvoiceItem) {
    if (!this.canManageInvoices) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    this.setInvoiceBusy(item.id, true);
    this.api.manageRefund(item.id, today).subscribe({
      next: () => {
        this.feedback.success(`Factura ${item.invoiceNumber} marcada como gestionada.`);
        this.reload(item.id);
      },
      error: () => this.feedback.error('No fue posible marcar la factura como gestionada.'),
      complete: () => this.setInvoiceBusy(item.id, false)
    });
  }

  private reload(preferredInvoiceId?: string) {
    if (this.canAssignManagers) {
      this.api.getUsers().subscribe({
        next: data => this.users.set(data),
        error: () => this.feedback.error('No fue posible cargar los gestores disponibles.')
      });
    } else {
      this.users.set([]);
    }
    this.api.getSuppliers().subscribe({
      next: data => this.suppliers.set(data),
      error: () => this.feedback.error('No fue posible cargar los proveedores.')
    });
    this.api.getContracts().subscribe({
      next: data => this.contracts.set(data),
      error: () => this.feedback.error('No fue posible cargar los contratos.')
    });
    this.api.getDeliverables().subscribe({
      next: data => this.deliverables.set(data),
      error: () => this.feedback.error('No fue posible cargar los entregables.')
    });
    this.api.getInvoices(this.scope).subscribe({
      next: data => {
        this.invoices.set(data);
        if (this.selectedInvoiceId() && !data.some(item => item.id === this.selectedInvoiceId())) {
          this.selectedInvoiceId.set(null);
          this.timeline.set([]);
          this.timelineError.set(null);
        }

        if (!data.length) {
          this.cancelEdit();
          return;
        }

        const targetId = preferredInvoiceId ?? this.selectedInvoiceId();
        if (targetId && data.some(item => item.id === targetId)) {
          this.selectedInvoiceId.set(targetId);
          this.loadTimeline(targetId);
        }
      },
      error: () => this.feedback.error('No fue posible cargar las facturas.')
    });
  }

  isManaged(item: InvoiceItem) {
    return this.hasStatus(item.status, 'GESTIONADA');
  }

  isInvoiceBusy(id: string) {
    return this.busyInvoiceIds().includes(id);
  }

  private loadTimeline(invoiceId: string) {
    this.timelineLoading.set(true);
    this.timelineError.set(null);
    this.api.getInvoiceTimeline(invoiceId).subscribe({
      next: data => this.timeline.set(data),
      error: () => {
        this.timeline.set([]);
        this.timelineError.set('No fue posible cargar la actividad reciente.');
      },
      complete: () => this.timelineLoading.set(false)
    });
  }

  private hasOperationalBlockers(item: InvoiceItem) {
    return this.getOperationalBlockers(item).length > 0;
  }

  private hasStatus(status: string | null | undefined, expected: string) {
    return this.normalizeStatus(status) === expected;
  }

  private normalizeStatus(status: string | null | undefined) {
    return (status ?? '').trim().toUpperCase();
  }

  private hasBlocker(item: InvoiceItem, blockerId: InvoiceBlockerId) {
    return this.getOperationalBlockers(item).some(blocker => blocker.id === blockerId);
  }

  private getOperationalBlockers(item: InvoiceItem): InvoiceBlocker[] {
    const blockers: InvoiceBlocker[] = [];

    if (!item.purchaseOrder?.trim()) {
      blockers.push({ id: 'missing-po', label: 'Sin OC', icon: 'description', tone: 'warning' });
    }
    if (item.guaranteeRefundable && !item.estimatedRefundDate?.trim()) {
      blockers.push({ id: 'missing-date', label: 'Sin fecha estimada', icon: 'event_busy', tone: 'info' });
    }
    if (!item.refundManagerUserId) {
      blockers.push({ id: 'missing-manager', label: 'Sin gestor asignado', icon: 'person_off', tone: 'accent' });
    }

    return blockers;
  }

  private setInvoiceBusy(id: string, busy: boolean) {
    this.busyInvoiceIds.update(current => busy
      ? current.includes(id) ? current : [...current, id]
      : current.filter(item => item !== id));
  }

  private recalculateEstimatedRefundDate() {
    if (!this.form.controls.guaranteeRefundable.value) {
      this.form.controls.estimatedRefundDate.setValue('', { emitEvent: false });
      return;
    }

    const normalizedStartDate = this.normalizeDateValue(this.form.controls.invoiceDate.value);
    if (!normalizedStartDate) {
      this.form.controls.estimatedRefundDate.setValue('', { emitEvent: false });
      return;
    }

    const startDate = this.parseDate(normalizedStartDate);
    if (!startDate) {
      this.form.controls.estimatedRefundDate.setValue('', { emitEvent: false });
      return;
    }

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 90);
    this.form.controls.estimatedRefundDate.setValue(this.formatDate(dueDate), { emitEvent: false });
  }

  private resetFormForCreate() {
    this.form.reset({
      supplierId: '',
      contractId: '',
      invoiceNumber: '',
      invoiceDate: new Date(),
      invoiceAmount: 0,
      purchaseOrder: '',
      retainedAmount: 0,
      guaranteeRefundable: true,
      estimatedRefundDate: '',
      deliverableIds: [],
      refundManagerUserId: ''
    }, { emitEvent: false });
    this.recalculateEstimatedRefundDate();
    this.form.markAsPristine();
  }

  private syncSupplierDependentFields(supplierId: string) {
    const currentContractId = this.form.controls.contractId.value;
    const validContractIds = new Set(
      this.contracts()
        .filter(item => !supplierId || item.supplierId === supplierId)
        .map(item => item.id)
    );

    if (currentContractId && !validContractIds.has(currentContractId)) {
      this.form.controls.contractId.setValue('', { emitEvent: false });
      this.form.controls.deliverableIds.setValue([], { emitEvent: false });
    }
  }

  private syncContractDependentFields(contractId: string) {
    const validDeliverableIds = new Set(
      this.deliverables()
        .filter(item => !contractId || item.contractId === contractId)
        .map(item => item.id)
    );

    const nextSelectedDeliverables = this.form.controls.deliverableIds.value
      .filter(item => validDeliverableIds.has(item));

    if (nextSelectedDeliverables.length !== this.form.controls.deliverableIds.value.length) {
      this.form.controls.deliverableIds.setValue(nextSelectedDeliverables, { emitEvent: false });
    }
  }

  private normalizeOptionalDateValue(value: Date | string | null): string | null {
    if (!value) return null;
    return this.normalizeDateValue(value);
  }

  private normalizeDateValue(value: Date | string): string | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : this.formatDate(value);
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) return null;

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedValue);
    if (isoMatch) {
      const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      return this.isExactDateMatch(parsed, Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]))
        ? normalizedValue
        : null;
    }

    const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalizedValue);
    if (!slashMatch) return null;

    const parsed = new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
    return this.isExactDateMatch(parsed, Number(slashMatch[3]), Number(slashMatch[2]), Number(slashMatch[1]))
      ? this.formatDate(parsed)
      : null;
  }

  private parseDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return this.isExactDateMatch(parsed, Number(match[1]), Number(match[2]), Number(match[3])) ? parsed : null;
  }

  private isExactDateMatch(date: Date, year: number, month: number, day: number): boolean {
    return !Number.isNaN(date.getTime())
      && date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
