import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
        <div class="card-header">
          <h2>Proveedores</h2>
          <button mat-flat-button color="primary" type="button" (click)="openSupplierModal()">Nuevo proveedor</button>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Buscar proveedor</mat-label>
          <input matInput [value]="supplierSearch()" (input)="updateSupplierSearch($event)" />
        </mat-form-field>
        <ul class="item-list">
          <li *ngFor="let item of filteredSuppliers()">
            <span>{{ item.name }} - {{ item.taxId }}</span>
            <button mat-button type="button" (click)="editSupplier(item)">Editar</button>
          </li>
        </ul>
      </mat-card>

      <mat-card>
        <div class="card-header">
          <h2>Contratos</h2>
          <button mat-flat-button color="primary" type="button" (click)="openContractModal()">Nuevo contrato</button>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Buscar contrato</mat-label>
          <input matInput [value]="contractSearch()" (input)="updateContractSearch($event)" />
        </mat-form-field>
        <ul class="item-list">
          <li *ngFor="let item of filteredContracts()">
            <span>{{ item.contractNumber }} - {{ item.title }} / {{ getSupplierName(item.supplierId) }}</span>
            <button mat-button type="button" (click)="editContract(item)">Editar</button>
          </li>
        </ul>
      </mat-card>

      <mat-card>
        <div class="card-header">
          <h2>Entregables</h2>
          <button mat-flat-button color="primary" type="button" (click)="openDeliverableModal()">Nuevo entregable</button>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Buscar entregable</mat-label>
          <input matInput [value]="deliverableSearch()" (input)="updateDeliverableSearch($event)" />
        </mat-form-field>
        <ul class="item-list">
          <li *ngFor="let item of filteredDeliverables()">
            <span>{{ item.name }} / {{ getContractTitle(item.contractId) }}</span>
          </li>
        </ul>
      </mat-card>
    </section>

    <div class="modal-shell" *ngIf="showSupplierModal()" (click)="cancelSupplierEdit()">
      <mat-card class="modal-card" (click)="$event.stopPropagation()">
        <div class="card-header modal-header">
          <h2>{{ editingSupplierId() ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2>
          <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="cancelSupplierEdit()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>NIT / ID</mat-label><input matInput formControlName="taxId" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput formControlName="contactEmail" /></mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit">{{ editingSupplierId() ? 'Actualizar proveedor' : 'Guardar proveedor' }}</button>
            <button mat-stroked-button type="button" (click)="cancelSupplierEdit()">Cancelar</button>
          </div>
        </form>
      </mat-card>
    </div>

    <div class="modal-shell" *ngIf="showContractModal()" (click)="cancelContractEdit()">
      <mat-card class="modal-card" (click)="$event.stopPropagation()">
        <div class="card-header modal-header">
          <h2>{{ editingContractId() ? 'Editar contrato' : 'Nuevo contrato' }}</h2>
          <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="cancelContractEdit()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>
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
            <button mat-stroked-button type="button" (click)="cancelContractEdit()">Cancelar</button>
          </div>
        </form>
      </mat-card>
    </div>

    <div class="modal-shell" *ngIf="showDeliverableModal()" (click)="cancelDeliverableEdit()">
      <mat-card class="modal-card" (click)="$event.stopPropagation()">
        <div class="card-header modal-header">
          <h2>Nuevo entregable</h2>
          <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="cancelDeliverableEdit()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <form [formGroup]="deliverableForm" (ngSubmit)="saveDeliverable()">
          <mat-form-field appearance="outline"><mat-label>Contrato</mat-label><mat-select formControlName="contractId"><mat-option *ngFor="let item of contracts()" [value]="item.id">{{ item.title }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Descripción</mat-label><input matInput formControlName="description" /></mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit">Guardar entregable</button>
            <button mat-stroked-button type="button" (click)="cancelDeliverableEdit()">Cancelar</button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    form { display: grid; gap: 12px; margin-bottom: 16px; }
    ul { padding-left: 18px; margin: 0; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .item-list { list-style: none; padding-left: 0; }
    .item-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0; }
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card-header h2 { margin: 0; }
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
      width: min(760px, 100%);
      max-height: calc(100vh - 48px);
      overflow: auto;
    }
    .modal-header { margin-bottom: 0; }
    @media (max-width: 960px) {
      .grid { grid-template-columns: 1fr; }
      .card-header,
      .actions {
        display: grid;
        grid-template-columns: 1fr;
      }
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
      .modal-shell {
        padding: 12px;
        align-items: end;
      }
      .modal-card {
        max-height: min(88vh, 100%);
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
  readonly showSupplierModal = signal(false);
  readonly showContractModal = signal(false);
  readonly showDeliverableModal = signal(false);
  readonly supplierSearch = signal('');
  readonly contractSearch = signal('');
  readonly deliverableSearch = signal('');
  readonly filteredSuppliers = computed(() => {
    const search = this.supplierSearch().trim().toLowerCase();
    return this.suppliers().filter(item => !search || [item.name, item.taxId, item.contactEmail].some(value => value.toLowerCase().includes(search)));
  });
  readonly filteredContracts = computed(() => {
    const search = this.contractSearch().trim().toLowerCase();
    return this.contracts().filter(item => !search || [item.contractNumber, item.title, this.getSupplierName(item.supplierId)].some(value => value.toLowerCase().includes(search)));
  });
  readonly filteredDeliverables = computed(() => {
    const search = this.deliverableSearch().trim().toLowerCase();
    return this.deliverables().filter(item => !search || [item.name, item.description, this.getContractTitle(item.contractId)].some(value => value.toLowerCase().includes(search)));
  });

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

  openSupplierModal() {
    this.resetSupplierForm();
    this.showSupplierModal.set(true);
  }

  updateSupplierSearch(event: Event) {
    this.supplierSearch.set((event.target as HTMLInputElement).value);
  }

  updateContractSearch(event: Event) {
    this.contractSearch.set((event.target as HTMLInputElement).value);
  }

  updateDeliverableSearch(event: Event) {
    this.deliverableSearch.set((event.target as HTMLInputElement).value);
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
      this.showSupplierModal.set(false);
      this.reload();
    });
  }

  editSupplier(supplier: Supplier) {
    this.editingSupplierId.set(supplier.id);
    this.showSupplierModal.set(true);
    this.supplierForm.reset({
      name: supplier.name,
      taxId: supplier.taxId,
      contactEmail: supplier.contactEmail
    });
  }

  cancelSupplierEdit() {
    this.resetSupplierForm();
    this.showSupplierModal.set(false);
  }

  openContractModal() {
    this.resetContractForm();
    this.showContractModal.set(true);
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
      this.showContractModal.set(false);
      this.reload();
    });
  }

  editContract(contract: ContractItem) {
    this.editingContractId.set(contract.id);
    this.showContractModal.set(true);
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
    this.showContractModal.set(false);
  }

  openDeliverableModal() {
    this.deliverableForm.reset({ contractId: '', name: '', description: '' });
    this.showDeliverableModal.set(true);
  }

  saveDeliverable() {
    if (this.deliverableForm.invalid) return;
    this.api.createDeliverable(this.deliverableForm.getRawValue()).subscribe(() => {
      this.deliverableForm.reset({ contractId: '', name: '', description: '' });
      this.showDeliverableModal.set(false);
      this.reload();
    });
  }

  cancelDeliverableEdit() {
    this.deliverableForm.reset({ contractId: '', name: '', description: '' });
    this.showDeliverableModal.set(false);
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

  getContractTitle(contractId: string) {
    return this.contracts().find(item => item.id === contractId)?.title ?? 'Contrato no encontrado';
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
