import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ObservacaoAdicionalPageRoutingModule } from './observacao-adicional-routing.module';

import { ObservacaoAdicionalPage } from './observacao-adicional.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ObservacaoAdicionalPageRoutingModule
  ],
  declarations: [ObservacaoAdicionalPage]
})
export class ObservacaoAdicionalPageModule {}
