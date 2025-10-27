import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PneusPage } from './pneus.page';

const routes: Routes = [
  {
    path: '',
    component: PneusPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PneusPageRoutingModule {}
