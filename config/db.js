const mongoose = require('mongoose');
require('dotenv').config();  // Asegúrate de cargar las variables de entorno

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1); // Detener la aplicación si no se puede conectar a la base de datos
  }
};

// Esquema de Plan
const planSchema = new mongoose.Schema({
  tipo_plan: { type: String, enum: ['gratis', 'premium', 'destacado'], required: true },
  descripcion: String,
  permisos: {
    crear_blog: { type: Boolean, default: false },
    // Agrega más permisos según lo necesites
  },
});

// Esquema de Categoría
const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
});

// Esquema de Usuario
const usuarioSchema = new mongoose.Schema({
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  foto_perfil: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tipo: { type: String, enum: ['cliente', 'empresa'], required: true },
  telefono: String,
  direccion: String,
  fecha_registro: { type: Date, default: Date.now },
  token_verificacion: String,
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
  fecha_ultimo_login: Date,
  informacion_contacto: mongoose.Schema.Types.Mixed,  // JSON
  fecha_actualizacion: Date,
  tipo_plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },  // Referencia a Plan
});

// Crear los modelos de Plan, Categoria y Usuario
const Plan = mongoose.model('Plan', planSchema);
const Categoria = mongoose.model('Categoria', categoriaSchema);
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Función para verificar los permisos del usuario
async function verificarPermisos(usuarioId, accion) {
  const usuario = await Usuario.findById(usuarioId).populate('tipo_plan');
  
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const plan = usuario.tipo_plan;

  if (plan.permisos[accion] === false) {
    throw new Error(`No tienes permiso para realizar la acción: ${accion}`);
  }

  return true;
}

// Función de ejemplo para crear un blog
async function crearBlog(usuarioId, titulo, contenido) {
  try {
    // Verificar permisos de creación de blog
    await verificarPermisos(usuarioId, 'crear_blog');

    const nuevoBlog = new Blog({
      usuario_id: usuarioId,
      titulo,
      contenido,
      fecha_creacion: new Date(),
    });

    await nuevoBlog.save();
    console.log('Blog creado exitosamente');
  } catch (error) {
    console.error(error.message);
  }
}

// Exportar la conexión y los modelos
module.exports = { connectDB, Plan, Categoria, Usuario };
