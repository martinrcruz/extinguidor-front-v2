import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, NavController, AlertController, ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { ListUsuarioComponent } from './list-usuario.component';
import { UserService } from '../../../services/user.service';

describe('ListUsuarioComponent', () => {
  let component: ListUsuarioComponent;
  let fixture: ComponentFixture<ListUsuarioComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let navController: jasmine.SpyObj<NavController>;
  let alertController: jasmine.SpyObj<AlertController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let alertElement: any;
  let toastElement: any;

  const mockUsuarios = [
    { _id: '1', name: 'Usuario 1', email: 'usuario1@test.com', role: 'admin', status: 'activo' },
    { _id: '2', name: 'Usuario 2', email: 'usuario2@test.com', role: 'worker', status: 'inactivo' },
    { _id: '3', name: 'Usuario 3', email: 'usuario3@test.com', role: 'worker', status: 'activo' }
  ];

  beforeEach(waitForAsync(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers', 'deleteUser']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateForward']);
    const alertCtrlSpy = jasmine.createSpyObj('AlertController', ['create']);
    const toastCtrlSpy = jasmine.createSpyObj('ToastController', ['create']);

    alertElement = jasmine.createSpyObj('Alert', ['present', 'onDidDismiss']);
    toastElement = jasmine.createSpyObj('Toast', ['present']);

    alertCtrlSpy.create.and.returnValue(Promise.resolve(alertElement));
    toastCtrlSpy.create.and.returnValue(Promise.resolve(toastElement));

    TestBed.configureTestingModule({
      declarations: [ ListUsuarioComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: NavController, useValue: navControllerSpy },
        { provide: AlertController, useValue: alertCtrlSpy },
        { provide: ToastController, useValue: toastCtrlSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListUsuarioComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;

    userService.getAllUsers.and.returnValue(Promise.resolve(of({ ok: true, data: { users: mockUsuarios } })));
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar usuarios al inicializar', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    
    expect(userService.getAllUsers).toHaveBeenCalled();
    expect(component.usuarios.length).toBe(3);
  });

  it('debería filtrar usuarios por texto de búsqueda', () => {
    component.usuarios = mockUsuarios;
    component.applyFilters();
    
    const event = { detail: { value: 'Usuario 1' } };
    component.filtrar(event);
    
    expect(component.filteredUsuarios.length).toBe(1);
    expect(component.filteredUsuarios[0].name).toBe('Usuario 1');
  });

  it('debería filtrar usuarios por email', () => {
    component.usuarios = mockUsuarios;
    component.applyFilters();
    
    const event = { detail: { value: 'usuario2@test.com' } };
    component.filtrar(event);
    
    expect(component.filteredUsuarios.length).toBe(1);
    expect(component.filteredUsuarios[0].email).toBe('usuario2@test.com');
  });

  it('debería filtrar usuarios por rol', () => {
    component.usuarios = mockUsuarios;
    component.applyFilters();
    
    const event = { detail: { value: 'admin' } };
    component.filtrar(event);
    
    expect(component.filteredUsuarios.length).toBe(1);
    expect(component.filteredUsuarios[0].role).toBe('admin');
  });

  it('debería aplicar filtros por estado', () => {
    component.usuarios = mockUsuarios;
    component.selectedStatus = 'activo';
    
    component.applyFilters();
    
    expect(component.filteredUsuarios.length).toBe(2);
    expect(component.filteredUsuarios.every(u => u.status === 'activo')).toBeTruthy();
  });

  it('debería mostrar todos los usuarios cuando no hay filtro de estado', () => {
    component.usuarios = mockUsuarios;
    component.selectedStatus = '';
    
    component.applyFilters();
    
    expect(component.filteredUsuarios.length).toBe(3);
  });

  it('debería navegar al formulario de nuevo usuario', () => {
    component.nuevoUsuario();
    expect(navController.navigateForward).toHaveBeenCalledWith('/usuarios/create');
  });

  it('debería navegar al formulario de editar usuario', () => {
    component.editarUsuario('123');
    expect(navController.navigateForward).toHaveBeenCalledWith('/usuarios/edit/123');
  });

  it('debería eliminar un usuario correctamente', async () => {
    component.usuarios = mockUsuarios;
    component.filteredUsuarios = [...mockUsuarios];
    userService.deleteUser.and.returnValue(Promise.resolve(of({ ok: true })));
    
    // Simular confirmación del alert
    alertElement.onDidDismiss.and.returnValue(Promise.resolve({ role: undefined })); // Confirmar
    
    await component.eliminarUsuario('1');
    
    expect(alertController.create).toHaveBeenCalled();
    expect(userService.deleteUser).toHaveBeenCalledWith('1');
    expect(component.usuarios.length).toBe(2);
  });

  it('no debería eliminar usuario si se cancela', async () => {
    component.usuarios = mockUsuarios;
    component.filteredUsuarios = [...mockUsuarios];
    
    // Simular cancelación del alert
    alertElement.onDidDismiss.and.returnValue(Promise.resolve({ role: 'cancel' }));
    
    await component.eliminarUsuario('1');
    
    expect(alertController.create).toHaveBeenCalled();
    expect(userService.deleteUser).not.toHaveBeenCalled();
    expect(component.usuarios.length).toBe(3);
  });

  it('debería mostrar un toast cuando se elimina un usuario', async () => {
    component.usuarios = mockUsuarios;
    component.filteredUsuarios = [...mockUsuarios];
    userService.deleteUser.and.returnValue(Promise.resolve(of({ ok: true })));
    alertElement.onDidDismiss.and.returnValue(Promise.resolve({ role: undefined }));
    
    await component.eliminarUsuario('1');
    
    expect(toastController.create).toHaveBeenCalled();
  });

  it('debería recargar usuarios cuando se entra a la vista', async () => {
    component.ionViewDidEnter();
    await fixture.whenStable();
    
    expect(userService.getAllUsers).toHaveBeenCalled();
  });

  it('debería mostrar todos los usuarios cuando el texto de búsqueda está vacío', () => {
    component.usuarios = mockUsuarios;
    component.applyFilters();
    
    const event = { detail: { value: '' } };
    component.filtrar(event);
    
    expect(component.filteredUsuarios.length).toBe(3);
  });
});
