import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ContractItem, Deliverable, InvoiceItem, Supplier } from '../core/models';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="grid">
      <mat-card>
        <h2>{{ title }}</h2>
        <form [formGroup]="form" (ngSubmit)="saveInvoice()">
          <mat-form-field appearance="outline"><mat-label>Proveedor</mat-label><mat-select formControlName="supplierId"><mat-option *ngFor="let item of suppliers()" [value]="item.id">{{ item.name }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Contrato</mat-label><mat-select formControlName="contractId"><mat-option *ngFor="let item of filteredContracts()" [value]="item.id">{{ item.title }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Factura</mat-label><input matInput formControlName="invoiceNumber" placeholder="999-999-999999999" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Fecha factura</mat-label><input matInput type="date" formControlName="invoiceDate" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Valor factura</mat-label><input matInput type="number" formControlName="invoiceAmount" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>OC</mat-label><input matInput formControlName="purchaseOrder" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Valor retenido</mat-label><input matInput type="number" formControlName="retainedAmount" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Fecha estimada devolución</mat-label><input matInput type="date" formControlName="estimatedRefundDate" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Entregables</mat-label><mat-select formControlName="deliverableIds" multiple><mat-option *ngFor="let item of filteredDeliverables()" [value]="item.id">{{ item.name }}</mat-option></mat-select></mat-form-field>
          <mat-checkbox formControlName="guaranteeRefundable">Aplica devolución</mat-checkbox>
          <button mat-flat-button color="primary" type="submit">Guardar factura</button>
        </form>
      </mat-card>

      <mat-card>
        <h2>Listado</h2>
        <div class="cards">
          <article class="invoice" *ngFor="let item of invoices()">
            <h3>{{ item.invoiceNumber }} · {{ item.status }}</h3>
            <p>{{ item.supplierName }} / {{ item.contractTitle }}</p>
            <p>OC: {{ item.purchaseOrder }} · Retenido: {{ item.retainedAmount | currency:'USD':'symbol':'1.0-0' }}</p>
            <p>Gestor: {{ item.refundManagerName || 'Sin asignar' }}</p>
            <div class="actions">
              <button mat-stroked-button *ngIf="auth.hasAnyRole(['Gestor', 'Admin']) && item.status !== 'MANAGED'" (click)="manage(item)">Marcar gestión</button>
              <input type="file" (change)="upload(item.id, $event)" />
            </div>
            <small *ngIf="item.attachments.length">Adjuntos: {{ item.attachments.length }}</small>
          </article>
        </div>
      </mat-card>
    </section>
  `,
  styles: [`
    .grid { display: grid; gap: 20px; grid-template-columns: minmax(320px, 420px) 1fr; }
    form { display: grid; gap: 12px; }
    .cards { display: grid; gap: 12px; }
    .invoice { padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #fff; }
    .invoice h3, .invoice p { margin: 0 0 8px; }
    .actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
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
  readonly scope = this.route.snapshot.data['scope'] as string ?? 'all';
  readonly title = this.scope === 'mine' ? 'Mis registros' : this.scope === 'managed' ? 'Pendientes por gestionar' : 'Facturas';

  readonly form = this.fb.nonNullable.group({
    supplierId: ['', Validators.required],
    contractId: ['', Validators.required],
    invoiceNumber: ['', [Validators.required, Validators.pattern(/^\d{3}-\d{3}-\d{9}$/)]],
    invoiceDate: [new Date().toISOString().slice(0, 10), Validators.required],
    invoiceAmount: [0, Validators.required],
    purchaseOrder: [''],
    retainedAmount: [0, Validators.required],
    guaranteeRefundable: [true],
    estimatedRefundDate: [''],
    deliverableIds: [[] as string[]]
  });

  constructor() {
    this.reload();
  }

  filteredContracts() {
    return this.contracts().filter(item => !this.form.value.supplierId || item.supplierId === this.form.value.supplierId);
  }

  filteredDeliverables() {
    return this.deliverables().filter(item => !this.form.value.contractId || item.contractId === this.form.value.contractId);
  }

  saveInvoice() {
    if (this.form.invalid) return;
    this.api.saveInvoice(this.form.getRawValue()).subscribe(() => {
      this.form.patchValue({ invoiceNumber: '', invoiceAmount: 0, purchaseOrder: '', retainedAmount: 0, estimatedRefundDate: '', deliverableIds: [] });
      this.reload();
    });
  }

  manage(item: InvoiceItem) {
    const today = new Date().toISOString().slice(0, 10);
    this.api.manageRefund(item.id, today).subscribe(() => this.reload());
  }

  upload(id: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.api.uploadAttachment(id, file).subscribe(() => this.reload());
  }

  private reload() {
    this.api.getSuppliers().subscribe(data => this.suppliers.set(data));
    this.api.getContracts().subscribe(data => this.contracts.set(data));
    this.api.getDeliverables().subscribe(data => this.deliverables.set(data));
    this.api.getInvoices(this.scope).subscribe(data => this.invoices.set(data));
  }
}
