import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="login-page">
      <mat-card>
        <h1>Portal TI Garantías</h1>
        <p>Ingreso local de demostración.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Correo</mat-label>
            <input matInput formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">Ingresar</button>
          <p class="hint">Demo: admin@demo.local / AdminTemporal123!</p>
          <p class="error" *ngIf="error()">{{ error() }}</p>
        </form>
      </mat-card>
    </section>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: linear-gradient(135deg, #eef6ff, #f9f0e7); }
    mat-card { width: min(420px, 100%); padding: 24px; }
    form { display: grid; gap: 16px; margin-top: 16px; }
    .hint, .error { margin: 0; font-size: 0.9rem; }
    .error { color: #b3261e; }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['admin@demo.local', [Validators.required, Validators.email]],
    password: ['AdminTemporal123!', Validators.required]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/mis-registros']),
      error: () => this.error.set('No fue posible iniciar sesión.'),
      complete: () => this.loading.set(false)
    });
  }
}
