/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const tripSchema = new mongoose.Schema({
  status: {
    type: String,
    require: true
  },
  dateStart: {
    type: String,
    require: true
  },
  dateEnd: {
    type: String,
    require: true
  },
  placeStart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place'
  },
  placeEnd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  ],
  searchRadiusKm: {
    type: Number,
    require: true
  },
  arrivalRadiusKm: {
    type: Number,
    require: true
  },
  opinions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opinion'
    }
  ],
  chat: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  ],
  tripCost: {
    type: Number,
    require: true
  },
  tripFee: {
    type: Number, //porcentaje del costo total del viaje
    require: true
  }
})

const Trip = mongoose.model('Trip', tripSchema)

module.exports = Trip