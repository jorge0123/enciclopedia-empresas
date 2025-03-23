  const express = require('express');
  const router = express.Router();
  const { Usuario, Blog } = require('../models/models');
  const authController = require('../controllers/authController');

  // Middleware para verificar la sesión de usuario
  const verificarSesion = (req, res, next) => {
    if (!req.session.usuario) {
      return res.status(401).send('No estás autenticado');
    }
    next();
  };

  // Ruta para mostrar el perfil del usuario (GET)
  router.get('/perfil', verificarSesion, (req, res) => {
    res.render('perfil', {
      theme: req.session.theme || 'light',
      usuario: req.session.usuario,
    });
  });

  // Ruta para manejar la actualización del perfil (POST)
  router.post('/actualizar-perfil', verificarSesion, authController.actualizarPerfil);

  // Ruta para editar el blog (GET)
  router.get('/editar-blog', verificarSesion, (req, res) => {
    res.render('editar-blog', {
      theme: req.session.theme || 'light',
      usuario: req.session.usuario,
    });
  });

  // Ruta para manejar la actualización del blog (POST)
  router.post('/editar-blog', verificarSesion, authController.editBlog);

  module.exports = router;
