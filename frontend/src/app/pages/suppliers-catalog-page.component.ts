import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../core/api.service';
import { FeedbackService } from '../core/feedback.service';
import { Supplier } from '../core/models';

@Component({
  selector: 'app-suppliers-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="page-shell">
      <section class="page-hero">
        <div>
          <p class="page-hero__eyebrow">Catalogos</p>
          <h1 class="page-hero__title">Proveedores</h1>
          <p class="page-hero__subtitle">Consulta, crea y actualiza proveedores desde una vista mas clara y enfocada en busqueda rapida.</p>
        </div>
        <div class="hero-stat-grid">
          <article class="hero-stat">
            <p class="hero-stat__label">Proveedores</p>
            <p class="hero-stat__value">{{ suppliers().length }}</p>
          </article>
          <article class="hero-stat">
            <p class="hero-stat__label">Visibles</p>
            <p class="hero-stat__value">{{ filteredSuppliers().length }}</p>
          </article>
        </div>
      </section>

    <mat-card class="surface-card">
      <div class="section-header">
        <div>
          <h2>Catálogos · Proveedores</h2>
          <p class="section-help">Consulta el listado y crea o edita proveedores desde una ventana superpuesta más cómoda.</p>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="openSupplierModal()">Nuevo proveedor</button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar proveedor</mat-label>
          <input matInput [value]="searchTerm()" (input)="updateSearchTerm($event)" placeholder="Nombre, NIT o correo" />
        </mat-form-field>
      </div>

      <div class="list-toolbar">
        <p>{{ filteredSuppliers().length }} de {{ suppliers().length }} proveedores visibles</p>
        <button mat-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Limpiar busqueda</button>
      </div>

      <div class="empty-panel" *ngIf="!filteredSuppliers().length">
        <div>
          <h3>{{ hasActiveFilters() ? 'No encontramos coincidencias' : 'Todavia no hay proveedores' }}</h3>
          <p>{{ hasActiveFilters() ? 'Prueba con otro nombre, NIT o correo.' : 'Crea el primer proveedor para empezar a poblar el catalogo.' }}</p>
        </div>
        <button mat-stroked-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Ver todo</button>
      </div>

      <div class="table-wrap desktop-only" *ngIf="filteredSuppliers().length">
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>NIT / ID</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredSuppliers()">
              <td>{{ item.name }}</td>
              <td>{{ item.taxId || 'Sin registro' }}</td>
              <td>{{ item.contactEmail || 'Sin correo' }}</td>
              <td class="actions">
                <button mat-stroked-button type="button" (click)="editSupplier(item)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cards mobile-only" *ngIf="filteredSuppliers().length">
        <article class="item-card" *ngFor="let item of filteredSuppliers()">
          <h3>{{ item.name }}</h3>
          <p><strong>NIT / ID:</strong> {{ item.taxId || 'Sin registro' }}</p>
          <p><strong>Correo:</strong> {{ item.contactEmail || 'Sin correo' }}</p>
          <div class="actions mobile-actions">
            <button mat-stroked-button type="button" (click)="editSupplier(item)">Editar</button>
          </div>
        </article>
      </div>
    </mat-card>

    <div class="modal-shell" *ngIf="showModal()" (click)="requestCloseModal()">
      <mat-card class="surface-card modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>{{ editingSupplierId() ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2>
            <p>Completa la información del proveedor sin perder de vista el listado principal.</p>
          </div>
          <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="requestCloseModal()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="saveSupplier()">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>NIT / ID</mat-label>
            <input matInput formControlName="taxId" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Correo</mat-label>
            <input matInput formControlName="contactEmail" />
          </mat-form-field>
          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : (editingSupplierId() ? 'Actualizar proveedor' : 'Guardar proveedor') }}
            </button>
            <button mat-stroked-button type="button" (click)="requestCloseModal()" [disabled]="saving()">Cancelar</button>
          </div>
        </form>

        <section class="draft-warning" *ngIf="discardDraftPrompt()">
          <div>
            <p class="draft-warning__eyebrow">Cambios sin guardar</p>
            <h3>¿Cerrar sin guardar?</h3>
            <p>Perderas la informacion editada del proveedor.</p>
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
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .cards { display: grid; gap: 12px; }
    .item-card { padding: 18px; border: 1px solid var(--color-border); border-radius: 22px; background: rgba(255, 255, 255, 0.88); box-shadow: var(--shadow-soft); }
    .item-card h3, .item-card p { margin: 0 0 8px; }
    .empty { text-align: center; color: var(--color-ink-soft); }
    .desktop-only { display: block; }
    .mobile-only { display: none; }
    .modal-card {
      width: min(840px, calc(100vw - 32px));
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
      .section-header, .modal-header, .filters, form, .form-actions, .mobile-actions, .list-toolbar, .empty-panel, .draft-warning {
        display: grid;
        grid-template-columns: 1fr;
      }
      .desktop-only { display: none; }
      .mobile-only { display: grid; }
      .actions button { width: 100%; }
      .filters { grid-template-columns: 1fr; }
      .modal-shell { padding: 12px; align-items: end; }
      .modal-card { width: 100%; max-height: min(90vh, 100%); }
    }
  `]
})
export class SuppliersCatalogPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly feedback = inject(FeedbackService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly searchTerm = signal('');
  readonly showModal = signal(false);
  readonly editingSupplierId = signal<string | null>(null);
  readonly discardDraftPrompt = signal(false);
  readonly saving = signal(false);
  readonly hasActiveFilters = computed(() => !!this.searchTerm().trim());
  readonly filteredSuppliers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return this.suppliers().filter(item => !search || [item.name, item.taxId, item.contactEmail].some(value => value.toLowerCase().includes(search)));
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: [''],
    contactEmail: ['']
  });

  constructor() {
    this.reload();
  }

  openSupplierModal() {
    this.discardDraftPrompt.set(false);
    this.resetForm();
    this.showModal.set(true);
  }

  editSupplier(supplier: Supplier) {
    this.editingSupplierId.set(supplier.id);
    this.form.reset({
      name: supplier.name,
      taxId: supplier.taxId,
      contactEmail: supplier.contactEmail
    });
    this.form.markAsPristine();
    this.discardDraftPrompt.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.discardDraftPrompt.set(false);
    this.resetForm();
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

  saveSupplier() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const supplierId = this.editingSupplierId();
    const payload = this.form.getRawValue();
    const action = supplierId
      ? this.api.updateSupplier(supplierId, payload)
      : this.api.createSupplier(payload);

    this.saving.set(true);
    action.subscribe({
      next: () => {
        this.feedback.success(supplierId ? 'Proveedor actualizado.' : 'Proveedor creado.');
        this.closeModal();
        this.reload();
      },
      error: () => this.feedback.error('No fue posible guardar el proveedor.'),
      complete: () => this.saving.set(false)
    });
  }

  private reload() {
    this.api.getSuppliers().subscribe({
      next: data => this.suppliers.set(data),
      error: () => this.feedback.error('No fue posible cargar los proveedores.')
    });
  }

  private resetForm() {
    this.editingSupplierId.set(null);
    this.form.reset({ name: '', taxId: '', contactEmail: '' });
    this.form.markAsPristine();
  }
}
