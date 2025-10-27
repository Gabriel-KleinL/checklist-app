import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InspecaoVeiculoPageRoutingModule } from './inspecao-veiculo-routing.module';

import { InspecaoVeiculoPage } from './inspecao-veiculo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InspecaoVeiculoPageRoutingModule
  ],
  declarations: [InspecaoVeiculoPage]
})
export class InspecaoVeiculoPageModule {}
