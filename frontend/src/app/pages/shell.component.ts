import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav mode="side" opened>
        <div class="brand">
          <h2>TI Garantías</h2>
          <p>{{ auth.user()?.fullName }}</p>
        </div>
        <mat-nav-list>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Registrador', 'Admin'])" routerLink="/mis-registros" routerLinkActive="active">Mis registros</a>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Registrador', 'Admin'])" routerLink="/facturas" routerLinkActive="active">Facturas</a>
          <a mat-list-item routerLink="/catalogos" routerLinkActive="active">Catálogos</a>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Gestor', 'Admin'])" routerLink="/pendientes-gestion" routerLinkActive="active">Pendientes por gestionar</a>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Admin'])" routerLink="/admin/usuarios" routerLinkActive="active">Admin usuarios</a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar>
          <span>Portal interno de garantías y devolución</span>
          <span class="spacer"></span>
          <button mat-stroked-button (click)="auth.logout()">Salir</button>
        </mat-toolbar>
        <main>
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .layout { min-height: 100vh; }
    .brand { padding: 20px 16px 8px; }
    .brand h2, .brand p { margin: 0; }
    mat-sidenav { width: 260px; border-right: 1px solid #d8d8d8; background: #f3f1ea; }
    mat-toolbar { background: #17324d; color: #fff; }
    .spacer { flex: 1; }
    main { padding: 24px; background: #faf8f3; min-height: calc(100vh - 64px); }
    .active { background: rgba(0, 0, 0, 0.06); }
  `]
})
export class ShellComponent {
  readonly auth = inject(AuthService);
}
