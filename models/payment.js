/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  alias: { //alias elegido, puede ser igual al 1 o 2, lo decide el admin
    type: String,
    require: true
  },
  alias1: {
    type: String,
    require: true
  },
  alias2: {
    type: String,
    require: true
  },
  fee: {
    type: Number, //comision por cada viaje en float ej 0.1
    require: true
  },
})

const Payment = mongoose.model('Payment', paymentSchema)

module.exports = Payment
