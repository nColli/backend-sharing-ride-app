/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const Place = new mongoose.Schema({
  street: String,
  number: String,
  city: String,
  province: String
})

const RegularPlace = new mongoose.Schema({
  name: String,
  place: Place
})

const Vehicle = new mongoose.Schema({
  plate: String,
  brand: String,
  model: String,
  year: Number,
  insuranceImage: String //store in Base64
})

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  //datos usuario
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  isAdministrator: {
    type: Boolean,
    required: true
  },
  tokenResetPassword: {
    type: String
  },
  tokenExpirationDate: {
    type: String
  },
  //adentro va almacenado la casa cuando se registra
  regularPlaces: [RegularPlace],
  vehicles: [Vehicle],
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
  ]
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // el passwordHash no debe mostrarse
    delete returnedObject.passwordHash
    delete returnedObject.tokenResetPassword
    delete returnedObject.tokenExpirationDate
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User