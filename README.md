# 🏫 SISAE-FRONT

**Sistema Integral de Administración Educativa - Frontend**

Un sistema moderno y completo para la gestión administrativa de instituciones educativas, desarrollado con Angular y diseñado especialmente para "Nuestra Señora del Carmen".

## 🎯 Descripción

SISAE-FRONT es la interfaz de usuario del Sistema Integral de Administración Educativa, que proporciona una plataforma web moderna y eficiente para la gestión de todos los aspectos administrativos de una institución educativa.

## ✨ Características Principales

- 🔐 **Autenticación Segura** - Sistema de login con recuperación de contraseña
- 🎨 **Diseño Moderno** - Interfaz elegante con tema personalizado (Guindo/Crema)
- 🌙 **Modo Oscuro** - Soporte completo para tema claro y oscuro
- 📱 **Responsive Design** - Optimizado para desktop, tablet y móvil
- ♿ **Accesibilidad** - Cumple estándares WCAG para inclusión digital
- 🚀 **Performance** - Carga rápida y navegación fluida
- 🎯 **UX/UI Intuitiva** - Diseño centrado en el usuario

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 18+** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS v4** - Framework de estilos
- **FontAwesome** - Iconografía
- **RxJS** - Programación reactiva

### Herramientas de Desarrollo
- **Angular CLI** - Herramientas de desarrollo
- **PostCSS** - Procesamiento de CSS
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Primario**: Guindo (Burgundy) - `oklch(0.45 0.15 15)`
- **Secundario**: Crema - `oklch(0.92 0.03 75)`
- **Accent**: Dorado - `oklch(0.70 0.12 85)`
- **Soporte completo**: Info, Success, Warning, Error

### Características del Diseño
- 🎨 Colores en formato OKLCH para mejor precisión
- 🌙 Modo oscuro automático
- 📐 Sistema de espaciado consistente
- 🎯 Componentes reutilizables

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
Node.js >= 18.x
npm >= 9.x
Angular CLI >= 18.x
```

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/jhoelsv25/SISAE-FRONT.git

# Entrar al directorio
cd SISAE-FRONT

# Instalar dependencias
npm install

# Instalar Angular CLI globalmente (si no está instalado)
npm install -g @angular/cli
```

### Desarrollo
```bash
# Servidor de desarrollo
ng serve

# Servidor con puerto específico
ng serve --port 4200

# Modo desarrollo con recarga automática
ng serve --watch
```

### Construcción
```bash
# Build para producción
ng build --configuration production

# Build para desarrollo
ng build
```

### Testing
```bash
# Ejecutar tests unitarios
ng test

# Ejecutar tests e2e
ng e2e

# Cobertura de tests
ng test --code-coverage
```

## 📁 Estructura del Proyecto

