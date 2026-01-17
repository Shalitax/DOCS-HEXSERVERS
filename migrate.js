/**
 * Script de Migración de Base de Datos
 * Actualiza la estructura de la base de datos existente
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'hexservers.db');

console.log('🔄 Iniciando migración de base de datos...');

// Verificar si la base de datos existe
if (!fs.existsSync(dbPath)) {
  console.log('❌ No se encontró la base de datos. Ejecuta el servidor primero para crearla.');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

// Función para ejecutar consultas SQL
function runQuery(query, description) {
  return new Promise((resolve) => {
    db.run(query, (err) => {
      if (err) {
        // Si el error es "duplicate column" o "already exists", lo ignoramos
        if (err.message.includes('duplicate') || err.message.includes('already exists')) {
          console.log(`⚠️  ${description} - Ya existe, saltando...`);
        } else {
          console.log(`❌ Error en ${description}:`, err.message);
        }
      } else {
        console.log(`✅ ${description}`);
      }
      resolve();
    });
  });
}

// Función para verificar si una columna existe
function columnExists(table, column) {
  return new Promise((resolve) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) {
        resolve(false);
        return;
      }
      const exists = rows.some(row => row.name === column);
      resolve(exists);
    });
  });
}

// Ejecutar migraciones
async function migrate() {
  console.log('\n📊 Verificando estructura de tablas...\n');

  // Migración 1: Agregar columnas a categories
  if (!(await columnExists('categories', 'is_hidden'))) {
    await runQuery(
      'ALTER TABLE categories ADD COLUMN is_hidden INTEGER DEFAULT 0',
      'Agregar columna is_hidden a categories'
    );
  }

  if (!(await columnExists('categories', 'icon_type'))) {
    await runQuery(
      'ALTER TABLE categories ADD COLUMN icon_type TEXT DEFAULT "fontawesome"',
      'Agregar columna icon_type a categories'
    );
  }

  // Migración 2: Agregar columnas a subcategories
  if (!(await columnExists('subcategories', 'is_hidden'))) {
    await runQuery(
      'ALTER TABLE subcategories ADD COLUMN is_hidden INTEGER DEFAULT 0',
      'Agregar columna is_hidden a subcategories'
    );
  }

  if (!(await columnExists('subcategories', 'icon_type'))) {
    await runQuery(
      'ALTER TABLE subcategories ADD COLUMN icon_type TEXT DEFAULT "fontawesome"',
      'Agregar columna icon_type a subcategories'
    );
  }

  // Migración 3: Actualizar valores por defecto
  await runQuery(
    'UPDATE categories SET icon_type = "fontawesome" WHERE icon_type IS NULL',
    'Actualizar icon_type en categories'
  );

  await runQuery(
    'UPDATE categories SET is_hidden = 0 WHERE is_hidden IS NULL',
    'Actualizar is_hidden en categories'
  );

  await runQuery(
    'UPDATE subcategories SET icon_type = "fontawesome" WHERE icon_type IS NULL',
    'Actualizar icon_type en subcategories'
  );

  await runQuery(
    'UPDATE subcategories SET is_hidden = 0 WHERE is_hidden IS NULL',
    'Actualizar is_hidden en subcategories'
  );

  console.log('\n✅ Migración completada!\n');
  
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('📦 Base de datos cerrada correctamente.');
    }
  });
}

// Ejecutar migraciones
migrate().catch(err => {
  console.error('❌ Error durante la migración:', err);
  process.exit(1);
});
