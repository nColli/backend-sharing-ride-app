/* eslint-disable @stylistic/js/linebreak-style */
const tripsRouter = require('express').Router()
const Trip = require('../models/trip')
const Place = require('../models/place')
const User = require('../models/user')

function userHasVehicle(user, vehicleId) {
  return user.vehicles.includes(vehicleId)
}

function validPlaces(placeStart, placeEnd) {
  return placeStart && placeEnd //verifico que existan
}

tripsRouter.get('/', async (request, response) => {
  const trips = await Trip.find({})

  response.json(trips)
})

tripsRouter.post('/', async (request, response) => {
  const user = request.user

  console.log('user', user.id)

  console.log('request body', request.body)

  const { vehicleId, placeStart, placeEnd, dateStart, isRoutine, searchRadiusKm, arrivalRadiusKm } = request.body
  /*
  const totalCost = estimateCost(placeStart, placeEnd)

  const fee = totalCost * 0.1
  */

  if (!userHasVehicle(user, vehicleId)) {
    return response.status(401).json({ error: 'Vehiculo no esta a nombre del usuario' })
  }

  if (!validPlaces(placeStart, placeEnd)) {
    return response.status(401).json({ error: 'Lugares ingresados no validos' })
  }

  const newPlaceStart = new Place({
    ...placeStart
  })

  const newPlaceEnd= new Place({
    ...placeEnd
  })

  await newPlaceStart.save()
  await newPlaceEnd.save()

  //crear en loop o crear un solo trip
  if (!isRoutine) {

    const newTrip = new Trip({
      status: 'pendiente',
      dateStart,
      placeStart: newPlaceStart.id,
      placeEnd: newPlaceEnd.id,
      driver: user.id,
      vehicle: vehicleId,
      searchRadiusKm,
      arrivalRadiusKm
    })

    const savedTrip = await newTrip.save()

    if (!savedTrip) {
      response.status(401).send({ error: 'error al crear viaje' })
    }

    const updatedUser = user
    updatedUser.trips = user.trips.concat(savedTrip._id)
    await User.findOneAndReplace({ _id: user.id }, updatedUser)

    response
      .status(200)
      .send({ trip: savedTrip })

  } else {

    const { dateStartRoutine, dateEndRoutine, days } = request.body

    const start = new Date(dateStartRoutine)
    const end = new Date(dateEndRoutine)
    const dayMap = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    }

    const savedTrips = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayMap[d.getDay()]

      if (days.includes(dayName)) {
        const tripDate = new Date(d) // make a copy

        const newTrip = new Trip({
          status: 'pendiente',
          dateStart: tripDate,
          placeStart: newPlaceStart.id,
          placeEnd: newPlaceEnd.id,
          driver: user.id,
          vehicle: vehicleId,
          searchRadiusKm,
          arrivalRadiusKm
        })

        const savedTrip = await newTrip.save()
        if (savedTrip) {
          savedTrips.push(savedTrip._id)
        }
      }
    }

    user.trips = user.trips.concat(savedTrips)
    await User.findOneAndReplace({ _id: user.id }, user)

    return response.status(200).json({ trips: savedTrips })

  }

  return response.status(200).json({})
})

module.exports = tripsRouter