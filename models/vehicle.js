/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const vehicleSchema = new mongoose.Schema({
  plate: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  insuranceImage: {
    type: String, //store in base64
    required: true,
  },
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)

module.exports = Vehicle