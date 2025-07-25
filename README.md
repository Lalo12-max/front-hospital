# Hospital Frontend

Aplicación frontend para gestión hospitalaria desarrollada con Angular 19.

## 📋 Descripción

Sistema de gestión hospitalaria que permite administrar consultas médicas, consultorios, expedientes de pacientes, horarios, recetas y usuarios del sistema.

## 🚀 Tecnologías utilizadas

- **Angular 19** - Framework principal
- **PrimeNG 19.1.3** - Biblioteca de componentes UI
- **PrimeIcons 7.0.0** - Iconografía
- **TypeScript 5.7.2** - Lenguaje de programación
- **Express 4.18.2** - Servidor para SSR (Server-Side Rendering)
- **RxJS 7.8.0** - Programación reactiva
- **QRCode 1.5.4** - Generación de códigos QR
- **Mermaid 11.9.0** - Diagramas y gráficos

## 📦 Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

## 🏃‍♂️ Comandos disponibles

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm start
# o
ng serve
```




## 🏥 Módulos del sistema

### 👥 Gestión de Usuarios
- Registro y autenticación de usuarios
- Gestión de perfiles y permisos
- Control de acceso basado en roles

### 🏢 Consultorios
- Administración de consultorios médicos
- Asignación de espacios
- Gestión de disponibilidad

### 📅 Horarios
- Programación de citas médicas
- Gestión de disponibilidad de médicos
- Calendario de consultas

### 🩺 Consultas
- Registro de consultas médicas
- Historial de atenciones
- Seguimiento de pacientes

### 📋 Expedientes
- Gestión de expedientes médicos
- Historial clínico de pacientes
- Documentación médica

### 💊 Recetas
- Generación de recetas médicas
- Control de medicamentos
- Historial de prescripciones

## 🛠️ Arquitectura

### Estructura del proyecto
src/app/
├── components/          # Componentes reutilizables
├── interceptors/        # Interceptores HTTP
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   └── loading.interceptor.ts
├── models/             # Modelos de datos
├── pages/              # Páginas principales
│   ├── auth/
│   ├── consultas/
│   ├── consultorios/
│   ├── dashboard/
│   ├── expedientes/
│   ├── horarios/
│   ├── recetas/
│   └── usuarios/
└── services/           # Servicios de la aplicación

## 🌐 Navegación

La aplicación estará disponible en:
- **Desarrollo**: `http://localhost:4200`
- **SSR**: Puerto configurado en el servidor Express

## 📝 Notas adicionales

- El proyecto utiliza Angular 19 con las últimas características
- Implementa SSR para mejor SEO y rendimiento
- Incluye interceptores para manejo centralizado de autenticación y errores
- Utiliza PrimeNG para una interfaz de usuario profesional y consistente