# Sistema de Metadata - HexServers Docs

## 📋 Descripción

Sistema centralizado de metadata para SEO, Open Graph, Twitter Cards y datos estructurados (JSON-LD). Toda la configuración está en un archivo separado (`metadata.js`) que se integra automáticamente en todas las páginas.

## 🎯 Características

- ✅ **Meta tags básicos**: title, description, keywords, author, robots
- ✅ **Open Graph**: Para compartir en redes sociales
- ✅ **Twitter Cards**: Tarjetas enriquecidas en Twitter
- ✅ **JSON-LD**: Datos estructurados para motores de búsqueda
- ✅ **Breadcrumbs**: Navegación estructurada
- ✅ **Analytics**: Google Analytics y Microsoft Clarity
- ✅ **Verificación**: Google, Bing, Yandex
- ✅ **Canonical URLs**: URLs canónicas para evitar contenido duplicado

## 📁 Estructura de Archivos

```
metadata.js                    # Configuración centralizada
views/partials/metadata.ejs    # Partial que renderiza las meta tags
server.js                      # Integración con Express
database.js                    # Métodos para breadcrumbs
```

## 🔧 Configuración

### 1. Editar metadata.js

Abre [metadata.js](metadata.js) y configura los valores según tu sitio:

```javascript
const metadata = {
  site: {
    name: 'HexServers Docs',
    title: 'HexServers Documentation',
    description: 'Tu descripción aquí',
    url: 'https://tu-dominio.com',
    logo: '/images/logo.png',
    favicon: '/images/favicon.ico'
  },
  
  author: {
    name: 'Tu Nombre',
    email: 'tu@email.com',
    url: 'https://tu-sitio.com'
  },
  
  social: {
    twitter: {
      handle: '@tu_usuario',
      card: 'summary_large_image'
    },
    facebook: {
      appId: 'TU_APP_ID',
      page: 'https://facebook.com/tu-pagina'
    },
    discord: 'https://discord.gg/tu-server',
    github: 'https://github.com/tu-usuario'
  },
  
  // ... más configuraciones
};
```

### 2. Analytics (Opcional)

Para activar Google Analytics o Microsoft Clarity:

```javascript
analytics: {
  googleAnalyticsId: 'G-XXXXXXXXXX',  // Tu ID de GA4
  microsoftClarityId: 'XXXXXXXXXX'    // Tu ID de Clarity
}
```

### 3. Verificación de Sitios (Opcional)

Para verificar tu sitio en motores de búsqueda:

```javascript
verification: {
  google: 'tu-codigo-de-verificacion-google',
  bing: 'tu-codigo-de-verificacion-bing',
  yandex: 'tu-codigo-de-verificacion-yandex'
}
```

## 💻 Uso en el Código

### Uso Básico

El sistema ya está integrado en todas las rutas. Solo necesitas pasar la metadata:

```javascript
// En server.js
app.get('/tu-ruta', async (req, res) => {
  const pageMetadata = generatePageMetadata({
    title: 'Título de la Página',
    description: 'Descripción de la página',
    keywords: ['keyword1', 'keyword2']
  });

  res.render('tu-vista', {
    // ... otros datos
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});
```

### Página de Artículo con Breadcrumb

Para páginas de documentación con breadcrumb:

```javascript
const doc = await docDb.getBySlug(category, subcategory, guide);
const categoryData = await categoryDb.getBySlug(category);
const subcategoryData = await subcategoryDb.getBySlug(subcategory, categoryData?.id);

const breadcrumb = generateBreadcrumb(doc, subcategoryData, categoryData);

const pageMetadata = generatePageMetadata({
  title: doc.title,
  description: doc.content.substring(0, 160),
  type: 'article',
  slug: `docs/${category}/${subcategory}/${guide}`,
  datePublished: doc.created_at,
  dateModified: doc.updated_at,
  breadcrumb
});
```

### Página con noindex, nofollow

Para páginas que no quieres indexar (como login):

```javascript
const pageMetadata = generatePageMetadata({
  title: 'Login - Admin',
  description: 'Panel de administración',
  robots: 'noindex, nofollow'
});
```

## 🔍 Funciones Disponibles

### `generatePageMetadata(page)`

Genera metadata completa para una página.

**Parámetros:**
```javascript
{
  title: 'Título',              // Título de la página
  description: 'Descripción',   // Descripción (160 caracteres recomendado)
  keywords: ['key1', 'key2'],   // Keywords adicionales (opcional)
  type: 'article',              // 'website' o 'article' (default: 'website')
  slug: 'path/to/page',         // Slug para URL canónica (opcional)
  image: '/path/image.jpg',     // Imagen específica (opcional)
  datePublished: '2024-01-01',  // Fecha de publicación (solo articles)
  dateModified: '2024-01-02',   // Fecha de modificación (solo articles)
  breadcrumb: [],               // Array de breadcrumbs (opcional)
  robots: 'index, follow'       // Control de indexación (opcional)
}
```

### `generateBreadcrumb(doc, subcategory, category)`

Genera breadcrumb estructurado para JSON-LD.

**Parámetros:**
- `doc`: Objeto del documento
- `subcategory`: Objeto de la subcategoría
- `category`: Objeto de la categoría

**Retorna:** Array de breadcrumbs

### `getBaseMetadata()`

Obtiene la configuración base del sitio (social, analytics, etc.)

## 📊 Metadata Generada

### Meta Tags HTML

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="...">
<meta name="keywords" content="...">
<meta name="author" content="...">
<meta name="robots" content="...">
<link rel="canonical" href="...">
```

### Open Graph

```html
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="HexServers Docs">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="...">
<meta property="og:image" content="...">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

### Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@hexservers">
<meta name="twitter:creator" content="@hexservers">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
```

### JSON-LD (Structured Data)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "url": "...",
  "author": {...},
  "datePublished": "...",
  "dateModified": "...",
  "breadcrumb": {...}
}
</script>
```

## 🎨 Vista (EJS)

En tus vistas, el partial se incluye automáticamente si existen `metadata` y `baseMetadata`:

```html
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <% if (typeof metadata !== 'undefined' && typeof baseMetadata !== 'undefined') { %>
    <%- include('partials/metadata') %>
  <% } else { %>
    <!-- Fallback básico -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
  <% } %>
  
  <!-- CSS y JS -->
  <link href="/css/output.css" rel="stylesheet">
  <!-- ... -->
</head>
```

## 🧪 Validación

### Herramientas de Prueba

1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Valida datos estructurados

2. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Valida Open Graph

3. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Valida Twitter Cards

4. **Schema.org Validator**
   - https://validator.schema.org/
   - Valida JSON-LD

## 📝 Mejores Prácticas

### Títulos (Title)
- **Longitud ideal**: 50-60 caracteres
- **Formato**: "Página | Sitio" (automático)
- **Único**: Cada página debe tener un título único

### Descripciones (Description)
- **Longitud ideal**: 150-160 caracteres
- **Contenido**: Resume el contenido de la página
- **Call-to-action**: Incluye una acción si es apropiado

### Keywords
- **Cantidad**: 5-10 keywords relevantes
- **Relevancia**: Solo keywords relacionadas con el contenido
- **No spam**: Evita repetir la misma keyword muchas veces

### Imágenes Open Graph
- **Dimensiones**: 1200x630px (ratio 1.91:1)
- **Formato**: JPG o PNG
- **Peso**: < 8MB
- **Contenido**: Incluye el logo y título cuando sea posible

### Robots
- **Páginas públicas**: `index, follow`
- **Páginas admin**: `noindex, nofollow`
- **Páginas de prueba**: `noindex, nofollow`

## 🚀 Producción

### Checklist antes de lanzar

- [ ] Configura la URL real del sitio en `metadata.site.url`
- [ ] Sube imagen Open Graph (1200x630px) a `/public/images/og-image.png`
- [ ] Configura Google Analytics si lo usas
- [ ] Configura Microsoft Clarity si lo usas
- [ ] Verifica el sitio en Google Search Console
- [ ] Verifica el sitio en Bing Webmaster Tools
- [ ] Prueba con todas las herramientas de validación
- [ ] Crea un sitemap.xml
- [ ] Crea un robots.txt

### robots.txt recomendado

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://tu-dominio.com/sitemap.xml
```

## 🐛 Troubleshooting

### Las meta tags no aparecen

Verifica que estés pasando `metadata` y `baseMetadata` a la vista:

```javascript
res.render('tu-vista', {
  metadata: pageMetadata,
  baseMetadata: getBaseMetadata()
});
```

### Error "metadata is not defined"

Asegúrate de importar las funciones en server.js:

```javascript
const { generatePageMetadata, generateBreadcrumb, getBaseMetadata } = require('./metadata');
```

### Open Graph no muestra la imagen correcta

1. Verifica que la imagen exista en `/public/images/og-image.png`
2. La imagen debe ser accesible públicamente
3. Usa la herramienta de Facebook para limpiar la caché

### JSON-LD con errores

Usa el validador de Schema.org para identificar el problema:
https://validator.schema.org/

## 📚 Recursos Adicionales

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Meta Tags Best Practices](https://moz.com/learn/seo/meta-description)

## 🤝 Contribuir

Si encuentras algún problema o quieres mejorar el sistema:

1. Abre un issue
2. Propón una mejora
3. Documenta los cambios

---

**Última actualización**: Enero 2026
**Versión**: 1.0.0
