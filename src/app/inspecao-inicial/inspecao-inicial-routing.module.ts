import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InspecaoInicialPage } from './inspecao-inicial.page';

const routes: Routes = [
  {
    path: '',
    component: InspecaoInicialPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InspecaoInicialPageRoutingModule {}
