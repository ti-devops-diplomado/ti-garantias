import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ContractItem, Deliverable, InvoiceItem, Supplier, UserSummary } from './models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  getUsers() {
    return this.http.get<UserSummary[]>(`${this.auth.apiBaseUrl}/api/users`);
  }

  saveUser(payload: unknown, id?: string) {
    return id
      ? this.http.put(`${this.auth.apiBaseUrl}/api/users/${id}`, payload)
      : this.http.post(`${this.auth.apiBaseUrl}/api/users`, payload);
  }

  getSuppliers() {
    return this.http.get<Supplier[]>(`${this.auth.apiBaseUrl}/api/suppliers`);
  }

  createSupplier(payload: unknown) {
    return this.http.post<Supplier>(`${this.auth.apiBaseUrl}/api/suppliers`, payload);
  }

  updateSupplier(id: string, payload: unknown) {
    return this.http.put<Supplier>(`${this.auth.apiBaseUrl}/api/suppliers/${id}`, payload);
  }

  getContracts() {
    return this.http.get<ContractItem[]>(`${this.auth.apiBaseUrl}/api/contracts`);
  }

  createContract(payload: unknown) {
    return this.http.post<ContractItem>(`${this.auth.apiBaseUrl}/api/contracts`, payload);
  }

  updateContract(id: string, payload: unknown) {
    return this.http.put<ContractItem>(`${this.auth.apiBaseUrl}/api/contracts/${id}`, payload);
  }

  getDeliverables() {
    return this.http.get<Deliverable[]>(`${this.auth.apiBaseUrl}/api/deliverables`);
  }

  createDeliverable(payload: unknown) {
    return this.http.post<Deliverable>(`${this.auth.apiBaseUrl}/api/deliverables`, payload);
  }

  getInvoices(scope: string) {
    const query = scope === 'all' ? '' : `?scope=${scope}`;
    return this.http.get<InvoiceItem[]>(`${this.auth.apiBaseUrl}/api/invoices${query}`);
  }

  saveInvoice(payload: unknown, id?: string) {
    return id
      ? this.http.put<InvoiceItem>(`${this.auth.apiBaseUrl}/api/invoices/${id}`, payload)
      : this.http.post<InvoiceItem>(`${this.auth.apiBaseUrl}/api/invoices`, payload);
  }

  manageRefund(id: string, refundManagedDate: string) {
    return this.http.post<InvoiceItem>(`${this.auth.apiBaseUrl}/api/invoices/${id}/manage-refund`, { refundManagedDate });
  }

  uploadAttachment(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.auth.apiBaseUrl}/api/invoices/${id}/attachments`, formData);
  }
}
