import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FotosVeiculoPageRoutingModule } from './fotos-veiculo-routing.module';

import { FotosVeiculoPage } from './fotos-veiculo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FotosVeiculoPageRoutingModule
  ],
  declarations: [FotosVeiculoPage]
})
export class FotosVeiculoPageModule {}
