import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'inspecao-veiculo',
    loadChildren: () => import('./inspecao-veiculo/inspecao-veiculo.module').then( m => m.InspecaoVeiculoPageModule)
  },
  {
    path: 'fotos-veiculo',
    loadChildren: () => import('./fotos-veiculo/fotos-veiculo.module').then( m => m.FotosVeiculoPageModule)
  },
  {
    path: 'pneus',
    loadChildren: () => import('./pneus/pneus.module').then( m => m.PneusPageModule)
  },
  {
    path: 'historico',
    loadChildren: () => import('./historico/historico.module').then( m => m.HistoricoPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'teste',
    loadChildren: () => import('./teste/teste.module').then( m => m.TestePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
