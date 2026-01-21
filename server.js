const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const bodyParser = require('body-parser');
const { minify } = require('html-minifier');
const rateLimit = require('express-rate-limit');

const { initDatabase, createDefaultAdmin, userDb, categoryDb, subcategoryDb, docDb, settingsDb } = require('./database');
const { requireAuth, requireGuest, passUser } = require('./middleware/auth');
const { generatePageMetadata, getBaseMetadata } = require('./metadata');

const app = express();
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

const PORT = process.env.PORT || 3000;

// Función de logging mejorada
function logError(context, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = error.message || error;
  const stack = error.stack || '';
  
  if (process.env.NODE_ENV === 'production') {
    // En producción, log estructurado sin stack trace
    console.error(JSON.stringify({
      timestamp,
      level: 'error',
      context,
      message: errorMessage
    }));
  } else {
    // En desarrollo, log detallado con stack trace
    console.error(`[${timestamp}] ERROR in ${context}:`, errorMessage);
    if (stack) console.error(stack);
  }
}

function logInfo(message) {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({
      timestamp,
      level: 'info',
      message
    }));
  } else {
    console.log(`[${timestamp}] INFO:`, message);
  }
}

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sesiones
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: __dirname
  }),
  secret: process.env.SESSION_SECRET || 'hexservers-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    httpOnly: true
  }
}));

// Middleware para pasar información del usuario a las vistas
app.use(passUser);

// Middleware para minificar HTML y eliminar comentarios (solo en producción)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, options, callback) {
      originalRender.call(this, view, options, (err, html) => {
        if (err) return callback ? callback(err) : next(err);
        
        try {
          const minified = minify(html, {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: false,
            minifyJS: true,
            minifyCSS: true
          });
          callback ? callback(null, minified) : res.send(minified);
        } catch (minifyErr) {
          logError('HTML Minification', minifyErr);
          callback ? callback(null, html) : res.send(html);
        }
      });
    };
    next();
  });
}

// ===== FUNCIONES AUXILIARES =====

// Helper para renderizar con metadata y logo settings
async function renderWithMetadata(res, view, data, metadataOptions) {
  const pageMetadata = generatePageMetadata(metadataOptions);
  const logoSettings = {
    logo_type: await settingsDb.get('logo_type') || 'text',
    logo_text: await settingsDb.get('logo_text') || 'HexServers Docs',
    logo_url: await settingsDb.get('logo_url') || ''
  };
  
  res.render(view, {
    ...data,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata(),
    logoSettings
  });
}

// Función auxiliar para construir árbol de subcategorías (reutilizable)
async function buildSubcategoryTree(subcategories, parentId, categoryId, includeHidden = false, includeDocs = false) {
  const subs = parentId 
    ? subcategories.filter(s => s.parent_subcategory_id === parentId)
    : subcategories.filter(s => s.category_id === categoryId && !s.parent_subcategory_id);
  
  const result = [];
  
  for (const sub of subs) {
    // Saltar subcategorías ocultas si no se requieren
    if (!includeHidden && sub.is_hidden) continue;
    
    const subcategoryData = {
      id: sub.id,
      name: sub.name,
      display_name: sub.display_name,
      slug: sub.slug,
      icon: sub.icon,
      icon_type: sub.icon_type || 'fontawesome',
      order_index: sub.order_index,
      is_hidden: sub.is_hidden,
      parent_subcategory_id: sub.parent_subcategory_id,
      category_id: sub.category_id,
      subcategories: []
    };
    
    // Recursivamente obtener sub-subcategorías
    subcategoryData.subcategories = await buildSubcategoryTree(
      subcategories, 
      sub.id, 
      categoryId, 
      includeHidden, 
      includeDocs
    );
    
    // Incluir documentos si se solicita
    if (includeDocs) {
      const docs = await docDb.getBySubcategoryId(sub.id);
      subcategoryData.guides = docs.map(doc => ({
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        path: includeDocs === 'full' ? `${doc.category_slug}/${sub.slug}/${doc.slug}` : undefined
      }));
    }
    
    result.push(subcategoryData);
  }
  
  return result;
}

