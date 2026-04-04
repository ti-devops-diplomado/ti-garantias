import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import { AttachmentItem, ContractItem, Deliverable, InvoiceItem, Supplier } from '../core/models';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <ng-container *ngIf="scope !== 'mine'; else mineLayout">
      <mat-card>
        <h2>{{ title }}</h2>
        <p class="section-help" *ngIf="scope === 'managed'">
          Completa y gestiona las facturas asignadas desde la misma vista, con el mismo formato operativo del listado general de facturas.
        </p>
        <form [formGroup]="form" (ngSubmit)="saveInvoice()">
          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <mat-select formControlName="supplierId">
              <mat-option *ngFor="let item of suppliers()" [value]="item.id">{{ item.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Contrato</mat-label>
            <mat-select formControlName="contractId">
              <mat-option *ngFor="let item of filteredContracts()" [value]="item.id">{{ contractLabel(item) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Factura</mat-label>
            <input matInput formControlName="invoiceNumber" placeholder="999-999-999999999" />
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
            <mat-select formControlName="deliverableIds" multiple>
              <mat-option *ngFor="let item of filteredDeliverables()" [value]="item.id">{{ item.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-checkbox formControlName="guaranteeRefundable">Aplica devolución</mat-checkbox>
          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="scope === 'managed' && !editingInvoiceId()">
              {{ scope === 'managed' ? 'Guardar cambios' : submitLabel() }}
            </button>
            <button mat-stroked-button type="button" *ngIf="editingInvoiceId()" (click)="cancelEdit()">
              {{ scope === 'managed' ? 'Cancelar' : 'Cancelar edición' }}
            </button>
          </div>
        </form>

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
              <th>Adjuntos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of invoices()">
              <td>{{ item.invoiceNumber }}</td>
              <td>{{ item.supplierName }}</td>
              <td>{{ invoiceContractLabel(item) }}</td>
              <td>{{ item.invoiceDate }}</td>
              <td>{{ item.estimatedRefundDate || 'Pendiente' }}</td>
              <td>{{ item.purchaseOrder || 'Sin OC' }}</td>
              <td>{{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.refundManagerName || 'Sin asignar' }}</td>
              <td>{{ item.attachments.length }}</td>
              <td class="actions">
                <button mat-stroked-button type="button" (click)="startEdit(item)">
                  {{ scope === 'managed' ? 'Completar datos' : 'Editar' }}
                </button>
                <button mat-stroked-button type="button" *ngIf="canManageInvoices && item.status !== 'GESTIONADA'" (click)="manage(item)">Marcar gestión</button>
                <label class="upload-action">
                  <span>Adjuntar</span>
                  <input type="file" (change)="upload(item.id, $event)" />
                </label>
              </td>
            </tr>
            <tr *ngIf="!invoices().length">
              <td colspan="11" class="empty">No hay registros para mostrar.</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div class="cards mobile-only">
          <article class="invoice" *ngFor="let item of invoices()">
            <h3>{{ item.invoiceNumber }} · {{ item.status }}</h3>
            <p>{{ item.supplierName }}</p>
            <p>{{ invoiceContractLabel(item) }}</p>
            <div class="detail-grid">
              <p><strong>Inicio:</strong> {{ item.invoiceDate }}</p>
              <p><strong>Vencimiento:</strong> {{ item.estimatedRefundDate || 'Pendiente' }}</p>
              <p><strong>OC:</strong> {{ item.purchaseOrder || 'Sin OC' }}</p>
              <p><strong>Retenido:</strong> {{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</p>
              <p><strong>Gestor:</strong> {{ item.refundManagerName || 'Sin asignar' }}</p>
              <p><strong>Adjuntos:</strong> {{ item.attachments.length }}</p>
            </div>
            <div class="attachments" *ngIf="item.attachments.length; else noManagedAttachments">
              <strong>Adjuntos</strong>
              <button *ngFor="let attachment of item.attachments"
                      type="button"
                      class="attachment-link"
                      (click)="previewAttachment(attachment.id, attachment.originalFileName)">
                {{ attachment.originalFileName }}
              </button>
            </div>
            <ng-template #noManagedAttachments>
              <small>Sin adjuntos</small>
            </ng-template>
            <div class="actions mobile-actions">
              <button mat-stroked-button type="button" (click)="startEdit(item)">
                {{ scope === 'managed' ? 'Completar datos' : 'Editar' }}
              </button>
              <button mat-stroked-button type="button" *ngIf="canManageInvoices && item.status !== 'GESTIONADA'" (click)="manage(item)">Marcar gestión</button>
              <label class="upload-action">
                <span>Adjuntar</span>
                <input type="file" (change)="upload(item.id, $event)" />
              </label>
            </div>
          </article>
          <p class="empty" *ngIf="!invoices().length">No hay registros para mostrar.</p>
        </div>
      </mat-card>
    </ng-container>

    <ng-template #mineLayout>
      <mat-card>
        <h2>{{ title }}</h2>
        <div class="cards">
          <article class="invoice" *ngFor="let item of invoices()">
            <h3>{{ item.invoiceNumber }} · {{ item.status }}</h3>
            <p>{{ item.supplierName }} / {{ invoiceContractLabel(item) }}</p>
            <p>Inicio: {{ item.invoiceDate }} · Vencimiento: {{ item.estimatedRefundDate || 'Pendiente' }}</p>
            <p>OC: {{ item.purchaseOrder || 'Sin OC' }} · Retenido: {{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</p>
            <p>Gestor: {{ item.refundManagerName || 'Sin asignar' }}</p>
            <div class="attachments" *ngIf="item.attachments.length; else noAttachments">
              <strong>Adjuntos</strong>
              <button *ngFor="let attachment of item.attachments"
                      type="button"
                      class="attachment-link"
                      (click)="previewAttachment(attachment.id, attachment.originalFileName)">
                {{ attachment.originalFileName }}
              </button>
            </div>
            <ng-template #noAttachments>
              <small>Sin adjuntos</small>
            </ng-template>
          </article>
          <p class="empty" *ngIf="!invoices().length">No hay registros para mostrar.</p>
        </div>
      </mat-card>
    </ng-template>
  `,
  styles: [`
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; vertical-align: top; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .form-actions { display: flex; gap: 8px; align-items: center; }
    .section-help { margin: 0 0 16px; color: #566573; }
    .upload-action { position: relative; display: inline-flex; align-items: center; border: 1px solid #8a8a8a; border-radius: 20px; padding: 6px 12px; cursor: pointer; font: inherit; }
    .upload-action input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .empty { text-align: center; color: #666; }
    .cards { display: grid; gap: 12px; }
    .invoice { padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #fff; }
    .invoice h3, .invoice p { margin: 0 0 8px; }
    .detail-grid { display: grid; gap: 6px; margin: 12px 0; }
    .attachments { display: grid; gap: 6px; margin-top: 12px; }
    .attachment-link { border: 0; padding: 0; background: transparent; color: #17324d; text-align: left; cursor: pointer; font: inherit; }
    .attachment-link:hover { text-decoration: underline; }
    .mobile-only { display: none; }
    @media (max-width: 960px) {
      form { grid-template-columns: 1fr; }
      .desktop-only { display: none; }
      .mobile-only { display: grid; }
      .form-actions,
      .mobile-actions {
        display: grid;
        grid-template-columns: 1fr;
      }
      .actions button,
      .upload-action {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class InvoicesPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly contracts = signal<ContractItem[]>([]);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly invoices = signal<InvoiceItem[]>([]);
  readonly editingInvoiceId = signal<string | null>(null);
  readonly scope = this.route.snapshot.data['scope'] as string ?? 'all';
  readonly title = this.scope === 'mine' ? 'Mis registros' : this.scope === 'managed' ? 'Pendientes por gestionar' : 'Facturas';
  readonly canCreateInvoices = this.auth.hasAnyRole(['Registrador', 'Admin']);
  readonly canManageInvoices = this.auth.hasAnyRole(['Gestor', 'Admin']);
  readonly canEditInvoices = this.auth.hasAnyRole(['Registrador', 'Gestor', 'Admin']);

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
    deliverableIds: [[] as string[]]
  });

  constructor() {
    this.form.controls.invoiceDate.valueChanges.subscribe(() => this.recalculateEstimatedRefundDate());
    this.form.controls.guaranteeRefundable.valueChanges.subscribe(() => this.recalculateEstimatedRefundDate());
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

  startEdit(item: InvoiceItem) {
    this.editingInvoiceId.set(item.id);
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
      deliverableIds: item.deliverableIds
    }, { emitEvent: false });
    this.recalculateEstimatedRefundDate();
  }

  cancelEdit() {
    this.editingInvoiceId.set(null);
    this.resetFormForCreate();
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

    this.api.saveInvoice({
      ...rawValue,
      invoiceDate,
      estimatedRefundDate
    }, editingInvoiceId ?? undefined).subscribe(saved => {
      if (editingInvoiceId) {
        this.reload(saved.id);
        return;
      }

      this.resetFormForCreate();
      this.reload();
    });
  }

  manage(item: InvoiceItem) {
    if (!this.canManageInvoices) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    this.api.manageRefund(item.id, today).subscribe(() => this.reload(item.id));
  }

  upload(id: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.uploadAttachment(id, file).subscribe(() => this.reload(id));
  }

  previewAttachment(attachmentId: string, fileName: string) {
    this.api.getAttachmentPreview(attachmentId).subscribe(({ blob, contentType }) => {
      const previewBlob = blob.type ? blob : new Blob([blob], { type: contentType });
      const url = URL.createObjectURL(previewBlob);
      const previewWindow = window.open(url, '_blank', 'noopener,noreferrer');

      if (!previewWindow) {
        URL.revokeObjectURL(url);
        return;
      }

      previewWindow.document.title = fileName;
      previewWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(url), { once: true });
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
  }

  private reload(preferredInvoiceId?: string) {
    this.api.getSuppliers().subscribe(data => this.suppliers.set(data));
    this.api.getContracts().subscribe(data => this.contracts.set(data));
    this.api.getDeliverables().subscribe(data => this.deliverables.set(data));
    this.api.getInvoices(this.scope).subscribe(data => {
      this.invoices.set(data);

      if (!data.length) {
        this.cancelEdit();
        return;
      }

      if (preferredInvoiceId) {
        const preferredInvoice = data.find(item => item.id === preferredInvoiceId);
        if (preferredInvoice) {
          this.startEdit(preferredInvoice);
          return;
        }
      }

      if (this.scope === 'managed') {
        this.startEdit(data[0]);
      }
    });
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
      deliverableIds: []
    }, { emitEvent: false });
    this.recalculateEstimatedRefundDate();
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
