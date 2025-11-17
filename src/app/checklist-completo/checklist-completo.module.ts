import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChecklistCompletoPageRoutingModule } from './checklist-completo-routing.module';

import { ChecklistCompletoPage } from './checklist-completo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChecklistCompletoPageRoutingModule
  ],
  declarations: [ChecklistCompletoPage]
})
export class ChecklistCompletoPageModule {}
