import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guards';
import { LoginPageComponent } from './pages/login-page.component';
import { ShellComponent } from './pages/shell.component';
import { InvoicesPageComponent } from './pages/invoices-page.component';
import { UsersPageComponent } from './pages/users-page.component';
import { MasterDataPageComponent } from './pages/master-data-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'mis-registros', component: InvoicesPageComponent, canActivate: [roleGuard(['Registrador', 'Admin'])], data: { scope: 'mine' } },
      { path: 'pendientes-gestion', component: InvoicesPageComponent, canActivate: [roleGuard(['Gestor', 'Admin'])], data: { scope: 'managed' } },
      { path: 'facturas', component: InvoicesPageComponent, canActivate: [roleGuard(['Registrador', 'Admin'])], data: { scope: 'all' } },
      { path: 'catalogos', component: MasterDataPageComponent },
      { path: 'admin/usuarios', component: UsersPageComponent, canActivate: [roleGuard(['Admin'])] }
    ]
  },
  { path: '**', redirectTo: '' }
];
