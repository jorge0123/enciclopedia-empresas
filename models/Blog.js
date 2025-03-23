const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  titulo: String,
  contenido: String,
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Relación con usuario
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', BlogSchema);
