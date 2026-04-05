import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { FeedbackService } from '../core/feedback.service';
import { UserSummary } from '../core/models';

interface PendingUserAction {
  type: 'toggle-status' | 'reset-password';
  user: UserSummary;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page-shell">
      <section class="page-hero">
        <div>
          <p class="page-hero__eyebrow">Administracion</p>
          <h1 class="page-hero__title">Usuarios</h1>
          <p class="page-hero__subtitle">Gestiona accesos, estados y reseteos desde una vista administrativa mas clara.</p>
        </div>
        <div class="hero-stat-grid">
          <article class="hero-stat">
            <p class="hero-stat__label">Usuarios</p>
            <p class="hero-stat__value">{{ users().length }}</p>
          </article>
          <article class="hero-stat">
            <p class="hero-stat__label">Visibles</p>
            <p class="hero-stat__value">{{ filteredUsers().length }}</p>
          </article>
        </div>
      </section>

    <mat-card class="surface-card">
      <div class="section-header">
        <h2>Administración de usuarios</h2>
        <button mat-flat-button color="primary" type="button" (click)="openForm()">Nuevo usuario</button>
      </div>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar</mat-label>
          <input matInput [value]="searchTerm()" (input)="updateSearchTerm($event)" placeholder="Nombre o correo" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select [value]="roleFilter()" (selectionChange)="roleFilter.set($event.value || '')">
            <mat-option value="">Todos</mat-option>
            <mat-option *ngFor="let role of roles" [value]="role">{{ role }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value || '')">
            <mat-option value="">Todos</mat-option>
            <mat-option value="Activo">Activo</mat-option>
            <mat-option value="Inactivo">Inactivo</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="list-toolbar">
        <p>{{ filteredUsers().length }} de {{ users().length }} usuarios visibles</p>
        <button mat-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Limpiar filtros</button>
      </div>
      <p class="message" *ngIf="message()">{{ message() }}</p>

      <section class="confirm-panel" *ngIf="pendingAction() as action">
        <div>
          <p class="confirm-panel__eyebrow">Confirmacion requerida</p>
          <h3>{{ action.type === 'toggle-status' ? 'Actualizar estado del usuario' : 'Resetear contraseña' }}</h3>
          <p>
            <ng-container *ngIf="action.type === 'toggle-status'; else passwordPrompt">
              Vas a {{ action.user.isActive ? 'desactivar' : 'activar' }} a {{ action.user.fullName }}.
            </ng-container>
            <ng-template #passwordPrompt>
              Vas a resetear la clave de {{ action.user.fullName }} a <code>Temporal123!</code>.
            </ng-template>
          </p>
        </div>
        <div class="confirm-panel__actions">
          <button mat-flat-button color="primary" type="button" (click)="confirmPendingAction()" [disabled]="actionInProgress()">
            {{ actionInProgress() ? 'Procesando...' : 'Confirmar' }}
          </button>
          <button mat-stroked-button type="button" (click)="pendingAction.set(null)" [disabled]="actionInProgress()">Cancelar</button>
        </div>
      </section>

      <div class="empty-panel" *ngIf="!filteredUsers().length">
        <div>
          <h3>{{ hasActiveFilters() ? 'No encontramos coincidencias' : 'Todavia no hay usuarios' }}</h3>
          <p>{{ hasActiveFilters() ? 'Prueba limpiando filtros o ajustando la busqueda.' : 'Crea el primer usuario para habilitar accesos en la plataforma.' }}</p>
        </div>
        <button mat-stroked-button type="button" *ngIf="hasActiveFilters()" (click)="clearFilters()">Ver todo</button>
      </div>

      <div class="table-wrap" *ngIf="filteredUsers().length">
      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Roles</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let item of filteredUsers()">
            <td>{{ item.fullName }}</td>
            <td>{{ item.email }}</td>
            <td>{{ item.isActive ? 'Activo' : 'Inactivo' }}</td>
            <td>{{ item.roles.join(', ') }}</td>
            <td class="actions">
              <button mat-stroked-button type="button" (click)="editUser(item)" [disabled]="actionInProgress() || saving()">
                Editar
              </button>
              <button mat-stroked-button type="button" (click)="requestToggleStatus(item)" [disabled]="actionInProgress()">
                {{ item.isActive ? 'Desactivar' : 'Activar' }}
              </button>
              <button mat-stroked-button type="button" (click)="requestResetPassword(item)" [disabled]="actionInProgress()">Resetear clave</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <p class="hint">El reseteo asigna la clave temporal <code>Temporal123!</code>.</p>
    </mat-card>

