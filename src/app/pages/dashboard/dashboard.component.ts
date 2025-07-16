import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

interface ModulePermission {
  name: string;
  route: string;
  icon: string;
  description: string;
  allowedRoles: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    ButtonModule,
    CardModule,
    ToastModule,
    TooltipModule,
    AvatarModule,
    DividerModule,
    PanelModule
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  availableModules: ModulePermission[] = [];
  userType: string = '';
  userName: string = '';
  private isBrowser: boolean;
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private permissionService: PermissionService,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Solo ejecutar lógica de autenticación en el navegador
    if (!this.isBrowser) {
      return;
    }

    const token = localStorage.getItem('access_token');
    console.log('Token en dashboard:', token ? token.substring(0, 20) + '...' : 'No hay token');
    
    if (!token) {
      console.log('No hay token, redirigiendo a login');
      this.messageService.add({
        severity: 'warn',
        summary: 'Sesión Expirada',
        detail: 'Por favor, inicia sesión nuevamente.',
        life: 3000
      });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.router.navigate(['/login']);
      return;
    }
    
    if (token.length < 10) {
      console.log('Token inválido, redirigiendo a login');
      this.messageService.add({
        severity: 'error',
        summary: 'Token Inválido',
        detail: 'El token de sesión es inválido.',
        life: 3000
      });
      localStorage.removeItem('access_token');
      this.router.navigate(['/login']);
      return;
    }
    
    // Forzar la recarga del usuario desde el token
    this.authService.reloadUserFromToken();
    
    // Obtener información del usuario y cargar módulos permitidos
    this.loadUserInfo();
    
    console.log('Dashboard cargado correctamente con token válido');
  }

  private loadUserInfo(): void {
    // Intentar obtener usuario actual inmediatamente
    let currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual al cargar:', currentUser);
    
    if (currentUser && currentUser.tipo) {
      this.userType = currentUser.tipo;
      this.userName = currentUser.nombre;
      this.loadAvailableModules();
    } else {
      // Suscribirse a cambios en el usuario
      this.authService.user$.subscribe(user => {
        console.log('Usuario recibido en suscripción:', user);
        if (user && user.tipo) {
          this.userType = user.tipo;
          this.userName = user.nombre;
          this.loadAvailableModules();
        }
      });
      
      // Si después de 1 segundo no hay usuario, mostrar error
      setTimeout(() => {
        if (!this.userType) {
          console.error('No se pudo obtener el tipo de usuario');
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Autenticación',
            detail: 'No se pudo obtener la información del usuario. Inicia sesión nuevamente.',
            life: 5000
          });
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }, 1000);
    }
  }

  private loadAvailableModules(): void {
    console.log('Cargando módulos para tipo de usuario:', this.userType);
    this.availableModules = this.permissionService.getAvailableModules(this.userType);
    console.log(`Módulos disponibles para ${this.userType}:`, this.availableModules);
    
    if (this.isBrowser) {
      this.messageService.add({
        severity: 'success',
        summary: `Bienvenido ${this.userName}`,
        detail: `Tipo de usuario: ${this.userType.charAt(0).toUpperCase() + this.userType.slice(1)} - ${this.availableModules.length} módulos disponibles`,
        life: 4000
      });
    }
  }

  navigateTo(route: string): void {
    if (!this.isBrowser) return;

    // Verificar si el usuario tiene acceso al módulo
    if (!this.permissionService.hasAccessToModule(this.userType, route)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acceso Denegado',
        detail: 'No tienes permisos para acceder a este módulo.',
        life: 3000
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Navegando',
      detail: `Accediendo a ${route.replace('/', '')}...`,
      life: 1500
    });
    
    setTimeout(() => {
      this.router.navigate([route]);
    }, 500);
  }

  logout(): void {
    if (!this.isBrowser) return;

    this.messageService.add({
      severity: 'info',
      summary: 'Cerrando Sesión',
      detail: 'Hasta pronto...',
      life: 2000
    });
    
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 1000);
  }
}