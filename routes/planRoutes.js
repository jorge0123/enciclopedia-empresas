const express = require('express');
const router = express.Router();
const { Usuario, Blog, Plan } = require('../models/models');

// Ruta para mostrar la página de planes
router.get('/planes', async (req, res) => {
  try {
    const planes = await Plan.find({});
    res.render('planes', { planes, theme: req.session.theme || 'light' });
  } catch (err) {
    res.status(500).send('Error al obtener los planes: ' + err.message);
  }
});

// Ruta para crear un blog
router.post('/crear-blog', async (req, res) => {
  const { titulo, descripcion, contenido, categoria_id } = req.body;
  const usuario = req.session.usuario;

  if (!usuario) {
    return res.redirect('/login');
  }

  try {
    if (usuario.blog) {
      return res.status(400).send('Ya tienes un blog creado.');
    }

    const nuevoBlog = new Blog({
      usuario_id: usuario._id,
      titulo,
      descripcion,
      contenido,
      categoria_id,
    });

    await nuevoBlog.save();
    usuario.blog = nuevoBlog._id;
    await usuario.save();

    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error al crear el blog: ' + err.message);
  }
});

module.exports = router;