const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const bodyParser = require('body-parser');

const { initDatabase, createDefaultAdmin, userDb, categoryDb, subcategoryDb, docDb } = require('./database');
const { requireAuth, requireGuest, passUser } = require('./middleware/auth');
const { generatePageMetadata, generateBreadcrumb, getBaseMetadata } = require('./metadata');

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

// Cargar estructura de documentación desde la base de datos
async function loadDocsStructure() {
  try {
    const categories = await categoryDb.getAll();
    const structure = [];

    // Función recursiva para construir subcategorías anidadas
    async function buildSubcategoryTree(parentId, categoryId, categorySlug) {
      const subcategories = parentId 
        ? await subcategoryDb.getByParentId(parentId)
        : await subcategoryDb.getByCategoryId(categoryId);
      
      const result = [];
      
      for (const subcategory of subcategories) {
        // Saltar subcategorías ocultas
        if (subcategory.is_hidden) continue;
        
        const subcategoryData = {
          id: subcategory.id,
          name: subcategory.name,
          displayName: subcategory.display_name,
          slug: subcategory.slug,
          icon: subcategory.icon,
          icon_type: subcategory.icon_type || 'fontawesome',
          order_index: subcategory.order_index,
          is_hidden: subcategory.is_hidden,
          parent_subcategory_id: subcategory.parent_subcategory_id,
          subcategories: [],
          guides: []
        };

        // Obtener sub-subcategorías recursivamente
        subcategoryData.subcategories = await buildSubcategoryTree(subcategory.id, categoryId, categorySlug);

        // Obtener documentos de esta subcategoría
        const docs = await docDb.getBySubcategoryId(subcategory.id);
        
        for (const doc of docs) {
          // Construir path completo recursivamente
          subcategoryData.guides.push({
            id: doc.id,
            title: doc.title,
            slug: doc.slug,
            description: doc.description,
            path: `${categorySlug}/${subcategory.slug}/${doc.slug}`
          });
        }

        result.push(subcategoryData);
      }
      
      return result;
    }

    for (const category of categories) {
      // Saltar categorías ocultas
      if (category.is_hidden) continue;
      
      const categoryData = {
        id: category.id,
        name: category.name,
        displayName: category.display_name,
        slug: category.slug,
        icon: category.icon,
        icon_type: category.icon_type || 'fontawesome',
        order_index: category.order_index,
        is_hidden: category.is_hidden,
        subcategories: []
      };

      // Obtener subcategorías de nivel raíz (sin parent)
      categoryData.subcategories = await buildSubcategoryTree(null, category.id, category.slug);

      structure.push(categoryData);
    }

    return structure;
  } catch (error) {
    console.error('Error loading docs structure:', error);
    return [];
  }
}

// ===== RUTAS PÚBLICAS =====

// Ruta principal
app.get('/', async (req, res) => {
  const structure = await loadDocsStructure();
  
  if (!structure || structure.length === 0) {
    const pageMetadata = generatePageMetadata({
      title: 'Documentación',
      description: 'Bienvenido a la documentación de HexServers'
    });

    return res.render('index', {
      structure: [],
      content: '<h1>Bienvenido a la documentación</h1><p>No hay guías disponibles aún.</p>',
      title: 'Documentación',
      currentPath: null,
      metadata: pageMetadata,
      baseMetadata: getBaseMetadata()
    });
  }

  // Mostrar la primera guía disponible
  const firstCategory = structure[0];
  const firstSubcategory = firstCategory.subcategories[0];
  const firstGuide = firstSubcategory?.guides[0];

  if (firstGuide) {
    return res.redirect(`/docs/${firstGuide.path}`);
  }

  const pageMetadata = generatePageMetadata({
    title: 'Documentación'
  });

  res.render('index', {
    structure,
    content: '<h1>Bienvenido a la documentación</h1>',
    title: 'Documentación',
    currentPath: null,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
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

    // Obtener información de categoría y subcategoría para breadcrumb
    const categoryData = await categoryDb.getBySlug(category);
    const subcategoryData = await subcategoryDb.getBySlug(subcategory, categoryData?.id);

    // Generar metadata para la página del documento
    const breadcrumb = generateBreadcrumb(doc, subcategoryData, categoryData);
    const pageMetadata = generatePageMetadata({
      title: doc.title,
      description: doc.content.substring(0, 160), // Primeros 160 caracteres como descripción
      type: 'article',
      slug: `docs/${category}/${subcategory}/${guide}`,
      datePublished: doc.created_at,
      dateModified: doc.updated_at,
      breadcrumb
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

// Login POST
app.post('/admin/login', requireGuest, async (req, res) => {
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
    console.error('Login error:', error);
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
  
  const pageMetadata = generatePageMetadata({
    title: 'Dashboard - Admin',
    description: 'Panel de administración de HexServers Docs'
  });
  
  res.render('admin/dashboard', {
    structure,
    docs: allDocs,
    categories: allCategories,
    subcategories: allSubcategories,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
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
  
  const pageMetadata = generatePageMetadata({
    title: 'Categorías - Admin',
    description: 'Gestión de categorías y subcategorías'
  });
  
  res.render('admin/categories', { 
    categories: categoriesWithSubs,
    metadata: pageMetadata,
    baseMetadata: getBaseMetadata()
  });
});

// Gestión de documentación
app.get('/admin/docs', requireAuth, async (req, res) => {
  const docs = await docDb.getAll();
  const categories = await categoryDb.getAll();
  const subcategories = await subcategoryDb.getAll();
  
  // Construir estructura de árbol con categorías, subcategorías y documentos
  const structure = [];
  
  // Función recursiva para construir subcategorías anidadas
  async function buildSubcategoryTree(parentId, categoryId) {
    const subs = parentId 
      ? subcategories.filter(s => s.parent_subcategory_id === parentId)
      : subcategories.filter(s => s.category_id === categoryId && !s.parent_subcategory_id);
    
    const result = [];
    
    for (const sub of subs) {
      const subDocs = docs.filter(d => d.subcategory_id === sub.id);
      
      result.push({
        ...sub,
        subcategories: await buildSubcategoryTree(sub.id, categoryId),
        docs: subDocs
      });
    }
    
    return result;
  }
  
  // Construir estructura completa
  for (const category of categories) {
    structure.push({
      ...category,
      subcategories: await buildSubcategoryTree(null, category.id)
    });
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
  
  try {
    await docDb.create(subcategory_id, title, slug, description, content, order_index || 0);
    
    // Si es una petición JSON, devolver JSON
    if (req.headers['content-type'] === 'application/json') {
      res.json({ success: true });
    } else {
      res.redirect('/admin/docs');
    }
  } catch (error) {
    console.error('Error creating doc:', error);
    
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
  
  try {
    const id = await categoryDb.create(name, display_name, slug, icon || 'fa-folder', order_index || 0, is_hidden ? 1 : 0, icon_type || 'fontawesome');
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Actualizar categoría
app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
  const { name, display_name, slug, icon, order_index, is_hidden, icon_type } = req.body;
  
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
  
  try {
    const existingUser = await userDb.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    await userDb.create(username, password, email);
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating user:', error);
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

// Inicializar base de datos y servidor
(async () => {
  try {
    await initDatabase();
    await createDefaultAdmin();
    console.log('✅ Base de datos inicializada');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🔐 Panel admin: http://localhost:${PORT}/admin`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`👤 Usuario: admin | Contraseña: admin123`);
        console.log('⚠️  CAMBIAR CREDENCIALES ANTES DE PRODUCCION');
      }
    });
  } catch (error) {
    console.error('Error al inicializar:', error);
    process.exit(1);
  }
})();
