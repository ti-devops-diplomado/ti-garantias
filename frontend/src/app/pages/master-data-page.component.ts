import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { ContractItem, Deliverable, Supplier } from '../core/models';

@Component({
  selector: 'app-master-data-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
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
          <mat-form-field appearance="outline">
            <mat-label>Fecha inicio</mat-label>
            <input
              matInput
              [matDatepicker]="startDatePicker"
              formControlName="startDate"
              placeholder="AAAA-MM-DD o DD/MM/AAAA" />
            <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #startDatePicker></mat-datepicker>
            <mat-error *ngIf="contractForm.controls.startDate.hasError('required')">
              La fecha de inicio es obligatoria.
            </mat-error>
            <mat-error *ngIf="contractForm.controls.startDate.hasError('matDatepickerParse') || contractForm.controls.startDate.hasError('invalidDate')">
              Ingresa una fecha valida en formato AAAA-MM-DD o DD/MM/AAAA, o seleccionala en el calendario.
            </mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input
              matInput
              [matDatepicker]="endDatePicker"
              formControlName="endDate"
              placeholder="AAAA-MM-DD o DD/MM/AAAA" />
            <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #endDatePicker></mat-datepicker>
            <mat-error *ngIf="contractForm.controls.endDate.hasError('matDatepickerParse') || contractForm.controls.endDate.hasError('invalidDate')">
              Ingresa una fecha valida en formato AAAA-MM-DD o DD/MM/AAAA, o seleccionala en el calendario.
            </mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>% retención</mat-label><input matInput type="number" min="0" step="0.01" formControlName="retentionPercentage" /></mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit">{{ editingContractId() ? 'Actualizar contrato' : 'Guardar contrato' }}</button>
            <button *ngIf="editingContractId()" mat-stroked-button type="button" (click)="cancelContractEdit()">Cancelar</button>
          </div>
        </form>
        <ul class="item-list">
          <li *ngFor="let item of contracts()">
            <span>{{ item.contractNumber }} - {{ item.title }} / {{ getSupplierName(item.supplierId) }}</span>
            <button mat-button type="button" (click)="editContract(item)">Editar</button>
          </li>
        </ul>
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
    @media (max-width: 960px) {
      .grid { grid-template-columns: 1fr; }
      .actions { display: grid; grid-template-columns: 1fr; }
      .actions button { width: 100%; }
      .item-list li {
        flex-direction: column;
        align-items: flex-start;
        padding: 12px 0;
        border-bottom: 1px solid #ece7dc;
      }
      .item-list li button {
        width: 100%;
      }
    }
  `]
})
export class MasterDataPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly contracts = signal<ContractItem[]>([]);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly editingSupplierId = signal<string | null>(null);
  readonly editingContractId = signal<string | null>(null);

  readonly supplierForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: [''],
    contactEmail: ['']
  });

  readonly contractForm = this.fb.nonNullable.group({
    supplierId: ['', Validators.required],
    contractNumber: ['', Validators.required],
    title: ['', Validators.required],
    startDate: [new Date(), Validators.required],
    endDate: [null as Date | string | null],
    retentionPercentage: [10, Validators.required]
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
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }

    const rawValue = this.contractForm.getRawValue();
    const startDate = this.normalizeDateValue(rawValue.startDate);
    const endDate = this.normalizeOptionalDateValue(rawValue.endDate);

    if (!startDate) {
      this.contractForm.controls.startDate.setErrors({ invalidDate: true });
      this.contractForm.controls.startDate.markAsTouched();
      return;
    }

    if (rawValue.endDate && !endDate) {
      this.contractForm.controls.endDate.setErrors({ invalidDate: true });
      this.contractForm.controls.endDate.markAsTouched();
      return;
    }

    const request = {
      ...rawValue,
      startDate,
      endDate
    };
    const contractId = this.editingContractId();

    const action = contractId
      ? this.api.updateContract(contractId, request)
      : this.api.createContract(request);

    action.subscribe(() => {
      this.resetContractForm();
      this.reload();
    });
  }

  editContract(contract: ContractItem) {
    this.editingContractId.set(contract.id);
    this.contractForm.reset({
      supplierId: contract.supplierId,
      contractNumber: contract.contractNumber,
      title: contract.title,
      startDate: this.parseDate(contract.startDate) ?? new Date(),
      endDate: contract.endDate ? this.parseDate(contract.endDate) : null,
      retentionPercentage: contract.retentionPercentage
    });
  }

  cancelContractEdit() {
    this.resetContractForm();
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

  private resetContractForm() {
    this.editingContractId.set(null);
    this.contractForm.reset({
      supplierId: '',
      contractNumber: '',
      title: '',
      startDate: new Date(),
      endDate: null,
      retentionPercentage: 10
    });
  }

  getSupplierName(supplierId: string) {
    return this.suppliers().find(item => item.id === supplierId)?.name ?? 'Proveedor no encontrado';
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
    if (!match) return null;

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
