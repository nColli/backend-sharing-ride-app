/* eslint-disable @stylistic/js/linebreak-style */
const tripsRouter = require('express').Router()
const Trip = require('../models/trip')
const Place = require('../models/place')
const User = require('../models/user')
const Message = require('../models/message')
const Reserve = require('../models/reserve')
/*
function userHasVehicle(user, vehicleId) {
  if (!user || !user.vehicles || !vehicleId) return false
  return user.vehicles.some(id => id.toString() === vehicleId.toString())
}

function validPlaces(placeStart, placeEnd) {
  return placeStart && placeEnd //verifico que existan
}
*/
tripsRouter.get('/', async (request, response) => {
  const trips = await Trip.find({ driver: request.user.id }).populate('driver').populate('vehicle').populate('placeStart').populate('placeEnd')

  response.json(trips)
})

tripsRouter.post('/', async (request, response) => {
  const user = request.user

  //console.log('user', user.id)

  //console.log('request body', request.body)

  //Desestrucutar request body
  const {
    arrivalRadiusKm,
    date,
    placeEnd,
    placeStart,
    searchRadiusKm,
    vehicle,
    isRoutine,
    pricePerPassenger,
  } = request.body

  const vehicleId = vehicle._id.toString() // ensure we have a string ID
  const dateStart = date


  //console.log("price per passenger: ", pricePerPassenger);

  const feeNumber = Number(pricePerPassenger) * 0.1 // la aplicaciones se lleva el 10% de lo que le cobra a cada pasajero el conductor, establecido por el usuario
  const fee = feeNumber.toString()


  //console.log("fee: ", fee);

  //console.log("date start: ", dateStart);
  /*
  if (!userHasVehicle(user, vehicleId)) {
    return response.status(401).json({ error: 'Vehiculo no esta a nombre del usuario' })
  }

  if (!validPlaces(placeStart, placeEnd)) {
    return response.status(401).json({ error: 'Lugares ingresados no validos' })
  }
  */
  //buscar si existe el lugar de de partida y llegada en la base de datos, si existe no crearlo, obtener el id y guardarlo en el viaje
  let placeStartId = await Place.findOne({ name: placeStart.name })
  let placeEndId = await Place.findOne({ name: placeEnd.name })

  if (!placeStartId) {
    const newPlaceStart = new Place({
      ...placeStart
    })
    const newPlace = await newPlaceStart.save()
    placeStartId = newPlace._id
  }

  if (!placeEndId) {
    const newPlaceEnd = new Place({
      ...placeEnd
    })
    const newPlace = await newPlaceEnd.save()
    placeEndId = newPlace._id
  }

  //crear en loop o crear un solo trip
  if (!isRoutine) {

    const newTrip = new Trip({
      status: 'pendiente',
      dateStart,
      placeStart: placeStartId,
      placeEnd: placeEndId,
      driver: user.id,
      vehicle: vehicleId,
      searchRadiusKm,
      arrivalRadiusKm,
      tripCost: pricePerPassenger,
      tripFee: fee
    })

    //console.log("new trip: ", newTrip);

    const savedTrip = await newTrip.save()

    //console.log("saved trip: ", savedTrip);

    if (!savedTrip) {
      return response.status(401).send({ error: 'error al crear viaje' })
    }

    const updatedUser = user
    updatedUser.pendingTrips = user.pendingTrips.concat(savedTrip._id)
    await User.findOneAndReplace({ _id: user.id }, updatedUser)

    return response.status(200).send({ trip: savedTrip })

  } else {
    const { dateStartRoutine, dateEndRoutine, days } = request.body

    const start = new Date(dateStartRoutine) //en start y end esta la hora del viaje, se usa para establecer la hora de comienzo de cada viaje
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
    //sumo un dia pero la hora que esta en d se conserva
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayMap[d.getDay()]

      if (days.includes(dayName)) {
        const tripDate = new Date(d) // make a copy

        const newTrip = new Trip({
          status: 'pendiente',
          dateStart: tripDate,
          placeStart: placeStartId,
          placeEnd: placeEndId,
          driver: user.id,
          vehicle: vehicleId,
          searchRadiusKm,
          arrivalRadiusKm,
          tripCost: pricePerPassenger,
          tripFee: fee
        })

        const savedTrip = await newTrip.save()
        if (savedTrip) {
          savedTrips.push(savedTrip._id)
          const updatedUser = user
          updatedUser.pendingTrips = user.pendingTrips.concat(savedTrip._id)
          await User.findOneAndReplace({ _id: user.id }, updatedUser)
        }
      }
    }

    return response.status(200).json({ trips: savedTrips })
  }
})

tripsRouter.get('/chat/:id', async (request, response) => {
  //con el id obtengo que viaje es, eso me permite buscar en Trip el trip y obtener los chat, luego retorno un array con todos los mensajes incluido el dueño y el mensaje
  const tripId = request.params.id
  // Find messages for the given tripId, populate user with only name and surname
  const messages = await Message.find({ trip: tripId }).populate({
    path: 'user',
    select: 'name surname _id'
  })

  if (!messages) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  response.json({ messages })
})

//id de trip para agregarlo al chat del viaje, luego se retorna todos los mensajes con la descripcion de los mismos
tripsRouter.post('/chat/:id', async (request, response) => {
  const tripId = request.params.id
  const user = request.user

  const trip = await Trip.findById(tripId)

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  const { message } = request.body

  if (!message) {
    return response.status(404).json({ error: 'Message not found' })
  }

  let isDriver = false

  const userId = user._id.toString()
  const driverId = trip.driver.toString()

  //console.log('user._id', userId)
  //console.log('trip.driver', driverId)

  if (userId === driverId) {
    console.log('user is driver')
    isDriver = true
  }

  const newMessage = new Message({
    trip: tripId,
    user: user.id,
    message,
    isDriver
  })

  console.log('message before saved:', newMessage)

  const savedMessage = await newMessage.save()

  trip.chat = trip.chat.concat(savedMessage._id)
  await trip.save()
  response.status(201).json(savedMessage)
})

//obtener viaje con id en url
tripsRouter.get('/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId)

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  response.json(trip)
})

//eliminar viaje con id en url
//se deben eliminar las reservas asociadas a ese viaje y actualizar a los usuarios con las listas de reservas y viajes
tripsRouter.delete('/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId)

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  //eliminar las reservas asociadas a ese viaje
  const reserves = await Reserve.find({ trip: tripId })
  for (const reserve of reserves) {
    await Reserve.findByIdAndDelete(reserve._id)
  }

  //eliminar el viaje
  await Trip.findByIdAndDelete(tripId)

  response.json({ message: 'Trip deleted' })
})

module.exports = tripsRouter
