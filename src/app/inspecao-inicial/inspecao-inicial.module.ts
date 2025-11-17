import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InspecaoInicialPageRoutingModule } from './inspecao-inicial-routing.module';

import { InspecaoInicialPage } from './inspecao-inicial.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InspecaoInicialPageRoutingModule
  ],
  declarations: [InspecaoInicialPage]
})
export class InspecaoInicialPageModule {}
