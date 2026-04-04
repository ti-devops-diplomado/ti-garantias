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
import { ContractItem, Supplier } from '../core/models';

@Component({
  selector: 'app-contracts-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card>
      <div class="section-header">
        <div>
          <h2>Catálogos · Contratos</h2>
          <p class="section-help">Administra contratos de forma independiente, con mejor espacio para fechas y datos financieros.</p>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="openContractModal()">Nuevo contrato</button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar contrato</mat-label>
          <input matInput [value]="searchTerm()" (input)="updateSearchTerm($event)" placeholder="Número, título o proveedor" />
        </mat-form-field>
      </div>

      <div class="table-wrap desktop-only">
        <table>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Proveedor</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>% retención</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredContracts()">
              <td>{{ contractLabel(item) }}</td>
              <td>{{ getSupplierName(item.supplierId) }}</td>
              <td>{{ item.startDate }}</td>
              <td>{{ item.endDate || 'Vigente' }}</td>
              <td>{{ item.retentionPercentage }}%</td>
              <td class="actions">
                <button mat-stroked-button type="button" (click)="editContract(item)">Editar</button>
              </td>
            </tr>
            <tr *ngIf="!filteredContracts().length">
              <td colspan="6" class="empty">No hay contratos para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cards mobile-only">
        <article class="item-card" *ngFor="let item of filteredContracts()">
          <h3>{{ contractLabel(item) }}</h3>
          <p><strong>Proveedor:</strong> {{ getSupplierName(item.supplierId) }}</p>
          <p><strong>Inicio:</strong> {{ item.startDate }}</p>
          <p><strong>Fin:</strong> {{ item.endDate || 'Vigente' }}</p>
          <p><strong>Retención:</strong> {{ item.retentionPercentage }}%</p>
          <div class="actions mobile-actions">
            <button mat-stroked-button type="button" (click)="editContract(item)">Editar</button>
          </div>
        </article>
        <p class="empty" *ngIf="!filteredContracts().length">No hay contratos para mostrar.</p>
      </div>
    </mat-card>

    <div class="modal-shell" *ngIf="showModal()" (click)="closeModal()">
      <mat-card class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>{{ editingContractId() ? 'Editar contrato' : 'Nuevo contrato' }}</h2>
            <p>Completa los datos del contrato en una ventana más amplia y cómoda.</p>
          </div>
          <button mat-icon-button type="button" (click)="closeModal()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="saveContract()">
          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <mat-select formControlName="supplierId">
              <mat-option *ngFor="let item of suppliers()" [value]="item.id">{{ item.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Número contrato</mat-label>
            <input matInput formControlName="contractNumber" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Título</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha inicio</mat-label>
            <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" placeholder="AAAA-MM-DD o DD/MM/AAAA" />
            <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #startDatePicker></mat-datepicker>
            <mat-error *ngIf="form.controls.startDate.hasError('required')">La fecha de inicio es obligatoria.</mat-error>
            <mat-error *ngIf="form.controls.startDate.hasError('matDatepickerParse') || form.controls.startDate.hasError('invalidDate')">
              Ingresa una fecha válida en formato AAAA-MM-DD o DD/MM/AAAA.
            </mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input matInput [matDatepicker]="endDatePicker" formControlName="endDate" placeholder="AAAA-MM-DD o DD/MM/AAAA" />
            <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #endDatePicker></mat-datepicker>
            <mat-error *ngIf="form.controls.endDate.hasError('matDatepickerParse') || form.controls.endDate.hasError('invalidDate')">
              Ingresa una fecha válida en formato AAAA-MM-DD o DD/MM/AAAA.
            </mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>% retención</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="retentionPercentage" />
          </mat-form-field>
          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit">{{ editingContractId() ? 'Actualizar contrato' : 'Guardar contrato' }}</button>
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
      width: min(980px, calc(100vw - 32px));
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
export class ContractsCatalogPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly contracts = signal<ContractItem[]>([]);
  readonly searchTerm = signal('');
  readonly showModal = signal(false);
  readonly editingContractId = signal<string | null>(null);
  readonly filteredContracts = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return this.contracts().filter(item => !search || [
      item.contractNumber,
      item.title,
      this.getSupplierName(item.supplierId)
    ].some(value => value.toLowerCase().includes(search)));
  });

  readonly form = this.fb.nonNullable.group({
    supplierId: ['', Validators.required],
    contractNumber: ['', Validators.required],
    title: ['', Validators.required],
    startDate: [new Date(), Validators.required],
    endDate: [null as Date | string | null],
    retentionPercentage: [10, Validators.required]
  });

  constructor() {
    this.reload();
  }

  openContractModal() {
    this.resetForm();
    this.showModal.set(true);
  }

  editContract(contract: ContractItem) {
    this.editingContractId.set(contract.id);
    this.form.reset({
      supplierId: contract.supplierId,
      contractNumber: contract.contractNumber,
      title: contract.title,
      startDate: this.parseDate(contract.startDate) ?? new Date(),
      endDate: contract.endDate ? this.parseDate(contract.endDate) : null,
      retentionPercentage: contract.retentionPercentage
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

  saveContract() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const startDate = this.normalizeDateValue(rawValue.startDate);
    const endDate = this.normalizeOptionalDateValue(rawValue.endDate);

    if (!startDate) {
      this.form.controls.startDate.setErrors({ invalidDate: true });
      this.form.controls.startDate.markAsTouched();
      return;
    }

    if (rawValue.endDate && !endDate) {
      this.form.controls.endDate.setErrors({ invalidDate: true });
      this.form.controls.endDate.markAsTouched();
      return;
    }

    const contractId = this.editingContractId();
    const payload = { ...rawValue, startDate, endDate };
    const action = contractId
      ? this.api.updateContract(contractId, payload)
      : this.api.createContract(payload);

    action.subscribe(() => {
      this.closeModal();
      this.reload();
    });
  }

  contractLabel(item: ContractItem) {
    return `${item.contractNumber} - ${item.title}`;
  }

  getSupplierName(supplierId: string) {
    return this.suppliers().find(item => item.id === supplierId)?.name ?? 'Proveedor no encontrado';
  }

  private reload() {
    this.api.getSuppliers().subscribe(data => this.suppliers.set(data));
    this.api.getContracts().subscribe(data => this.contracts.set(data));
  }

  private resetForm() {
    this.editingContractId.set(null);
    this.form.reset({
      supplierId: '',
      contractNumber: '',
      title: '',
      startDate: new Date(),
      endDate: null,
      retentionPercentage: 10
    });
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
