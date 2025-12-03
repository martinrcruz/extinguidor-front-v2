import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-client-selector',
  template: `
    <ion-item [ngClass]="{'invalid': isInvalid}">
      <ion-label position="stacked">{{ label }}</ion-label>
      <ion-input
        [placeholder]="placeholder"
        [(ngModel)]="searchText"
        (ionInput)="filterClients($event)"
        (click)="openModal()"
        [readonly]="true">
      </ion-input>
    </ion-item>

    <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ modalTitle }}</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeModal()">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar 
              placeholder="Buscar..." 
              [(ngModel)]="searchText"
              (ionInput)="filterClients($event)"
              animated="true"
              debounce="300">
            </ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <ion-list>
            <ion-item 
              button 
              *ngFor="let client of filteredClients" 
              (click)="selectClient(client)"
              detail="true">
              {{ client.name }} <span *ngIf="client.nifCif">({{ client.nifCif }})</span>
            </ion-item>
            <ion-item *ngIf="filteredClients.length === 0">
              <ion-label class="ion-text-center">No se encontraron clientes</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    ion-item {
      --background: var(--ion-color-light);
      --border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
      margin-bottom: 12px;
    }

    ion-input {
      --padding-start: 12px;
      --padding-end: 12px;
      --background: white;
      --border-radius: 4px;
      font-size: 0.9rem;
    }

    ion-searchbar {
      --box-shadow: none;
      --background: var(--ion-color-light);
      --border-radius: 8px;
      --placeholder-color: var(--ion-color-medium);
    }

    ion-modal ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      --min-height: 50px;
      cursor: pointer;
      margin-bottom: 0;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClientSelectorComponent implements OnInit {
  @Input() label: string = 'Cliente';
  @Input() placeholder: string = 'Seleccione un cliente';
  @Input() modalTitle: string = 'Seleccionar Cliente';
  @Input() clients: any[] = [];
  @Input() selectedClientId: string = '';
  @Input() isInvalid: boolean = false;

  @Output() clientSelected = new EventEmitter<any>();

  searchText: string = '';
  filteredClients: any[] = [];
  isModalOpen: boolean = false;

  ngOnInit() {
    this.filteredClients = [...this.clients];
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  filterClients(event: any) {
    const query = (event && event.detail ? event.detail.value : this.searchText) || '';

    if (query === '') {
      this.filteredClients = [...this.clients];
      return;
    }

    const normalizedQuery = query.toLowerCase();
    this.filteredClients = this.clients.filter(client => {
      return (
        client.name.toLowerCase().includes(normalizedQuery) ||
        (client.nifCif && client.nifCif.toLowerCase().includes(normalizedQuery)) ||
        (client.email && client.email.toLowerCase().includes(normalizedQuery))
      );
    });
  }

  selectClient(client: any) {
    this.searchText = client.name;
    this.selectedClientId = client._id;
    this.clientSelected.emit(client);
    this.closeModal();
  }
} 