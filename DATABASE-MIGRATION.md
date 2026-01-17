# 🔄 Guía de Migración de Base de Datos

## 📋 Cuándo necesitas migrar

Debes ejecutar la migración cuando:
- Clonas el proyecto en un nuevo dispositivo
- Actualizas el código y hay cambios en la estructura de la base de datos
- Ves errores relacionados con columnas faltantes
- La base de datos fue creada con una versión anterior del código

## 🚀 Métodos de Migración

### Método 1: Script de Migración (Recomendado)

En el nuevo dispositivo, después de clonar el proyecto:

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar migración
npm run migrate
```

O directamente:

```bash
node migrate.js
```

**Salida esperada:**
```
🔄 Iniciando migración de base de datos...

📊 Verificando estructura de tablas...

✅ Agregar columna is_hidden a categories
✅ Agregar columna icon_type a categories
✅ Agregar columna is_hidden a subcategories
✅ Agregar columna icon_type a subcategories
✅ Actualizar icon_type en categories
✅ Actualizar is_hidden en categories
✅ Actualizar icon_type en subcategories
✅ Actualizar is_hidden en subcategories

✅ Migración completada!

📦 Base de datos cerrada correctamente.
```

### Método 2: Migración Automática al Iniciar

El servidor ya ejecuta migraciones básicas al iniciar en `database.js`. Simplemente inicia el servidor:

```bash
npm start
```

### Método 3: SQLite CLI (Manual)

Si prefieres migrar manualmente:

```bash
# Abrir la base de datos
sqlite3 hexservers.db

# Agregar columnas faltantes (ejecuta solo las que falten)
ALTER TABLE categories ADD COLUMN is_hidden INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN icon_type TEXT DEFAULT 'fontawesome';
ALTER TABLE subcategories ADD COLUMN is_hidden INTEGER DEFAULT 0;
ALTER TABLE subcategories ADD COLUMN icon_type TEXT DEFAULT 'fontawesome';

# Actualizar valores
UPDATE categories SET icon_type = 'fontawesome' WHERE icon_type IS NULL;
UPDATE categories SET is_hidden = 0 WHERE is_hidden IS NULL;
UPDATE subcategories SET icon_type = 'fontawesome' WHERE icon_type IS NULL;
UPDATE subcategories SET is_hidden = 0 WHERE is_hidden IS NULL;

# Salir
.exit
```

### Método 4: Crear Base de Datos Nueva

Si la base de datos está muy corrupta o deseas empezar de cero:

```bash
# 1. Backup de la base de datos actual (opcional)
cp hexservers.db hexservers.db.backup

# 2. Eliminar base de datos
rm hexservers.db
rm sessions.db

# 3. Iniciar servidor (creará nuevas bases de datos)
npm start
```

**Nota:** Esto eliminará todos los datos. Solo hazlo si tienes un backup o no te importa perder los datos.

## 🔧 Verificar Estado de la Base de Datos

### Verificar columnas existentes:

```bash
# Ver estructura de categories
sqlite3 hexservers.db "PRAGMA table_info(categories);"

# Ver estructura de subcategories
sqlite3 hexservers.db "PRAGMA table_info(subcategories);"

# Ver estructura de documentation
sqlite3 hexservers.db "PRAGMA table_info(documentation);"
```

### Verificar datos:

```bash
# Contar registros
sqlite3 hexservers.db "SELECT COUNT(*) FROM categories;"
sqlite3 hexservers.db "SELECT COUNT(*) FROM subcategories;"
sqlite3 hexservers.db "SELECT COUNT(*) FROM documentation;"

# Ver todas las categorías
sqlite3 hexservers.db "SELECT * FROM categories;"
```

## 📦 Transferir Datos Entre Dispositivos

### Método 1: Copiar archivo de base de datos

```bash
# En el dispositivo origen
# La base de datos está en: hexservers.db

# Copiar al nuevo dispositivo y colocar en la raíz del proyecto
```

### Método 2: Exportar e Importar

**Exportar (en dispositivo origen):**
```bash
sqlite3 hexservers.db .dump > backup.sql
```

**Importar (en dispositivo nuevo):**
```bash
sqlite3 hexservers.db < backup.sql
```

### Método 3: Usar Git (No recomendado para producción)

Si es solo para desarrollo, puedes incluir la base de datos en Git:

```bash
# Eliminar de .gitignore
# Quitar esta línea: *.db

# Commitear
git add hexservers.db
git commit -m "Add database"
git push

# En otro dispositivo
git pull
```

**⚠️ Advertencia:** No incluyas bases de datos en producción en Git por seguridad.

## 🐛 Solución de Problemas

### Error: "no such table"

La base de datos no existe o está vacía.

**Solución:**
```bash
# Eliminar y recrear
rm hexservers.db
npm start
```

### Error: "duplicate column name"

Intentas agregar una columna que ya existe.

**Solución:** Ya está migrada, no necesitas hacer nada. O usa el script de migración que verifica antes de agregar.

### Error: "no such column"

Falta una columna en la base de datos.

**Solución:**
```bash
npm run migrate
```

### Error: "database is locked"

Otra aplicación tiene la base de datos abierta.

**Solución:**
1. Cierra el servidor si está corriendo
2. Cierra cualquier herramienta de SQLite (DB Browser, etc.)
3. Reinicia y vuelve a intentar

### Error: Cannot read properties of undefined

Puede haber documentos con referencias rotas.

**Solución:**
```bash
# Verificar integridad
sqlite3 hexservers.db "
SELECT d.id, d.title, d.subcategory_id 
FROM documentation d 
LEFT JOIN subcategories s ON d.subcategory_id = s.id 
WHERE s.id IS NULL;
"

# Si hay resultados, elimina o corrige esos documentos
```

## 📊 Migraciones Futuras

Para agregar nuevas migraciones, edita `migrate.js`:

```javascript
// Migración 4: Ejemplo de nueva columna
if (!(await columnExists('documentation', 'nueva_columna'))) {
  await runQuery(
    'ALTER TABLE documentation ADD COLUMN nueva_columna TEXT',
    'Agregar columna nueva_columna a documentation'
  );
}
```

## 🔐 Backup Automático

Crea un script para hacer backup antes de migrar:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
cp hexservers.db "backups/hexservers_$DATE.db"
echo "Backup creado: backups/hexservers_$DATE.db"
```

Úsalo antes de migrar:
```bash
bash backup.sh
npm run migrate
```

## 📝 Checklist de Migración

Cuando clones el proyecto en un nuevo dispositivo:

- [ ] Clonar repositorio: `git clone ...`
- [ ] Instalar dependencias: `npm install`
- [ ] Copiar `.env` si existe (no incluir en Git)
- [ ] Copiar `hexservers.db` del otro dispositivo (opcional)
- [ ] Ejecutar migración: `npm run migrate`
- [ ] Iniciar servidor: `npm start`
- [ ] Verificar que todo funciona
- [ ] Cambiar credenciales de admin si es producción

## 🆘 Contacto de Soporte

Si encuentras problemas durante la migración, verifica:
1. Los logs del servidor
2. La consola del navegador (F12)
3. Que todas las dependencias estén instaladas
4. Que la versión de Node.js sea compatible (v14+)

---

**Última actualización:** Enero 2026
