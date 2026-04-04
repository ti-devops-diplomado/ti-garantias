import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: '',
    loadComponent: () => import('./pages/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-page.component').then(m => m.DashboardPageComponent)
      },
      {
        path: 'mis-registros',
        loadComponent: () => import('./pages/invoices-page.component').then(m => m.InvoicesPageComponent),
        canActivate: [roleGuard(['Registrador', 'Admin'])],
        data: { scope: 'mine' }
      },
      {
        path: 'pendientes-gestion',
        loadComponent: () => import('./pages/invoices-page.component').then(m => m.InvoicesPageComponent),
        canActivate: [roleGuard(['Gestor', 'Admin'])],
        data: { scope: 'managed' }
      },
      {
        path: 'facturas',
        loadComponent: () => import('./pages/invoices-page.component').then(m => m.InvoicesPageComponent),
        canActivate: [roleGuard(['Registrador', 'Admin'])],
        data: { scope: 'all' }
      },
      {
        path: 'catalogos',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'proveedores' },
          {
            path: 'proveedores',
            loadComponent: () => import('./pages/suppliers-catalog-page.component').then(m => m.SuppliersCatalogPageComponent)
          },
          {
            path: 'contratos',
            loadComponent: () => import('./pages/contracts-catalog-page.component').then(m => m.ContractsCatalogPageComponent)
          },
          {
            path: 'entregables',
            loadComponent: () => import('./pages/deliverables-catalog-page.component').then(m => m.DeliverablesCatalogPageComponent)
          }
        ]
      },
      {
        path: 'admin/usuarios',
        loadComponent: () => import('./pages/users-page.component').then(m => m.UsersPageComponent),
        canActivate: [roleGuard(['Admin'])]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