    <div class="modal-shell" *ngIf="showForm()" (click)="requestCloseForm()">
      <mat-card class="surface-card modal-card" (click)="$event.stopPropagation()">
        <div class="section-header modal-header">
          <div>
            <h2>{{ editingUserId() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
            <p class="section-help">
              {{ editingUserId()
                ? 'Actualiza nombre, correo, roles o estado del usuario sin salir del listado.'
                : 'Crea el usuario desde una ventana más amplia y cómoda, sin perder el contexto del listado.' }}
            </p>
          </div>
          <button mat-icon-button class="icon-button icon-button--ghost icon-button--danger" type="button" (click)="requestCloseForm()" aria-label="Cerrar formulario">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="fullName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ editingUserId() ? 'Nueva contraseña temporal (opcional)' : 'Contraseña temporal' }}</mat-label>
            <input matInput formControlName="password" />
            <mat-hint *ngIf="editingUserId()">Déjalo vacío si no quieres cambiar la contraseña.</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Roles</mat-label><mat-select formControlName="roles" multiple><mat-option *ngFor="let role of roles" [value]="role">{{ role }}</mat-option></mat-select></mat-form-field>
          <mat-checkbox formControlName="isActive">Activo</mat-checkbox>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : (editingUserId() ? 'Actualizar usuario' : 'Guardar usuario') }}
            </button>
            <button mat-stroked-button type="button" (click)="requestCloseForm()" [disabled]="saving()">Cancelar</button>
          </div>
        </form>

