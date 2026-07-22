# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [1.0.3] - 2026-07-21

### Added
- **Background Remover Tool:** Nueva herramienta interactiva para remover fondos y preparar imagenes desde el navegador.
  - Permite remover fondos planos de forma automatica usando el color detectado en los bordes de la imagen.
  - Soporte para elegir manualmente el color de fondo a remover y ajustar la tolerancia del recorte.
  - Opcion para convertir la imagen completa a un solo color configurable.
  - Opcion para agregar un fondo solido despues de remover el fondo original.
  - Exportacion directa a PNG con transparencia o fondo final aplicado.
  - **Workflows de CI/CD y notificaciones**: Configuración de `deploy.yml` para despliegues en GitHub Pages y `branch-build-notifications.yml` para builds de ramas, ambos con notificaciones a Slack y estado de SonarCloud.

### Changed
- **Background Remover Tool:** Mejora del algoritmo de remocion de fondo con tolerancia mas alta por defecto, suavizado de bordes y regeneracion automatica de la previsualizacion al cambiar opciones.
- **Navigation:** Se agrego acceso a Background Remover desde el dashboard y el menu de herramientas de fotografia.

## [1.0.2] - 2026-07-16

### Added
- **Photo Metadata Tool:** Nueva herramienta interactiva para extraer y visualizar metadatos EXIF de fotografías e imágenes.
  - Soporte para analizar imágenes y leer metadatos detallados (dispositivo, ubicación GPS, fechas, parámetros de la cámara, etc.).
  - Vista amigable para la información y mapa interactivo integrado para datos de geolocalización.
  - Interfaz moderna y responsiva utilizando componentes nativos de PrimeReact.

### Changed
- **JWT Tool:** Mejoras y optimizaciones generales en la herramienta.

## [1.0.1] - 2026-07-14

### Added
- **JWT Encoder/Decoder Tool:** A complete interface similar to jwt.io for JSON Web Tokens.
  - Interactive Encoder and Decoder modes with a toggle switch.
  - Support for multiple symmetric and asymmetric algorithms (HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512, PS256, PS384, PS512).
  - Colorized visual representation of tokens (Header, Payload, Signature).
  - Built-in signature verification with real-time feedback.
  - Capability to sign tokens using user-provided secrets, public, and private keys (PEM format).
  - Mobile-responsive design integrating PrimeReact native UI components.

## [1.0.0] - 2026-07-14

### Añadido
- **Base64 Decoder**: Herramienta para decodificar cadenas Base64 y exportar su contenido directamente como un archivo `.xlsx`, `.xls`, o `.csv`.
- **Cédula Ecuador**: Generador de lotes de cédulas de identidad ecuatorianas válidas (por provincia) y validador algorítmico (dígito verificador de módulo 10).
- **Text to Speech**: Utilidad de síntesis de voz en el navegador.
- **Modo Oscuro/Claro**: Sistema de temas nativo apoyado en variables de PrimeReact, persistente vía localStorage.
- **Enrutamiento**: Arquitectura de aplicación de una sola página (SPA) usando `react-router-dom` con `HashRouter` para asegurar compatibilidad total y sin errores 404 al desplegar en GitHub Pages.
- **Automatización**: Configuración y workflow de GitHub Actions integrado para despliegues continuos automatizados hacia GitHub Pages.
- **Licencia**: Inclusión de Licencia MIT estándar y README descriptivo.

### Optimizado
- Diseño de interfaces refactorizado y limpiado usando `PrimeFlex`.
- Errores de linting de JavaScript solucionados siguiendo los mejores estándares de desarrollo (usando métodos seguros para generación de random, iteraciones modernas del DOM, atributos de accesibilidad).
