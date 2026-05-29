# id_skills: Panel local para instalar, probar y gestionar habilidades de agentes

<!-- README-I18N:START -->

[English](./README.md) | **Español**

<!-- README-I18N:END -->

Administra tus habilidades de OpenCode y Claude Code desde una interfaz web rápida y optimizada.

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
└── README.md            # Guía del proyecto
```

---

## Guía de inicio rápido

### Requisitos previos

Necesitas tener instalados en tu sistema:
*   [Node.js](https://nodejs.org/) (versión 18 o superior)
*   [Git](https://git-scm.com/)

### Cómo poner en marcha el panel

El proyecto incluye un script de PowerShell para iniciar el backend y el frontend al mismo tiempo:

1. Abre PowerShell en la carpeta `skill-dashboard`.
2. Ejecuta el script:
   ```powershell
   ./start.ps1
   ```
3. Entra a `http://localhost:5173` en tu navegador para usar el panel. El backend se ejecutará en segundo plano en `http://localhost:3001`.

---

## Licencia

Este proyecto se distribuye bajo la Licencia MIT.
