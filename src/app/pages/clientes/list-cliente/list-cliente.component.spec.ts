import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { ListClienteComponent } from './list-cliente.component';
import { ClientesService } from '../../../services/clientes.service';
import { ZonasService } from '../../../services/zonas.service';

describe('ListClienteComponent', () => {
  let component: ListClienteComponent;
  let fixture: ComponentFixture<ListClienteComponent>;
  let clientesService: jasmine.SpyObj<ClientesService>;
  let zonasService: jasmine.SpyObj<ZonasService>;
  let router: jasmine.SpyObj<Router>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let loadingElement: any;
  let toastElement: any;

  const mockClientes = [
    { _id: '1', name: 'Cliente 1', email: 'cliente1@test.com', nifCif: '12345678A', phone: '123456789', address: 'Dirección 1', tipo: 'Normal', zone: { _id: 'z1', name: 'Zona Norte' } },
    { _id: '2', name: 'Cliente 2', email: 'cliente2@test.com', nifCif: '87654321B', phone: '987654321', address: 'Dirección 2', tipo: 'Especial', zone: { _id: 'z2', name: 'Zona Sur' } }
  ];

  const mockZonas = [
    { _id: 'z1', name: 'Zona Norte' },
    { _id: 'z2', name: 'Zona Sur' }
  ];

  beforeEach(waitForAsync(() => {
    const clientesServiceSpy = jasmine.createSpyObj('ClientesService', ['getCustomers', 'deleteCustomer']);
    const zonasServiceSpy = jasmine.createSpyObj('ZonasService', ['getZones']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const loadingCtrlSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const toastCtrlSpy = jasmine.createSpyObj('ToastController', ['create']);

    loadingElement = jasmine.createSpyObj('Loading', ['present', 'dismiss']);
    toastElement = jasmine.createSpyObj('Toast', ['present']);

    loadingCtrlSpy.create.and.returnValue(Promise.resolve(loadingElement));
    toastCtrlSpy.create.and.returnValue(Promise.resolve(toastElement));

    TestBed.configureTestingModule({
      declarations: [ ListClienteComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ClientesService, useValue: clientesServiceSpy },
        { provide: ZonasService, useValue: zonasServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoadingController, useValue: loadingCtrlSpy },
        { provide: ToastController, useValue: toastCtrlSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListClienteComponent);
    component = fixture.componentInstance;
    clientesService = TestBed.inject(ClientesService) as jasmine.SpyObj<ClientesService>;
    zonasService = TestBed.inject(ZonasService) as jasmine.SpyObj<ZonasService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;

    clientesService.getCustomers.and.returnValue(of({ ok: true, data: { customers: mockClientes } }));
    zonasService.getZones.and.returnValue(of({ ok: true, data: { zones: mockZonas } }));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar clientes al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(clientesService.getCustomers).toHaveBeenCalled();
    expect(component.clientes.length).toBe(2);
  });

  it('debería cargar zonas al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(zonasService.getZones).toHaveBeenCalled();
    expect(component.zonas.length).toBe(2);
  });

  it('debería filtrar clientes por texto de búsqueda', () => {
    component.clientes = mockClientes;
    component.filteredClientes = [...mockClientes];
    component.searchText = 'Cliente 1';
    
    component.filterCustomers();
    
    expect(component.filteredClientes.length).toBe(1);
    expect(component.filteredClientes[0].name).toBe('Cliente 1');
  });

  it('debería filtrar clientes por zona', () => {
    component.clientes = mockClientes;
    component.filteredClientes = [...mockClientes];
    component.selectedZone = 'z1';
    
    component.filterCustomers();
    
    expect(component.filteredClientes.length).toBe(1);
    expect(component.filteredClientes[0].zone?._id).toBe('z1');
  });

  it('debería filtrar clientes por tipo', () => {
    component.clientes = mockClientes;
    component.filteredClientes = [...mockClientes];
    component.selectedType = 'Especial';
    
    component.filterCustomers();
    
    expect(component.filteredClientes.length).toBe(1);
    expect(component.filteredClientes[0].tipo).toBe('Especial');
  });

  it('debería aplicar paginación correctamente', () => {
    component.clientes = Array.from({ length: 20 }, (_, i) => ({
      _id: `${i}`,
      name: `Cliente ${i}`,
      email: `cliente${i}@test.com`,
      nifCif: `${i}`,
      phone: `12345678${i}`,
      address: `Dirección ${i}`,
      tipo: 'Normal',
      zone: { _id: 'z1', name: 'Zona' }
    }));
    component.filteredClientes = [...component.clientes];
    component.pageSize = 8;
    
    component.applyPagination();
    
    expect(component.totalPages).toBe(3);
    expect(component.paginatedClientes.length).toBe(8);
  });

  it('debería navegar a la siguiente página', () => {
    component.currentPage = 1;
    component.totalPages = 3;
    component.filteredClientes = Array.from({ length: 20 }, (_, i) => ({
      _id: `${i}`,
      name: `Cliente ${i}`,
      email: `cliente${i}@test.com`,
      nifCif: `${i}`,
      phone: `12345678${i}`,
      address: `Dirección ${i}`,
      tipo: 'Normal',
      zone: { _id: 'z1', name: 'Zona' }
    }));
    
    component.nextPage();
    
    expect(component.currentPage).toBe(2);
  });

  it('debería navegar a la página anterior', () => {
    component.currentPage = 2;
    component.totalPages = 3;
    component.filteredClientes = Array.from({ length: 20 }, (_, i) => ({
      _id: `${i}`,
      name: `Cliente ${i}`,
      email: `cliente${i}@test.com`,
      nifCif: `${i}`,
      phone: `12345678${i}`,
      address: `Dirección ${i}`,
      tipo: 'Normal',
      zone: { _id: 'z1', name: 'Zona' }
    }));
    
    component.prevPage();
    
    expect(component.currentPage).toBe(1);
  });

  it('debería navegar al formulario de nuevo cliente', () => {
    component.nuevoCliente();
    expect(router.navigate).toHaveBeenCalledWith(['/clientes/create']);
  });

  it('debería navegar al formulario de editar cliente', () => {
    component.editarCliente('123');
    expect(router.navigate).toHaveBeenCalledWith(['/clientes/edit', '123']);
  });

  it('debería eliminar un cliente correctamente', async () => {
    component.clientes = mockClientes;
    component.filteredClientes = [...mockClientes];
    clientesService.deleteCustomer.and.returnValue(of({ ok: true }));
    
    // Simular confirmación del toast
    const confirmToast = jasmine.createSpyObj('Toast', ['present', 'onDidDismiss']);
    confirmToast.onDidDismiss.and.returnValue(Promise.resolve({ role: 'confirm' }));
    toastController.create.and.returnValue(Promise.resolve(confirmToast));
    
    await component.eliminarCliente('1');
    
    expect(clientesService.deleteCustomer).toHaveBeenCalledWith('1');
    expect(component.clientes.length).toBe(1);
  });

  it('debería manejar errores al cargar clientes', async () => {
    clientesService.getCustomers.and.returnValue(throwError(() => new Error('Error al cargar')));
    
    await component.cargarClientes();
    
    expect(component.errorMessage).toBeTruthy();
    expect(toastController.create).toHaveBeenCalled();
  });

  it('debería recargar clientes cuando se entra a la vista', async () => {
    component.ionViewDidEnter();
    await fixture.whenStable();
    
    expect(clientesService.getCustomers).toHaveBeenCalled();
  });
});
