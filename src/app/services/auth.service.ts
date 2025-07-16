import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface UserInfo {
  id_usuario: number;
  nombre: string;
  email: string;
  tipo: string;
}

interface AccessRule {
  resource: string;
  actions: string[];
}

interface UserPermissions {
  user_type: string;
  permissions: AccessRule[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api/v1/auth';
  private userSubject = new BehaviorSubject<UserInfo | null>(null);
  public user$ = this.userSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadUserFromToken();
    }
  }

  login(credentials: {email: string, password: string, totp_code?: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.access_token && this.isBrowser) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          
          // Guardar información del usuario desde la respuesta del login
          if (response.user) {
            const userInfo: UserInfo = {
              id_usuario: response.user.id_usuario,
              nombre: response.user.nombre,
              email: response.user.email,
              tipo: response.user.tipo
            };
            this.userSubject.next(userInfo);
            console.log('Usuario logueado:', userInfo);
          }
        }
      })
    );
  }

  register(userData: {nombre: string, email: string, tipo: string, password: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  getUserPermissions(): Observable<UserPermissions> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.get<UserPermissions>('http://localhost:3001/api/v1/user/permissions', { headers });
  }

  getCurrentUser(): UserInfo | null {
    return this.userSubject.value;
  }

  getUserType(): string | null {
    const user = this.getCurrentUser();
    return user ? user.tipo : null;
  }

  private loadUserFromToken(): void {
    if (!this.isBrowser) return;
    
    const token = this.getToken();
    if (token) {
      try {
        // Decodificar el payload del JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('Payload del token:', payload);
        
        // Extraer información del usuario del payload
        const userInfo: UserInfo = {
          id_usuario: payload.user_id,
          nombre: payload.nombre || payload.email?.split('@')[0] || 'Usuario',
          email: payload.email,
          tipo: payload.tipo
        };
        
        console.log('Información del usuario extraída:', userInfo);
        this.userSubject.next(userInfo);
        
      } catch (error) {
        console.error('Error al decodificar token:', error);
        console.log('Token problemático:', token);
        this.logout();
      }
    }
  }

  // Método para forzar la recarga del usuario desde el token
  reloadUserFromToken(): void {
    this.loadUserFromToken();
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('access_token');
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    this.userSubject.next(null);
  }
}