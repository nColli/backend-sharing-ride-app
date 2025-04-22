/* eslint-disable @stylistic/js/linebreak-style */
const StringRequired  = require('../structure/requirements')
const { RegularPlace, Vehicle } = require('../structure/objects')

const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
  email: {
    ...StringRequired,
    unique: true
  },
  passwordHash: StringRequired,
  //datos usuario
  name: StringRequired,
  surname: StringRequired,
  //adentro va almacenado la casa cuando se registra
  regularPlaces: [
    {
      type: RegularPlace,
      ref: 'RegularPlace'
    }
  ],
  vehicles: [
    {
      type: Vehicle,
      ref: 'Vehicle'
    }
  ],
  //arrays de viajes y reservas
  oldTrips: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    }
  ],
  pendingTrips: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    }
  ],
  oldReserves: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reserve'
    }
  ],
  pendingReserves: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reserve'
    }
  ],
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // el passwordHash no debe mostrarse
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User