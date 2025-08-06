const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  price: String,
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
})

module.exports = mongoose.model('Product', productSchema)
