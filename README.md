# Linker Corp - Utils

Bienvenido al repositorio de utilidades y herramientas web de **Linker Corp**. Esta aplicación proporciona una colección centralizada de herramientas de productividad y desarrollo diseñadas para facilitar las tareas del día a día, con un enfoque en usabilidad, rapidez y diseño limpio.

## 🚀 Herramientas Incluidas

Actualmente, el sistema incluye las siguientes herramientas totalmente operativas desde el navegador sin necesidad de backend:

1. **Decodificador Base64 (a Excel/CSV):** Permite procesar cadenas codificadas en Base64 (típicamente de reportes) y descargarlas directamente en formato `.xlsx`, `.xls` o `.csv`.
2. **Generador y Validador de Cédulas (Ecuador):** Valida algoritmos de Cédulas de Identidad ecuatorianas y genera números de prueba válidos de manera masiva, útil para entornos de Testing (QA).
3. **Text-to-Speech (TTS):** Interfaz para conversión de texto a voz utilizando las APIs nativas del navegador.

## 🛠️ Tecnologías

La aplicación está construida sobre un stack moderno de Frontend:
- **[React 18](https://react.dev/)**
- **[Vite](https://vitejs.dev/)** (Empaquetador y entorno de desarrollo ultra-rápido)
- **[PrimeReact](https://primereact.org/)** (Librería de componentes UI)
- **[PrimeFlex](https://primeflex.org/)** (Sistema de grillas y clases utilitarias CSS)
- **[React Router v6](https://reactrouter.com/)** (Sistema de enrutamiento basado en HashRouter para compatibilidad estática)

## 📦 Instalación y Desarrollo Local

El proyecto está diseñado para funcionar de manera ágil. Para levantarlo en tu entorno local:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Linker-Corp/utils.git
   ```
2. Navega al directorio de la aplicación frontend:
   ```bash
   cd utils/frontend
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador `http://localhost:5173`.

## 🌐 Despliegue Automatizado

El proyecto incluye un flujo de trabajo (Workflow) de **GitHub Actions**. Al momento de integrar cambios en la rama `master`, GitHub compila la aplicación automáticamente y la publica en **GitHub Pages**.

- Ruta base de despliegue configurada para GitHub Pages: `/utils/`
- Enrutamiento soportado a través de `HashRouter`.

## 📄 Licencia

Este proyecto se encuentra bajo los términos de la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
