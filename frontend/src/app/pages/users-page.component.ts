import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../core/api.service';
import { UserSummary } from '../core/models';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card>
      <h2>Administración de usuarios</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="fullName" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput formControlName="email" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Contraseña temporal</mat-label><input matInput formControlName="password" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Roles</mat-label><mat-select formControlName="roles" multiple><mat-option *ngFor="let role of roles" [value]="role">{{ role }}</mat-option></mat-select></mat-form-field>
        <mat-checkbox formControlName="isActive">Activo</mat-checkbox>
        <button mat-flat-button color="primary" type="submit">Guardar usuario</button>
      </form>
      <p class="message" *ngIf="message()">{{ message() }}</p>

      <div class="table-wrap desktop-only">
      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Roles</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let item of users()">
            <td>{{ item.fullName }}</td>
            <td>{{ item.email }}</td>
            <td>{{ item.isActive ? 'Activo' : 'Inactivo' }}</td>
            <td>{{ item.roles.join(', ') }}</td>
            <td class="actions">
              <button mat-stroked-button type="button" (click)="toggleStatus(item)">
                {{ item.isActive ? 'Desactivar' : 'Activar' }}
              </button>
              <button mat-stroked-button type="button" (click)="resetPassword(item)">Resetear clave</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <div class="mobile-only user-cards">
        <article class="user-card" *ngFor="let item of users()">
          <h3>{{ item.fullName }}</h3>
          <p>{{ item.email }}</p>
          <p><strong>Estado:</strong> {{ item.isActive ? 'Activo' : 'Inactivo' }}</p>
          <p><strong>Roles:</strong> {{ item.roles.join(', ') }}</p>
          <div class="actions mobile-actions">
            <button mat-stroked-button type="button" (click)="toggleStatus(item)">
              {{ item.isActive ? 'Desactivar' : 'Activar' }}
            </button>
            <button mat-stroked-button type="button" (click)="resetPassword(item)">Resetear clave</button>
          </div>
        </article>
      </div>
      <p class="hint">El reseteo asigna la clave temporal <code>Temporal123!</code>.</p>
    </mat-card>
  `,
  styles: [`
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .message, .hint { margin-top: 12px; }
    .mobile-only { display: none; }
    .user-cards { display: grid; gap: 12px; }
    .user-card { padding: 16px; border: 1px solid #ddd; border-radius: 12px; background: #fff; }
    .user-card h3, .user-card p { margin: 0 0 8px; }
    @media (max-width: 960px) {
      form { grid-template-columns: 1fr; }
      .desktop-only { display: none; }
      .mobile-only { display: grid; }
      .mobile-actions {
        display: grid;
        grid-template-columns: 1fr;
      }
      .mobile-actions button {
        width: 100%;
      }
    }
  `]
})
export class UsersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly roles = ['Admin', 'Registrador', 'Gestor', 'Auditor'];
  readonly users = signal<UserSummary[]>([]);
  readonly message = signal('');
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

  save() {
    if (this.form.invalid) return;
    this.message.set('');
    this.api.saveUser(this.form.getRawValue()).subscribe(() => {
      this.form.reset({ fullName: '', email: '', password: 'Temporal123!', roles: ['Registrador'], isActive: true });
      this.message.set('Usuario creado correctamente.');
      this.reload();
    });
  }

  toggleStatus(user: UserSummary) {
    const nextStatus = !user.isActive;
    const confirmed = window.confirm(`¿Seguro que deseas ${nextStatus ? 'activar' : 'desactivar'} a ${user.fullName}?`);
    if (!confirmed) return;

    this.message.set('');
    this.api.updateUserStatus(user.id, nextStatus).subscribe({
      next: () => {
        this.message.set(`Usuario ${nextStatus ? 'activado' : 'desactivado'} correctamente.`);
        this.reload();
      },
      error: () => this.message.set('No fue posible actualizar el estado del usuario.')
    });
  }

  resetPassword(user: UserSummary) {
    const confirmed = window.confirm(`¿Resetear la clave de ${user.fullName} a Temporal123!?`);
    if (!confirmed) return;

    this.message.set('');
    this.api.resetUserPassword(user.id, 'Temporal123!').subscribe({
      next: () => this.message.set(`Clave reseteada correctamente para ${user.email}.`),
      error: () => this.message.set('No fue posible resetear la clave del usuario.')
    });
  }

  private reload() {
    this.api.getUsers().subscribe(data => this.users.set(data));
  }
}
