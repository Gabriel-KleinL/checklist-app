import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ObservacaoAdicionalPage } from './observacao-adicional.page';

const routes: Routes = [
  {
    path: '',
    component: ObservacaoAdicionalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ObservacaoAdicionalPageRoutingModule {}
