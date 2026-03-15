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

      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Roles</th></tr></thead>
        <tbody><tr *ngFor="let item of users()"><td>{{ item.fullName }}</td><td>{{ item.email }}</td><td>{{ item.roles.join(', ') }}</td></tr></tbody>
      </table>
    </mat-card>
  `,
  styles: [`
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
  `]
})
export class UsersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly roles = ['Admin', 'Registrador', 'Gestor', 'Auditor'];
  readonly users = signal<UserSummary[]>([]);
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
    this.api.saveUser(this.form.getRawValue()).subscribe(() => {
      this.form.reset({ fullName: '', email: '', password: 'Temporal123!', roles: ['Registrador'], isActive: true });
      this.reload();
    });
  }

  private reload() {
    this.api.getUsers().subscribe(data => this.users.set(data));
  }
}
