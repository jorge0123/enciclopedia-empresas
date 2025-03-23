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
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Configurar la carpeta de vistas y motor de plantillas (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware para establecer el tema en la sesión
app.use((req, res, next) => {
  if (!req.session.theme) {
    req.session.theme = 'light'; // Por defecto
  }
  next();
});

// Configuración de Nodemailer para enviar correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
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

// Middleware para verificar la autenticación del usuario
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/login'); // Redirigir al login si no está autenticado
  }
  next();
};

// Ruta para manejar el login (mostrar formulario)
app.get('/login', (req, res) => {
  res.render('login', { theme: req.session.theme });
});

// Ruta para manejar el login (procesar formulario)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(400).send('El correo electrónico no está registrado.');
    }

    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(400).send('Contraseña incorrecta.');
    }

    req.session.usuario = usuario;
    return res.redirect('/'); // Redirigir al inicio después de iniciar sesión
  } catch (error) {
    return res.status(500).send('Error al iniciar sesión: ' + error.message);
  }
});

// Ruta para manejar el registro de usuarios
app.post('/register', async (req, res) => {
  const { nombres, apellidos, email, password, telefono, tipo } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).send('El correo electrónico ya está registrado.');
    }

    const token = crypto.randomBytes(20).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);
    const planGratis = await Plan.findOne({ nombre: 'Gratis' });

    if (!planGratis) {
      return res.status(500).send('Error al registrar el usuario: Plan gratis no encontrado.');
    }

    const usuario = new Usuario({
      nombres,
      apellidos,
      email,
      password: hashedPassword,
      telefono,
      tipo,
      token_verificacion: token,
      tipo_plan: planGratis._id,
    });

    await usuario.save();
    sendVerificationEmail(email, token);

    return res.status(201).send('Usuario registrado. Por favor, verifica tu correo electrónico.');
  } catch (error) {
    return res.status(500).send('Error al registrar el usuario: ' + error.message);
  }
});

// Ruta para mostrar la página de inicio (index.ejs)
app.get('/', async (req, res) => {
  try {
    const publicaciones = await Blog.find({});
    const usuario = req.session.usuario;

    // Verificamos si el usuario tiene un blog para mostrar el botón de editar o eliminar
    let mostrarBotones = false;
    if (usuario && usuario.blog) {
      mostrarBotones = true;
    }

    return res.render('index', { publicaciones, theme: req.session.theme, usuario, mostrarBotones });
  } catch (err) {
    console.error('Error obteniendo publicaciones:', err);
    return res.status(500).send('Error al cargar las publicaciones');
  }
});

// Ruta para crear un blog (mostrar el formulario)
app.get('/crear-blog', requireAuth, async (req, res) => {
  const usuarioId = req.session.usuario._id;

  try {
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    if (usuario.blog) {
      return res.redirect('/editar-blog'); // Redirigir a la edición si ya tiene un blog
    }

    const categorias = await Categoria.find();
    return res.render('crear-blog', { categorias, theme: req.session.theme });
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    return res.status(500).send('Error al obtener categorías: ' + err.message);
  }
});

// Ruta para crear un blog (procesar el formulario)
app.post('/crear-blog', requireAuth, async (req, res) => {
  const { titulo, descripcion, contenido, categoria_id } = req.body;
  const usuarioId = req.session.usuario._id;

  try {
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado.');
    }

    if (usuario.blog) {
      return res.status(400).send('Ya tienes un blog creado.');
    }

    const nuevoBlog = new Blog({
      titulo,
      descripcion,
      contenido,
      usuario_id: usuarioId,
      categoria: categoria_id,
    });

    await nuevoBlog.save();
    usuario.blog = nuevoBlog._id;
    await usuario.save();

    return res.redirect('/editar-blog'); // Redirigir al formulario de edición del blog
  } catch (err) {
    console.error('Error al crear el blog:', err);
    return res.status(500).send('Error al crear el blog');
  }
});

// Ruta para eliminar el blog
app.post('/eliminar-blog', requireAuth, async (req, res) => {
  const usuarioId = req.session.usuario._id;

  try {
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario || !usuario.blog) {
      return res.status(404).send('No tienes un blog para eliminar.');
    }

    await Blog.findByIdAndDelete(usuario.blog);
    usuario.blog = undefined;
    await usuario.save();

    return res.redirect('/perfil'); // Redirigir al perfil después de eliminar el blog
  } catch (err) {
    console.error('Error al eliminar el blog:', err);
    return res.status(500).send('Error al eliminar el blog');
  }
});

// Iniciar el servidor
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
