export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: UserSummary;
}

export interface Supplier {
  id: string;
  name: string;
  taxId: string;
  contactEmail: string;
}

export interface ContractItem {
  id: string;
  supplierId: string;
  contractNumber: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  retentionPercentage: number;
}

export interface Deliverable {
  id: string;
  contractId: string;
  name: string;
  description: string;
}

export interface AttachmentItem {
  id: string;
  originalFileName: string;
  contentType: string;
  sizeInBytes: number;
  uploadedAt: string;
}

export interface InvoiceItem {
  id: string;
  contractId: string;
  contractTitle: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  purchaseOrder: string;
  retainedAmount: number;
  guaranteeRefundable: boolean;
  estimatedRefundDate?: string | null;
  refundManagedDate?: string | null;
  refundManagerUserId?: string | null;
  refundManagerName?: string | null;
  status: string;
  createdByUserName: string;
  deliverableIds: string[];
  attachments: AttachmentItem[];
}
