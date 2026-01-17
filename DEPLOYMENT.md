# Guía de Despliegue a Producción

## 🚀 Pasos para Desplegar

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (NO commitear este archivo):

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=tu-clave-secreta-muy-larga-y-aleatoria-aqui
ADMIN_PASSWORD=tu-contraseña-segura-aqui
```

**⚠️ IMPORTANTE:** 
- Genera una `SESSION_SECRET` segura (mínimo 32 caracteres aleatorios)
- Cambia `ADMIN_PASSWORD` por una contraseña fuerte
- Nunca compartas el archivo `.env`

### 2. Instalación de Dependencias

```bash
npm install --production
```

### 3. Construir CSS

```bash
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify
```

### 4. Seguridad

**Credenciales por Defecto:**
- Usuario: `admin`
- Contraseña: La que configuraste en `ADMIN_PASSWORD` (o `admin123` si no configuraste ninguna)

**⚠️ CAMBIAR INMEDIATAMENTE DESPUÉS DEL PRIMER LOGIN:**
1. Inicia sesión con las credenciales por defecto
2. Ve a: Panel Admin → Usuarios
3. Cambia la contraseña del usuario admin
4. (Opcional) Crea nuevos usuarios y elimina el admin por defecto

### 5. Iniciar Servidor

**Desarrollo:**
```bash
npm start
```

**Producción (con PM2):**
```bash
npm install -g pm2
pm2 start server.js --name hexservers-docs
pm2 save
pm2 startup
```

### 6. Nginx (Opcional)

Configuración recomendada para Nginx como proxy inverso:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7. HTTPS con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## 🔒 Checklist de Seguridad

- [ ] Cambiar `SESSION_SECRET` en `.env`
- [ ] Configurar contraseña fuerte en `.env`
- [ ] Cambiar credenciales de admin después del primer login
- [ ] Asegurar que `.env` está en `.gitignore`
- [ ] Configurar HTTPS en producción
- [ ] Configurar firewall (solo puertos 80, 443, 22)
- [ ] Hacer backups regulares de la base de datos SQLite
- [ ] Revisar logs periódicamente

## 📦 Backup de Base de Datos

La base de datos SQLite se encuentra en `documentation.db`. Para hacer backup:

```bash
# Backup
cp documentation.db documentation.db.backup

# Restaurar
cp documentation.db.backup documentation.db
```

## 🔄 Actualización

```bash
git pull
npm install
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify
pm2 restart hexservers-docs
```

## 📊 Monitoreo

Con PM2:
```bash
pm2 logs hexservers-docs
pm2 monit
pm2 status
```

## ⚡ Optimizaciones

- Tailwind CSS ya está minificado en producción
- SQLite es suficientemente rápido para la mayoría de casos
- Para alto tráfico, considera migrar a PostgreSQL/MySQL
- Configura cache en Nginx para archivos estáticos

## 🐛 Troubleshooting

**Error: Puerto en uso**
```bash
lsof -i :3000
kill -9 <PID>
```

**Permisos de base de datos**
```bash
chmod 644 documentation.db
chown www-data:www-data documentation.db
```

**Logs del servidor**
```bash
pm2 logs hexservers-docs --lines 100
```