// Cargar estructura de documentación desde la base de datos
async function loadDocsStructure() {
  try {
    const categories = await categoryDb.getAll();
    const subcategories = await subcategoryDb.getAll();
    const structure = [];

    for (const category of categories) {
      // Saltar categorías ocultas
      if (category.is_hidden) continue;
      
      const categoryData = {
        id: category.id,
        name: category.name,
        display_name: category.display_name,
        slug: category.slug,
        icon: category.icon,
        icon_type: category.icon_type || 'fontawesome',
        order_index: category.order_index,
        is_hidden: category.is_hidden,
        subcategories: []
      };

      // Obtener subcategorías con documentos
      categoryData.subcategories = await buildSubcategoryTree(
        subcategories,
        null,
        category.id,
        false,
        'full'
      );

      structure.push(categoryData);
    }

    return structure;
  } catch (error) {
    logError('loadDocsStructure', error);
    return [];
  }
}

// ===== RUTAS PÚBLICAS =====

// Ruta principal - Landing Page
app.get('/', async (req, res) => {
  try {
    const structure = await loadDocsStructure();
    const landingContent = await settingsDb.get('landing_page_content') || '# Bienvenido a la documentación';
    const htmlContent = md.render(landingContent);
    
    await renderWithMetadata(res, 'landing', {
      structure,
      content: htmlContent,
      rawContent: landingContent,
      title: 'HexServers Docs',
      currentPath: null
    }, {
      title: 'Inicio',
      description: 'Bienvenido a la documentación de HexServers'
    });
  } catch (error) {
    logError('Landing Page Load', error);
    res.status(500).send('Error al cargar la página');
  }
});

