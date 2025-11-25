import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DateLocalPipe } from '../../pipes/date-local.pipe';

@Component({
  selector: 'app-date-picker',
  template: `
    <ion-item>
      <ion-label>{{ label }}</ion-label>
      <ion-button fill="clear" (click)="openDatePicker()">
        <ion-icon name="calendar-outline" slot="start"></ion-icon>
        {{ selectedDate | dateLocal:'dd/MM/yyyy' }}
      </ion-button>
    </ion-item>

    <ion-modal [isOpen]="isOpen" (didDismiss)="closeDatePicker()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ label }}</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeDatePicker()">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-datetime
            [value]="selectedDate"
            (ionChange)="onDateChange($event)"
            presentation="date"
            [showDefaultButtons]="true"
            [preferWheel]="true"
            [firstDayOfWeek]="1"
            locale="es-ES">
          </ion-datetime>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    ion-item {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    ion-button {
      --padding-start: 8px;
      --padding-end: 8px;
      font-size: 0.9rem;
      height: 36px;
    }

    ion-datetime {
      width: 100%;
      max-width: 350px;
      margin: 0 auto;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, DateLocalPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DatePickerComponent {
  @Input() label: string = 'Fecha';
  @Input() selectedDate: string = new Date().toISOString();
  @Output() dateChange = new EventEmitter<string>();

  isOpen = false;

  openDatePicker() {
    this.isOpen = true;
  }

  closeDatePicker() {
    this.isOpen = false;
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    this.dateChange.emit(this.selectedDate);
    this.closeDatePicker();
  }
} 