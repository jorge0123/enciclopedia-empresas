function verificarSesion(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).send('No estás autenticado');
  }
  next();
}

module.exports = verificarSesion;
