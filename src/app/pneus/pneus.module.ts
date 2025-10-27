import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PneusPageRoutingModule } from './pneus-routing.module';

import { PneusPage } from './pneus.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PneusPageRoutingModule
  ],
  declarations: [PneusPage]
})
export class PneusPageModule {}
