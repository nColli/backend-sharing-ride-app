/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')
const Place = require('./place')

const regularPlaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  place: {
    type: Place,
    required: true,
  },
})

const RegularPlace = mongoose.model('RegularPlace', regularPlaceSchema)

module.exports = RegularPlace