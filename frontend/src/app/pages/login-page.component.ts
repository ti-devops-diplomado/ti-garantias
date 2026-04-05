import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { FeedbackService } from '../core/feedback.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="login-page">
      <div class="login-page__backdrop"></div>

      <div class="login-grid">
        <section class="login-story">
          <p class="login-story__eyebrow">Portal interno</p>
          <h1>Seguimiento claro para devoluciones de garantias.</h1>
          <p class="login-story__copy">
            Centraliza facturas, vencimientos, bloqueos operativos y asignaciones desde una sola experiencia de trabajo.
          </p>

          <div class="login-highlights">
            <article>
              <mat-icon>monitoring</mat-icon>
              <div>
                <strong>Vista operativa</strong>
                <p>Dashboard, alertas y pendientes alineados por rol.</p>
              </div>
            </article>
            <article>
              <mat-icon>folder_managed</mat-icon>
              <div>
                <strong>Datos operativos</strong>
                <p>Facturas, contratos y responsables en un flujo mas legible.</p>
              </div>
            </article>
            <article>
              <mat-icon>inventory</mat-icon>
              <div>
                <strong>Catalogos vivos</strong>
                <p>Mantenimiento de proveedores, contratos y entregables sin perder contexto.</p>
              </div>
            </article>
          </div>
        </section>

        <mat-card class="surface-card login-card">
          <p class="login-card__eyebrow">Acceso seguro</p>
          <h2>Ingresa a TI Garantias</h2>
          <p class="login-card__copy">Ingresa con tus credenciales para acceder al portal.</p>

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="field-span-full">
              <mat-label>Correo</mat-label>
              <input matInput formControlName="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="field-span-full">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>

            <div class="login-card__footer field-span-full">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Ingresando...' : 'Ingresar' }}
              </button>
            </div>

            <p class="error field-span-full" *ngIf="error()">{{ error() }}</p>
          </form>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    .login-page {
      position: relative;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 28px;
      overflow: hidden;
    }

    .login-page__backdrop {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 12% 18%, rgba(194, 138, 46, 0.2), transparent 24%),
        radial-gradient(circle at 88% 20%, rgba(23, 76, 116, 0.18), transparent 22%),
        linear-gradient(160deg, rgba(255, 253, 248, 0.92), rgba(241, 246, 252, 0.86));
    }

    .login-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(360px, 440px);
      gap: 28px;
      width: min(1100px, 100%);
      align-items: center;
    }

    .login-story {
      padding: 20px 10px 20px 0;
    }

    .login-story__eyebrow,
    .login-card__eyebrow {
      margin: 0 0 10px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-weight: 800;
    }

    .login-story__eyebrow {
      color: var(--color-gold);
    }

    .login-story h1,
    .login-story__copy,
    .login-card h2,
    .login-card__copy,
    .error {
      margin: 0;
    }

    .login-story h1 {
      max-width: 12ch;
      font-size: clamp(2.5rem, 4.5vw, 4.6rem);
      line-height: 0.98;
    }

    .login-story__copy {
      margin-top: 18px;
      max-width: 620px;
      font-size: 1.05rem;
      color: var(--color-ink-soft);
    }

    .login-highlights {
      display: grid;
      gap: 14px;
      margin-top: 28px;
    }

    .login-highlights article {
      display: grid;
      grid-template-columns: 44px 1fr;
      gap: 14px;
      padding: 18px;
      border: 1px solid rgba(23, 50, 77, 0.08);
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.68);
      box-shadow: var(--shadow-soft);
    }

    .login-highlights mat-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 16px;
      background: rgba(220, 239, 253, 0.9);
      color: var(--color-accent-strong);
    }

    .login-highlights strong,
    .login-highlights p {
      display: block;
      margin: 0;
    }

    .login-highlights p {
      margin-top: 4px;
      color: var(--color-ink-soft);
    }

    .login-card {
      padding: 30px 28px;
    }

    .login-card__eyebrow {
      color: var(--color-accent);
    }

    .login-card__copy {
      margin-top: 10px;
      color: var(--color-ink-soft);
    }

    form {
      margin-top: 22px;
    }

    .login-card__footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 6px;
    }

    .error {
      color: var(--color-danger);
      font-size: 0.95rem;
    }

    @media (max-width: 960px) {
      .login-page {
        padding: 18px;
      }

      .login-grid {
        grid-template-columns: 1fr;
      }

      .login-story {
        padding: 0;
      }

      .login-card__footer {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .login-page {
        padding: 14px;
      }

      .login-grid {
        gap: 16px;
      }

      .login-story h1 {
        max-width: 100%;
        font-size: clamp(2rem, 11vw, 2.8rem);
      }

      .login-story__copy {
        font-size: 0.96rem;
      }

      .login-highlights article {
        grid-template-columns: 40px 1fr;
        gap: 12px;
        padding: 14px;
        border-radius: 18px;
      }

      .login-highlights mat-icon {
        width: 40px;
        height: 40px;
      }

      .login-card {
        padding: 20px 18px;
      }

      .login-card__footer {
        margin-top: 10px;
      }
    }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedback.success('Sesion iniciada correctamente.');
        void this.router.navigate([this.auth.getPreferredRoute()]);
      },
      error: () => {
        this.error.set('No fue posible iniciar sesión.');
        this.feedback.error('No fue posible iniciar sesion. Verifica tus credenciales.');
        this.loading.set(false);
      }
    });
  }
}
