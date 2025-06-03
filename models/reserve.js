const mongoose = require('mongoose')

const reserveSchema = new mongoose.Schema({
  status: {
    type: String, //pendiente - confirmada - completada - evaluada (luego de dar opinion), si tiene reservas completadas se muestra en la pantalla iniciar primer boton de evaluar conductor
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
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

const Reserve = mongoose.model('Reserve', reserveSchema)

module.exports = Reserve
