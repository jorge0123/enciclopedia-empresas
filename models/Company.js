const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  categorias: {
    productos: {
      type: [String],
      enum: ['accesorios', 'otro tipo de producto'],
    },
    servicios: {
      type: [String],
      enum: ['delivery', 'otro servicio'],
    },
  },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, default: 'gratis', enum: ['gratis', 'premium', 'empresa'] },
  modificaciones: { type: Number, default: 0 }, // Número de modificaciones realizadas
  modificacionesRestantes: { type: Number, default: 3 }, // Restante de modificaciones mensuales en el plan gratuito
  elementosAgregados: { type: Number, default: 0 }, // Número de elementos agregados (productos, servicios)
});

module.exports = mongoose.model('Company', companySchema);
