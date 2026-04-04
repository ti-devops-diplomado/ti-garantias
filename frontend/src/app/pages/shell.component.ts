import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav
        #drawer
        [mode]="drawerMode()"
        [opened]="drawerOpened()"
        [fixedInViewport]="isMobile()"
        [fixedTopGap]="isMobile() ? 64 : 0"
        [style.width]="isMobile() ? '86vw' : '260px'"
        (openedChange)="onDrawerOpenedChange($event)">
        <div class="brand">
          <h2>TI Garantías</h2>
          <p>{{ auth.user()?.fullName }}</p>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="closeMobileDrawer()">Dashboard</a>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Registrador', 'Admin'])" routerLink="/mis-registros" routerLinkActive="active" (click)="closeMobileDrawer()">Mis registros</a>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Registrador', 'Admin'])" routerLink="/facturas" routerLinkActive="active" (click)="closeMobileDrawer()">Facturas</a>
          <div class="nav-group">
            <div class="nav-group-label" [class.active-group]="catalogsExpanded()">Catálogos</div>
            <a mat-list-item class="nav-subitem" routerLink="/catalogos/proveedores" routerLinkActive="active" (click)="closeMobileDrawer()">Proveedores</a>
            <a mat-list-item class="nav-subitem" routerLink="/catalogos/contratos" routerLinkActive="active" (click)="closeMobileDrawer()">Contratos</a>
            <a mat-list-item class="nav-subitem" routerLink="/catalogos/entregables" routerLinkActive="active" (click)="closeMobileDrawer()">Entregables</a>
          </div>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Gestor', 'Admin'])" routerLink="/pendientes-gestion" routerLinkActive="active" (click)="closeMobileDrawer()">Pendientes por gestionar</a>
          <a mat-list-item *ngIf="auth.hasAnyRole(['Admin'])" routerLink="/admin/usuarios" routerLinkActive="active" (click)="closeMobileDrawer()">Admin usuarios</a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar>
          <button mat-icon-button *ngIf="isMobile()" (click)="toggleMobileDrawer()" aria-label="Abrir menú">
            <mat-icon>menu</mat-icon>
          </button>
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
    .nav-group { padding: 4px 0 8px; }
    .nav-group-label {
      padding: 10px 16px 6px;
      font-size: 12px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #6e6454;
      font-weight: 700;
    }
    .active-group { color: #17324d; }
    .nav-subitem {
      margin-left: 10px;
      width: calc(100% - 10px);
      border-radius: 12px 0 0 12px;
    }
    @media (max-width: 960px) {
      mat-toolbar {
        gap: 8px;
        padding: 0 12px;
      }
      mat-toolbar span:first-of-type {
        font-size: 14px;
        line-height: 1.2;
      }
      main {
        padding: 16px;
      }
      mat-sidenav {
        border-right: none;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
      }
      .nav-subitem {
        margin-left: 0;
        width: 100%;
        border-radius: 12px;
      }
    }
  `]
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly mobileBreakpoint = toSignal(
    this.breakpointObserver.observe('(max-width: 960px)').pipe(map(result => result.matches)),
    { initialValue: false }
  );
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );
  private readonly mobileDrawerOpen = signal(false);

  readonly isMobile = computed(() => this.mobileBreakpoint());
  readonly drawerMode = computed<'side' | 'over'>(() => this.isMobile() ? 'over' : 'side');
  readonly drawerOpened = computed(() => this.isMobile() ? this.mobileDrawerOpen() : true);
  readonly catalogsExpanded = computed(() => this.currentUrl().startsWith('/catalogos'));

  toggleMobileDrawer() {
    this.mobileDrawerOpen.update(value => !value);
  }

  closeMobileDrawer() {
    if (this.isMobile()) {
      this.mobileDrawerOpen.set(false);
    }
  }

  onDrawerOpenedChange(opened: boolean) {
    if (this.isMobile()) {
      this.mobileDrawerOpen.set(opened);
    }
  }
}
