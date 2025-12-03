import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { WorkerGuard } from './guards/worker.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  // ---------------------------------
  // Rutas de autenticación
  // ---------------------------------
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module').then(m => m.AuthModule),
  },

  // ---------------------------------
  // Rutas protegidas (requieren AuthGuard)
  // ---------------------------------
  {
    path: 'worker-dashboard',
    loadChildren: () => import('./pages/worker-dashboard/worker-dashboard.module').then(m => m.WorkerDashboardModule),
    canActivate: [AuthGuard, WorkerGuard]
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/home.module').then(m => m.HomeModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'partes',
    loadChildren: () =>
      import('./pages/partes/partes.module').then(m => m.PartesModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'rutas',
    loadChildren: () =>
      import('./pages/rutas/rutas.module').then(m => m.RutasModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'facturacion',
    loadChildren: () =>
      import('./pages/facturacion/facturacion.module').then(m => m.FacturacionModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'usuarios',
    loadChildren: () =>
      import('./pages/usuarios/usuarios.module').then(m => m.UsuariosModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'calendario',
    loadChildren: () =>
      import('./pages/calendario/calendario.module').then(m => m.CalendarioModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'clientes',
    loadChildren: () =>
      import('./pages/clientes/clientes.module').then(m => m.ClientesModule),
    canActivate: [AuthGuard, AdminGuard]
  },

  // ---------------------------------
  // Módulos nuevos
  // ---------------------------------
  {
    path: 'contratos',
    loadChildren: () =>
      import('./pages/contratos/contratos.module').then(m => m.ContratosModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'materiales',
    loadChildren: () =>
      import('./pages/materiales/materiales.module').then(m => m.MaterialesModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'vehiculos',
    loadChildren: () =>
      import('./pages/vehiculos/vehiculos.module').then(m => m.VehiculosModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'herramientas',
    loadChildren: () =>
      import('./pages/herramientas/herramientas.module').then(m => m.HerramientasModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'zonas',
    loadChildren: () =>
      import('./pages/zonas/zonas.module').then(m => m.ZonasModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'articulos',
    loadChildren: () =>
      import('./pages/articulos/articulos.module').then(m => m.ArticulosModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'alertas',
    loadChildren: () =>
      import('./pages/alertas/alertas.module').then(m => m.AlertasModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard, AdminGuard]
  },

  // ---------------------------------
  // Ruta comodín
  // ---------------------------------
  {
    path: '**',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
