/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema({
  name: {
    type: String
  },
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
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
})

const Place = mongoose.model('Place', placeSchema)

module.exports = Place