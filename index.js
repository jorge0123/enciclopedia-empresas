const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware para parsear datos del formulario
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de la sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key', // Usa una variable de entorno o un valor por defecto
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a true si estás usando HTTPS
}));

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Configurar la carpeta de vistas y motor de plantillas (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Servir archivos estáticos (CSS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para establecer el tema en la sesión
app.use((req, res, next) => {
  if (!req.session.theme) {
    req.session.theme = 'light'; // Por defecto
  }
  next();
});

// Configuración de Nodemailer para enviar correos
const transporter = nodemailer.createTransport({
  service: 'gmail', // O cualquier otro servicio
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Función para enviar el correo de verificación
const sendVerificationEmail = (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verifica tu correo electrónico',
    html: `<p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
           <a href="http://localhost:5001/verify/${token}">Verificar correo</a>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error enviando el correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
};

// Importar modelos
const { Categoria, Usuario, Plan, Blog } = require('./models/models');

// Crear el plan Gratis por defecto al iniciar la aplicación
const crearPlanGratis = async () => {
  try {
    const planGratis = await Plan.findOne({ nombre: 'Gratis' });

    if (!planGratis) {
      await Plan.create({
        nombre: 'Gratis',
        descripcion: 'Plan gratuito con funcionalidades básicas.',
        permisos: {
          crear_blog: true,
          crear_producto: false,
          acceso_dashboard: false,
        },
        precio: 0,
        modificaciones_permitidas: 1, // Límite de 1 modificación
      });
      console.log('Plan Gratis creado exitosamente.');
    } else {
      console.log('El plan Gratis ya existe.');
    }
  } catch (error) {
    console.error('Error al crear el plan Gratis:', error);
  }
};

// Llamar a la función para crear el plan Gratis al iniciar la aplicación
crearPlanGratis();

// Middleware para verificar la autenticación del usuario
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/login'); // Redirigir al login si no está autenticado
  }
  next(); // Continuar si el usuario está autenticado
};

// Ruta para manejar el registro de usuarios
app.post('/register', async (req, res) => {
  const { nombres, apellidos, email, password, telefono, tipo } = req.body;

  try {
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).send('El correo electrónico ya está registrado.');
    }

    // Generar un token de verificación
    const token = crypto.randomBytes(20).toString('hex');

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener el plan gratis por defecto
    const planGratis = await Plan.findOne({ nombre: 'Gratis' });

    if (!planGratis) {
      return res.status(500).send('Error al registrar el usuario: Plan gratis no encontrado.');
    }

    // Crear un nuevo usuario
    const usuario = new Usuario({
      nombres,
      apellidos,
      email,
      password: hashedPassword,
      telefono,
      tipo,
      token_verificacion: token,
      tipo_plan: planGratis._id, // Asignar el plan gratis por defecto
    });

    // Guardar el usuario en la base de datos
    await usuario.save();

    // Enviar el correo de verificación
    sendVerificationEmail(email, token);

    // Respuesta al cliente
    res.status(201).send('Usuario registrado. Por favor, verifica tu correo electrónico.');
  } catch (error) {
    res.status(500).send('Error al registrar el usuario: ' + error.message);
  }
});

// Ruta para verificar el correo electrónico
app.get('/verify/:token', async (req, res) => {
  try {
    // Buscar al usuario por el token de verificación
    const usuario = await Usuario.findOne({ token_verificacion: req.params.token });

    if (!usuario) {
      return res.status(400).send('Token inválido o expirado.');
    }

    // Marcar al usuario como verificado
    usuario.estado = 'activo';
    usuario.token_verificacion = undefined;
    await usuario.save();

    // Redirigir al login después de la verificación
    res.redirect('/login');
  } catch (error) {
    res.status(500).send('Error al verificar el correo electrónico: ' + error.message);
  }
});

// Ruta para cambiar el tema
app.post('/toggle-theme', (req, res) => {
  req.session.theme = req.session.theme === 'dark' ? 'light' : 'dark';
  res.json({ theme: req.session.theme });
});

// Ruta para mostrar la página de inicio (index.ejs)
app.get('/', async (req, res) => {
  try {
    const publicaciones = await Blog.find({}); // Buscar blogs
    const usuario = req.session.usuario;
    res.render('index', { publicaciones, theme: req.session.theme, usuario }); // Asegúrate de pasar 'usuario'
  } catch (err) {
    console.error('Error obteniendo publicaciones:', err);
    res.status(500).send('Error al cargar las publicaciones');
  }
});

// Ruta para mostrar la página de registro
app.get('/register', (req, res) => {
  res.render('register', { theme: req.session.theme || 'light' });
});

// Ruta para mostrar la página de login
app.get('/login', (req, res) => {
  res.render('login', { theme: req.session.theme || 'light' });
});

// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar que el email y password no estén vacíos
    if (!email || !password) {
      return res.status(400).send('Por favor ingrese un correo y una contraseña.');
    }

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(400).send('Correo o contraseña incorrectos.');
    }

    // Comparar la contraseña proporcionada con la almacenada
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    
    if (!passwordMatch) {
      return res.status(400).send('Correo o contraseña incorrectos.');
    }

    // Verificar si el usuario está activo
    if (usuario.estado !== 'activo') {
      return res.status(400).send('Cuenta no verificada o inactiva.');
    }

    // Almacenar el usuario en la sesión
    req.session.usuario = usuario;

    // Redirigir al inicio
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error al iniciar sesión: ' + error.message);
  }
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/');
  });
});

// Ruta para mostrar la página de perfil
app.get('/perfil', requireAuth, async (req, res) => {
  const usuario = req.session.usuario;
  res.render('perfil', { usuario, theme: req.session.theme });
});

// Ruta para crear un blog (mostrar el formulario)
app.get('/crear-blog', requireAuth, async (req, res) => {
  const usuarioId = req.session.usuario._id; // Obtener el ID del usuario desde la sesión

  try {
    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    // Verificar si el usuario ya tiene un blog
    if (usuario.blog) {
      return res.redirect('/editar-blog');  // Redirigir a la edición si ya tiene un blog
    }

    // Obtener las categorías
    const categorias = await Categoria.find();

    res.render('crear-blog', { categorias, theme: req.session.theme || 'light' });
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).send('Error al obtener categorías: ' + err.message);
  }
});

// Ruta para crear un blog (procesar el formulario)
app.post('/crear-blog', requireAuth, async (req, res) => {
  const { titulo, descripcion, contenido, categoria_id } = req.body;
  const usuarioId = req.session.usuario._id; // Obtener el ID del usuario desde la sesión

  try {
    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    // Verificar si el usuario ya tiene un blog
    if (usuario.blog) {
      return res.status(400).send('Ya tienes un blog creado.');
    }

    // Crear el nuevo blog
    const nuevoBlog = new Blog({
      usuario_id: usuario._id,
      titulo,
      descripcion,
      contenido,
      categoria_id
    });

    // Guardar el blog en la base de datos
    await nuevoBlog.save();

    // Asignar el blog al usuario
    usuario.blog = nuevoBlog._id;
    await usuario.save();

    // Actualizar el objeto `usuario` en la sesión
    req.session.usuario = usuario;

    // Redirigir al inicio
    res.redirect('/');
  } catch (err) {
    console.error('Error al crear el blog:', err);
    res.status(500).send('Error al crear el blog: ' + err.message);
  }
});

// Ruta para editar un blog (mostrar el formulario)
app.get('/editar-blog', requireAuth, async (req, res) => {
  const usuarioId = req.session.usuario._id; // Obtener el ID del usuario desde la sesión

  try {
    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    // Verificar si el usuario tiene un blog
    if (!usuario.blog) {
      return res.redirect('/crear-blog');  // Redirigir a la creación si no tiene un blog
    }

    // Obtener el blog del usuario
    const blog = await Blog.findById(usuario.blog);

    if (!blog) {
      return res.status(404).send('Blog no encontrado.');
    }

    // Obtener las categorías
    const categorias = await Categoria.find();

    res.render('editar-blog', { blog, categorias, theme: req.session.theme || 'light' });
  } catch (err) {
    console.error('Error al obtener el blog:', err);
    res.status(500).send('Error al obtener el blog: ' + err.message);
  }
});

// Ruta para editar un blog (procesar el formulario)
app.post('/editar-blog', requireAuth, async (req, res) => {
  const { titulo, descripcion, contenido, categoria_id } = req.body;
  const usuarioId = req.session.usuario._id; // Obtener el ID del usuario desde la sesión

  try {
    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    // Obtener el plan del usuario
    const plan = await Plan.findById(usuario.tipo_plan);

    if (!plan) {
      return res.status(400).send('Plan no encontrado.');
    }

    // Verificar si el usuario ha excedido las modificaciones permitidas
    if (usuario.modificaciones_realizadas >= plan.modificaciones_permitidas) {
      return res.status(400).send('Has excedido el límite de modificaciones permitidas para tu plan.');
    }

    // Obtener el blog del usuario
    const blog = await Blog.findById(usuario.blog);

    if (!blog) {
      return res.status(404).send('Blog no encontrado.');
    }

    // Actualizar el blog
    blog.titulo = titulo;
    blog.descripcion = descripcion;
    blog.contenido = contenido;
    blog.categoria_id = categoria_id;
    blog.fecha_actualizacion = Date.now();
    await blog.save();

    // Incrementar el contador de modificaciones
    usuario.modificaciones_realizadas += 1;
    usuario.fecha_ultima_modificacion = Date.now();
    await usuario.save();

    // Actualizar el objeto `usuario` en la sesión
    req.session.usuario = usuario;

    // Redirigir al inicio
    res.redirect('/');
  } catch (err) {
    console.error('Error al editar el blog:', err);
    res.status(500).send('Error al editar el blog: ' + err.message);
  }
});

// Ruta para eliminar un blog
app.post('/eliminar-blog', requireAuth, async (req, res) => {
  const usuarioId = req.session.usuario._id; // Obtener el ID del usuario desde la sesión

  try {
    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    // Eliminar el blog
    await Blog.findByIdAndDelete(usuario.blog);

    // Limpiar la referencia al blog en el usuario
    usuario.blog = undefined;
    usuario.modificaciones_realizadas = 0; // Reiniciar el contador de modificaciones
    await usuario.save();

    // Actualizar el objeto `usuario` en la sesión
    req.session.usuario = usuario;

    // Redirigir al inicio
    res.redirect('/');
  } catch (err) {
    console.error('Error al eliminar el blog:', err);
    res.status(500).send('Error al eliminar el blog: ' + err.message);
  }
});
// Ruta para mostrar el perfil y el formulario de actualización
app.get('/perfil', requireAuth, async (req, res) => {
  const usuario = req.session.usuario;
  res.render('perfil', { usuario, theme: req.session.theme });
});
// Ruta para procesar la actualización del perfil
app.post('/actualizar-perfil', requireAuth, async (req, res) => {
  const { nombres, apellidos, telefono, email } = req.body;
  const usuarioId = req.session.usuario._id;

  try {
    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    // Actualizar los datos del usuario
    usuario.nombres = nombres || usuario.nombres;
    usuario.apellidos = apellidos || usuario.apellidos;
    usuario.telefono = telefono || usuario.telefono;
    usuario.email = email || usuario.email;

    // Guardar los cambios en la base de datos
    await usuario.save();

    // Actualizar el objeto `usuario` en la sesión
    req.session.usuario = usuario;

    // Redirigir al perfil con los cambios actualizados
    res.redirect('/');
  } catch (err) {
    console.error('Error al actualizar el perfil:', err);
    res.status(500).send('Error al actualizar el perfil: ' + err.message);
  }
});


// Servir la aplicación en el puerto 5001
app.listen(5001, () => {
  console.log('Servidor ejecutándose en http://localhost:5001');
});