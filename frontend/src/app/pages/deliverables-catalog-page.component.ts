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
import { ContractItem, Deliverable } from '../core/models';

@Component({
  selector: 'app-deliverables-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card>
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

      <div class="table-wrap desktop-only">
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
            <tr *ngIf="!filteredDeliverables().length">
              <td colspan="3" class="empty">No hay entregables para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cards mobile-only">
        <article class="item-card" *ngFor="let item of filteredDeliverables()">
          <h3>{{ item.name }}</h3>
          <p><strong>Contrato:</strong> {{ getContractLabel(item.contractId) }}</p>
          <p><strong>Descripción:</strong> {{ item.description || 'Sin descripción' }}</p>
        </article>
        <p class="empty" *ngIf="!filteredDeliverables().length">No hay entregables para mostrar.</p>
      </div>
    </mat-card>

    <div class="modal-shell" *ngIf="showModal()" (click)="closeModal()">
      <mat-card class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>Nuevo entregable</h2>
            <p>Asocia el entregable al contrato correcto desde una ventana más amplia.</p>
          </div>
          <button mat-icon-button type="button" (click)="closeModal()" aria-label="Cerrar formulario">
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
            <button mat-flat-button color="primary" type="submit">Guardar entregable</button>
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
      .section-header, .modal-header, .filters, form, .form-actions {
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

  readonly contracts = signal<ContractItem[]>([]);
  readonly deliverables = signal<Deliverable[]>([]);
  readonly searchTerm = signal('');
  readonly showModal = signal(false);
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
    this.showModal.set(true);
  }

  closeModal() {
    this.form.reset({ contractId: '', name: '', description: '' });
    this.showModal.set(false);
  }

  updateSearchTerm(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  saveDeliverable() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.api.createDeliverable(this.form.getRawValue()).subscribe(() => {
      this.closeModal();
      this.reload();
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
    this.api.getContracts().subscribe(data => this.contracts.set(data));
    this.api.getDeliverables().subscribe(data => this.deliverables.set(data));
  }
}
