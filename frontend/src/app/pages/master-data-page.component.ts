import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { ContractItem, Deliverable, Supplier } from '../core/models';

@Component({
  selector: 'app-master-data-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="grid">
      <mat-card>
        <h2>Proveedores</h2>
        <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>NIT / ID</mat-label><input matInput formControlName="taxId" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput formControlName="contactEmail" /></mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit">{{ editingSupplierId() ? 'Actualizar proveedor' : 'Guardar proveedor' }}</button>
            <button *ngIf="editingSupplierId()" mat-stroked-button type="button" (click)="cancelSupplierEdit()">Cancelar</button>
          </div>
        </form>
        <ul class="item-list">
          <li *ngFor="let item of suppliers()">
            <span>{{ item.name }} - {{ item.taxId }}</span>
            <button mat-button type="button" (click)="editSupplier(item)">Editar</button>
          </li>
        </ul>
      </mat-card>

      <mat-card>
        <h2>Contratos</h2>
        <form [formGroup]="contractForm" (ngSubmit)="saveContract()">
          <mat-form-field appearance="outline"><mat-label>Proveedor</mat-label><mat-select formControlName="supplierId"><mat-option *ngFor="let item of suppliers()" [value]="item.id">{{ item.name }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Número contrato</mat-label><input matInput formControlName="contractNumber" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Título</mat-label><input matInput formControlName="title" /></mat-form-field>
          <button mat-flat-button color="primary" type="submit">Guardar contrato</button>
        </form>
        <ul><li *ngFor="let item of contracts()">{{ item.contractNumber }} - {{ item.title }}</li></ul>
      </mat-card>

      <mat-card>
        <h2>Entregables</h2>
        <form [formGroup]="deliverableForm" (ngSubmit)="saveDeliverable()">
          <mat-form-field appearance="outline"><mat-label>Contrato</mat-label><mat-select formControlName="contractId"><mat-option *ngFor="let item of contracts()" [value]="item.id">{{ item.title }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Descripción</mat-label><input matInput formControlName="description" /></mat-form-field>
          <button mat-flat-button color="primary" type="submit">Guardar entregable</button>
        </form>
        <ul><li *ngFor="let item of deliverables()">{{ item.name }}</li></ul>
      </mat-card>
    </section>
  `,
  styles: [`
    .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    form { display: grid; gap: 12px; margin-bottom: 16px; }
    ul { padding-left: 18px; margin: 0; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .item-list { list-style: none; padding-left: 0; }
    .item-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0; }
  `]
})
export class MasterDataPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly contracts = signal<ContractItem[]>([]);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly editingSupplierId = signal<string | null>(null);

  readonly supplierForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: [''],
    contactEmail: ['']
  });

  readonly contractForm = this.fb.nonNullable.group({
    supplierId: ['', Validators.required],
    contractNumber: ['', Validators.required],
    title: ['', Validators.required]
  });

  readonly deliverableForm = this.fb.nonNullable.group({
    contractId: ['', Validators.required],
    name: ['', Validators.required],
    description: ['']
  });

  constructor() {
    this.reload();
  }

  saveSupplier() {
    if (this.supplierForm.invalid) return;
    const request = this.supplierForm.getRawValue();
    const supplierId = this.editingSupplierId();

    const action = supplierId
      ? this.api.updateSupplier(supplierId, request)
      : this.api.createSupplier(request);

    action.subscribe(() => {
      this.resetSupplierForm();
      this.reload();
    });
  }

  editSupplier(supplier: Supplier) {
    this.editingSupplierId.set(supplier.id);
    this.supplierForm.reset({
      name: supplier.name,
      taxId: supplier.taxId,
      contactEmail: supplier.contactEmail
    });
  }

  cancelSupplierEdit() {
    this.resetSupplierForm();
  }

  saveContract() {
    if (this.contractForm.invalid) return;
    this.api.createContract({ ...this.contractForm.getRawValue(), startDate: new Date().toISOString().slice(0, 10), retentionPercentage: 10 }).subscribe(() => {
      this.contractForm.reset({ supplierId: '', contractNumber: '', title: '' });
      this.reload();
    });
  }

  saveDeliverable() {
    if (this.deliverableForm.invalid) return;
    this.api.createDeliverable(this.deliverableForm.getRawValue()).subscribe(() => {
      this.deliverableForm.reset({ contractId: '', name: '', description: '' });
      this.reload();
    });
  }

  private reload() {
    this.api.getSuppliers().subscribe(data => this.suppliers.set(data));
    this.api.getContracts().subscribe(data => this.contracts.set(data));
    this.api.getDeliverables().subscribe(data => this.deliverables.set(data));
  }

  private resetSupplierForm() {
    this.editingSupplierId.set(null);
    this.supplierForm.reset({ name: '', taxId: '', contactEmail: '' });
  }
}
