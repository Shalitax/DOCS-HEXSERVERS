# 📦 Guía de Instalación en Linux

Guía completa para instalar y configurar HexServers Docs en sistemas Linux (Ubuntu, Debian, CentOS, Fedora, etc.).

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Básica](#instalación-básica)
3. [Configuración](#configuración)
4. [Primer Inicio](#primer-inicio)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [Actualización](#actualización)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Software Requerido

- **Node.js**: v16.x o superior (recomendado v18 LTS)
- **npm**: v8.x o superior
- **Git**: Para clonar el repositorio

### Instalación de Node.js en Linux

#### Ubuntu/Debian

```bash
# Instalar Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

#### CentOS/RHEL/Fedora

```bash
# Instalar Node.js 18.x LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar instalación
node --version
npm --version
```

#### Arch Linux

```bash
# Instalar Node.js
sudo pacman -S nodejs npm

# Verificar instalación
node --version
npm --version
```

---

## 🚀 Instalación Básica

### 1. Descargar el Proyecto

#### Opción A: Clonar con Git

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/hexservers-docs.git

# Entrar al directorio
cd hexservers-docs
```

#### Opción B: Descargar ZIP

```bash
# Descargar y descomprimir
wget https://github.com/tu-usuario/hexservers-docs/archive/main.zip
unzip main.zip
cd hexservers-docs-main
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias del proyecto
npm install
```

**Tiempo estimado:** 1-2 minutos

### 3. Compilar CSS

```bash
# Compilar Tailwind CSS
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify
```

### 4. Inicializar Base de Datos

```bash
# El servidor inicializa automáticamente la base de datos en el primer inicio
# No se requiere configuración adicional
```

---

## ⚙️ Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Contenido del archivo `.env`:**

```env
# Puerto del servidor (default: 3000)
PORT=3000

# Entorno (development o production)
NODE_ENV=production

# Secret para sesiones (CAMBIAR EN PRODUCCIÓN)
SESSION_SECRET=tu-secret-key-super-seguro-aqui-cambiar-esto

# Base de datos (opcional, por defecto usa hexservers.db)
# DB_PATH=./hexservers.db
```

### Permisos de Archivos

```bash
# Asegurar permisos correctos
chmod 644 .env
chmod 755 server.js
chmod -R 755 public/
chmod 644 *.db
```

---

## 🎯 Primer Inicio

### Modo Desarrollo

```bash
# Iniciar servidor en modo desarrollo
npm run dev
```

**O manualmente:**

```bash
node server.js
```

### Verificar Instalación

El servidor mostrará:

```
[2026-01-19T12:00:00.000Z] INFO: Base de datos inicializada
[2026-01-19T12:00:00.000Z] INFO: Servidor corriendo en http://localhost:3000
[2026-01-19T12:00:00.000Z] INFO: Panel admin: http://localhost:3000/admin
```

### Acceder al Sistema

1. **Sitio público:** http://localhost:3000
2. **Panel admin:** http://localhost:3000/admin
3. **Credenciales por defecto:**
   - Usuario: `admin`
   - Contraseña: `admin123`

### ⚠️ Cambiar Contraseña (IMPORTANTE)

1. Accede al panel admin
2. Ve a **Usuarios**
3. Edita el usuario `admin`
4. Cambia la contraseña inmediatamente

---

## 🏭 Despliegue en Producción

### Opción 1: PM2 (Recomendado)

PM2 mantiene el servidor ejecutándose y lo reinicia automáticamente si falla.

#### Instalar PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2
```

#### Iniciar con PM2

```bash
# Iniciar servidor
pm2 start server.js --name hexservers-docs

# Ver logs
pm2 logs hexservers-docs

# Ver estado
pm2 status

# Reiniciar
pm2 restart hexservers-docs

# Detener
pm2 stop hexservers-docs
```

#### Configurar Inicio Automático

```bash
# Guardar configuración actual
pm2 save

# Generar script de inicio automático
pm2 startup

# Ejecutar el comando que PM2 te muestra (algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u tu-usuario --hp /home/tu-usuario
```

#### Monitoreo con PM2

```bash
# Dashboard interactivo
pm2 monit

# Métricas web
pm2 plus
```

### Opción 2: systemd

Crear un servicio systemd para gestionar el servidor.

#### Crear archivo de servicio

```bash
sudo nano /etc/systemd/system/hexservers-docs.service
```

**Contenido:**

```ini
[Unit]
Description=HexServers Docs
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/completa/al/proyecto
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hexservers-docs

[Install]
WantedBy=multi-user.target
```

#### Activar servicio

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable hexservers-docs

# Iniciar servicio
sudo systemctl start hexservers-docs

# Ver estado
sudo systemctl status hexservers-docs

# Ver logs
sudo journalctl -u hexservers-docs -f
```

### Opción 3: Docker

#### Crear Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
```

#### Construir y ejecutar

```bash
# Construir imagen
docker build -t hexservers-docs .

# Ejecutar contenedor
docker run -d \
  --name hexservers-docs \
  -p 3000:3000 \
  -v $(pwd)/hexservers.db:/app/hexservers.db \
  -v $(pwd)/sessions.db:/app/sessions.db \
  --restart unless-stopped \
  hexservers-docs

# Ver logs
docker logs -f hexservers-docs
```

### Configurar Nginx como Reverse Proxy

#### Instalar Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Configurar sitio

```bash
sudo nano /etc/nginx/sites-available/hexservers-docs
```

**Contenido:**

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Activar sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/hexservers-docs /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Renovación automática ya está configurada
```

### Configurar Firewall

#### UFW (Ubuntu)

```bash
# Permitir puerto 3000 (si es directo)
sudo ufw allow 3000/tcp

# O solo HTTP/HTTPS si usas Nginx
sudo ufw allow 'Nginx Full'
```

#### firewalld (CentOS/RHEL)

```bash
# Permitir puerto 3000
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# O solo HTTP/HTTPS si usas Nginx
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🔄 Actualización

### Actualizar el Proyecto

```bash
# Detener servidor
pm2 stop hexservers-docs
# O si usas systemd:
# sudo systemctl stop hexservers-docs

# Hacer backup de la base de datos
cp hexservers.db hexservers.db.backup
cp sessions.db sessions.db.backup

# Actualizar código
git pull origin main
# O descargar nueva versión ZIP

# Instalar nuevas dependencias
npm install

# Recompilar CSS
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify

# Reiniciar servidor
pm2 restart hexservers-docs
# O si usas systemd:
# sudo systemctl start hexservers-docs
```

### Backup de Base de Datos

```bash
# Crear backup manual
cp hexservers.db "hexservers-$(date +%Y%m%d-%H%M%S).db"

# O desde el panel admin
# Ir a Configuración > Respaldo de Base de Datos > Descargar
```

---

## 🐛 Troubleshooting

### Error: "EADDRINUSE: address already in use"

**Problema:** El puerto 3000 ya está en uso.

**Solución:**

```bash
# Ver qué proceso usa el puerto 3000
sudo lsof -i :3000

# Matar el proceso
sudo kill -9 <PID>

# O cambiar el puerto en .env
echo "PORT=3001" >> .env
```

### Error: "Cannot find module"

**Problema:** Faltan dependencias.

**Solución:**

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "EACCES: permission denied"

**Problema:** Permisos insuficientes.

**Solución:**

```bash
# Cambiar propietario de archivos
sudo chown -R $USER:$USER .

# Ajustar permisos
chmod -R 755 .
chmod 644 *.db
```

### CSS no se carga correctamente

**Problema:** Tailwind CSS no compilado.

**Solución:**

```bash
# Recompilar CSS
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css --minify

# Verificar archivo generado
ls -lh public/css/output.css
```

### Base de datos corrupta

**Problema:** Error al leer la base de datos.

**Solución:**

```bash
# Restaurar desde backup
cp hexservers.db.backup hexservers.db

# O reinicializar (PERDERÁS DATOS)
rm hexservers.db sessions.db
node server.js
```

### Servidor no inicia

**Problema:** Error desconocido al iniciar.

**Solución:**

```bash
# Ver logs detallados
NODE_ENV=development node server.js

# Verificar dependencias
npm list --depth=0

# Verificar versión de Node.js
node --version  # Debe ser >= 16
```

### Rate limit en login

**Problema:** "Demasiados intentos de inicio de sesión".

**Solución:**

Espera 15 minutos o reinicia el servidor para resetear el contador:

```bash
pm2 restart hexservers-docs
```

---

## 📚 Recursos Adicionales

- **Documentación del proyecto:** Ver archivos `.md` en la raíz
- **Variables de entorno:** `.env.example`
- **Configuración de deployment:** `DEPLOYMENT.md`
- **Estructura del proyecto:** `VIEWS-REFACTORING-REPORT.md`

---

## 🆘 Soporte

Si encuentras problemas no cubiertos en esta guía:

1. Revisa los logs del servidor
2. Verifica los permisos de archivos
3. Asegúrate de tener la versión correcta de Node.js
4. Consulta la documentación adicional del proyecto

---

## 📝 Checklist de Instalación

- [ ] Node.js v16+ instalado
- [ ] Proyecto descargado/clonado
- [ ] `npm install` ejecutado
- [ ] CSS compilado
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Contraseña de admin cambiada
- [ ] Servidor iniciando correctamente
- [ ] PM2 o systemd configurado (producción)
- [ ] Nginx configurado (producción)
- [ ] Firewall configurado
- [ ] SSL configurado (producción)
- [ ] Backup automático configurado

---

**¡Instalación completa!** 🎉

Tu sitio de documentación HexServers Docs ya está funcionando en Linux.
