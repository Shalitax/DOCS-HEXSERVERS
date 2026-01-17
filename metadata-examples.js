/**
 * EJEMPLO DE PERSONALIZACIÓN DE METADATA
 * 
 * Este archivo muestra ejemplos de cómo personalizar la metadata
 * para diferentes tipos de páginas.
 */

// ============================================
// EJEMPLO 1: Página de inicio
// ============================================

const homeMetadata = generatePageMetadata({
  title: 'Inicio',
  description: 'Documentación completa de HexServers. Guías, tutoriales y recursos.',
  keywords: ['documentación', 'guías', 'tutoriales', 'minecraft', 'servidor']
});

// ============================================
// EJEMPLO 2: Artículo/Documento con breadcrumb
// ============================================

const articleMetadata = generatePageMetadata({
  title: 'Cómo Configurar el Servidor',
  description: 'Aprende a configurar tu servidor de Minecraft paso a paso con esta guía completa.',
  type: 'article',
  slug: 'docs/minecraft/configuracion/servidor',
  keywords: ['configuración', 'servidor', 'minecraft', 'tutorial'],
  datePublished: '2024-01-15',
  dateModified: '2024-01-17',
  breadcrumb: [
    { name: 'Inicio', url: '/' },
    { name: 'Minecraft', url: '#category-minecraft' },
    { name: 'Configuración', url: '#subcategory-configuracion' },
    { name: 'Servidor', url: '/docs/minecraft/configuracion/servidor' }
  ]
});

// ============================================
// EJEMPLO 3: Página con imagen personalizada
// ============================================

const customImageMetadata = generatePageMetadata({
  title: 'Nuevas Características',
  description: 'Descubre las últimas actualizaciones y características de HexServers.',
  image: '/images/featured/new-features.jpg',
  keywords: ['actualizaciones', 'novedades', 'características']
});

// ============================================
// EJEMPLO 4: Página sin indexación (Admin/Login)
// ============================================

const adminMetadata = generatePageMetadata({
  title: 'Panel de Administración',
  description: 'Acceso restringido al panel de administración',
  robots: 'noindex, nofollow'
});

// ============================================
// EJEMPLO 5: Página de categoría
// ============================================

const categoryMetadata = generatePageMetadata({
  title: 'Guías de Minecraft',
  description: 'Todas las guías relacionadas con servidores de Minecraft.',
  slug: 'category/minecraft',
  keywords: ['minecraft', 'guías', 'tutoriales', 'servidor']
});

// ============================================
// EJEMPLO 6: Página de búsqueda
// ============================================

const searchMetadata = generatePageMetadata({
  title: 'Resultados de Búsqueda',
  description: 'Encuentra la información que necesitas en nuestra documentación.',
  robots: 'noindex, follow' // No indexar búsquedas, pero seguir enlaces
});

// ============================================
// EJEMPLO 7: Página 404
// ============================================

const notFoundMetadata = generatePageMetadata({
  title: 'Página No Encontrada',
  description: 'La página que buscas no existe o ha sido movida.',
  robots: 'noindex, follow'
});

// ============================================
// USO EN RUTAS DE EXPRESS
// ============================================

/*
// Ruta básica
app.get('/', async (req, res) => {
  const pageMetadata = generatePageMetadata({
    title: 'Inicio',
    description: 'Bienvenido a la documentación'
  });

  res.render('index', {
    content: '<h1>Bienvenido</h1>',
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Ruta con artículo y breadcrumb completo
app.get('/docs/:category/:subcategory/:guide', async (req, res) => {
  const { category, subcategory, guide } = req.params;
  
  // Obtener datos de la base de datos
  const doc = await docDb.getBySlug(category, subcategory, guide);
  const categoryData = await categoryDb.getBySlug(category);
  const subcategoryData = await subcategoryDb.getBySlug(subcategory, categoryData?.id);
  
  // Generar breadcrumb
  const breadcrumb = generateBreadcrumb(doc, subcategoryData, categoryData);
  
  // Generar metadata
  const pageMetadata = generatePageMetadata({
    title: doc.title,
    description: doc.content.substring(0, 160),
    type: 'article',
    slug: `docs/${category}/${subcategory}/${guide}`,
    datePublished: doc.created_at,
    dateModified: doc.updated_at,
    breadcrumb
  });

  res.render('index', {
    content: htmlContent,
    title: doc.title,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Ruta de admin (sin indexación)
app.get('/admin/login', requireGuest, (req, res) => {
  const pageMetadata = generatePageMetadata({
    title: 'Login - Admin',
    description: 'Panel de administración',
    robots: 'noindex, nofollow'
  });

  res.render('admin/login', {
    error: null,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});
*/

// ============================================
// PERSONALIZACIÓN AVANZADA
// ============================================

/*
// Modificar configuración global en metadata.js
const metadata = {
  site: {
    name: 'TU SITIO',
    title: 'Tu Título Personalizado',
    description: 'Tu descripción personalizada',
    url: 'https://tu-dominio.com',
    logo: '/images/tu-logo.png',
    favicon: '/images/tu-favicon.ico'
  },
  
  social: {
    twitter: {
      handle: '@tu_usuario',
      card: 'summary_large_image'
    },
    facebook: {
      appId: 'TU_FACEBOOK_APP_ID',
      page: 'https://facebook.com/tu-pagina'
    }
  },
  
  analytics: {
    googleAnalyticsId: 'G-XXXXXXXXXX',
    microsoftClarityId: 'YYYYYYYYYY'
  }
};
*/

// ============================================
// KEYWORDS DINÁMICOS
// ============================================

/*
// Combinar keywords globales con específicos
const dynamicMetadata = generatePageMetadata({
  title: 'Mi Página',
  description: 'Descripción de mi página',
  keywords: ['keyword1', 'keyword2', 'keyword3']
  // Se combinarán con los keywords globales automáticamente
});
*/

// ============================================
// VALIDACIÓN DE METADATA
// ============================================

/*
Herramientas para validar:

1. Google Rich Results Test:
   https://search.google.com/test/rich-results
   
2. Facebook Sharing Debugger:
   https://developers.facebook.com/tools/debug/
   
3. Twitter Card Validator:
   https://cards-dev.twitter.com/validator
   
4. Schema.org Validator:
   https://validator.schema.org/
*/

module.exports = {
  homeMetadata,
  articleMetadata,
  customImageMetadata,
  adminMetadata,
  categoryMetadata,
  searchMetadata,
  notFoundMetadata
};
