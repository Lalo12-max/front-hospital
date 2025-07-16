import { Injectable } from '@angular/core';

interface ModulePermission {
  name: string;
  route: string;
  icon: string;
  description: string;
  allowedRoles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  private modules: ModulePermission[] = [
    {
      name: 'Usuarios',
      route: '/usuarios',
      icon: 'pi pi-users',
      description: 'Gestión de usuarios del sistema',
      allowedRoles: ['admin']
    },
    {
      name: 'Consultorios',
      route: '/consultorios',
      icon: 'pi pi-building',
      description: 'Administrar consultorios médicos',
      allowedRoles: ['admin', 'medico', 'enfermera']
    },
    {
      name: 'Consultas',
      route: '/consultas',
      icon: 'pi pi-heart',
      description: 'Programar y gestionar consultas',
      allowedRoles: ['admin', 'medico', 'enfermera', 'paciente']
    },
    {
      name: 'Expedientes',
      route: '/expedientes',
      icon: 'pi pi-folder',
      description: 'Historiales médicos de pacientes',
      allowedRoles: ['admin', 'medico', 'enfermera', 'paciente']
    },
    {
      name: 'Horarios',
      route: '/horarios',
      icon: 'pi pi-clock',
      description: 'Gestión de horarios médicos',
      allowedRoles: ['admin', 'medico', 'enfermera']
    },
    {
      name: 'Recetas',
      route: '/recetas',
      icon: 'pi pi-file-edit',
      description: 'Prescripciones médicas',
      allowedRoles: ['admin', 'medico', 'enfermera', 'paciente']
    }
  ];

  getAvailableModules(userType: string): ModulePermission[] {
    return this.modules.filter(module => 
      module.allowedRoles.includes(userType)
    );
  }

  hasAccessToModule(userType: string, route: string): boolean {
    const module = this.modules.find(m => m.route === route);
    return module ? module.allowedRoles.includes(userType) : false;
  }
}