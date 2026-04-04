import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../core/api.service';
import { Supplier } from '../core/models';

@Component({
  selector: 'app-suppliers-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <mat-card>
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

      <div class="table-wrap desktop-only">
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
            <tr *ngIf="!filteredSuppliers().length">
              <td colspan="4" class="empty">No hay proveedores para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cards mobile-only">
        <article class="item-card" *ngFor="let item of filteredSuppliers()">
          <h3>{{ item.name }}</h3>
          <p><strong>NIT / ID:</strong> {{ item.taxId || 'Sin registro' }}</p>
          <p><strong>Correo:</strong> {{ item.contactEmail || 'Sin correo' }}</p>
          <div class="actions mobile-actions">
            <button mat-stroked-button type="button" (click)="editSupplier(item)">Editar</button>
          </div>
        </article>
        <p class="empty" *ngIf="!filteredSuppliers().length">No hay proveedores para mostrar.</p>
      </div>
    </mat-card>

    <div class="modal-shell" *ngIf="showModal()" (click)="closeModal()">
      <mat-card class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>{{ editingSupplierId() ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2>
            <p>Completa la información del proveedor sin perder de vista el listado principal.</p>
          </div>
          <button mat-icon-button type="button" (click)="closeModal()" aria-label="Cerrar formulario">
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
            <button mat-flat-button color="primary" type="submit">{{ editingSupplierId() ? 'Actualizar proveedor' : 'Guardar proveedor' }}</button>
            <button mat-stroked-button type="button" (click)="closeModal()">Cancelar</button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .section-header, .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .section-header h2, .modal-header h2 { margin: 0; }
    .section-help, .modal-header p { margin: 6px 0 0; color: #566573; }
    .filters {
      display: grid;
      grid-template-columns: minmax(260px, 420px);
      gap: 12px;
      margin-bottom: 20px;
    }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #ddd; vertical-align: top; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .cards { display: grid; gap: 12px; }
    .item-card { padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #fff; }
    .item-card h3, .item-card p { margin: 0 0 8px; }
    .empty { text-align: center; color: #666; }
    .desktop-only { display: block; }
    .mobile-only { display: none; }
    .modal-shell {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(15, 24, 35, 0.44);
    }
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
      .section-header, .modal-header, .filters, form, .form-actions, .mobile-actions {
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

  readonly suppliers = signal<Supplier[]>([]);
  readonly searchTerm = signal('');
  readonly showModal = signal(false);
  readonly editingSupplierId = signal<string | null>(null);
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
    this.showModal.set(true);
  }

  closeModal() {
    this.resetForm();
    this.showModal.set(false);
  }

  updateSearchTerm(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
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

    action.subscribe(() => {
      this.closeModal();
      this.reload();
    });
  }

  private reload() {
    this.api.getSuppliers().subscribe(data => this.suppliers.set(data));
  }

  private resetForm() {
    this.editingSupplierId.set(null);
    this.form.reset({ name: '', taxId: '', contactEmail: '' });
  }
}
