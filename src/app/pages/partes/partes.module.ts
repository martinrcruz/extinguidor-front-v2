import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonDatetime, IonicModule } from '@ionic/angular';
import { PartesRoutingModule } from './partes-routing.module';
import { ListParteComponent } from './list-parte/list-parte.component';
import { FormParteComponent } from './form-parte/form-parte.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PartesTabsComponent } from './partes-tabs/partes-tabs.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [ListParteComponent, FormParteComponent, PartesTabsComponent],
  imports: [
    CommonModule,
    IonicModule,
    PartesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  exports: []
})
export class PartesModule { }
