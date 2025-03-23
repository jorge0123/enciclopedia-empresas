const mongoose = require('mongoose');

// Esquema para la colección de Categorías
const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },       // Nombre de la categoría principal
  tipo: { type: String, enum: ['servicios', 'productos'], required: true }, // Tipo: 'servicios' o 'productos'
  subcategorias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }], // Subcategorías relacionadas
});

// Esquema para la colección de Usuarios
const usuarioSchema = new mongoose.Schema({
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  foto_perfil: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tipo: { type: String, enum: ['cliente', 'empresa'], required: true },
  telefono: { type: String, required: true },
  direccion: String,
  fecha_registro: { type: Date, default: Date.now },
  token_verificacion: String,
  estado: { type: String, enum: ['pendiente', 'activo', 'inactivo'], default: 'pendiente' },
  fecha_ultimo_login: Date,
  informacion_contacto: mongoose.Schema.Types.Mixed,
  fecha_actualizacion: Date,
  tipo_plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }, // Referencia al plan del usuario
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }, // Referencia al blog del usuario
  modificaciones_realizadas: { type: Number, default: 0 }, // Contador de modificaciones
  fecha_ultima_modificacion: Date, // Fecha de la última modificación
  fecha_vencimiento_plan: { type: Date, default: null }, // Fecha de vencimiento del plan
});

// Esquema para la colección de Blogs
const blogSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  titulo: { type: String, required: true },
  descripcion: String,
  contenido: String,
  imagen_video: String,
  fecha_creacion: { type: Date, default: Date.now },
  fecha_actualizacion: Date,
  categoria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },  // Relación con la categoría
});

// Esquema para la colección de Productos
const productoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  imagen_video: String,
  fecha_publicacion: { type: Date, default: Date.now },
  categoria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },  // Relación con la categoría
  fecha_expiracion: Date,
  estado_producto: { type: String, enum: ['disponible', 'agotado', 'ultimas_unidades'], default: 'disponible' },
});

// Esquema para la colección de Calificaciones
const calificacionSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  empresa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comentario: String,
  fecha: { type: Date, default: Date.now },
});

// Esquema para la colección de Favoritos
const favoritoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  empresa_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
});

// Esquema para la colección de Mensajes
const mensajeSchema = new mongoose.Schema({
  remitente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  destinatario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  mensaje: { type: String, required: true },
  fecha_envio: { type: Date, default: Date.now },
  estado: { type: String, enum: ['leído', 'no leído'], default: 'no leído' },
});

// Esquema para la colección de Transacciones
const transaccionSchema = new mongoose.Schema({
  comprador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  vendedor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  producto_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true },
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'completado', 'cancelado'], default: 'pendiente' },
});

// Esquema para la colección de Pagos
const pagoSchema = new mongoose.Schema({
  transaccion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaccion', required: true },
  monto: { type: Number, required: true },
  metodo_pago: { type: String, enum: ['tarjeta', 'paypal', 'transferencia'], required: true },
  fecha_pago: { type: Date, default: Date.now },
  estado_pago: { type: String, enum: ['pendiente', 'completado', 'fallido'], default: 'pendiente' },
});

// Esquema para la colección de Tarjetas
const tarjetaSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  numero_tarjeta: { type: String, required: true },
  nombre_tarjeta: { type: String, required: true },
  fecha_expiracion: { type: Date, required: true },
  codigo_seguridad: { type: String, required: true },
  direccion_facturacion: { type: String, required: true },
  token_verificacion: String,
  telefono_validacion: String,
});

// Esquema para la colección de Actividad de Usuarios
const actividadUsuarioSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, enum: ['registro', 'inicio_sesion', 'cambio_direccion', 'cambio_contraseña'], required: true },
  fecha: { type: Date, default: Date.now },
  detalles: String,
});

// Esquema para la colección de Clics en Blogs
const clicBlogSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  blog_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  fecha_click: { type: Date, default: Date.now },
});

// Esquema para la colección de Clics en Productos
const clicProductoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  producto_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  fecha_click: { type: Date, default: Date.now },
});

// Esquema para la colección de Contacto de Empresa
const contactoEmpresaSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  telefono_adicional: String,
  email_adicional: String,
  direccion_adicional: String,
  horarios_atencion: String,
  imagen_logo: String,
  imagen_portada: String,
  video_presentacion: String,
  fecha_creacion: { type: Date, default: Date.now },
});

// Esquema para la colección de Planes
const planSchema = new mongoose.Schema({
  nombre: { type: String, required: true },  // Nombre del plan (por ejemplo, 'Básico', 'Premium', 'Enterprise')
  descripcion: String,                       // Descripción del plan
  permisos: {                               // Permisos asignados al plan
    crear_blog: { type: Boolean, default: false },
    crear_producto: { type: Boolean, default: false },
    acceso_dashboard: { type: Boolean, default: false },
  },
  precio: { type: Number, required: true },  // Precio del plan
  modificaciones_permitidas: { type: Number, default: 0 }, // Límite de modificaciones
  fecha_creacion: { type: Date, default: Date.now },
});

// Crear modelo para Plan
const Plan = mongoose.model('Plan', planSchema);

// Crear los modelos correspondientes
const Categoria = mongoose.model('Categoria', categoriaSchema);
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Blog = mongoose.model('Blog', blogSchema);
const Producto = mongoose.model('Producto', productoSchema);
const Calificacion = mongoose.model('Calificacion', calificacionSchema);
const Favorito = mongoose.model('Favorito', favoritoSchema);
const Mensaje = mongoose.model('Mensaje', mensajeSchema);
const Transaccion = mongoose.model('Transaccion', transaccionSchema);
const Pago = mongoose.model('Pago', pagoSchema);
const Tarjeta = mongoose.model('Tarjeta', tarjetaSchema);
const ActividadUsuario = mongoose.model('ActividadUsuario', actividadUsuarioSchema);
const ClicBlog = mongoose.model('ClicBlog', clicBlogSchema);
const ClicProducto = mongoose.model('ClicProducto', clicProductoSchema);
const ContactoEmpresa = mongoose.model('ContactoEmpresa', contactoEmpresaSchema);

module.exports = {
  Categoria,
  Usuario,
  Blog,
  Producto,
  Calificacion,
  Favorito,
  Mensaje,
  Transaccion,
  Pago,
  Tarjeta,
  ActividadUsuario,
  ClicBlog,
  ClicProducto,
  ContactoEmpresa,
  Plan
};