```
/ (raíz)
├── angular.json
├── package.json
├── tsconfig.json
├── README.md
├── public/
│   ├── favicon.ico
│   ├── logo.jpeg
│   └── styles/
│       ├── index.css
│       ├── animations/
│       │   ├── dropdown.css
│       │   ├── menu-anim.css
│       │   └── tooltip.css
│       ├── core/
│       │   ├── animation-routing.css
│       │   ├── animation.css
│       │   └── dialog.css
│       ├── forms/
│       │   ├── error-form.css
│       │   └── form.css
│       └── tailwind/
│           └── _core.css
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.css
│   ├── environments/
│   │   ├── environment.development.ts
│   │   └── environment.ts
│   └── app/
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── app.spec.ts
│       ├── app.ts
│       ├── auth/
│       │   ├── auth.routes.ts
│       │   ├── components/
│       │   │   ├── forgot-form/
│       │   │   ├── information/
│       │   │   └── login-form/
│       │   ├── guards/
│       │   │   ├── auth.guard.ts
│       │   │   ├── module.guard.ts
│       │   │   └── public.guard.ts
│       │   ├── interceptors/
│       │   │   └── auth.interceptor.ts
│       │   ├── pages/
│       │   │   ├── forgot-password/
│       │   │   ├── home/
│       │   │   └── login/
│       │   ├── services/
│       │   │   ├── auth-initializer.ts
│       │   │   ├── api/
│       │   │   └── store/
│       │   └── types/
│       │       └── auth-type.ts
│       ├── core/
│       │   ├── consts/
│       │   ├── enums/
│       │   ├── interceptors/
│       │   │   ├── api.interceptor.ts
│       │   │   └── error.interceptor.ts
│       │   ├── providers/
│       │   │   └── initializer.provider.ts
│       │   ├── services/
│       │   │   ├── breadcrumb.ts
│       │   │   ├── cell-formated.ts
│       │   │   ├── confirm-dialog.ts
│       │   │   ├── local-storage.ts
│       │   │   └── toast.ts
│       │   ├── stores/
│       │   │   ├── layout.store.ts
│       │   │   └── permission-check.store.ts
│       │   └── types/
│       │       ├── action-types.ts
│       │       ├── data-source-types.ts
│       │       ├── dialog-types.ts
│       │       ├── filter-types.ts
│       │       ├── header-types.ts
│       │       ├── layout-types.ts
│       │       ├── pagination-types.ts
│       │       └── toast-types.ts
│       ├── features/
│       │   ├── feature.routes.ts
│       │   ├── administration/
│       │   ├── dashboard/
│       │   ├── institution/
│       │   ├── setting/
│       │   ├── students/
│       │   ├── teachers/
│       │   ├── users/
│       │   └── year-academic/
│       │       └── year-academic.route.ts
│       ├── layout/
│       │   ├── layout.routes.ts
│       │   ├── components/
│       │   └── pages/
│       └── shared/
│           ├── components/
│           ├── directives/
│           ├── pages/
│           ├── pipes/
│           ├── services/
│           ├── stores/
│           ├── types/
│           ├── ui/
│           └── utils/
```

Esta estructura refleja la organización real y modular del proyecto, facilitando la escalabilidad y el mantenimiento siguiendo las mejores prácticas de Angular v21.

## 🔧 Configuración

### Variables de Entorno
Crear archivo `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'SISAE - Nuestra Señora del Carmen'
};
```

### Tailwind CSS
El proyecto utiliza Tailwind CSS v4 con configuración personalizada en `public/styles/tailwind/_core.css`.

## 📚 Documentación de Componentes

### Autenticación
- **LoginForm**: Formulario de inicio de sesión
- **ForgotForm**: Formulario de recuperación de contraseña
- **Information**: Panel informativo institucional

### Estilos Personalizados
- **form-control**: Estilos para inputs
- **form-group**: Contenedores de campos
- **btn-primary**: Botones principales
- **label-form**: Etiquetas de formularios

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

### Estándares de Código
- Seguir las convenciones de Angular
- Usar TypeScript estricto
- Mantener cobertura de tests > 80%
- Documentar componentes y servicios

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [jhoelsv25](https://github.com/jhoelsv25)
- **Institución**: Nuestra Señora del Carmen

## 📞 Contacto y Soporte

- **Email**: admin@nsdelcarmen.edu.pe
- **Teléfono**: +51 (01) 234-5678
- **Ubicación**: Lircay, Huancavelica

## 🚀 Roadmap

### Versión Actual (v1.0)
- ✅ Sistema de autenticación
- ✅ Diseño responsive
- ✅ Modo oscuro
- ✅ Tema personalizado

### Próximas Versiones
- 🔄 Gestión de estudiantes
- 🔄 Sistema de calificaciones
- 🔄 Reportes y estadísticas
- 🔄 Comunicación padres-escuela
- 🔄 Gestión de horarios

---

<p align="center">
  Desarrollado con ❤️ para <strong>Nuestra Señora del Carmen</strong>
</p>
