# id_skills: Panel local para instalar, probar y gestionar habilidades de agentes

<!-- README-I18N:START -->

**Español** | [English](./README.en.md)

<!-- README-I18N:END -->

Administra tus habilidades de OpenCode y Claude Code desde una interfaz web rápida y optimizada, o bien utilizando la **aplicación de escritorio nativa para Windows** (con un solo clic y actualizaciones automáticas).

> [!TIP]
> **¿Prefieres la comodidad de un programa instalable?** 
> Ve a la sección de **[Releases en GitHub](https://github.com/eatsangels/id_skills/releases)**, descarga el archivo ejecutable (`.exe`) de la última versión e instálalo. Se iniciará de forma autónoma con su propio backend en segundo plano y te notificará automáticamente cuando haya nuevas actualizaciones disponibles.

---

## 💻 Aplicación de Escritorio (Desktop App)

El proyecto cuenta con un modo de ejecución dual: un panel de control web tradicional y una aplicación de escritorio nativa que auto-inicia todos los servicios del backend en segundo plano.

### Descarga e Instalación (Recomendado)
1. Ve a **[Releases en GitHub](https://github.com/eatsangels/id_skills/releases)**.
2. Descarga la versión más reciente del instalador: `ID.Skills.Dashboard.Setup.X.X.X.exe`.
3. Ejecuta el archivo e instálalo. Se creará un acceso directo en tu escritorio.
4. Al iniciar la aplicación, esta levantará automáticamente el servidor y los servicios locales. No necesitas abrir la consola ni iniciar scripts.

### Comandos de Desarrollo (Escritorio)
Si deseas trabajar en el desarrollo de la aplicación o empaquetarla tú mismo:
* **Iniciar en modo desarrollo (Hot-reload para frontend y backend):**
  ```bash
  npm run dev:electron
  ```
* **Compilar y generar el instalador (.exe) de producción:**
  ```bash
  npm run package:dist
  ```

---

## Beneficios clave

*   **Instalación instantánea y sin errores**: Agrega nuevas habilidades en segundos usando `npx skills add` o mediante el buscador integrado que resuelve de forma automática las rutas reales de GitHub.
*   **Playground interactivo**: Prueba instrucciones directamente en la terminal web y observa la respuesta y ejecución del agente en tiempo real.
*   **Diseño enfocado en el desarrollador**: Interfaz oscura de alto contraste basada en las directrices de *brandkit* que reduce la fatiga visual y destaca la información importante.
*   **Idioma recordado automáticamente**: El panel guarda tu preferencia de idioma (español o inglés) para que no tengas que cambiarla cada vez que abres un agente o habilidad.
*   **Métricas claras al inicio**: Visualiza de inmediato el número exacto de agentes, habilidades, frameworks y modos de ejecución activos.

---

## Estructura del proyecto

```bash
id_skills/
├── skill-dashboard/     # Código fuente del panel de control
│   ├── frontend/        # React + Vite (Tailwind CSS v4)
│   └── backend/         # Node.js + Express (Servicios de escaneo y terminal interactiva)
├── electron-main.js     # Proceso principal de Electron (Ventana y auto-actualizador)
├── package.json         # Configuración del proyecto, dependencias y scripts de construcción
└── README.md            # Guía del proyecto
```

---

## Guía de inicio rápido (Modo Web)

### Requisitos previos

Necesitas tener instalados en tu sistema:
*   [Node.js](https://nodejs.org/) (versión 18 o superior)
*   [Git](https://git-scm.com/)

### Cómo poner en marcha el panel web
Si decides correr la versión web en lugar de instalar la aplicación de escritorio:

1. Abre PowerShell en la carpeta `skill-dashboard`.
2. Ejecuta el script:
   ```powershell
   ./start.ps1
   ```
3. Entra a `http://localhost:5173` en tu navegador para usar el panel. El backend se ejecutará en segundo plano en `http://localhost:3001`.

---

## Licencia

Este proyecto se distribuye bajo la Licencia MIT.
