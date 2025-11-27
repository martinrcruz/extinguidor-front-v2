import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { of } from 'rxjs';

import { FormContratoComponent } from './form-contrato.component';
import { ContratoService } from '../../../services/contrato.service';
import { ClientesService } from '../../../services/clientes.service';

describe('FormContratoComponent', () => {
  let component: FormContratoComponent;
  let fixture: ComponentFixture<FormContratoComponent>;
  let contratoService: jasmine.SpyObj<ContratoService>;
  let clientesService: jasmine.SpyObj<ClientesService>;
  let navController: jasmine.SpyObj<NavController>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let alertController: jasmine.SpyObj<AlertController>;

  const mockClientes = [
    { _id: 'c1', name: 'Cliente 1', email: 'cliente1@test.com', nifCif: '12345678A', phone: '123456789', address: 'Dirección 1' },
    { _id: 'c2', name: 'Cliente 2', email: 'cliente2@test.com', nifCif: '87654321B', phone: '987654321', address: 'Dirección 2' }
  ];

  beforeEach(waitForAsync(() => {
    const contratoServiceSpy = jasmine.createSpyObj('ContratoService', ['getContractById', 'createContract', 'updateContract']);
    const clientesServiceSpy = jasmine.createSpyObj('ClientesService', ['getCustomers']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateRoot', 'navigateBack']);
    const loadingCtrlSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const toastCtrlSpy = jasmine.createSpyObj('ToastController', ['create']);
    const alertCtrlSpy = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      declarations: [ FormContratoComponent ],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        { provide: ContratoService, useValue: contratoServiceSpy },
        { provide: ClientesService, useValue: clientesServiceSpy },
        { provide: NavController, useValue: navControllerSpy },
        { provide: LoadingController, useValue: loadingCtrlSpy },
        { provide: ToastController, useValue: toastCtrlSpy },
        { provide: AlertController, useValue: alertCtrlSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormContratoComponent);
    component = fixture.componentInstance;
    contratoService = TestBed.inject(ContratoService) as jasmine.SpyObj<ContratoService>;
    clientesService = TestBed.inject(ClientesService) as jasmine.SpyObj<ClientesService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;

    clientesService.getCustomers.and.returnValue(of({ ok: true, data: { customers: mockClientes } }));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con valores por defecto', () => {
    expect(component.contractForm).toBeDefined();
    expect(component.isEdit).toBe(false);
    expect(component.contractId).toBeNull();
  });

  it('debería validar campos requeridos', () => {
    expect(component.contractForm.get('code')?.hasError('required')).toBeTruthy();
    expect(component.contractForm.get('customerId')?.hasError('required')).toBeTruthy();
    expect(component.contractForm.get('name')?.hasError('required')).toBeTruthy();
    expect(component.contractForm.get('startDate')?.hasError('required')).toBeTruthy();
    expect(component.contractForm.get('endDate')?.hasError('required')).toBeTruthy();
  });

  it('debería cargar clientes al inicializar', () => {
    component.ngOnInit();
    
    expect(clientesService.getCustomers).toHaveBeenCalled();
    expect(component.clientes.length).toBe(2);
  });

  it('debería crear un contrato cuando el formulario es válido y no está en modo edición', async () => {
    contratoService.createContract.and.returnValue(of({ ok: true }));
    
    component.contractForm.patchValue({
      code: 'CON001',
      customerId: 'c1',
      name: 'Contrato Test',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      type: 'F'
    });

    await component.guardar();

    expect(contratoService.createContract).toHaveBeenCalled();
    expect(navController.navigateRoot).toHaveBeenCalledWith('/contratos');
  });

  it('debería actualizar un contrato cuando está en modo edición', async () => {
    component.isEdit = true;
    component.contractId = '123';
    contratoService.updateContract.and.returnValue(of({ ok: true }));
    
    component.contractForm.patchValue({
      code: 'CON001',
      customerId: 'c1',
      name: 'Contrato Actualizado',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      type: 'E'
    });

    await component.guardar();

    expect(contratoService.updateContract).toHaveBeenCalledWith('123', jasmine.objectContaining({
      _id: '123',
      code: 'CON001'
    }));
    expect(navController.navigateRoot).toHaveBeenCalledWith('/contratos');
  });

  it('no debería guardar si el formulario es inválido', async () => {
    component.contractForm.patchValue({
      code: '', // Campo requerido vacío
      customerId: ''
    });

    await component.guardar();

    expect(contratoService.createContract).not.toHaveBeenCalled();
    expect(contratoService.updateContract).not.toHaveBeenCalled();
  });

  it('debería cargar un contrato existente cuando hay un ID en la ruta', () => {
    const route = TestBed.inject(ActivatedRoute);
    route.snapshot.paramMap.get = (key: string) => key === 'id' ? '123' : null;
    
    const mockContrato = {
      _id: '123',
      code: 'CON001',
      customerId: 'c1',
      name: 'Contrato Test',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      type: 'F',
      averageTime: 60,
      delegation: 'Delegación Test',
      revisionFrequency: 'Mensual',
      address: 'Dirección Test',
      zone: 'z1',
      total: 10000
    };

    contratoService.getContractById.and.returnValue(of({ data: mockContrato }));

    component.ngOnInit();

    expect(component.isEdit).toBe(true);
    expect(component.contractId).toBe('123');
    expect(contratoService.getContractById).toHaveBeenCalledWith('123');
  });

  it('debería actualizar el formulario cuando se selecciona un cliente', () => {
    const cliente = mockClientes[0];
    
    component.onClientSelected(cliente);
    
    expect(component.contractForm.get('customerId')?.value).toBe('c1');
    expect(component.contractForm.get('customerId')?.dirty).toBeTruthy();
  });

  it('debería navegar hacia atrás al cancelar', () => {
    component.cancel();
    expect(navController.navigateBack).toHaveBeenCalledWith('/contratos');
  });
});