// Ruta para mostrar una categoría (redirige al primer documento disponible)
app.get('/docs/:category', async (req, res) => {
  const { category } = req.params;
  const structure = await loadDocsStructure();

  try {
    // Buscar la categoría por slug
    const categoryData = structure.find(cat => cat.slug === category);
    
    if (!categoryData) {
      const pageMetadata = generatePageMetadata({
        title: 'Categoría no encontrada',
        description: 'La categoría que buscas no existe'
      });

      return res.status(404).render('index', {
        structure,
        content: '<h1>Categoría no encontrada</h1><p>La categoría que buscas no existe.</p>',
        title: 'Error 404',
        currentPath: null,
        metadata: pageMetadata,
        baseMetadata: getBaseMetadata()
      });
    }

    // Buscar la primera subcategoría visible con documentos
    const firstSubcategory = categoryData.subcategories?.find(sub => !sub.is_hidden);
    
    if (firstSubcategory && firstSubcategory.guides && firstSubcategory.guides.length > 0) {
      const firstGuide = firstSubcategory.guides[0];
      return res.redirect(`/docs/${category}/${firstSubcategory.slug}/${firstGuide.slug}`);
    }

    // Si no hay guías, mostrar mensaje
    const pageMetadata = generatePageMetadata({
      title: categoryData.display_name,
      description: `Documentación de ${categoryData.display_name}`
    });

    res.render('index', {
      structure,
      content: `<h1>${categoryData.display_name}</h1><p>No hay guías disponibles en esta categoría.</p>`,
      title: categoryData.display_name,
      currentPath: category,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  } catch (error) {
    console.error('Error loading category:', error);
    const pageMetadata = generatePageMetadata({
      title: 'Error',
      description: 'Hubo un error al cargar la categoría'
    });

    res.status(500).render('index', {
      structure,
      content: '<h1>Error</h1><p>Hubo un error al cargar la categoría.</p>',
      title: 'Error',
      currentPath: null,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  }
});

// Ruta para mostrar una subcategoría (redirige al primer documento)
app.get('/docs/:category/:subcategory', async (req, res) => {
  const { category, subcategory } = req.params;
  const structure = await loadDocsStructure();

  try {
    // Buscar la categoría por slug
    const categoryData = structure.find(cat => cat.slug === category);
    
    if (!categoryData) {
      const pageMetadata = generatePageMetadata({
        title: 'Categoría no encontrada',
        description: 'La categoría que buscas no existe'
      });

      return res.status(404).render('index', {
        structure,
        content: '<h1>Categoría no encontrada</h1>',
        title: 'Error 404',
        currentPath: null,
        metadata: pageMetadata,
        baseMetadata: getBaseMetadata()
      });
    }

    // Buscar la subcategoría por slug
    const subcategoryData = categoryData.subcategories?.find(sub => sub.slug === subcategory);
    
    if (!subcategoryData) {
      const pageMetadata = generatePageMetadata({
        title: 'Subcategoría no encontrada',
        description: 'La subcategoría que buscas no existe'
      });

      return res.status(404).render('index', {
        structure,
        content: '<h1>Subcategoría no encontrada</h1>',
        title: 'Error 404',
        currentPath: category,
        metadata: pageMetadata,
        baseMetadata: getBaseMetadata()
      });
    }

    // Redirigir al primer documento de la subcategoría
    if (subcategoryData.guides && subcategoryData.guides.length > 0) {
      const firstGuide = subcategoryData.guides[0];
      return res.redirect(`/docs/${category}/${subcategory}/${firstGuide.slug}`);
    }

    // Si no hay guías, mostrar mensaje
    const pageMetadata = generatePageMetadata({
      title: subcategoryData.display_name,
      description: `Documentación de ${subcategoryData.display_name}`
    });

    res.render('index', {
      structure,
      content: `<h1>${subcategoryData.display_name}</h1><p>No hay guías disponibles en esta subcategoría.</p>`,
      title: subcategoryData.display_name,
      currentPath: `${category}/${subcategory}`,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  } catch (error) {
    console.error('Error loading subcategory:', error);
    const pageMetadata = generatePageMetadata({
      title: 'Error',
      description: 'Hubo un error al cargar la subcategoría'
    });

    res.status(500).render('index', {
      structure,
      content: '<h1>Error</h1><p>Hubo un error al cargar la subcategoría.</p>',
      title: 'Error',
      currentPath: category,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  }
});

// Ruta para mostrar una guía específica
app.get('/docs/:category/:subcategory/:guide', async (req, res) => {
  const { category, subcategory, guide } = req.params;
  const structure = await loadDocsStructure();

  try {
    const doc = await docDb.getBySlug(category, subcategory, guide);
    
    if (!doc) {
      const pageMetadata = generatePageMetadata({
        title: 'Error 404',
        description: 'La página que buscas no existe'
      });

      return res.status(404).render('index', {
        structure,
        content: '<h1>Guía no encontrada</h1><p>La guía que buscas no existe.</p>',
        title: 'Error 404',
        currentPath: null,
        metadata: pageMetadata,
        baseMetadata: getBaseMetadata()
      });
    }

    // Generar metadata para la página del documento
    const pageMetadata = generatePageMetadata({
      title: doc.title,
      description: doc.content.substring(0, 160) // Primeros 160 caracteres como descripción
    });

    const htmlContent = md.render(doc.content);

    res.render('index', {
      structure,
      content: htmlContent,
      title: doc.title,
      currentPath: `${category}/${subcategory}/${guide}`,
      docId: doc.id,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  } catch (error) {
    console.error('Error loading guide:', error);
    const pageMetadata = generatePageMetadata({
      title: 'Error',
      description: 'Hubo un error al cargar la página'
    });

    res.status(500).render('index', {
      structure,
      content: '<h1>Error</h1><p>Hubo un error al cargar la guía.</p>',
      title: 'Error',
      currentPath: null,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  }
});

// API de búsqueda
app.get('/api/search', async (req, res) => {
  const query = req.query.q?.toLowerCase();
  
  if (!query) {
    return res.json([]);
  }

  try {
    const results = await docDb.search(query);
    
    // Función para normalizar texto (quitar acentos)
    const normalizeText = (text) => {
      if (!text) return '';
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };
    
    const normalizedQuery = normalizeText(query);
    
    // Filtrar resultados considerando acentos y relevancia
    const filtered = results.filter(doc => {
      const normalizedTitle = normalizeText(doc.title);
      const normalizedDesc = normalizeText(doc.description || '');
      const normalizedCategory = normalizeText(doc.category_name || '');
      const normalizedSubcategory = normalizeText(doc.subcategory_name || '');
      
      return normalizedTitle.includes(normalizedQuery) ||
             normalizedDesc.includes(normalizedQuery) ||
             normalizedCategory.includes(normalizedQuery) ||
             normalizedSubcategory.includes(normalizedQuery);
    });
    
    // Ordenar por relevancia (título primero, luego descripción)
    filtered.sort((a, b) => {
      const aTitle = normalizeText(a.title);
      const bTitle = normalizeText(b.title);
      const aStartsWith = aTitle.startsWith(normalizedQuery);
      const bStartsWith = bTitle.startsWith(normalizedQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return aTitle.localeCompare(bTitle);
    });
    
    // Limitar a 20 resultados
    const limited = filtered.slice(0, 20);
    
    const formatted = limited.map(doc => ({
      title: doc.title,
      category: doc.category_name,
      subcategory: doc.subcategory_name,
      path: `/docs/${doc.category_slug}/${doc.subcategory_slug}/${doc.slug}`,
      url: `/docs/${doc.category_slug}/${doc.subcategory_slug}/${doc.slug}`
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json([]);
  }
});

// ===== RUTAS DE AUTENTICACIÓN =====

// Login GET
app.get('/admin/login', requireGuest, (req, res) => {
  const pageMetadata = generatePageMetadata({
    title: 'Login - Admin',
    description: 'Panel de administración de HexServers Docs',
    robots: 'noindex, nofollow'
  });

  res.render('admin/login', { 
    error: null,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Rate limiter para login (máximo 5 intentos cada 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const pageMetadata = generatePageMetadata({
      title: 'Login - Admin',
      description: 'Panel de administración de HexServers Docs',
      robots: 'noindex, nofollow'
    });
    res.status(429).render('admin/login', { 
      error: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.',
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  }
});

// Login POST
app.post('/admin/login', loginLimiter, requireGuest, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userDb.findByUsername(username);
    
    if (!user) {
      return res.render('admin/login', { error: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('admin/login', { error: 'Usuario o contraseña incorrectos' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.redirect('/admin');
  } catch (error) {
    logError('Login', error);
    res.render('admin/login', { error: 'Error al iniciar sesión' });
  }
});

// Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ===== RUTAS DE ADMINISTRACIÓN =====

// Panel principal
app.get('/admin', requireAuth, async (req, res) => {
  const structure = await loadDocsStructure();
  const allDocs = await docDb.getAll();
  const allCategories = await categoryDb.getAll();
  const allSubcategories = await subcategoryDb.getAll();
  
  renderWithMetadata(res, 'admin/dashboard', {
    structure,
    docs: allDocs,
    categories: allCategories,
    subcategories: allSubcategories
  }, {
    title: 'Dashboard - Admin',
    description: 'Panel de administración de HexServers Docs'
  });
});

// Gestión de categorías
app.get('/admin/categories', requireAuth, async (req, res) => {
  const categories = await categoryDb.getAll();
  const allSubcategories = await subcategoryDb.getAll();
  
  // Agrupar subcategorías por categoría
  const categoriesWithSubs = categories.map(cat => ({
    ...cat,
    subcategories: allSubcategories.filter(sub => sub.category_id === cat.id)
  }));
  
  renderWithMetadata(res, 'admin/categories', {
    categories: categoriesWithSubs
  }, {
    title: 'Categorías - Admin',
    description: 'Gestión de categorías y subcategorías'
  });
});

// Gestión de documentación
app.get('/admin/docs', requireAuth, async (req, res) => {
  const docs = await docDb.getAll();
  const categories = await categoryDb.getAll();
  const subcategories = await subcategoryDb.getAll();
  
  // Construir estructura usando la función reutilizable
  const structure = [];
  
  for (const category of categories) {
    const categoryData = {
      ...category,
      subcategories: await buildSubcategoryTree(subcategories, null, category.id, true, false)
    };
    
    // Agregar documentos a cada subcategoría
    const addDocsToSubcategories = (subs) => {
      for (const sub of subs) {
        sub.docs = docs.filter(d => d.subcategory_id === sub.id);
        if (sub.subcategories && sub.subcategories.length > 0) {
          addDocsToSubcategories(sub.subcategories);
        }
      }
    };
    
    addDocsToSubcategories(categoryData.subcategories);
    structure.push(categoryData);
  }
  
  const pageMetadata = generatePageMetadata({
    title: 'Documentos - Admin',
    description: 'Gestión de documentos y guías'
  });
  
  res.render('admin/docs', { 
    structure,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Crear nueva documentación POST
app.post('/admin/docs/new', requireAuth, async (req, res) => {
  const { title, slug, description, content, subcategory_id, order_index } = req.body;
  
  // Validación de entrada
  if (!subcategory_id || !title || !slug) {
    const error = 'Los campos subcategory_id, title y slug son requeridos';
    if (req.headers['content-type'] === 'application/json') {
      return res.status(400).json({ error });
    }
    return res.status(400).send(error);
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    const error = 'El slug solo puede contener letras minúsculas, números y guiones';
    if (req.headers['content-type'] === 'application/json') {
      return res.status(400).json({ error });
    }
    return res.status(400).send(error);
  }
  
  try {
    await docDb.create(subcategory_id, title, slug, description, content, order_index || 0);
    
    // Si es una petición JSON, devolver JSON
    if (req.headers['content-type'] === 'application/json') {
      res.json({ success: true });
    } else {
      res.redirect('/admin/docs');
    }
  } catch (error) {
    logError('Create Document', error);
    
    let errorMessage = 'Error al crear documentación';
    
    // Detectar error de slug duplicado
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')) {
      errorMessage = `Ya existe un documento con el slug "${slug}" en esta subcategoría. Por favor, usa un slug diferente.`;
    }
    
    if (req.headers['content-type'] === 'application/json') {
      res.status(400).json({ success: false, error: errorMessage });
    } else {
      res.status(400).send(errorMessage);
    }
  }
});

// Editar documentación POST
app.post('/admin/docs/edit/:id', requireAuth, async (req, res) => {
  const { title, slug, description, content, order_index, subcategory_id } = req.body;
  
  // Validación de entrada
  if (!title || !slug) {
    const error = 'Los campos title y slug son requeridos';
    if (req.headers['content-type'] === 'application/json') {
      return res.status(400).json({ error });
    }
    return res.status(400).send(error);
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    const error = 'El slug solo puede contener letras minúsculas, números y guiones';
    if (req.headers['content-type'] === 'application/json') {
      return res.status(400).json({ error });
    }
    return res.status(400).send(error);
  }
  
  try {
    await docDb.update(req.params.id, title, slug, description, content, order_index || 0, subcategory_id);
    
    // Si es una petición JSON, devolver JSON
    if (req.headers['content-type'] === 'application/json') {
      res.json({ success: true });
    } else {
      res.redirect('/admin/docs');
    }
  } catch (error) {
    console.error('Error updating doc:', error);
    
    let errorMessage = 'Error al actualizar documentación';
    
    // Detectar error de slug duplicado
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')) {
      errorMessage = `Ya existe otro documento con el slug "${slug}" en esta subcategoría. Por favor, usa un slug diferente.`;
    }
    
    if (req.headers['content-type'] === 'application/json') {
      res.status(400).json({ success: false, error: errorMessage });
    } else {
      res.status(400).send(errorMessage);
    }
  }
});

// Eliminar documentación
app.post('/admin/docs/delete/:id', requireAuth, async (req, res) => {
  try {
    await docDb.delete(req.params.id);
    res.redirect('/admin/docs');
  } catch (error) {
    console.error('Error deleting doc:', error);
    res.status(500).send('Error al eliminar documentación');
  }
});

// ===== API PARA GESTIÓN DE CATEGORÍAS =====

// Obtener todas las subcategorías
app.get('/api/admin/subcategories/all', requireAuth, async (req, res) => {
  try {
    const subcategories = await subcategoryDb.getAll();
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
});

// Obtener subcategorías de una categoría (solo primer nivel)
app.get('/api/admin/subcategories/:categoryId', requireAuth, async (req, res) => {
  try {
    const subcategories = await subcategoryDb.getByCategoryId(req.params.categoryId);
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
});

// Obtener TODAS las subcategorías de una categoría (incluyendo anidadas) en formato plano
app.get('/api/admin/subcategories/:categoryId/flat', requireAuth, async (req, res) => {
  try {
    const subcategories = await subcategoryDb.getAllByCategoryIdFlat(req.params.categoryId);
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
});

// Obtener todas las categorías
app.get('/api/admin/categories', requireAuth, async (req, res) => {
  try {
    const categories = await categoryDb.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Crear categoría
app.post('/api/admin/categories', requireAuth, async (req, res) => {
  const { name, display_name, slug, icon, order_index, is_hidden, icon_type } = req.body;
  
  // Validación de entrada
  if (!name || !display_name || !slug) {
    return res.status(400).json({ error: 'Los campos name, display_name y slug son requeridos' });
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
  }
  
  try {
    const id = await categoryDb.create(name, display_name, slug, icon || 'fa-folder', order_index || 0, is_hidden ? 1 : 0, icon_type || 'fontawesome');
    res.json({ success: true, id });
  } catch (error) {
    logError('Create Category', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Actualizar categoría
app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
  const { name, display_name, slug, icon, order_index, is_hidden, icon_type } = req.body;
  
  // Validación de entrada
  if (!name || !display_name || !slug) {
    return res.status(400).json({ error: 'Los campos name, display_name y slug son requeridos' });
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
  }
  
  try {
    await categoryDb.update(req.params.id, name, display_name, slug, icon, order_index, is_hidden ? 1 : 0, icon_type || 'fontawesome');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// Eliminar categoría
app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    await categoryDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

// Crear subcategoría
app.post('/api/admin/subcategories', requireAuth, async (req, res) => {
  const { category_id, parent_subcategory_id, name, display_name, slug, icon, order_index, is_hidden, icon_type } = req.body;
  
  // Validación de entrada
  if (!category_id || !name || !display_name || !slug) {
    return res.status(400).json({ error: 'Los campos category_id, name, display_name y slug son requeridos' });
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
  }
  
  try {
    const id = await subcategoryDb.create(
      category_id, 
      name, 
      display_name, 
      slug, 
      icon || 'fa-folder-open', 
      order_index || 0, 
      is_hidden ? 1 : 0, 
      icon_type || 'fontawesome',
      parent_subcategory_id || null
    );
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Error al crear subcategoría' });
  }
});

// Actualizar subcategoría
app.put('/api/admin/subcategories/:id', requireAuth, async (req, res) => {
  const { name, display_name, slug, icon, order_index, is_hidden, icon_type, parent_subcategory_id } = req.body;
  
  // Validación de entrada
  if (!name || !display_name || !slug) {
    return res.status(400).json({ error: 'Los campos name, display_name y slug son requeridos' });
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
  }
  
  try {
    await subcategoryDb.update(
      req.params.id, 
      name, 
      display_name, 
      slug, 
      icon, 
      order_index, 
      is_hidden ? 1 : 0, 
      icon_type || 'fontawesome',
      parent_subcategory_id || null
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar subcategoría' });
  }
});

// Eliminar subcategoría
app.delete('/api/admin/subcategories/:id', requireAuth, async (req, res) => {
  try {
    await subcategoryDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar subcategoría' });
  }
});

// API para edición en tiempo real desde la vista principal
app.get('/api/admin/docs/content/:id', requireAuth, async (req, res) => {
  try {
    const doc = await docDb.getById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    res.json({ content: doc.content });
  } catch (error) {
    console.error('Error getting doc content:', error);
    res.status(500).json({ error: 'Error al obtener el contenido' });
  }
});

// API para obtener un documento completo
app.get('/api/admin/docs/:id', requireAuth, async (req, res) => {
  try {
    const doc = await docDb.getById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    // Obtener información de subcategoría y categoría
    if (doc.subcategory_id) {
      const subcategory = await subcategoryDb.getById(doc.subcategory_id);
      if (subcategory) {
        doc.subcategory = subcategory;
        if (subcategory.category_id) {
          const category = await categoryDb.getById(subcategory.category_id);
          if (category) {
            doc.category = category;
          }
        }
      }
    }
    
    res.json(doc);
  } catch (error) {
    console.error('Error getting doc:', error);
    res.status(500).json({ error: 'Error al obtener el documento' });
  }
});

// API para obtener una subcategoría
app.get('/api/admin/subcategories/:id', requireAuth, async (req, res) => {
  try {
    const subcategory = await subcategoryDb.getById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    res.json(subcategory);
  } catch (error) {
    console.error('Error getting subcategory:', error);
    res.status(500).json({ error: 'Error al obtener la subcategoría' });
  }
});

app.post('/api/admin/docs/quick-edit/:id', requireAuth, async (req, res) => {
  const { content } = req.body;
  
  try {
    const doc = await docDb.getById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    await docDb.update(req.params.id, doc.title, doc.slug, doc.description, content, doc.order_index);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating doc:', error);
    res.status(500).json({ error: 'Error al actualizar documentación' });
  }
});

// ===== GESTIÓN DE USUARIOS =====

// Listar usuarios
app.get('/admin/users', requireAuth, async (req, res) => {
  const users = await userDb.getAll();
  
  const pageMetadata = generatePageMetadata({
    title: 'Usuarios - Admin',
    description: 'Gestión de usuarios del sistema'
  });
  
  res.render('admin/users', { 
    users,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Crear usuario
app.post('/api/admin/users', requireAuth, async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validación de entrada
  if (!username || !password) {
    return res.status(400).json({ error: 'Los campos username y password son requeridos' });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'El email no es válido' });
  }
  
  try {
    const existingUser = await userDb.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    await userDb.create(username, password, email);
    res.json({ success: true });
  } catch (error) {
    logError('Create User', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Actualizar usuario
app.put('/api/admin/users/:id', requireAuth, async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    await userDb.update(req.params.id, username, email, password || null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
app.delete('/api/admin/users/:id', requireAuth, async (req, res) => {
  try {
    // No permitir eliminar al usuario activo
    const user = await userDb.findById(req.params.id);
    if (user.username === req.session.user) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    
    await userDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ===== RUTAS ADMIN - LANDING PAGE =====

// Vista de edición de landing page
app.get('/admin/landing', requireAuth, async (req, res) => {
  const landingContent = await settingsDb.get('landing_page_content') || '';
  
  const pageMetadata = generatePageMetadata({
    title: 'Landing Page - Admin',
    description: 'Editar contenido de la página de inicio',
    robots: 'noindex, nofollow'
  });
  
  res.render('admin/landing', { 
    content: landingContent,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Guardar contenido de landing page
app.post('/api/admin/landing', requireAuth, async (req, res) => {
  const { content } = req.body;
  
  try {
    await settingsDb.set('landing_page_content', content);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving landing page:', error);
    res.status(500).json({ error: 'Error al guardar la landing page' });
  }
});

// ===== RUTAS ADMIN - CONFIGURACIÓN =====

// Vista de configuración
app.get('/admin/settings', requireAuth, async (req, res) => {
  try {
    const settings = {
      logo_type: await settingsDb.get('logo_type') || 'text',
      logo_text: await settingsDb.get('logo_text') || 'HexServers Docs',
      logo_url: await settingsDb.get('logo_url') || ''
    };

    const pageMetadata = generatePageMetadata({
      title: 'Configuración - Admin',
      description: 'Configuración del sitio',
      robots: 'noindex, nofollow'
    });

    res.render('admin/settings', {
      settings,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).send('Error al cargar configuración');
  }
});

// Guardar configuración del logo
app.post('/api/admin/settings/logo', requireAuth, async (req, res) => {
  const { logo_type, logo_text, logo_url } = req.body;
  
  try {
    await settingsDb.set('logo_type', logo_type);
    await settingsDb.set('logo_text', logo_text || 'HexServers Docs');
    await settingsDb.set('logo_url', logo_url || '');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving logo settings:', error);
    res.status(500).json({ error: 'Error al guardar configuración del logo' });
  }
});

// Descargar respaldo de base de datos
app.get('/api/admin/backup/download', requireAuth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, 'hexservers.db');
  
  try {
    if (fs.existsSync(dbPath)) {
      res.download(dbPath, `hexservers-backup-${new Date().toISOString().split('T')[0]}.db`);
    } else {
      res.status(404).json({ error: 'Base de datos no encontrada' });
    }
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Error al descargar respaldo' });
  }
});

// Inicializar base de datos y servidor
(async () => {
  try {
    await initDatabase();
    await createDefaultAdmin();
    logInfo('Base de datos inicializada');
    
    app.listen(PORT, () => {
      logInfo(`Servidor corriendo en http://localhost:${PORT}`);
      logInfo(`Panel admin: http://localhost:${PORT}/admin`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Servicio iniciado correctamente`);
      }
    });
  } catch (error) {
    logError('Server Initialization', error);
    process.exit(1);
  }
})();
