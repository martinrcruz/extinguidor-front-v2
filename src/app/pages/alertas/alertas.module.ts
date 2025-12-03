import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListAlertaComponent } from './list-alerta/list-alerta.component';
import { FormAlertaComponent } from './form-alerta/form-alerta.component';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [ListAlertaComponent, FormAlertaComponent],
  imports: [
    SharedModule,
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class AlertasModule { }
