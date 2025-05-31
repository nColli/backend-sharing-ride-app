/* eslint-disable @stylistic/js/linebreak-style */
const mongoose = require('mongoose')

const opinionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true
  },
  userTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true
  },
  opinion: {
    type: String,
    require: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    require: true
  }
})

const Opinion = mongoose.model('Opinion', opinionSchema)

module.exports = Opinion
