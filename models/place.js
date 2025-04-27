/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  province: {
    type: String,
    required: true,
  }
})

const Place = mongoose.model('Place', placeSchema)

module.exports = Place