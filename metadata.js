/**
 * Metadata Configuration
 * Configuración centralizada de metadata para SEO y redes sociales
 */

const metadata = {
  // Información básica del sitio
  site: {
    name: 'HexServers Docs',
    title: 'HexServers Documentación',
    description: 'Documentación completa y guías para HexServers. Aprende a configurar, administrar y optimizar tu servidor.',
    url: 'https://docs.hexservers.com',
    logo: '/images/logo.png',
    favicon: '/images/favicon.ico'
  },

  // Información del autor/organización
  author: {
    name: 'HexServers',
    email: 'support@hexservers.com',
    url: 'https://hexservers.com'
  },

  // Redes sociales
  social: {
    twitter: {
      handle: '@hexservers',
      card: 'summary_large_image'
    },
    facebook: {
      appId: '',
      page: 'https://facebook.com/hexservers'
    },
    discord: 'https://discord.gg/hexservers',
    github: 'https://github.com/hexservers'
  },

  // SEO Keywords globales
  keywords: [
    'HexServers',
    'documentación',
    'servidor',
    'hosting',
    'tutoriales',
    'guías',
    'minecraft',
    'game server'
  ],

  // Configuración de Open Graph
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'HexServers Docs',
    image: '/images/og-image.png',
    imageWidth: 1200,
    imageHeight: 630
  },

  // Robots y crawlers
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1
    }
  },

  // Verificación de sitios
  verification: {
    google: '',
    bing: '',
    yandex: ''
  },

  // Analytics (opcional)
  analytics: {
    googleAnalyticsId: '',
    microsoftClarityId: ''
  },

  // Configuración de búsqueda
  search: {
    enabled: true,
    placeholder: 'Buscar en la documentación...',
    noResultsText: 'No se encontraron resultados'
  }
};

/**
 * Genera metadata completa para una página
 * @param {Object} page - Información específica de la página
 * @returns {Object} - Metadata completa
 */
function generatePageMetadata(page = {}) {
  const baseUrl = metadata.site.url;
  const title = page.title 
    ? `${page.title} | ${metadata.site.name}` 
    : metadata.site.title;
  
  const description = page.description || metadata.site.description;
  const keywords = page.keywords 
    ? [...metadata.keywords, ...page.keywords]
    : metadata.keywords;
  
  const url = page.slug 
    ? `${baseUrl}/${page.slug}` 
    : baseUrl;
  
  const image = page.image || `${baseUrl}${metadata.openGraph.image}`;

  return {
    // Meta tags básicos
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0',
    title,
    description,
    keywords: keywords.join(', '),
    author: metadata.author.name,
    robots: generateRobotsContent(),

    // Canonical URL
    canonical: url,

    // Open Graph
    og: {
      type: page.type || metadata.openGraph.type,
      locale: metadata.openGraph.locale,
      siteName: metadata.openGraph.siteName,
      title,
      description,
      url,
      image,
      imageWidth: metadata.openGraph.imageWidth,
      imageHeight: metadata.openGraph.imageHeight
    },

    // Twitter Card
    twitter: {
      card: metadata.social.twitter.card,
      site: metadata.social.twitter.handle,
      creator: metadata.social.twitter.handle,
      title,
      description,
      image
    },

    // Structured Data (JSON-LD)
    structuredData: generateStructuredData(page, url),

    // Links adicionales
    links: {
      logo: `${baseUrl}${metadata.site.logo}`,
      favicon: `${baseUrl}${metadata.site.favicon}`
    }
  };
}

/**
 * Genera contenido para robots meta tag
 * @returns {String}
 */
function generateRobotsContent() {
  const { index, follow, googleBot } = metadata.robots;
  const parts = [];
  
  parts.push(index ? 'index' : 'noindex');
  parts.push(follow ? 'follow' : 'nofollow');
  
  if (googleBot.maxSnippet !== undefined) {
    parts.push(`max-snippet:${googleBot.maxSnippet}`);
  }
  if (googleBot.maxImagePreview) {
    parts.push(`max-image-preview:${googleBot.maxImagePreview}`);
  }
  if (googleBot.maxVideoPreview !== undefined) {
    parts.push(`max-video-preview:${googleBot.maxVideoPreview}`);
  }
  
  return parts.join(', ');
}

/**
 * Genera datos estructurados (JSON-LD)
 * @param {Object} page - Información de la página
 * @param {String} url - URL de la página
 * @returns {Object}
 */
function generateStructuredData(page, url) {
  const data = {
    '@context': 'https://schema.org',
    '@type': page.type === 'article' ? 'Article' : 'WebPage',
    headline: page.title || metadata.site.title,
    description: page.description || metadata.site.description,
    url: url,
    publisher: {
      '@type': 'Organization',
      name: metadata.author.name,
      logo: {
        '@type': 'ImageObject',
        url: `${metadata.site.url}${metadata.site.logo}`
      }
    }
  };

  if (page.type === 'article') {
    data.author = {
      '@type': 'Organization',
      name: metadata.author.name
    };
    
    if (page.datePublished) {
      data.datePublished = page.datePublished;
    }
    
    if (page.dateModified) {
      data.dateModified = page.dateModified;
    }
  }

  // Breadcrumb si existe
  if (page.breadcrumb && page.breadcrumb.length > 0) {
    data.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${metadata.site.url}${item.url}`
      }))
    };
  }

  return data;
}

/**
 * Genera breadcrumb para una página de documentación
 * @param {Object} doc - Documento
 * @param {Object} subcategory - Subcategoría
 * @param {Object} category - Categoría
 * @returns {Array}
 */
function generateBreadcrumb(doc, subcategory, category) {
  const breadcrumb = [
    { name: 'Inicio', url: '/' }
  ];

  if (category) {
    breadcrumb.push({
      name: category.display_name,
      url: `#category-${category.slug}`
    });
  }

  if (subcategory) {
    breadcrumb.push({
      name: subcategory.display_name,
      url: `#subcategory-${subcategory.slug}`
    });
  }

  if (doc) {
    breadcrumb.push({
      name: doc.title,
      url: `/docs/${doc.slug}`
    });
  }

  return breadcrumb;
}

/**
 * Obtiene metadata base para todas las páginas
 * @returns {Object}
 */
function getBaseMetadata() {
  return {
    site: metadata.site,
    author: metadata.author,
    social: metadata.social,
    verification: metadata.verification,
    analytics: metadata.analytics,
    search: metadata.search
  };
}

module.exports = {
  metadata,
  generatePageMetadata,
  generateBreadcrumb,
  getBaseMetadata,
  generateRobotsContent,
  generateStructuredData
};
