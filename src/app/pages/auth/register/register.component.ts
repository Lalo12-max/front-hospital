import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    DialogModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styles: [`
    .password-requirements {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }
    
    .requirement-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
      color: #6c757d;
    }
    
    .requirement-item:last-child {
      margin-bottom: 0;
    }
    
    .requirement-item i {
      margin-right: 0.5rem;
      width: 1rem;
    }
    
    .requirement-item.valid {
      color: #28a745;
    }
    
    .requirement-item.valid i {
      color: #28a745;
    }
    
    .requirement-item:not(.valid) i {
      color: #dc3545;
    }

    .mfa-dialog {
      text-align: center;
    }

    .qr-code {
      margin: 1rem 0;
    }

    .secret-key {
      background-color: #f8f9fa;
      padding: 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      word-break: break-all;
      margin: 1rem 0;
    }
    .qr-code-container {
      text-align: center;
      margin: 20px 0;
    }
    .qr-code-container img {
      max-width: 200px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  
  showMFADialog = false;
  qrCodeUrl = '';
  secretKey = '';
  qrCodeDataUrl: string = '';
  
  passwordValidation = {
    length: false,
    hasNumber: false,
    hasLower: false,
    hasUpper: false,
    hasSymbol: false
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordStrengthValidator.bind(this)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordStrengthValidator(control: any) {
    const password = control.value;
    if (!password) return null;

    const hasLength = password.length >= 12;
    const hasNumber = /[0-9]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    const isValid = hasLength && hasNumber && hasLower && hasUpper && hasSymbol;
    
    return isValid ? null : { passwordStrength: true };
  }

  onPasswordChange(event: any) {
    const password = event.target.value;
    
    this.passwordValidation = {
      length: password.length >= 12,
      hasNumber: /[0-9]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
    };
  }

  get isPasswordValid(): boolean {
    return Object.values(this.passwordValidation).every(valid => valid);
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async generateQRCode(secret: string, email: string): Promise<void> {
    try {
      const otpAuthUrl = `otpauth://totp/Hospital%20System:${encodeURIComponent(email)}?secret=${secret}&issuer=Hospital%20System`;
      this.qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
    } catch (error) {
      console.error('Error generando código QR:', error);
    }
  }

  onSubmit() {
    if (this.registerForm.valid && this.isPasswordValid) {
      this.isLoading = true;
      
      const registerData = {
        nombre: this.registerForm.value.nombre,
        email: this.registerForm.value.email,
        tipo: 'paciente', 
        password: this.registerForm.value.password
      };
      
      this.authService.register(registerData).subscribe({
        next: async (response) => {
          console.log('Registro exitoso:', response);
          
          if (response.intcode === 'S03') {
              if (response.data?.qr_code_url && response.data?.secret_key) {
                this.qrCodeUrl = response.data.qr_code_url;
                this.secretKey = response.data.secret_key;
                await this.generateQRCode(this.secretKey, this.registerForm.value.email);
                this.showMFADialog = true;
              } else {
                this.router.navigate(['/login']);
              }
          } else {
              const errorMessage = response.data?.error || response.data?.message || 'Error en el registro';
              this.messageService.add({
                severity: 'error',
                summary: 'Error en el registro',
                detail: `Error (${response.intcode}): ${errorMessage}`
              });
          }
          this.isLoading = false;
      },
      error: (error) => {
          console.error('Error en registro:', error);
          if (error.status === 400) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error de validación',
                detail: error.error?.data?.error || error.error?.message || 'Datos inválidos'
              });
          } else if (error.status === 409) {
              this.messageService.add({
                severity: 'error',
                summary: 'Email duplicado',
                detail: 'El email ya está registrado'
              });
          } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error del servidor',
                detail: 'Error en el servidor. Intenta nuevamente.'
              });
          }
          this.isLoading = false;
      }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  continuarAlLogin() {
    this.showMFADialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'MFA configurado',
      detail: 'MFA configurado exitosamente! Ahora puedes iniciar sesión.'
    });
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  copiarClaveSecreta() {
    navigator.clipboard.writeText(this.secretKey).then(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Copiado',
        detail: 'Clave secreta copiada al portapapeles'
      });
    });
  }
}