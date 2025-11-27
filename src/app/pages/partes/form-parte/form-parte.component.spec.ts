import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { FormParteComponent } from './form-parte.component';
import { PartesService } from '../../../services/partes.service';
import { RutasService } from '../../../services/rutas.service';
import { CustomerService } from '../../../services/customer.service';
import { ArticuloService } from '../../../services/articulo.service';

describe('FormParteComponent', () => {
  let component: FormParteComponent;
  let fixture: ComponentFixture<FormParteComponent>;
  let partesService: jasmine.SpyObj<PartesService>;
  let rutasService: jasmine.SpyObj<RutasService>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let articuloService: jasmine.SpyObj<ArticuloService>;
  let navController: jasmine.SpyObj<NavController>;

  const mockArticulo = {
    _id: 'art1',
    codigo: 'ART001',
    grupo: 'Grupo1',
    familia: 'Familia1',
    descripcionArticulo: 'Artículo Test',
    precioVenta: 100
  };

  const mockCustomer = {
    _id: 'cust1',
    name: 'Cliente Test',
    email: 'cliente@test.com'
  };

  const mockRuta = {
    _id: 'ruta1',
    name: 'Ruta Test'
  };

  beforeEach(waitForAsync(() => {
    const partesServiceSpy = jasmine.createSpyObj('PartesService', ['getParteById', 'createParte', 'updateParte']);
    const rutasServiceSpy = jasmine.createSpyObj('RutasService', ['getRutasDisponibles']);
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getCustomers']);
    const articuloServiceSpy = jasmine.createSpyObj('ArticuloService', ['getArticulos']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateBack', 'navigateRoot']);

    TestBed.configureTestingModule({
      declarations: [ FormParteComponent ],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        { provide: PartesService, useValue: partesServiceSpy },
        { provide: RutasService, useValue: rutasServiceSpy },
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: ArticuloService, useValue: articuloServiceSpy },
        { provide: NavController, useValue: navControllerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormParteComponent);
    component = fixture.componentInstance;
    partesService = TestBed.inject(PartesService) as jasmine.SpyObj<PartesService>;
    rutasService = TestBed.inject(RutasService) as jasmine.SpyObj<RutasService>;
    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    articuloService = TestBed.inject(ArticuloService) as jasmine.SpyObj<ArticuloService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;

    // Configurar mocks por defecto
    customerService.getCustomers.and.returnValue(of({ ok: true, data: { customers: [mockCustomer] } }));
    rutasService.getRutasDisponibles.and.returnValue(of({ ok: true, rutas: [mockRuta] }));
    articuloService.getArticulos.and.returnValue(of({ ok: true, articulos: [mockArticulo], pagination: {} }));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con valores por defecto', () => {
    expect(component.parteForm).toBeDefined();
    expect(component.isEdit).toBe(false);
    expect(component.parteId).toBeNull();
  });

  it('debería validar campos requeridos', () => {
    expect(component.parteForm.get('title')?.hasError('required')).toBeTruthy();
    expect(component.parteForm.get('description')?.hasError('required')).toBeTruthy();
    expect(component.parteForm.get('address')?.hasError('required')).toBeTruthy();
    expect(component.parteForm.get('date')?.hasError('required')).toBeTruthy();
    expect(component.parteForm.get('customer')?.hasError('required')).toBeTruthy();
  });

  it('debería cargar clientes al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(customerService.getCustomers).toHaveBeenCalled();
  });

  it('debería cargar artículos al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(articuloService.getArticulos).toHaveBeenCalled();
  });

  it('debería agregar un artículo al formulario', () => {
    const initialLength = component.articulosFormArray.length;
    component.agregarArticuloExistente(mockArticulo);
    
    expect(component.articulosFormArray.length).toBe(initialLength + 1);
    const addedArticulo = component.articulosFormArray.at(component.articulosFormArray.length - 1);
    expect(addedArticulo.get('codigo')?.value).toBe('ART001');
    expect(addedArticulo.get('descripcionArticulo')?.value).toBe('Artículo Test');
  });

  it('debería eliminar un artículo del formulario', () => {
    component.agregarArticuloExistente(mockArticulo);
    const initialLength = component.articulosFormArray.length;
    
    component.eliminarArticulo(0);
    
    expect(component.articulosFormArray.length).toBe(initialLength - 1);
  });

  it('debería crear un parte cuando el formulario es válido y no está en modo edición', async () => {
    partesService.createParte.and.returnValue(Promise.resolve(of({ ok: true, data: { parte: { _id: '123' } } })));
    
    component.parteForm.patchValue({
      title: 'Parte Test',
      description: 'Descripción test',
      address: 'Dirección test',
      date: '2024-01-01',
      customer: 'cust1',
      state: 'Pendiente',
      type: 'Mantenimiento',
      categoria: 'Extintores'
    });

    await component.guardar();

    expect(partesService.createParte).toHaveBeenCalled();
  });

  it('debería actualizar un parte cuando está en modo edición', async () => {
    component.isEdit = true;
    component.parteId = '123';
    partesService.updateParte.and.returnValue(Promise.resolve(of({ ok: true, data: { parte: { _id: '123' } } })));
    
    component.parteForm.patchValue({
      title: 'Parte Actualizado',
      description: 'Descripción actualizada',
      address: 'Dirección actualizada',
      date: '2024-01-01',
      customer: 'cust1',
      state: 'EnProceso',
      type: 'Mantenimiento',
      categoria: 'Extintores'
    });

    await component.guardar();

    expect(partesService.updateParte).toHaveBeenCalled();
  });

  it('no debería guardar si el formulario es inválido', async () => {
    component.parteForm.patchValue({
      title: '', // Campo requerido vacío
      description: ''
    });

    await component.guardar();

    expect(partesService.createParte).not.toHaveBeenCalled();
    expect(partesService.updateParte).not.toHaveBeenCalled();
  });

  it('debería cargar rutas cuando cambia la fecha', async () => {
    component.parteForm.patchValue({ date: '2024-01-15' });
    await fixture.whenStable();
    
    // El listener debería dispararse
    expect(rutasService.getRutasDisponibles).toHaveBeenCalled();
  });

  it('debería cargar un parte existente cuando hay un ID en la ruta', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    const mockParte = {
      _id: '123',
      title: 'Parte Test',
      description: 'Descripción',
      address: 'Dirección',
      date: '2024-01-01',
      customer: mockCustomer,
      state: 'Pendiente',
      type: 'Mantenimiento',
      categoria: 'Extintores',
      articulos: []
    };

    partesService.getParteById.and.returnValue(Promise.resolve(of(mockParte)));

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isEdit).toBe(true);
    expect(component.parteId).toBe('123');
    expect(partesService.getParteById).toHaveBeenCalledWith('123');
  });

  it('debería filtrar clientes por texto de búsqueda', () => {
    component.customersList = [mockCustomer, { _id: 'cust2', name: 'Otro Cliente', email: 'otro@test.com' }];
    component.filteredCustomers = [...component.customersList];
    
    component.searchClientTxt = 'Test';
    component.filterCustomers();
    
    expect(component.filteredCustomers.length).toBeGreaterThan(0);
  });

  it('debería abrir y cerrar el modal de artículos', () => {
    expect(component.articulosModalOpen).toBe(false);
    
    component.openArticulosModal();
    expect(component.articulosModalOpen).toBe(true);
    
    component.closeArticulosModal();
    expect(component.articulosModalOpen).toBe(false);
  });

  it('debería seleccionar un artículo del modal', () => {
    component.articulosSeleccionados = [];
    component.selectArticulo(mockArticulo);
    
    expect(component.articulosSeleccionados.length).toBe(1);
    expect(component.articulosSeleccionados[0]).toBe(mockArticulo);
  });

  it('debería eliminar un artículo seleccionado', () => {
    component.articulosSeleccionados = [mockArticulo];
    component.removeSelectedArticulo(0);
    
    expect(component.articulosSeleccionados.length).toBe(0);
  });
});
