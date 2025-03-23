const Company = require('../models/Company');
const User = require('../models/User');

// Actualizar perfil del usuario
exports.actualizarPerfil = async (req, res) => {
  const { nombres, apellidos, email, telefono } = req.body;
  const usuarioId = req.session.usuario._id;  // Usar el ID de la sesión

  try {
    const usuario = await User.findById(usuarioId);
    if (!usuario) {
      return res.status(404).send('Usuario no encontrado');
    }

    usuario.nombres = nombres || usuario.nombres;
    usuario.apellidos = apellidos || usuario.apellidos;
    usuario.email = email || usuario.email;
    usuario.telefono = telefono || usuario.telefono;

    await usuario.save();

    req.session.usuario = usuario; // Actualizar sesión con los nuevos datos

    res.redirect('/perfil');  // Redirigir al perfil después de la actualización
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el perfil: ' + error.message);
  }
};

// Editar el blog
exports.editBlog = async (req, res) => {
  const { titulo, descripcion, productos, servicios } = req.body;
  const userId = req.session.usuario._id;  // Usar el ID de la sesión

  const blog = await Company.findOne({ usuario: userId });
  if (!blog) {
    return res.status(400).send('No tienes un blog para editar.');
  }

  blog.titulo = titulo || blog.titulo;
  blog.descripcion = descripcion || blog.descripcion;
  blog.categorias.productos = productos.split(',') || blog.categorias.productos;
  blog.categorias.servicios = servicios.split(',') || blog.categorias.servicios;

  try {
    await blog.save();
    res.redirect('/perfil');  // Redirigir al perfil después de la edición
  } catch (error) {
    console.error(error);
    res.status(500).send('Hubo un error al editar el blog.');
  }
};
