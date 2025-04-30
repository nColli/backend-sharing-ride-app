/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const vehicleSchema = new mongoose.Schema({
  plate: {
    type: String,
    required: true,
    unique: true
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
  capacity: {
    type: String,
    required: true
  },
  kilometers: {
    type: String,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)

module.exports = Vehicle