import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InspecaoVeiculoPage } from './inspecao-veiculo.page';

const routes: Routes = [
  {
    path: '',
    component: InspecaoVeiculoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InspecaoVeiculoPageRoutingModule {}
