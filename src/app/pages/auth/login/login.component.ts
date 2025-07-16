import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-login',
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
    ToastModule,
    DialogModule 
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styles: [`
    .mfa-config-content {
      max-height: 70vh;
      overflow-y: auto;
    }
    .secret-key {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
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
    .backup-codes {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      max-height: 150px;
      overflow-y: auto;
    }
    .backup-code {
      background: #f0f0f0;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
    }
    .instructions ol {
      padding-left: 20px;
    }
    .instructions li {
      margin-bottom: 8px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showMFAInput = true;
  showMFAConfigDialog = false;
  mfaConfigData: any = null;
  qrCodeDataUrl: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      totp_code: ['']
    });
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
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const loginData = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        ...(this.loginForm.value.totp_code && { totp_code: this.loginForm.value.totp_code })
      };
      
      this.authService.login(loginData).subscribe({
        next: async (response) => {
          console.log('Respuesta completa del servidor:', response);
          
          if (response.intcode === 'MFA_AUTO_CONFIGURED') {
            this.mfaConfigData = response.data;
            if (this.mfaConfigData.secret_key) {
              await this.generateQRCode(this.mfaConfigData.secret_key, this.loginForm.value.email);
            }
            this.showMFAConfigDialog = true;
            this.isLoading = false;
            return;
          }
          
          if (response.intcode === 'S02' || response.data?.requires_mfa) {
            this.messageService.add({
              severity: 'warn',
              summary: 'MFA Requerido',
              detail: 'Por favor ingresa tu código de autenticación de 6 dígitos'
            });
            this.loginForm.get('totp_code')?.setValidators([Validators.required]);
            this.loginForm.get('totp_code')?.updateValueAndValidity();
            return;
          }
          
          if (response.intcode === 'S01') {
            console.log('Login exitoso:', response);
            
            const token = response.data?.access_token;
            const refreshToken = response.data?.refresh_token;
            
            if (token) {
              localStorage.setItem('access_token', token);
              if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
              }
              console.log('Token guardado exitosamente:', token.substring(0, 20) + '...');
              this.messageService.add({
                severity: 'success',
                summary: 'Login Exitoso',
                detail: 'Bienvenido al sistema'
              });
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
            } else {
              console.error('No se recibió token del servidor. Respuesta:', response);
              this.messageService.add({
                severity: 'error',
                summary: 'Error de Autenticación',
                detail: 'No se recibió token de autenticación del servidor'
              });
            }
          } else {
            const errorMessage = response.data?.error || response.data?.message || 'Error desconocido';
            this.messageService.add({
              severity: 'error',
              summary: `Error (${response.intcode})`,
              detail: errorMessage
            });
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error completo en login:', error);
          
          if (error.status === 401) {
            if (this.loginForm.get('totp_code')?.value) {
              this.messageService.add({
                severity: 'error',
                summary: 'Código MFA Incorrecto',
                detail: 'El código de autenticación es incorrecto. Intenta nuevamente.'
              });
              this.loginForm.get('totp_code')?.setValue('');
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Credenciales Incorrectas',
                detail: 'Email o contraseña incorrectos'
              });
            }
          } else if (error.status === 0) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error de Conexión',
              detail: 'No se puede conectar al servidor. Verifica que el backend esté corriendo en el puerto 3001.'
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: `Error del Servidor (${error.status})`,
              detail: error.message || 'Error desconocido'
            });
          }
          this.isLoading = false;
        }
      });
    }
  }

  closeMFADialog() {
    this.showMFAConfigDialog = false;
    this.mfaConfigData = null;
    
    this.messageService.add({
      severity: 'success',
      summary: 'MFA Configurado',
      detail: 'Tu autenticación de dos factores ha sido configurada exitosamente'
    });
    
    if (this.mfaConfigData?.user) {
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Copiado',
        detail: 'Texto copiado al portapapeles'
      });
    });
  }

  goToRegister(event: Event) {
    event.preventDefault();
    this.router.navigate(['/register']);
  }
}