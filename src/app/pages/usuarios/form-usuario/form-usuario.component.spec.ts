import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { FormUsuarioComponent } from './form-usuario.component';
import { UserService } from '../../../services/user.service';

describe('FormUsuarioComponent', () => {
  let component: FormUsuarioComponent;
  let fixture: ComponentFixture<FormUsuarioComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let navController: jasmine.SpyObj<NavController>;

  const mockUsuario = {
    _id: '123',
    name: 'Usuario Test',
    code: 'USR001',
    email: 'usuario@example.com',
    phone: '123456789',
    role: 'worker',
    junior: false
  };

  beforeEach(waitForAsync(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUserById', 'createUser', 'updateUser']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateRoot', 'navigateBack']);

    TestBed.configureTestingModule({
      declarations: [ FormUsuarioComponent ],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: NavController, useValue: navControllerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => null })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormUsuarioComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario con valores por defecto', () => {
    expect(component.usuarioForm).toBeDefined();
    expect(component.isEdit).toBe(false);
    expect(component.usuarioId).toBeNull();
  });

  it('debería validar campos requeridos', () => {
    expect(component.usuarioForm.get('name')?.hasError('required')).toBeTruthy();
    expect(component.usuarioForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.usuarioForm.get('phone')?.hasError('required')).toBeTruthy();
    expect(component.usuarioForm.get('role')?.hasError('required')).toBeFalsy(); // Tiene valor por defecto
  });

  it('debería validar formato de email', () => {
    component.usuarioForm.patchValue({ email: 'email-invalido' });
    expect(component.usuarioForm.get('email')?.hasError('email')).toBeTruthy();
    
    component.usuarioForm.patchValue({ email: 'test@example.com' });
    expect(component.usuarioForm.get('email')?.hasError('email')).toBeFalsy();
  });

  it('debería tener role por defecto como worker', () => {
    expect(component.usuarioForm.get('role')?.value).toBe('worker');
  });

  it('debería crear un usuario cuando el formulario es válido y no está en modo edición', async () => {
    userService.createUser.and.returnValue(of({ ok: true, data: { user: mockUsuario } }));
    
    component.usuarioForm.patchValue({
      name: 'Usuario Test',
      email: 'test@example.com',
      phone: '123456789',
      role: 'worker',
      password: 'password123'
    });

    await component.guardar();

    expect(userService.createUser).toHaveBeenCalled();
    expect(navController.navigateRoot).toHaveBeenCalledWith('/usuarios');
  });

  it('debería actualizar un usuario cuando está en modo edición', async () => {
    component.isEdit = true;
    component.usuarioId = '123';
    userService.updateUser.and.returnValue(of({ ok: true, data: { user: mockUsuario } }));
    
    component.usuarioForm.patchValue({
      name: 'Usuario Actualizado',
      email: 'updated@example.com',
      phone: '987654321',
      role: 'admin'
    });

    await component.guardar();

    expect(userService.updateUser).toHaveBeenCalledWith(jasmine.objectContaining({
      _id: '123',
      name: 'Usuario Actualizado',
      email: 'updated@example.com'
    }));
    expect(navController.navigateRoot).toHaveBeenCalledWith('/usuarios');
  });

  it('debería cargar un usuario existente cuando hay un ID en la ruta', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    userService.getUserById.and.returnValue(of({
      ok: true,
      data: { user: mockUsuario }
    }));

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.isEdit).toBe(true);
    expect(component.usuarioId).toBe('123');
    expect(userService.getUserById).toHaveBeenCalledWith('123');
    expect(component.usuarioForm.get('name')?.value).toBe('Usuario Test');
    expect(component.usuarioForm.get('email')?.value).toBe('usuario@example.com');
    expect(component.usuarioForm.get('code')?.hasError('required')).toBeTruthy(); // Requerido en edición
  });

  it('debería hacer el campo code requerido cuando está en modo edición', async () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.paramMap as any) = of({ get: (key: string) => key === 'id' ? '123' : null });
    
    userService.getUserById.and.returnValue(of({
      ok: true,
      data: { user: mockUsuario }
    }));

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.usuarioForm.get('code')?.hasError('required')).toBeTruthy();
  });

  it('no debería guardar si el formulario es inválido', async () => {
    component.usuarioForm.patchValue({
      name: '', // Campo requerido vacío
      email: 'invalid-email'
    });

    await component.guardar();

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('debería navegar hacia atrás al cancelar', () => {
    component.cancelar();
    expect(navController.navigateBack).toHaveBeenCalledWith('/usuarios');
  });

  it('debería mostrar el campo password solo cuando no está en modo edición', () => {
    component.isEdit = false;
    fixture.detectChanges();
    
    let passwordField = fixture.nativeElement.querySelector('ion-input[formControlName="password"]');
    expect(passwordField).toBeTruthy();

    component.isEdit = true;
    fixture.detectChanges();
    
    passwordField = fixture.nativeElement.querySelector('ion-input[formControlName="password"]');
    expect(passwordField).toBeFalsy();
  });

  it('debería mostrar el campo code solo cuando está en modo edición', () => {
    component.isEdit = false;
    fixture.detectChanges();
    
    let codeField = fixture.nativeElement.querySelector('ion-input[formControlName="code"]');
    expect(codeField).toBeFalsy();

    component.isEdit = true;
    fixture.detectChanges();
    
    codeField = fixture.nativeElement.querySelector('ion-input[formControlName="code"]');
    expect(codeField).toBeTruthy();
  });

  it('debería manejar errores al guardar usuario', async () => {
    userService.createUser.and.returnValue(throwError(() => new Error('Error al guardar')));
    
    component.usuarioForm.patchValue({
      name: 'Usuario Test',
      email: 'test@example.com',
      phone: '123456789',
      role: 'worker'
    });

    await component.guardar();

    expect(userService.createUser).toHaveBeenCalled();
    // No debería navegar si hay error
    expect(navController.navigateRoot).not.toHaveBeenCalled();
  });
});
