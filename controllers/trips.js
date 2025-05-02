/* eslint-disable @stylistic/js/linebreak-style */
const tripsRouter = require('express').Router()
const Trips = require('../models/trip')

function estimateCost(placeStart, placeEnd) {
  return 100
}

tripsRouter.get('/', async (request, response) => {
  const trips = await Trips.find({})

  response.json(trips)
})

tripsRouter.post('/', async (request, response) => {
  const user = request.user

  console.log('user', user.id)

  console.log('request body', request.body)

  const { vehicleId, placeStart, placeEnd, dateStart, isRoutine, searchRadiusKm, arrivalRadiusKm } = request.body

  const totalCost = estimateCost(placeStart, placeEnd)

  const fee = totalCost * 0.1

  if (isRoutine) {
    const { dateStartRoutine, dateEndRoutine, days } = request.body
  }

  

  return response.status(200).json({})
})

module.exports = tripsRouter