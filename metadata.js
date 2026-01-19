/**
 * Metadata Configuration
 * Configuración centralizada de metadata para SEO y redes sociales
 */

const metadata = {
  // Información básica del sitio
  site: {
    name: 'HexServers Docs',
    title: 'HexServers Documentación',
    description: 'Documentación para HexServers',
    url: 'https://docs.hexservers.com'
  },

  // Información del autor
  author: {
    name: 'HexServers'
  },

  // Robots
  robots: {
    index: true,
    follow: true
  }
};

/**
 * Genera metadata completa para una página
 * @param {Object} page - Información específica de la página
 * @returns {Object} - Metadata completa
 */
function generatePageMetadata(page = {}) {
  const title = page.title 
    ? `${page.title} | ${metadata.site.name}` 
    : metadata.site.title;
  
  const description = page.description || metadata.site.description;

  return {
    // Meta tags básicos
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0',
    title,
    description,
    author: metadata.author.name,
    robots: `${metadata.robots.index ? 'index' : 'noindex'}, ${metadata.robots.follow ? 'follow' : 'nofollow'}`
  };
}

/**
 * Obtiene metadata base para todas las páginas
 * @returns {Object}
 */
function getBaseMetadata() {
  return {
    site: metadata.site,
    author: metadata.author
  };
}

module.exports = {
  metadata,
  generatePageMetadata,
  getBaseMetadata
};
