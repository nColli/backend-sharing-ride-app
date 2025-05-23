const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDriver: {
    type: Boolean
  },
  message: {
    type: String,
    required: true
  },
})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message
