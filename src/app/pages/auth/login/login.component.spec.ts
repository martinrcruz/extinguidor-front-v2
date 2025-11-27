import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let navController: jasmine.SpyObj<NavController>;

  beforeEach(waitForAsync(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const navControllerSpy = jasmine.createSpyObj('NavController', ['navigateRoot', 'navigateForward']);

    TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      imports: [
        IonicModule.forRoot(),
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NavController, useValue: navControllerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar con valores vacíos', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.rememberMe).toBe(false);
  });

  it('debería mostrar el formulario de login', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('ion-input[name="email"]')).toBeTruthy();
    expect(compiled.querySelector('ion-input[name="password"]')).toBeTruthy();
    expect(compiled.querySelector('ion-button[type="submit"]')).toBeTruthy();
  });

  it('debería deshabilitar el botón de submit cuando el formulario es inválido', () => {
    fixture.detectChanges();
    const submitButton = fixture.nativeElement.querySelector('ion-button[type="submit"]');
    expect(submitButton.disabled).toBeTruthy();
  });

  it('debería habilitar el botón de submit cuando el formulario es válido', () => {
    component.email = 'test@example.com';
    component.password = 'password123';
    fixture.detectChanges();
    
    const form = fixture.nativeElement.querySelector('form');
    const emailInput = fixture.nativeElement.querySelector('ion-input[name="email"]');
    const passwordInput = fixture.nativeElement.querySelector('ion-input[name="password"]');
    
    // Simular que los campos han sido tocados y son válidos
    emailInput.dispatchEvent(new Event('ionInput'));
    passwordInput.dispatchEvent(new Event('ionInput'));
    fixture.detectChanges();
  });

  it('debería mostrar mensaje de error cuando el email es inválido', () => {
    component.email = 'email-invalido';
    fixture.detectChanges();
    
    const emailInput = fixture.nativeElement.querySelector('ion-input[name="email"]');
    emailInput.dispatchEvent(new Event('ionBlur'));
    fixture.detectChanges();
    
    const errorMessage = fixture.nativeElement.querySelector('ion-note');
    expect(errorMessage).toBeTruthy();
  });

  it('debería llamar a authService.login cuando se envía el formulario con credenciales válidas', async () => {
    const mockResponse = { ok: true, data: { token: 'mock-token', role: 'admin' } };
    authService.login.and.returnValue(of(mockResponse));

    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.onLogin();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('debería navegar a /calendario cuando el login es exitoso', async () => {
    const mockResponse = { ok: true, data: { token: 'mock-token', role: 'admin' } };
    authService.login.and.returnValue(of(mockResponse));

    component.email = 'test@example.com';
    component.password = 'password123';
    
    await component.onLogin();

    expect(navController.navigateRoot).toHaveBeenCalledWith('/calendario', { animated: true });
  });

  it('debería manejar errores de login correctamente', async () => {
    const mockError = { status: 401, error: { message: 'Credenciales incorrectas' } };
    authService.login.and.returnValue(throwError(() => mockError));

    component.email = 'test@example.com';
    component.password = 'wrongpassword';
    
    await component.onLogin();

    expect(authService.login).toHaveBeenCalled();
    expect(navController.navigateRoot).not.toHaveBeenCalled();
  });

  it('debería navegar a /forgot-password cuando se hace clic en olvidé mi contraseña', () => {
    component.onForgotPassword();
    expect(navController.navigateForward).toHaveBeenCalledWith('/forgot-password');
  });

  it('debería actualizar rememberMe cuando se marca el checkbox', () => {
    const checkbox = fixture.nativeElement.querySelector('ion-checkbox');
    expect(component.rememberMe).toBe(false);
    
    component.rememberMe = true;
    fixture.detectChanges();
    
    expect(component.rememberMe).toBe(true);
  });
});
