# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

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
