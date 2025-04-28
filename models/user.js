/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

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
  dni: {
    type: String,
    required: true
  },
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
  regularPlaces: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    }
  ],
  vehicles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    }
  ],
  //selfie almacenada en base64
  profile_photo: {
    type: String
  },
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