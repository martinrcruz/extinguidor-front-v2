import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { of } from 'rxjs';

import { FormFacturacionComponent } from './form-facturacion.component';
import { FacturacionService } from '../../../services/facturacion.service';
import { RutasService } from '../../../services/rutas.service';
import { PartesService } from '../../../services/partes.service';

describe('FormFacturacionComponent', () => {
  let component: FormFacturacionComponent;
  let fixture: ComponentFixture<FormFacturacionComponent>;
  let facturacionService: jasmine.SpyObj<FacturacionService>;
  let rutasService: jasmine.SpyObj<RutasService>;
  let partesService: jasmine.SpyObj<PartesService>;
  let navController: jasmine.SpyObj<NavController>;

  const mockRutas = [
    { _id: 'r1', name: 'Ruta 1' },
    { _id: 'r2', name: 'Ruta 2' }
  ];

  const mockPartes = [
    { _id: 'p1', title: 'Parte 1' },
    { _id: 'p2', title: 'Parte 2' }
  ];

  beforeEach(waitForAsync(() => {
    const facturacionServiceSpy = jasmine.createSpyObj('FacturacionService', ['getFacturacionById', 'createFacturacion', 'updateFacturacion']);
    const rutasServiceSpy = jasmine.createSpyObj('RutasService', ['getRutas']);
    const partesServiceSpy = jasmine.createSpyObj('PartesService', ['getPartes']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateRoot']);

    TestBed.configureTestingModule({
      declarations: [ FormFacturacionComponent ],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        { provide: FacturacionService, useValue: facturacionServiceSpy },
        { provide: RutasService, useValue: rutasServiceSpy },
        { provide: PartesService, useValue: partesServiceSpy },
        { provide: NavController, useValue: navControllerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormFacturacionComponent);
    component = fixture.componentInstance;
    facturacionService = TestBed.inject(FacturacionService) as jasmine.SpyObj<FacturacionService>;
    rutasService = TestBed.inject(RutasService) as jasmine.SpyObj<RutasService>;
    partesService = TestBed.inject(PartesService) as jasmine.SpyObj<PartesService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;

    // Configurar mocks por defecto
    rutasService.getRutas.and.returnValue(of({ ok: true, rutas: mockRutas }));
    partesService.getPartes.and.returnValue(Promise.resolve(of({ partes: mockPartes })));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con valores por defecto', () => {
    expect(component.facturacionForm).toBeDefined();
    expect(component.isEdit).toBe(false);
    expect(component.facturacionId).toBeNull();
  });

  it('debería validar campos requeridos', () => {
    expect(component.facturacionForm.get('facturacion')?.hasError('required')).toBeTruthy();
    expect(component.facturacionForm.get('ruta')?.hasError('required')).toBeTruthy();
    expect(component.facturacionForm.get('parte')?.hasError('required')).toBeTruthy();
  });

  it('debería cargar rutas y partes al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(rutasService.getRutas).toHaveBeenCalled();
    expect(partesService.getPartes).toHaveBeenCalled();
    expect(component.rutasDisponibles.length).toBe(2);
    expect(component.partesDisponibles.length).toBe(2);
  });

  it('debería crear una facturación cuando el formulario es válido y no está en modo edición', async () => {
    facturacionService.createFacturacion.and.returnValue(of({ ok: true }));
    
    component.facturacionForm.patchValue({
      facturacion: 1000,
      ruta: 'r1',
      parte: 'p1'
    });

    await component.guardar();

    expect(facturacionService.createFacturacion).toHaveBeenCalled();
    expect(navController.navigateRoot).toHaveBeenCalledWith('/facturacion');
  });

  it('debería actualizar una facturación cuando está en modo edición', async () => {
    component.isEdit = true;
    component.facturacionId = '123';
    facturacionService.updateFacturacion.and.returnValue(of({ ok: true }));
    
    component.facturacionForm.patchValue({
      facturacion: 2000,
      ruta: 'r2',
      parte: 'p2'
    });

    await component.guardar();

    expect(facturacionService.updateFacturacion).toHaveBeenCalledWith('123', jasmine.any(Object));
    expect(navController.navigateRoot).toHaveBeenCalledWith('/facturacion');
  });

  it('no debería guardar si el formulario es inválido', async () => {
    component.facturacionForm.patchValue({
      facturacion: 0, // Valor inválido
      ruta: '',
      parte: ''
    });

    await component.guardar();

    expect(facturacionService.createFacturacion).not.toHaveBeenCalled();
    expect(facturacionService.updateFacturacion).not.toHaveBeenCalled();
  });

  it('debería cargar una facturación existente cuando hay un ID en la ruta', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    const mockFacturacion = {
      _id: '123',
      facturacion: 1500,
      ruta: { _id: 'r1', name: 'Ruta 1' },
      parte: { _id: 'p1', title: 'Parte 1' }
    };

    facturacionService.getFacturacionById.and.returnValue(of({
      ok: true,
      data: { facturacion: mockFacturacion }
    }));

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isEdit).toBe(true);
    expect(component.facturacionId).toBe('123');
    expect(facturacionService.getFacturacionById).toHaveBeenCalledWith('123');
    expect(component.facturacionForm.get('facturacion')?.value).toBe(1500);
  });

  it('debería agregar ruta y parte a las listas si no existen al cargar facturación', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    const nuevaRuta = { _id: 'r3', name: 'Ruta Nueva' };
    const nuevoParte = { _id: 'p3', title: 'Parte Nuevo' };
    
    const mockFacturacion = {
      _id: '123',
      facturacion: 1500,
      ruta: nuevaRuta,
      parte: nuevoParte
    };

    facturacionService.getFacturacionById.and.returnValue(of({
      ok: true,
      data: { facturacion: mockFacturacion }
    }));

    component.rutasDisponibles = mockRutas;
    component.partesDisponibles = mockPartes;

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.rutasDisponibles.some(r => r._id === 'r3')).toBeTruthy();
    expect(component.partesDisponibles.some(p => p._id === 'p3')).toBeTruthy();
  });
});
