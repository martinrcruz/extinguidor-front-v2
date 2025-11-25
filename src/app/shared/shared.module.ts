import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { FormValidationDirective } from './directives/form-validation.directive';
import { ClientSelectorComponent } from './components/client-selector/client-selector.component';
import { DateLocalPipe } from './pipes/date-local.pipe';

@NgModule({
  declarations: [
    FormValidationDirective
  ],
  imports: [
    CommonModule,
    IonicModule,
    DatePickerComponent,
    ClientSelectorComponent,
    DateLocalPipe
  ],
  exports: [
    CommonModule,
    IonicModule,
    DatePickerComponent,
    ClientSelectorComponent,
    FormValidationDirective,
    DateLocalPipe
  ]
})
export class SharedModule { }
