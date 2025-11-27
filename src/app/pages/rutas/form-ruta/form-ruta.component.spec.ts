import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { of } from 'rxjs';

import { FormRutaComponent } from './form-ruta.component';
import { RutasService } from '../../../services/rutas.service';
import { UserService } from '../../../services/user.service';
import { VehiculosService } from '../../../services/vehiculos.service';
import { CustomerService } from '../../../services/customer.service';

describe('FormRutaComponent', () => {
  let component: FormRutaComponent;
  let fixture: ComponentFixture<FormRutaComponent>;
  let rutasService: jasmine.SpyObj<RutasService>;
  let userService: jasmine.SpyObj<UserService>;
  let vehiculosService: jasmine.SpyObj<VehiculosService>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let navController: jasmine.SpyObj<NavController>;

  const mockUsers = [
    { _id: '1', name: 'Usuario 1', email: 'user1@test.com' },
    { _id: '2', name: 'Usuario 2', email: 'user2@test.com' }
  ];

  const mockRutasN = [
    { _id: 'rn1', name: 'Ruta N 1' },
    { _id: 'rn2', name: 'Ruta N 2' }
  ];

  const mockVehicles = [
    { _id: 'v1', name: 'Vehículo 1' },
    { _id: 'v2', name: 'Vehículo 2' }
  ];

  const mockClientes = [
    { _id: 'c1', name: 'Cliente 1' },
    { _id: 'c2', name: 'Cliente 2' }
  ];

  beforeEach(waitForAsync(() => {
    const rutasServiceSpy = jasmine.createSpyObj('RutasService', ['getRutasN', 'getRutaById', 'createRuta', 'updateRuta']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers']);
    const vehiculosServiceSpy = jasmine.createSpyObj('VehiculosService', ['getVehicles']);
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getCustomers']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateRoot', 'back']);

    TestBed.configureTestingModule({
      declarations: [ FormRutaComponent ],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        { provide: RutasService, useValue: rutasServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: VehiculosService, useValue: vehiculosServiceSpy },
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: NavController, useValue: navControllerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormRutaComponent);
    component = fixture.componentInstance;
    rutasService = TestBed.inject(RutasService) as jasmine.SpyObj<RutasService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    vehiculosService = TestBed.inject(VehiculosService) as jasmine.SpyObj<VehiculosService>;
    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;

    // Configurar mocks por defecto
    userService.getAllUsers.and.returnValue(Promise.resolve(of({ ok: true, data: { users: mockUsers } })));
    rutasService.getRutasN.and.returnValue(of({ ok: true, rutas: mockRutasN }));
    vehiculosService.getVehicles.and.returnValue(of({ ok: true, data: mockVehicles }));
    customerService.getCustomers.and.returnValue(of({ customers: mockClientes }));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con valores por defecto', () => {
    expect(component.rutaForm).toBeDefined();
    expect(component.isEdit).toBe(false);
    expect(component.rutaId).toBeNull();
  });

  it('debería validar campos requeridos', () => {
    expect(component.rutaForm.get('name')?.hasError('required')).toBeTruthy();
    expect(component.rutaForm.get('date')?.hasError('required')).toBeTruthy();
    expect(component.rutaForm.get('encargado')?.hasError('required')).toBeTruthy();
  });

  it('debería cargar usuarios al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(userService.getAllUsers).toHaveBeenCalled();
    expect(component.users.length).toBe(2);
  });

  it('debería cargar rutas N, vehículos y clientes al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(rutasService.getRutasN).toHaveBeenCalled();
    expect(vehiculosService.getVehicles).toHaveBeenCalled();
    expect(customerService.getCustomers).toHaveBeenCalled();
  });

  it('debería crear una ruta cuando el formulario es válido y no está en modo edición', async () => {
    rutasService.createRuta.and.returnValue(Promise.resolve(of({ ok: true })));
    
    component.rutaForm.patchValue({
      name: 'Ruta Test',
      date: '2024-01-01',
      encargado: '1',
      state: 'Pendiente'
    });

    await component.onSave();

    expect(rutasService.createRuta).toHaveBeenCalled();
    expect(navController.navigateRoot).toHaveBeenCalledWith('/rutas');
  });

  it('debería actualizar una ruta cuando está en modo edición', async () => {
    component.isEdit = true;
    component.rutaId = '123';
    rutasService.updateRuta.and.returnValue(Promise.resolve(of({ ok: true })));
    
    component.rutaForm.patchValue({
      name: 'Ruta Actualizada',
      date: '2024-01-01',
      encargado: '1',
      state: 'EnProceso'
    });

    await component.onSave();

    expect(rutasService.updateRuta).toHaveBeenCalled();
    expect(navController.navigateRoot).toHaveBeenCalledWith('/rutas');
  });

  it('no debería guardar si el formulario es inválido', async () => {
    component.rutaForm.patchValue({
      name: '', // Campo requerido vacío
      date: ''
    });

    await component.onSave();

    expect(rutasService.createRuta).not.toHaveBeenCalled();
    expect(rutasService.updateRuta).not.toHaveBeenCalled();
  });

  it('no debería guardar si no hay encargado', async () => {
    component.rutaForm.patchValue({
      name: 'Ruta Test',
      date: '2024-01-01',
      encargado: ''
    });

    await component.onSave();

    expect(rutasService.createRuta).not.toHaveBeenCalled();
  });

  it('debería cargar una ruta existente cuando hay un ID en la ruta', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    const mockRuta = {
      _id: '123',
      name: { _id: 'rn1', name: 'Ruta N 1' },
      date: '2024-01-01',
      encargado: { _id: '1', name: 'Usuario 1' },
      state: 'Pendiente',
      vehicle: { _id: 'v1' },
      users: [{ _id: '1' }, { _id: '2' }],
      comentarios: 'Comentarios test',
      herramientas: []
    };

    rutasService.getRutaById.and.returnValue(Promise.resolve(of({ ok: true, ruta: mockRuta })));

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isEdit).toBe(true);
    expect(component.rutaId).toBe('123');
    expect(rutasService.getRutaById).toHaveBeenCalledWith('123');
  });

  it('debería navegar hacia atrás al cancelar', () => {
    component.cancel();
    expect(navController.back).toHaveBeenCalled();
  });
});
