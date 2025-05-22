const mongoose = require('mongoose')

const reserveSchema = new mongoose.Schema({
  status: {
    type: String, //pendiente - confirmada
    require: true
  },
  dateStart: {
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
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }
})

const Reserve = mongoose.model('Reserve', reserveSchema)

module.exports = Reserve
