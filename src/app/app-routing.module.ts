import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'login',
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
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then( m => m.AdminPageModule)
  },
  {
    path: 'checklist-completo',
    loadChildren: () => import('./checklist-completo/checklist-completo.module').then( m => m.ChecklistCompletoPageModule)
  },
  {
    path: 'inspecao-inicial',
    loadChildren: () => import('./inspecao-inicial/inspecao-inicial.module').then( m => m.InspecaoInicialPageModule)
  },
  {
    path: 'observacao-adicional',
    loadChildren: () => import('./observacao-adicional/observacao-adicional.module').then( m => m.ObservacaoAdicionalPageModule)
  },
  {
    path: 'test',
    loadChildren: () => import('./test/test.module').then( m => m.TestPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
