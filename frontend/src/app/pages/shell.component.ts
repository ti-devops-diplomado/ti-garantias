import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/auth.service';

interface MobileDockLink {
  label: string;
  icon: string;
  route?: string;
  action?: 'logout';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatSidenavModule, MatToolbarModule],
  template: `
    <mat-sidenav-container class="shell-layout">
      <mat-sidenav
        #drawer
        class="shell-sidebar"
        [mode]="drawerMode()"
        [opened]="drawerOpened()"
        [fixedInViewport]="isMobile()"
        [fixedTopGap]="isMobile() ? 76 : 0"
        [style.width]="isMobile() ? '86vw' : '260px'"
        (openedChange)="onDrawerOpenedChange($event)">
        <div class="sidebar-scroll">
          <section class="brand-card">
            <p class="brand-card__eyebrow">Portal interno</p>
            <h1>TI Garantías</h1>
            <p>Seguimiento operativo para facturas, devoluciones y catálogos maestros.</p>
          </section>

          <section class="profile-card">
            <div class="profile-card__avatar">{{ userInitials() }}</div>
            <div>
              <strong>{{ auth.user()?.fullName }}</strong>
              <p>{{ auth.user()?.roles?.join(' · ') || 'Sin rol asignado' }}</p>
            </div>
          </section>

          <nav class="nav-section">
            <p class="nav-section__title">Principal</p>
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="nav-link--active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobileDrawer()">
              <mat-icon>space_dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a class="nav-link" *ngIf="auth.hasAnyRole(['Registrador', 'Admin'])" routerLink="/mis-registros" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>inventory_2</mat-icon>
              <span>Mis registros</span>
            </a>
            <a class="nav-link" *ngIf="auth.hasAnyRole(['Registrador', 'Admin'])" routerLink="/facturas" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>receipt_long</mat-icon>
              <span>Facturas</span>
            </a>
            <a class="nav-link" *ngIf="auth.hasAnyRole(['Gestor', 'Admin'])" routerLink="/pendientes-gestion" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>assignment_turned_in</mat-icon>
              <span>Pendientes</span>
            </a>
            <a class="nav-link" *ngIf="auth.hasAnyRole(['Admin'])" routerLink="/admin/usuarios" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>manage_accounts</mat-icon>
              <span>Usuarios</span>
            </a>
          </nav>

          <nav class="nav-section">
            <div class="nav-section__header">
              <p class="nav-section__title">Catálogos</p>
              <span class="info-badge" [class.info-badge--active]="catalogsExpanded()">Activos</span>
            </div>
            <a class="nav-link nav-link--nested" routerLink="/catalogos/proveedores" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>apartment</mat-icon>
              <span>Proveedores</span>
            </a>
            <a class="nav-link nav-link--nested" routerLink="/catalogos/contratos" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>description</mat-icon>
              <span>Contratos</span>
            </a>
            <a class="nav-link nav-link--nested" routerLink="/catalogos/entregables" routerLinkActive="nav-link--active" (click)="closeMobileDrawer()">
              <mat-icon>checklist</mat-icon>
              <span>Entregables</span>
            </a>
          </nav>
        </div>
      </mat-sidenav>
      <mat-sidenav-content class="shell-content">
        <mat-toolbar class="topbar">
          <div class="topbar__left">
            <button mat-icon-button class="icon-button icon-button--surface" *ngIf="isMobile()" (click)="toggleMobileDrawer()" aria-label="Abrir menú">
              <mat-icon>menu</mat-icon>
            </button>
            <div class="topbar__title-group">
              <p class="topbar__eyebrow">Gestión de garantías</p>
              <h2>{{ activeTitle() }}</h2>
            </div>
          </div>
          <div class="topbar__right">
            <span class="info-badge desktop-chip">{{ todayLabel }}</span>
            <span class="topbar__user" *ngIf="!isMobile()">{{ auth.user()?.fullName }}</span>
            <button mat-stroked-button type="button" class="topbar__logout" aria-label="Cerrar sesión" (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              <span class="topbar__logout-label">Salir</span>
            </button>
          </div>
        </mat-toolbar>
        <main class="content-area">
          <router-outlet />
        </main>
        <nav class="mobile-dock" *ngIf="isMobile()">
          <ng-container *ngFor="let item of mobilePrimaryLinks()">
            <a class="mobile-dock__link"
               *ngIf="!item.action; else dockAction"
               [routerLink]="item.route"
               routerLinkActive="mobile-dock__link--active"
               [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
            <ng-template #dockAction>
              <button type="button" class="mobile-dock__link mobile-dock__link--button" (click)="handleMobileDockAction(item.action!)">
                <mat-icon>{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
              </button>
            </ng-template>
          </ng-container>
        </nav>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-layout {
      min-height: 100vh;
      background: transparent;
    }

    .shell-sidebar {
      border-right: 1px solid rgba(23, 50, 77, 0.1);
      background:
        linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(243, 239, 232, 0.94));
      box-shadow: 18px 0 44px rgba(15, 31, 48, 0.08);
    }

    .sidebar-scroll {
      display: grid;
      gap: 20px;
      height: 100%;
      padding: 18px 16px 24px;
      overflow: auto;
    }

    .brand-card {
      padding: 20px;
      border-radius: 26px;
      background: linear-gradient(145deg, rgba(15, 53, 82, 0.96), rgba(23, 76, 116, 0.88));
      color: #f8fbff;
      box-shadow: 0 20px 44px rgba(15, 31, 48, 0.18);
    }

    .brand-card h1,
    .brand-card p {
      margin: 0;
    }

    .brand-card__eyebrow {
      margin-bottom: 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-weight: 800;
      color: rgba(248, 251, 255, 0.72);
    }

    .brand-card p:last-child {
      margin-top: 10px;
      color: rgba(248, 251, 255, 0.8);
      font-size: 0.92rem;
    }

    .profile-card {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 16px;
      border-radius: 22px;
      border: 1px solid rgba(23, 50, 77, 0.08);
      background: rgba(255, 255, 255, 0.72);
    }

    .profile-card strong,
    .profile-card p {
      display: block;
      margin: 0;
    }

    .profile-card p {
      margin-top: 4px;
      color: var(--color-ink-soft);
      font-size: 0.9rem;
    }

    .profile-card__avatar {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(220, 239, 253, 0.9), rgba(255, 241, 212, 0.9));
      color: var(--color-accent-strong);
      font-size: 1rem;
      font-weight: 800;
    }

    .nav-section {
      display: grid;
      gap: 8px;
    }

    .nav-section__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .nav-section__title {
      margin: 0;
      padding: 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-weight: 800;
      color: var(--color-ink-muted);
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 48px;
      padding: 0 14px;
      border-radius: 18px;
      color: var(--color-ink);
      text-decoration: none;
      transition: transform 150ms ease, background-color 150ms ease, color 150ms ease;
    }

    .nav-link mat-icon {
      color: var(--color-ink-soft);
    }

    .nav-link:hover {
      transform: translateX(2px);
      background: rgba(220, 239, 253, 0.42);
    }

    .nav-link--nested {
      padding-left: 18px;
    }

    .nav-link--active {
      background: linear-gradient(135deg, rgba(220, 239, 253, 0.92), rgba(255, 241, 212, 0.78));
      color: var(--color-accent-strong);
      box-shadow: inset 0 0 0 1px rgba(23, 76, 116, 0.08);
    }

    .nav-link--active mat-icon {
      color: var(--color-accent-strong);
    }

    .info-badge--active {
      background: rgba(194, 138, 46, 0.16);
      color: var(--color-warning);
    }

    .shell-content {
      background: transparent;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 24px;
      background: rgba(251, 250, 247, 0.82);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(23, 50, 77, 0.08);
      color: var(--color-ink);
    }

    .topbar__left,
    .topbar__right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .topbar__left {
      flex: 1 1 auto;
      min-width: 0;
    }

    .topbar__title-group {
      min-width: 0;
    }

    .topbar__left h2,
    .topbar__left p {
      margin: 0;
    }

    .topbar__eyebrow {
      margin-bottom: 4px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-weight: 800;
      color: var(--color-ink-muted);
    }

    .topbar__left h2 {
      font-size: 1.35rem;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topbar__user {
      color: var(--color-ink-soft);
      font-weight: 700;
    }

    .topbar__logout {
      white-space: nowrap;
      min-width: auto;
    }

    .content-area {
      padding: 28px;
      min-height: calc(100vh - 76px);
      overflow-x: clip;
    }

    .mobile-dock {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: 12px;
      z-index: 6;
      display: none;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border: 1px solid rgba(23, 50, 77, 0.1);
      border-radius: 24px;
      background: rgba(255, 253, 248, 0.92);
      box-shadow: 0 18px 40px rgba(15, 31, 48, 0.16);
      backdrop-filter: blur(16px);
    }

    .mobile-dock__link {
      display: grid;
      justify-items: center;
      gap: 4px;
      min-height: 58px;
      padding: 8px 6px;
      border-radius: 18px;
      text-decoration: none;
      color: var(--color-ink-soft);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
      min-width: 0;
    }

    .mobile-dock__link--button {
      width: 100%;
      border: 0;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }

    .mobile-dock__link mat-icon {
      color: inherit;
    }

    .mobile-dock__link--active {
      background: linear-gradient(135deg, rgba(220, 239, 253, 0.96), rgba(255, 241, 212, 0.82));
      color: var(--color-accent-strong);
    }

    @media (max-width: 960px) {
      .topbar {
        gap: 10px;
        padding: 10px 12px;
      }

      .topbar__left,
      .topbar__right {
        min-width: 0;
      }

      .topbar__left h2 {
        font-size: 1rem;
      }

      .topbar__eyebrow {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .topbar__right {
        gap: 8px;
      }

      .topbar__logout {
        padding-inline: 12px;
      }

      .desktop-chip {
        display: none;
      }

      .content-area {
        padding: 16px 14px 104px;
      }

      .mobile-dock {
        display: grid;
        left: 10px;
        right: 10px;
        bottom: max(10px, env(safe-area-inset-bottom));
        gap: 6px;
        padding: 6px;
        border-radius: 22px;
      }

      .mobile-dock__link {
        min-height: 54px;
        padding: 6px 4px;
      }
    }

    @media (max-width: 480px) {
      .topbar__logout-label {
        display: none;
      }

      .topbar__logout {
        padding-inline: 0;
        width: 42px;
        min-width: 42px;
      }

      .mobile-dock__link {
        font-size: 10px;
      }
    }
  `]
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly todayLabel = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short'
  }).format(new Date());

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
  readonly mobilePrimaryLinks = computed<MobileDockLink[]>(() => {
    if (this.auth.hasAnyRole(['Admin'])) {
      return [
        { label: 'Inicio', route: '/dashboard', icon: 'space_dashboard' },
        { label: 'Facturas', route: '/facturas', icon: 'receipt_long' },
        { label: 'Pendientes', route: '/pendientes-gestion', icon: 'assignment_turned_in' },
        { label: 'Mas', route: '/catalogos/proveedores', icon: 'apps' }
      ];
    }

    if (this.auth.hasAnyRole(['Gestor'])) {
      return [
        { label: 'Inicio', route: '/dashboard', icon: 'space_dashboard' },
        { label: 'Pendientes', route: '/pendientes-gestion', icon: 'assignment_turned_in' },
        { label: 'Catalogos', route: '/catalogos/proveedores', icon: 'apartment' },
        { label: 'Cuenta', route: '/dashboard', icon: 'person' }
      ];
    }

    if (this.auth.hasAnyRole(['Registrador'])) {
      return [
        { label: 'Inicio', route: '/dashboard', icon: 'space_dashboard' },
        { label: 'Registros', route: '/mis-registros', icon: 'inventory_2' },
        { label: 'Facturas', route: '/facturas', icon: 'receipt_long' },
        { label: 'Mas', route: '/catalogos/proveedores', icon: 'apps' }
      ];
    }

    return [
      { label: 'Inicio', route: '/dashboard', icon: 'space_dashboard' },
      { label: 'Catalogos', route: '/catalogos/proveedores', icon: 'apartment' },
      { label: 'Cuenta', route: '/dashboard', icon: 'person' },
      { label: 'Salir', icon: 'logout', action: 'logout' }
    ];
  });
  readonly activeTitle = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/mis-registros')) return 'Mis registros';
    if (url.startsWith('/pendientes-gestion')) return 'Pendientes por gestionar';
    if (url.startsWith('/facturas')) return 'Facturas';
    if (url.startsWith('/catalogos/proveedores')) return 'Catalogo de proveedores';
    if (url.startsWith('/catalogos/contratos')) return 'Catalogo de contratos';
    if (url.startsWith('/catalogos/entregables')) return 'Catalogo de entregables';
    if (url.startsWith('/admin/usuarios')) return 'Administracion de usuarios';
    return 'Dashboard operativo';
  });
  readonly userInitials = computed(() => {
    const fullName = this.auth.user()?.fullName?.trim();
    if (!fullName) {
      return 'TG';
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  });

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

  handleMobileDockAction(action: MobileDockLink['action']) {
    if (action === 'logout') {
      this.auth.logout();
    }
  }
}
