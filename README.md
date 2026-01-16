# 📚 HexServers Documentation - CMS Completo

Sitio de documentación moderno con tema glass negro, construido con Node.js, Express, Tailwind CSS y **sistema de administración completo con SQLite**.

## ✨ Características

- 🎨 Diseño glass moderno con tema negro
- 📝 Soporte completo para Markdown
- 🔍 Búsqueda en tiempo real
- 📂 Categorías y subcategorías organizadas
- 🎭 Animaciones suaves
- 📱 Totalmente responsive
- ⚡ Rápido y ligero
- 🔐 **Sistema de autenticación con sesiones**
- 💾 **Base de datos SQLite local**
- ✏️ **Panel de administración completo**
- 🚀 **Edición en tiempo real desde la página principal**
- 📊 **CRUD completo de documentación y categorías**

## 🚀 Instalación

### Requisitos Previos

- Node.js 14.x o superior
- npm o yarn

### Pasos de Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Compilar CSS de Tailwind**
```bash
npm run build:css
```

3. **Iniciar el servidor**
```bash
npm start
```

El servidor iniciará automáticamente la base de datos y creará un usuario admin por defecto.

O para desarrollo con auto-reload:
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 🔐 Panel de Administración

### Acceso

- **URL**: http://localhost:3000/admin
- **Usuario por defecto**: `admin`
- **Contraseña por defecto**: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña por defecto en producción.

### Funcionalidades del Admin

#### 📊 Dashboard
- Ver estadísticas de documentación
- Acceso rápido a funciones principales
- Lista de documentación reciente

#### 📝 Gestión de Documentación
- ✅ **Crear** nueva documentación con Markdown
- ✅ **Editar** documentación existente
- ✅ **Eliminar** documentación
- ✅ **Organizar** con orden personalizado
- ✅ **Previsualización** en tiempo real

#### 📂 Gestión de Categorías
- ✅ **Crear** categorías y subcategorías
- ✅ **Editar** estructura de navegación
- ✅ **Eliminar** (con confirmación)
- ✅ **Personalizar** iconos de Font Awesome
- ✅ **Ordenar** categorías

#### ✏️ Edición en Tiempo Real
Cuando estás logueado como admin:
- Aparece botón "Editar Documento" en cada guía
- Editor de Markdown integrado
- Guardar cambios sin salir de la página
- Vista previa instantánea

## 📁 Estructura del Proyecto

```
DOCS HEXSERVERS/
├── .github/
│   └── copilot-instructions.md
├── middleware/
│   └── auth.js                # Middleware de autenticación
├── public/
│   ├── css/
│   │   ├── input.css          # Tailwind source
│   │   └── output.css         # Compiled CSS
│   └── js/
│       ├── main.js            # JavaScript del cliente
│       └── admin-categories.js # JS para gestión de categorías
├── views/
│   ├── admin/
│   │   ├── login.ejs          # Página de login
│   │   ├── dashboard.ejs      # Dashboard principal
│   │   ├── docs.ejs           # Lista de documentación
│   │   ├── doc-form.ejs       # Formulario crear/editar
│   │   └── categories.ejs     # Gestión de categorías
│   └── index.ejs              # Template principal del sitio
├── database.js                # Funciones de base de datos
├── migrate.js                 # Script de migración MD → DB
├── server.js                  # Servidor Express
├── hexservers.db              # Base de datos SQLite (generada)
├── sessions.db                # Base de datos de sesiones (generada)
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 📝 Agregar Nuevas Guías

### Desde el Panel de Admin (Recomendado)

1. Ir a http://localhost:3000/admin
2. Click en "Nueva Documentación"
3. Llenar el formulario:
   - **Título**: Nombre de la guía
   - **Slug**: URL amigable (se genera automáticamente)
   - **Categoría**: Seleccionar categoría existente
   - **Subcategoría**: Seleccionar subcategoría
   - **Descripción**: Breve descripción
   - **Contenido**: Markdown completo
   - **Orden**: Número para ordenar (0 = primero)
4. Click en "Crear"

### Mediante Script de Migración

1. Crea archivos `.md` en la estructura:
   ```
   docs/categoria/subcategoria/guia.md
   ```

2. Añade frontmatter al inicio:
   ```markdown
   ---
   title: Título de tu Guía
   description: Descripción breve
   ---

   # Tu contenido aquí
   ```

3. Ejecuta el script de migración:
   ```bash
   node migrate.js
   ```

## 🎨 Personalización

### Colores y Tema

Edita `tailwind.config.js` para cambiar colores:

```javascript
theme: {
  extend: {
    colors: {
      glass: {
        dark: 'rgba(0, 0, 0, 0.7)',
        // Personaliza aquí
      }
    }
  }
}
```

### Estilos CSS

Modifica `public/css/input.css` para estilos personalizados.

### Animaciones

Las animaciones están definidas en:
- `tailwind.config.js` (animaciones de Tailwind)
- `public/js/main.js` (animaciones JavaScript)

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Desarrollo con nodemon (auto-reload)
npm run build:css  # Compilar Tailwind CSS (modo watch)
```

## 🌐 Despliegue

### Variables de Entorno

Crea un archivo `.env` (opcional):

```env
PORT=3000
NODE_ENV=production
```

### Producción

1. Instalar dependencias de producción:
```bash
npm install --production
```

2. Compilar CSS:
```bash
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify
```

3. Iniciar servidor:
```bash
node server.js
```

### PM2 (Recomendado)

```bash
npm install -g pm2
pm2 start server.js --name hexservers-docs
pm2 save
pm2 startup
```

## 📱 Características Principales

### Búsqueda

- Búsqueda en tiempo real
- Búsqueda por título y contenido
- Resultados organizados por categoría

### Navegación

- Sidebar con categorías colapsables
- Highlight de página actual
- Navegación responsive para móviles

### Markdown

Soporta:
- Headers (h1-h6)
- Listas (ordenadas y no ordenadas)
- Bloques de código con syntax highlighting
- Tablas
- Blockquotes
- Enlaces e imágenes
- Y más...

## 🎯 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **EJS** - Motor de plantillas
- **Tailwind CSS** - Framework CSS
- **Markdown-it** - Parser de Markdown
- **Gray-matter** - Parser de frontmatter
- **Font Awesome** - Iconos

## 🐛 Troubleshooting

### CSS no se ve correctamente

Asegúrate de ejecutar el script de build:
```bash
npm run build:css
```

### Puerto en uso

Cambia el puerto en `server.js` o usa variable de entorno:
```bash
PORT=3001 npm start
```

### Guías no aparecen

Verifica:
1. Los archivos `.md` están en `docs/`
2. Tienen el frontmatter correcto
3. La estructura de carpetas es correcta

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - siéntete libre de usar este proyecto.

## 📞 Soporte

Para soporte:
- 📧 Email: soporte@hexservers.com
- 💬 Discord: [Tu servidor]
- 📚 Docs: http://localhost:3000

## 🎉 Créditos

Desarrollado con ❤️ por HexServers

---

**¿Listo para comenzar?** Ejecuta `npm install` y `npm start` para ver tu documentación en acción.
