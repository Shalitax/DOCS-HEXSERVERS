const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'hexservers.db');
const db = new sqlite3.Database(dbPath);

// Inicializar base de datos
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de usuarios
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de categorías
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          icon TEXT DEFAULT 'fa-folder',
          icon_type TEXT DEFAULT 'fontawesome',
          order_index INTEGER DEFAULT 0,
          is_hidden INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Agregar columnas si no existen (para bases de datos existentes)
      db.run(`ALTER TABLE categories ADD COLUMN is_hidden INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE categories ADD COLUMN icon_type TEXT DEFAULT 'fontawesome'`, () => {});

      // Tabla de subcategorías
      db.run(`
        CREATE TABLE IF NOT EXISTS subcategories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL,
          parent_subcategory_id INTEGER,
          name TEXT NOT NULL,
          display_name TEXT NOT NULL,
          slug TEXT NOT NULL,
          icon TEXT DEFAULT 'fa-folder-open',
          icon_type TEXT DEFAULT 'fontawesome',
          order_index INTEGER DEFAULT 0,
          is_hidden INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
        )
      `);
      
      // Agregar columnas si no existen (para bases de datos existentes)
      db.run(`ALTER TABLE subcategories ADD COLUMN is_hidden INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE subcategories ADD COLUMN icon_type TEXT DEFAULT 'fontawesome'`, () => {});
      db.run(`ALTER TABLE subcategories ADD COLUMN parent_subcategory_id INTEGER`, () => {});

      // Tabla de documentación
      db.run(`
        CREATE TABLE IF NOT EXISTS documentation (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subcategory_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          slug TEXT NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          order_index INTEGER DEFAULT 0,
          is_published BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
          UNIQUE(subcategory_id, slug)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Crear usuario admin por defecto
async function createDefaultAdmin() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, user) => {
      if (err) {
        reject(err);
        return;
      }

      if (!user) {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        db.run(
          'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
          ['admin', hashedPassword, 'admin@hexservers.com'],
          (err) => {
            if (err) {
              reject(err);
            } else {
              if (process.env.NODE_ENV !== 'production') {
                console.log('✅ Usuario admin creado (username: admin, password: ' + defaultPassword + ')');
              }
              resolve();
            }
          }
        );
      } else {
        resolve();
      }
    });
  });
}

// Funciones para usuarios
const userDb = {
  findByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  create: async (username, password, email) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  update: async (id, username, email, password = null) => {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?',
          [username, email, hashedPassword, id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET username = ?, email = ? WHERE id = ?',
          [username, email, id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Funciones para categorías
const categoryDb = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM categories ORDER BY order_index ASC, name ASC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create: (name, displayName, slug, icon = 'fa-folder', orderIndex = 0, isHidden = 0, iconType = 'fontawesome') => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO categories (name, display_name, slug, icon, order_index, is_hidden, icon_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, displayName, slug, icon, orderIndex, isHidden, iconType],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  update: (id, name, displayName, slug, icon, orderIndex, isHidden = 0, iconType = 'fontawesome') => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE categories SET name = ?, display_name = ?, slug = ?, icon = ?, order_index = ?, is_hidden = ?, icon_type = ? WHERE id = ?',
        [name, displayName, slug, icon, orderIndex, isHidden, iconType, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Funciones para subcategorías
const subcategoryDb = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM subcategories ORDER BY order_index ASC, name ASC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  getByCategoryId: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM subcategories WHERE category_id = ? AND parent_subcategory_id IS NULL ORDER BY order_index ASC, name ASC',
        [categoryId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM subcategories WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Obtener todas las subcategorías de una categoría (incluyendo anidadas) en formato plano
  getAllByCategoryIdFlat: async (categoryId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM subcategories WHERE category_id = ? ORDER BY order_index ASC, name ASC',
        [categoryId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const subcategories = rows || [];
          const result = [];
          
          // Función recursiva para construir la lista plana con indentación
          function buildFlatList(parentId = null, level = 0) {
            const children = subcategories.filter(s => 
              parentId === null ? s.parent_subcategory_id === null : s.parent_subcategory_id === parentId
            );
            
            children.forEach(sub => {
              result.push({
                ...sub,
                level: level,
                indentedName: '  '.repeat(level) + sub.display_name
              });
              buildFlatList(sub.id, level + 1);
            });
          }
          
          buildFlatList();
          resolve(result);
        }
      );
    });
  },

  getByParentId: (parentId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM subcategories WHERE parent_subcategory_id = ? ORDER BY order_index ASC, name ASC',
        [parentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  create: (categoryId, name, displayName, slug, icon = 'fa-folder-open', orderIndex = 0, isHidden = 0, iconType = 'fontawesome', parentSubcategoryId = null) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO subcategories (category_id, parent_subcategory_id, name, display_name, slug, icon, order_index, is_hidden, icon_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [categoryId, parentSubcategoryId, name, displayName, slug, icon, orderIndex, isHidden, iconType],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  update: (id, name, displayName, slug, icon, orderIndex, isHidden = 0, iconType = 'fontawesome', parentSubcategoryId = null) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE subcategories SET name = ?, display_name = ?, slug = ?, icon = ?, order_index = ?, is_hidden = ?, icon_type = ?, parent_subcategory_id = ? WHERE id = ?',
        [name, displayName, slug, icon, orderIndex, isHidden, iconType, parentSubcategoryId, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM subcategories WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Funciones para documentación
const docDb = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT d.*, s.name as subcategory_name, s.category_id, c.name as category_name
         FROM documentation d
         JOIN subcategories s ON d.subcategory_id = s.id
         JOIN categories c ON s.category_id = c.id
         WHERE d.is_published = 1
         ORDER BY d.order_index ASC, d.title ASC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  getBySlug: (categorySlug, subcategorySlug, docSlug) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT d.*, s.slug as subcategory_slug, c.slug as category_slug
         FROM documentation d
         JOIN subcategories s ON d.subcategory_id = s.id
         JOIN categories c ON s.category_id = c.id
         WHERE c.slug = ? AND s.slug = ? AND d.slug = ? AND d.is_published = 1`,
        [categorySlug, subcategorySlug, docSlug],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM documentation WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getBySubcategoryId: (subcategoryId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM documentation WHERE subcategory_id = ? ORDER BY order_index ASC, title ASC',
        [subcategoryId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  create: (subcategoryId, title, slug, description, content, orderIndex = 0) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO documentation (subcategory_id, title, slug, description, content, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [subcategoryId, title, slug, description, content, orderIndex],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  update: (id, title, slug, description, content, orderIndex, subcategoryId = null) => {
    return new Promise((resolve, reject) => {
      // Si se proporciona subcategoryId, actualizar también la subcategoría
      const query = subcategoryId 
        ? 'UPDATE documentation SET title = ?, slug = ?, description = ?, content = ?, order_index = ?, subcategory_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        : 'UPDATE documentation SET title = ?, slug = ?, description = ?, content = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      const params = subcategoryId
        ? [title, slug, description, content, orderIndex, subcategoryId, id]
        : [title, slug, description, content, orderIndex, id];
      
      db.run(query, params, (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM documentation WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  search: (query) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT d.*, s.slug as subcategory_slug, s.display_name as subcategory_name,
                c.slug as category_slug, c.display_name as category_name
         FROM documentation d
         JOIN subcategories s ON d.subcategory_id = s.id
         JOIN categories c ON s.category_id = c.id
         WHERE d.is_published = 1
         ORDER BY d.title ASC
         LIMIT 100`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
};

module.exports = {
  db,
  initDatabase,
  createDefaultAdmin,
  userDb,
  categoryDb,
  subcategoryDb,
  docDb
};
