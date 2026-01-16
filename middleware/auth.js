// Middleware para verificar si el usuario está autenticado
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Middleware para verificar si el usuario ya está autenticado (para login)
function requireGuest(req, res, next) {
  if (req.session && req.session.userId) {
    res.redirect('/admin');
  } else {
    next();
  }
}

// Middleware para pasar información del usuario a las vistas
function passUser(req, res, next) {
  res.locals.isAuthenticated = req.session && req.session.userId ? true : false;
  res.locals.username = req.session && req.session.username ? req.session.username : null;
  next();
}

module.exports = {
  requireAuth,
  requireGuest,
  passUser
};
