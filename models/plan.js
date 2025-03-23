// models/Plan.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  permisos: {
    crear_blog: { type: Boolean, default: false },
    crear_producto: { type: Boolean, default: false },
    acceso_dashboard: { type: Boolean, default: false },
    mostrar_en_inicio: { type: Boolean, default: false }, // Para el plan VIP
  },
  precio: { type: Number, required: true },
  modificaciones_permitidas: { type: Number, required: true },
});

module.exports = mongoose.model('Plan', planSchema);