        <section class="draft-warning" *ngIf="discardDraftPrompt()">
          <div>
            <p class="draft-warning__eyebrow">Cambios sin guardar</p>
            <h3>¿Cerrar sin guardar?</h3>
            <p>Perderas la informacion del nuevo usuario.</p>
          </div>
          <div class="draft-warning__actions">
            <button mat-flat-button color="primary" type="button" (click)="confirmDiscardDraft()">Descartar cambios</button>
            <button mat-stroked-button type="button" (click)="discardDraftPrompt.set(false)">Seguir editando</button>
          </div>
        </section>
      </mat-card>
    </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .section-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .empty-panel {
      margin-bottom: 14px;
    }
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .message, .hint { margin-top: 12px; }
    .section-help { margin: 6px 0 0; color: var(--color-ink-soft); }
    .confirm-panel {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin: 14px 0 20px;
      padding: 18px 20px;
      border: 1px solid rgba(194, 138, 46, 0.24);
      border-radius: 22px;
      background: rgba(255, 244, 221, 0.74);
    }
    .confirm-panel h3,
    .confirm-panel p {
      margin: 0;
    }
    .confirm-panel__eyebrow {
      margin: 0 0 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-warning);
      font-weight: 800;
    }
    .confirm-panel p:last-child {
      margin-top: 6px;
      color: var(--color-ink-soft);
    }
    .confirm-panel__actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .draft-warning {
      margin-top: 8px;
    }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.82);
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(23, 50, 77, 0.08); }
    th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ink-muted);
      background: rgba(245, 239, 230, 0.66);
    }
    .modal-card {
      width: min(880px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      overflow: auto;
    }
    .modal-header h2 { margin: 0; }
    @media (max-width: 960px) {
      .section-header,
      form,
      .filters,
      .confirm-panel,
      .list-toolbar,
      .empty-panel,
      .draft-warning {
        display: grid;
        grid-template-columns: 1fr;
      }
      .modal-header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: start;
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr;
      }
      .actions button {
        width: 100%;
      }
      .modal-shell {
        padding: 12px;
        align-items: end;
      }
      .modal-card {
        width: 100%;
        max-height: min(90vh, 100%);
      }
    }
    @media (max-width: 480px) {
      .confirm-panel {
        padding: 16px;
        border-radius: 18px;
      }
      .confirm-panel__actions,
      .actions,
      .modal-header {
        display: grid;
        grid-template-columns: 1fr;
      }
      .confirm-panel__actions button,
      .actions button {
        width: 100%;
      }
    }
  `]
})
export class UsersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly feedback = inject(FeedbackService);

  readonly roles = ['Admin', 'Registrador', 'Gestor', 'Auditor'];
  readonly users = signal<UserSummary[]>([]);
  readonly editingUserId = signal<string | null>(null);
  readonly message = signal('');
  readonly showForm = signal(false);
  readonly discardDraftPrompt = signal(false);
  readonly saving = signal(false);
  readonly actionInProgress = signal(false);
  readonly pendingAction = signal<PendingUserAction | null>(null);
  readonly searchTerm = signal('');
  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly hasActiveFilters = computed(() =>
    !!this.searchTerm().trim() || !!this.roleFilter() || !!this.statusFilter()
  );
  readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter(item => {
      const matchesSearch = !search || [item.fullName, item.email].some(value => value.toLowerCase().includes(search));
      const matchesRole = !role || item.roles.includes(role);
      const matchesStatus = !status || (status === 'Activo' ? item.isActive : !item.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  });
  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['Temporal123!'],
    roles: [['Registrador'] as string[]],
    isActive: [true]
  });

  constructor() {
    this.reload();
  }

  openForm() {
    this.resetForm();
    this.showForm.set(true);
  }

  editUser(user: UserSummary) {
    this.editingUserId.set(user.id);
    this.form.reset({
      fullName: user.fullName,
      email: user.email,
      password: '',
      roles: [...user.roles],
      isActive: user.isActive
    });
    this.form.markAsPristine();
    this.discardDraftPrompt.set(false);
    this.showForm.set(true);
  }

  updateSearchTerm(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.roleFilter.set('');
    this.statusFilter.set('');
  }

  save() {
    if (this.form.invalid) return;
    this.message.set('');
    this.saving.set(true);
    const editingUserId = this.editingUserId();
    this.api.saveUser(this.form.getRawValue(), editingUserId ?? undefined).subscribe({
      next: () => {
        const successMessage = editingUserId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.';
        this.resetForm();
        this.message.set(successMessage);
        this.feedback.success(successMessage);
        this.showForm.set(false);
        this.reload();
      },
      error: () => {
        this.message.set('No fue posible guardar el usuario.');
        this.feedback.error('No fue posible guardar el usuario.');
      },
      complete: () => this.saving.set(false)
    });
  }

  closeForm() {
    this.discardDraftPrompt.set(false);
    this.showForm.set(false);
    this.resetForm();
  }

  requestCloseForm() {
    if (this.saving()) {
      return;
    }

    if (this.form.dirty) {
      this.discardDraftPrompt.set(true);
      return;
    }

    this.closeForm();
  }

  confirmDiscardDraft() {
    this.closeForm();
  }

  requestToggleStatus(user: UserSummary) {
    this.pendingAction.set({ type: 'toggle-status', user });
  }

  requestResetPassword(user: UserSummary) {
    this.pendingAction.set({ type: 'reset-password', user });
  }

  confirmPendingAction() {
    const action = this.pendingAction();
    if (!action) {
      return;
    }

    this.message.set('');
    this.actionInProgress.set(true);

    const request = action.type === 'toggle-status'
      ? this.api.updateUserStatus(action.user.id, !action.user.isActive)
      : this.api.resetUserPassword(action.user.id, 'Temporal123!');

    request.subscribe({
      next: () => {
        if (action.type === 'toggle-status') {
          const nextStatus = !action.user.isActive;
          this.message.set(`Usuario ${nextStatus ? 'activado' : 'desactivado'} correctamente.`);
          this.feedback.success(`Usuario ${nextStatus ? 'activado' : 'desactivado'} correctamente.`);
          this.reload();
        } else {
          this.message.set(`Clave reseteada correctamente para ${action.user.email}.`);
          this.feedback.success(`Clave reseteada para ${action.user.fullName}.`);
        }

        this.pendingAction.set(null);
      },
      error: () => {
        const errorMessage = action.type === 'toggle-status'
          ? 'No fue posible actualizar el estado del usuario.'
          : 'No fue posible resetear la clave del usuario.';
        this.message.set(errorMessage);
        this.feedback.error(errorMessage);
      },
      complete: () => this.actionInProgress.set(false)
    });
  }

  private reload() {
    this.api.getUsers().subscribe({
      next: data => this.users.set(data),
      error: () => {
        this.message.set('No fue posible cargar los usuarios.');
        this.feedback.error('No fue posible cargar los usuarios.');
      }
    });
  }

  private resetForm() {
    this.editingUserId.set(null);
    this.form.reset({ fullName: '', email: '', password: 'Temporal123!', roles: ['Registrador'], isActive: true });
    this.form.markAsPristine();
    this.discardDraftPrompt.set(false);
  }
}
