import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChecklistCompletoPage } from './checklist-completo.page';

const routes: Routes = [
  {
    path: '',
    component: ChecklistCompletoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChecklistCompletoPageRoutingModule {}
