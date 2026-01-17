# 📋 Checklist de Metadata para Producción

## 🔧 Configuración Básica

### metadata.js

- [ ] **URL del sitio**
  - Cambiar `https://docs.hexservers.com` por tu dominio real
  - Ubicación: `metadata.site.url`

- [ ] **Nombre del sitio**
  - Verificar que `metadata.site.name` sea correcto
  - Verificar que `metadata.site.title` sea correcto

- [ ] **Descripción del sitio**
  - Actualizar `metadata.site.description`
  - Longitud recomendada: 150-160 caracteres

- [ ] **Información de contacto**
  - Actualizar `metadata.author.name`
  - Actualizar `metadata.author.email`
  - Actualizar `metadata.author.url`

---

## 📱 Redes Sociales

### Twitter
- [ ] Actualizar `metadata.social.twitter.handle` con tu usuario
- [ ] Verificar `metadata.social.twitter.card` (summary_large_image recomendado)

### Facebook
- [ ] Actualizar `metadata.social.facebook.page` con tu página
- [ ] (Opcional) Agregar `metadata.social.facebook.appId`

### Otras Redes
- [ ] Actualizar `metadata.social.discord` con tu servidor
- [ ] Actualizar `metadata.social.github` con tu usuario/organización

---

## 🖼️ Imágenes

### Favicon
- [ ] Subir favicon a `/public/images/favicon.ico`
- [ ] Tamaño: 16x16, 32x32, 48x48
- [ ] Formato: ICO o PNG

### Logo
- [ ] Subir logo a `/public/images/logo.png`
- [ ] Fondo transparente recomendado
- [ ] Formato: PNG

### Open Graph Image
- [ ] Subir imagen a `/public/images/og-image.png`
- [ ] Dimensiones: **1200x630px** (ratio 1.91:1)
- [ ] Peso: < 8MB
- [ ] Formato: JPG o PNG
- [ ] Incluir logo y título del sitio

**Herramientas para crear OG Image:**
- [Canva](https://www.canva.com/)
- [Figma](https://www.figma.com/)
- [OG Image Generator](https://og-image.vercel.app/)

---

## 📊 Analytics

### Google Analytics (Opcional)
- [ ] Crear cuenta en [Google Analytics](https://analytics.google.com/)
- [ ] Obtener ID de medición (G-XXXXXXXXXX)
- [ ] Agregar a `metadata.analytics.googleAnalyticsId`

### Microsoft Clarity (Opcional)
- [ ] Crear proyecto en [Microsoft Clarity](https://clarity.microsoft.com/)
- [ ] Obtener ID del proyecto
- [ ] Agregar a `metadata.analytics.microsoftClarityId`

---

## ✅ Verificación de Sitios

### Google Search Console
1. [ ] Ir a [Google Search Console](https://search.google.com/search-console)
2. [ ] Agregar tu propiedad
3. [ ] Obtener código de verificación
4. [ ] Agregar a `metadata.verification.google`
5. [ ] Verificar el sitio

### Bing Webmaster Tools
1. [ ] Ir a [Bing Webmaster](https://www.bing.com/webmasters)
2. [ ] Agregar tu sitio
3. [ ] Obtener código de verificación
4. [ ] Agregar a `metadata.verification.bing`
5. [ ] Verificar el sitio

### Yandex (Opcional)
1. [ ] Ir a [Yandex Webmaster](https://webmaster.yandex.com/)
2. [ ] Agregar tu sitio
3. [ ] Obtener código de verificación
4. [ ] Agregar a `metadata.verification.yandex`

---

## 🔍 SEO Adicional

### Keywords
- [ ] Revisar keywords globales en `metadata.keywords`
- [ ] Asegurarse de que sean relevantes
- [ ] 5-10 keywords recomendadas

### Robots
- [ ] Verificar configuración de `metadata.robots`
- [ ] Páginas públicas: `index: true, follow: true`
- [ ] Páginas admin: Agregar `noindex, nofollow` en rutas específicas

---

## 📄 Archivos Adicionales

### robots.txt
- [ ] Crear archivo `robots.txt` en `/public/`
  
```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://tu-dominio.com/sitemap.xml
```

### sitemap.xml
- [ ] Generar sitemap.xml
- [ ] Agregar a `/public/sitemap.xml`
- [ ] Actualizar URL en robots.txt
- [ ] Subir a Google Search Console

**Herramientas para generar sitemap:**
- [XML-Sitemaps.com](https://www.xml-sitemaps.com/)
- [Sitemap Generator](https://www.mysitemapgenerator.com/)
- Instalar paquete: `npm install sitemap`

---

## 🧪 Pruebas y Validación

### Open Graph
- [ ] Probar en [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Verificar imagen, título y descripción
- [ ] Limpiar caché si es necesario

### Twitter Cards
- [ ] Probar en [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] Verificar que la tarjeta se muestre correctamente

### Schema.org / JSON-LD
- [ ] Validar en [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Validar en [Schema.org Validator](https://validator.schema.org/)
- [ ] Verificar breadcrumbs
- [ ] Verificar datos estructurados de artículos

### General
- [ ] Probar metadata en todas las páginas principales:
  - [ ] Página de inicio (/)
  - [ ] Páginas de documentos (/docs/...)
  - [ ] Página 404
  - [ ] Páginas admin (verificar noindex)

### Responsive
- [ ] Verificar que las imágenes OG se vean bien en móvil
- [ ] Probar compartiendo en diferentes plataformas

---

## 🚀 Antes del Lanzamiento

### Configuración
- [ ] Cambiar `SESSION_SECRET` en producción
- [ ] Cambiar contraseña del admin
- [ ] Configurar variables de entorno
- [ ] Cambiar URL del sitio a producción

### Metadata
- [ ] Verificar todas las URLs canónicas
- [ ] Verificar que todas las rutas incluyan metadata
- [ ] Probar metadata en navegador (inspeccionar elementos)

### Performance
- [ ] Optimizar imágenes (OG image, logo, favicon)
- [ ] Minificar CSS/JS si es necesario
- [ ] Configurar caché de assets estáticos

---

## 📱 Post-Lanzamiento

### Monitoreo
- [ ] Verificar Google Analytics después de 24h
- [ ] Verificar Microsoft Clarity después de 24h
- [ ] Revisar errores en Google Search Console
- [ ] Revisar cobertura de indexación

### Redes Sociales
- [ ] Compartir una página de prueba en Facebook
- [ ] Compartir una página de prueba en Twitter
- [ ] Verificar que las previsualizaciones se vean correctas

### SEO
- [ ] Enviar sitemap a Google Search Console
- [ ] Enviar sitemap a Bing Webmaster Tools
- [ ] Monitorear posiciones en buscadores

---

## 🔄 Mantenimiento

### Mensual
- [ ] Revisar métricas de Analytics
- [ ] Revisar rendimiento en Search Console
- [ ] Actualizar contenido si es necesario

### Trimestral
- [ ] Actualizar keywords si es necesario
- [ ] Revisar y actualizar descripciones
- [ ] Optimizar imágenes OG si es necesario

### Anual
- [ ] Revisar toda la configuración de metadata
- [ ] Actualizar información de contacto
- [ ] Revisar enlaces de redes sociales

---

## 🆘 Troubleshooting

### Metadata no aparece
1. Verificar que se pasen `metadata` y `baseMetadata` a la vista
2. Verificar que el partial esté incluido correctamente
3. Limpiar caché del navegador

### Open Graph no funciona
1. Verificar URL completa de la imagen (debe ser absoluta)
2. Verificar que la imagen sea accesible públicamente
3. Usar Facebook Debugger para limpiar caché
4. Verificar dimensiones de la imagen (1200x630px)

### Analytics no registra visitas
1. Verificar que el ID sea correcto
2. Esperar 24-48 horas para los primeros datos
3. Verificar que no haya AdBlockers
4. Comprobar en modo incógnito

---

## 📚 Recursos

- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Moz SEO Guide](https://moz.com/beginners-guide-to-seo)

---

**Fecha de última revisión**: _________________

**Revisado por**: _________________

**Notas adicionales**:
_______________________________________________
_______________________________________________
_______________________________________________
