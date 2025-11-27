import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { FormClienteComponent } from './form-cliente.component';
import { ClientesService } from '../../../services/clientes.service';
import { ZonasService } from '../../../services/zonas.service';

describe('FormClienteComponent', () => {
  let component: FormClienteComponent;
  let fixture: ComponentFixture<FormClienteComponent>;
  let clientesService: jasmine.SpyObj<ClientesService>;
  let zonasService: jasmine.SpyObj<ZonasService>;
  let router: jasmine.SpyObj<Router>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let loadingElement: any;
  let toastElement: any;

  const mockZonas = [
    { _id: '1', name: 'Zona Norte' },
    { _id: '2', name: 'Zona Sur' }
  ];

  const mockCliente = {
    _id: '123',
    name: 'Cliente Test',
    email: 'test@example.com',
    nifCif: '12345678A',
    phone: '123456789',
    address: 'Calle Test 123',
    zone: { _id: '1', name: 'Zona Norte' },
    code: 'CLI001',
    contactName: 'Contacto Test',
    MI: 100,
    tipo: 'Normal',
    photo: 'http://example.com/photo.jpg'
  };

  beforeEach(waitForAsync(() => {
    const clientesServiceSpy = jasmine.createSpyObj('ClientesService', ['getCustomerById', 'createCustomer', 'updateCustomer']);
    const zonasServiceSpy = jasmine.createSpyObj('ZonasService', ['getZones']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const loadingCtrlSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const toastCtrlSpy = jasmine.createSpyObj('ToastController', ['create']);

    loadingElement = jasmine.createSpyObj('Loading', ['present', 'dismiss']);
    toastElement = jasmine.createSpyObj('Toast', ['present']);

    loadingCtrlSpy.create.and.returnValue(Promise.resolve(loadingElement));
    toastCtrlSpy.create.and.returnValue(Promise.resolve(toastElement));

    TestBed.configureTestingModule({
      declarations: [ FormClienteComponent ],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        { provide: ClientesService, useValue: clientesServiceSpy },
        { provide: ZonasService, useValue: zonasServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoadingController, useValue: loadingCtrlSpy },
        { provide: ToastController, useValue: toastCtrlSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormClienteComponent);
    component = fixture.componentInstance;
    clientesService = TestBed.inject(ClientesService) as jasmine.SpyObj<ClientesService>;
    zonasService = TestBed.inject(ZonasService) as jasmine.SpyObj<ZonasService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;

    zonasService.getZones.and.returnValue(of({ ok: true, data: { zones: mockZonas } }));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con valores por defecto', () => {
    expect(component.clienteForm).toBeDefined();
    expect(component.isEdit).toBe(false);
    expect(component.customerId).toBeNull();
  });

  it('debería cargar las zonas al inicializar', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(zonasService.getZones).toHaveBeenCalled();
    expect(component.zonas.length).toBe(2);
  });

  it('debería validar campos requeridos', () => {
    expect(component.clienteForm.get('name')?.hasError('required')).toBeTruthy();
    expect(component.clienteForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.clienteForm.get('nifCif')?.hasError('required')).toBeTruthy();
  });

  it('debería validar formato de email', () => {
    component.clienteForm.patchValue({ email: 'email-invalido' });
    expect(component.clienteForm.get('email')?.hasError('email')).toBeTruthy();
    
    component.clienteForm.patchValue({ email: 'test@example.com' });
    expect(component.clienteForm.get('email')?.hasError('email')).toBeFalsy();
  });

  it('debería deshabilitar el botón de submit cuando el formulario es inválido', () => {
    fixture.detectChanges();
    const submitButton = fixture.nativeElement.querySelector('ion-button[type="submit"]');
    expect(submitButton.disabled).toBeTruthy();
  });

  it('debería crear un cliente cuando el formulario es válido y no está en modo edición', async () => {
    clientesService.createCustomer.and.returnValue(of({ ok: true, data: { customer: mockCliente } }));
    
    component.clienteForm.patchValue({
      name: 'Cliente Test',
      email: 'test@example.com',
      nifCif: '12345678A'
    });

    await component.guardar();

    expect(loadingController.create).toHaveBeenCalled();
    expect(loadingElement.present).toHaveBeenCalled();
    expect(clientesService.createCustomer).toHaveBeenCalled();
    expect(loadingElement.dismiss).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/clientes']);
  });

  it('debería actualizar un cliente cuando está en modo edición', async () => {
    component.isEdit = true;
    component.customerId = '123';
    clientesService.updateCustomer.and.returnValue(of({ ok: true, data: { customer: mockCliente } }));
    
    component.clienteForm.patchValue({
      name: 'Cliente Actualizado',
      email: 'updated@example.com',
      nifCif: '12345678A'
    });

    await component.guardar();

    expect(clientesService.updateCustomer).toHaveBeenCalledWith('123', jasmine.any(Object));
    expect(router.navigate).toHaveBeenCalledWith(['/clientes']);
  });

  it('debería cargar un cliente existente cuando hay un ID en la ruta', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    clientesService.getCustomerById.and.returnValue(of({
      ok: true,
      data: { customer: mockCliente }
    }));

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isEdit).toBe(true);
    expect(component.customerId).toBe('123');
    expect(clientesService.getCustomerById).toHaveBeenCalledWith('123');
    expect(component.clienteForm.get('name')?.value).toBe('Cliente Test');
    expect(component.clienteForm.get('email')?.value).toBe('test@example.com');
  });

  it('debería manejar errores al cargar cliente', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    clientesService.getCustomerById.and.returnValue(throwError(() => new Error('Error al cargar')));

    component.ngOnInit();
    await fixture.whenStable();

    expect(toastController.create).toHaveBeenCalled();
  });

  it('debería manejar errores al guardar cliente', async () => {
    clientesService.createCustomer.and.returnValue(throwError(() => new Error('Error al guardar')));
    
    component.clienteForm.patchValue({
      name: 'Cliente Test',
      email: 'test@example.com',
      nifCif: '12345678A'
    });

    await component.guardar();

    expect(toastController.create).toHaveBeenCalled();
    expect(loadingElement.dismiss).toHaveBeenCalled();
  });

  it('debería procesar la selección de archivo', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const event = {
      target: {
        files: [file]
      }
    };

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(file);
    expect(component.previewImage).toBeTruthy();
  });

  it('debería eliminar la imagen seleccionada', () => {
    component.selectedFile = new File(['test'], 'test.jpg');
    component.previewImage = 'data:image/jpeg;base64,test';

    component.removeImage();

    expect(component.selectedFile).toBeNull();
    expect(component.previewImage).toBeNull();
  });

  it('debería navegar a la lista de clientes al cancelar', () => {
    component.cancelar();
    expect(router.navigate).toHaveBeenCalledWith(['/clientes']);
  });

  it('no debería guardar si el formulario es inválido', async () => {
    component.clienteForm.patchValue({
      name: '', // Campo requerido vacío
      email: 'invalid-email'
    });

    await component.guardar();

    expect(clientesService.createCustomer).not.toHaveBeenCalled();
    expect(clientesService.updateCustomer).not.toHaveBeenCalled();
  });
});
