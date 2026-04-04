import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { FeedbackService } from '../core/feedback.service';
import { ContractItem, Deliverable } from '../core/models';

@Component({
  selector: 'app-deliverables-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page-shell">
      <section class="page-hero">
        <div>
          <p class="page-hero__eyebrow">Catalogos</p>
          <h1 class="page-hero__title">Entregables</h1>
          <p class="page-hero__subtitle">Gestiona entregables por contrato con una vista mas limpia y facil de escanear.</p>
        </div>
        <div class="hero-stat-grid">
          <article class="hero-stat">
            <p class="hero-stat__label">Entregables</p>
            <p class="hero-stat__value">{{ deliverables().length }}</p>
          </article>
          <article class="hero-stat">
            <p class="hero-stat__label">Visibles</p>
            <p class="hero-stat__value">{{ filteredDeliverables().length }}</p>
          </article>
        </div>
      </section>

    <mat-card class="surface-card">
      <div class="section-header">
        <div>
          <h2>Catálogos · Entregables</h2>
          <p class="section-help">Gestiona entregables por contrato con una vista dedicada y más legible.</p>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="openModal()">Nuevo entregable</button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar entregable</mat-label>
          <input matInput [value]="searchTerm()" (input)="updateSearchTerm($event)" placeholder="Nombre, descripción o contrato" />
        </mat-form-field>
      </div>

      <div class="list-toolbar">
        <p>{{ filteredDeliverables().length }} de {{ deliverables().length }} entregables visibles</p>
        <button mat-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Limpiar busqueda</button>
      </div>

      <div class="empty-panel" *ngIf="!filteredDeliverables().length">
        <div>
          <h3>{{ hasActiveFilters() ? 'No encontramos coincidencias' : 'Todavia no hay entregables' }}</h3>
          <p>{{ hasActiveFilters() ? 'Prueba con otro nombre o contrato.' : 'Crea el primer entregable para completar el catalogo operativo.' }}</p>
        </div>
        <button mat-stroked-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Ver todo</button>
      </div>

      <div class="table-wrap desktop-only" *ngIf="filteredDeliverables().length">
        <table>
          <thead>
            <tr>
              <th>Entregable</th>
              <th>Contrato</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredDeliverables()">
              <td>{{ item.name }}</td>
              <td>{{ getContractLabel(item.contractId) }}</td>
              <td>{{ item.description || 'Sin descripción' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cards mobile-only" *ngIf="filteredDeliverables().length">
        <article class="item-card" *ngFor="let item of filteredDeliverables()">
          <h3>{{ item.name }}</h3>
          <p><strong>Contrato:</strong> {{ getContractLabel(item.contractId) }}</p>
          <p><strong>Descripción:</strong> {{ item.description || 'Sin descripción' }}</p>
        </article>
      </div>
    </mat-card>

    <div class="modal-shell" *ngIf="showModal()" (click)="requestCloseModal()">
      <mat-card class="surface-card modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>Nuevo entregable</h2>
            <p>Asocia el entregable al contrato correcto desde una ventana más amplia.</p>
          </div>
          <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="requestCloseModal()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="saveDeliverable()">
          <mat-form-field appearance="outline">
            <mat-label>Contrato</mat-label>
            <mat-select formControlName="contractId">
              <mat-option *ngFor="let item of contracts()" [value]="item.id">{{ contractLabel(item) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Descripción</mat-label>
            <input matInput formControlName="description" />
          </mat-form-field>
          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar entregable' }}
            </button>
            <button mat-stroked-button type="button" (click)="requestCloseModal()" [disabled]="saving()">Cancelar</button>
          </div>
        </form>

        <section class="draft-warning" *ngIf="discardDraftPrompt()">
          <div>
            <p class="draft-warning__eyebrow">Cambios sin guardar</p>
            <h3>¿Cerrar sin guardar?</h3>
            <p>Perderas la informacion editada del entregable.</p>
          </div>
          <div class="draft-warning__actions">
            <button mat-flat-button color="primary" type="button" (click)="confirmDiscardDraft()">Descartar cambios</button>
            <button mat-stroked-button type="button" (click)="discardDraftPrompt.set(false)">Seguir editando</button>
          </div>
        </section>
      </mat-card>
    </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .section-header, .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .section-header h2, .modal-header h2 { margin: 0; }
    .section-help, .modal-header p { margin: 6px 0 0; color: var(--color-ink-soft); }
    .filters {
      display: grid;
      grid-template-columns: minmax(260px, 420px);
      gap: 12px;
      margin-bottom: 20px;
    }
    .empty-panel {
      margin-bottom: 14px;
    }
    .draft-warning {
      margin-top: 8px;
    }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.82);
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(23, 50, 77, 0.08); vertical-align: top; }
    th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ink-muted);
      background: rgba(245, 239, 230, 0.66);
    }
    .cards { display: grid; gap: 12px; }
    .item-card { padding: 18px; border: 1px solid var(--color-border); border-radius: 22px; background: rgba(255, 255, 255, 0.88); box-shadow: var(--shadow-soft); }
    .item-card h3, .item-card p { margin: 0 0 8px; }
    .empty { text-align: center; color: var(--color-ink-soft); }
    .desktop-only { display: block; }
    .mobile-only { display: none; }
    .modal-card {
      width: min(880px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      overflow: auto;
    }
    form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .span-2 { grid-column: 1 / -1; }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 4px;
    }
    @media (max-width: 960px) {
      .section-header, .modal-header, .filters, form, .form-actions, .list-toolbar, .empty-panel, .draft-warning {
        display: grid;
        grid-template-columns: 1fr;
      }
      .desktop-only { display: none; }
      .mobile-only { display: grid; }
      .filters { grid-template-columns: 1fr; }
      .modal-shell { padding: 12px; align-items: end; }
      .modal-card { width: 100%; max-height: min(90vh, 100%); }
    }
  `]
})
export class DeliverablesCatalogPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly feedback = inject(FeedbackService);

  readonly contracts = signal<ContractItem[]>([]);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly searchTerm = signal('');
  readonly showModal = signal(false);
  readonly discardDraftPrompt = signal(false);
  readonly saving = signal(false);
  readonly hasActiveFilters = computed(() => !!this.searchTerm().trim());
  readonly filteredDeliverables = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return this.deliverables().filter(item => !search || [
      item.name,
      item.description,
      this.getContractLabel(item.contractId)
    ].some(value => value.toLowerCase().includes(search)));
  });

  readonly form = this.fb.nonNullable.group({
    contractId: ['', Validators.required],
    name: ['', Validators.required],
    description: ['']
  });

  constructor() {
    this.reload();
  }

  openModal() {
    this.form.reset({ contractId: '', name: '', description: '' });
    this.form.markAsPristine();
    this.discardDraftPrompt.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.form.reset({ contractId: '', name: '', description: '' });
    this.form.markAsPristine();
    this.discardDraftPrompt.set(false);
    this.showModal.set(false);
  }

  updateSearchTerm(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearFilters() {
    this.searchTerm.set('');
  }

  requestCloseModal() {
    if (this.saving()) {
      return;
    }

    if (this.form.dirty) {
      this.discardDraftPrompt.set(true);
      return;
    }

    this.closeModal();
  }

  confirmDiscardDraft() {
    this.closeModal();
  }

  saveDeliverable() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.api.createDeliverable(this.form.getRawValue()).subscribe({
      next: () => {
        this.feedback.success('Entregable creado.');
        this.closeModal();
        this.reload();
      },
      error: () => this.feedback.error('No fue posible guardar el entregable.'),
      complete: () => this.saving.set(false)
    });
  }

  contractLabel(item: ContractItem) {
    return `${item.contractNumber} - ${item.title}`;
  }

  getContractLabel(contractId: string) {
    const contract = this.contracts().find(item => item.id === contractId);
    return contract ? this.contractLabel(contract) : 'Contrato no encontrado';
  }

  private reload() {
    this.api.getContracts().subscribe({
      next: data => this.contracts.set(data),
      error: () => this.feedback.error('No fue posible cargar los contratos.')
    });
    this.api.getDeliverables().subscribe({
      next: data => this.deliverables.set(data),
      error: () => this.feedback.error('No fue posible cargar los entregables.')
    });
  }
}
