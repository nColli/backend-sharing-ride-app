/* eslint-disable @stylistic/js/linebreak-style */
const tripsRouter = require('express').Router()
const Trip = require('../models/trip')
const Place = require('../models/place')
const User = require('../models/user')
const Message = require('../models/message')
const Reserve = require('../models/reserve')
const Payment = require('../models/payment')
const Opinion = require('../models/opinion')
const geocode = require('../utils/geocode')
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

  const payment = await Payment.findOne({})
  const feeNumber = Number(pricePerPassenger) * payment.fee
  const fee = feeNumber.toString()

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
    const { dateStart, dateEnd, days } = request.body

    const start = new Date(dateStart) //en start y end esta la hora del viaje, se usa para establecer la hora de comienzo de cada viaje
    const end = new Date(dateEnd)
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

//next-trip del conductor que lo solicita
tripsRouter.get('/next-trip', async (request, response) => {
  const user = request.user
  console.log('user', user)

  const trips = await Trip.find({ driver: user._id, status: 'pendiente' }).populate('placeStart').populate('placeEnd').populate('bookings')

  //si retorna null en frontend, busca en reservas donde es pasajero, saca estado de usuario
  if (trips.length === 0) {
    return response.status(404).json({ error: 'No trips found' })
  }

  const today = new Date()
  let nextTrip = trips[0]
  trips.map(trip => {
    if (trip.dateStart < nextTrip.dateStart && trip.dateStart > today) {
      nextTrip = trip
    }
  })
  if (!nextTrip) {
    return response.status(404).json({ error: 'No next trip found' })
  }
  response.json(nextTrip)
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



//iniciar viaje con id en url
tripsRouter.put('/start/:id', async (request, response) => {
  //AGREGAR VERIFICACION QUE SOLO SE PUEDA INICIAR SI FALTA MEDIA HORA
  //sin verificar para testing

  const tripId = request.params.id
  const trip = await Trip.findById(tripId)

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  if (trip.status === 'en proceso') {
    return response.status(400).json({ error: 'Trip already started' })
  }

  if (trip.status === 'completado' || trip.status === 'pago pendiente') {
    return response.status(400).json({ error: 'Trip already completed' })
  }

  trip.status = 'en proceso'
  await trip.save()

  const payment = await Payment.findOne({})
  const alias = payment.alias
  const motivo = tripId //motivo transf conductor

  response.json({ alias, motivo })
})

//terminar viaje, conductor debe ser el que envia la request, envia con una opinion por cada pasajero, array de opiniones, con cada una el id del usuario o la rseserva
tripsRouter.put('/finish/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId)
  const { opinions } = request.body
  // opinions array de opinions
  //estructura opinion:
  // { userTo, opinion }

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  if (trip.status !== 'en proceso') {
    return response.status(400).json({ error: 'Trip not started' })
  }

  //crear opinion por cada pasajero que haya ingresado
  for (const opinionUser of opinions) {
    const opinion = new Opinion({
      user: trip.driver,
      userTo: opinionUser.userTo,
      trip: tripId,
      opinion: opinionUser.opinion
    })
    await opinion.save()
    //guardar en el viaje
    trip.opinions = trip.opinions.concat(opinion._id)
    await trip.save()
  }

  trip.status = 'pago pendiente'
  await trip.save()

  response.json({ message: 'Trip finished' })
})

//terminar viaje, confirmacion de pago
tripsRouter.put('/confirm-payment/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId)

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  if (trip.status !== 'pago pendiente') {
    return response.status(400).json({ error: 'Trip not in payment pending status' })
  }

  trip.status = 'completado'
  await trip.save()

  response.json({ message: 'Trip confirmed payment' })
})

tripsRouter.put('/review-driver/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId)
  const { reviewDriver } = request.body
  //estructura review:
  // { user, opinion }

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  if (trip.status !== 'completado' || trip.status !== 'pago pendiente') {
    return response.status(400).json({ error: 'Trip not completed' })
  }

  // si el usuario no es pasajero, no puede dejar una review
  const passenger = trip.bookings.find(booking => booking.user.toString() === reviewDriver.user.toString())
  if (!passenger) {
    return response.status(400).json({ error: 'User is not a passenger' })
  }

  const review = new Opinion({
    user: reviewDriver.user,
    userTo: trip.driver,
    trip: tripId,
    opinion: reviewDriver.opinion
  })
  await review.save()
  trip.opinions = trip.opinions.concat(review._id)
  await trip.save()

  response.json({ message: 'Review driver saved' })
})

tripsRouter.get('/route/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId).populate('placeStart').populate('placeEnd')

  if (!trip) {
    return response.status(404).json({ error: 'Trip not found' })
  }

  //para formar todas las rutas tengo que hayar los placeStart y placeEnd de cada reserva
  const reserves = await Reserve.find({ trip: tripId })
  const placesStart = []
  placesStart.push(trip.placeStart)
  const placesEnd = []
  placesEnd.push(trip.placeEnd)
  for (const reserve of reserves) {
    placesStart.push(reserve.placeStart)
    placesEnd.push(reserve.placeEnd)
  }

  let urlRuta = 'https://www.google.com/maps/dir/'
  //get coordenadas de cada placesStart y end en un solo array de coordenadas
  for (const place of placesStart) {
    const coordinate = await geocode(place)
    if (coordinate.lat && coordinate.lng) {
      urlRuta += `${coordinate.lat},${coordinate.lng}/`
    }
  }
  for (const place of placesEnd) {
    const coordinate = await geocode(place)
    if (coordinate.lat && coordinate.lng) {
      urlRuta += `${coordinate.lat},${coordinate.lng}/`
    }
  }

  console.log('urlRuta', urlRuta)

  response.json({ urlRuta })
})

//obtener viaje con id en url
tripsRouter.get('/:id', async (request, response) => {
  const tripId = request.params.id
  const trip = await Trip.findById(tripId).populate('placeStart').populate('placeEnd').populate('driver').populate('bookings')

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

  const user = await User.findById(trip.driver)
  user.pendingTrips = user.pendingTrips.filter((trip) => trip._id.toString() !== trip._id.toString())
  await user.save()

  //eliminar el viaje
  await Trip.findByIdAndDelete(tripId)

  response.json({ message: 'Trip deleted' })
})

module.exports = tripsRouter
