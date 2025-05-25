const reservesRouter = require('express').Router()
const Reserve = require('../models/reserve')
const Trip = require('../models/trip')
const axios = require('axios')
const Vehicle = require('../models/vehicle')
const User = require('../models/user')

const fechaCerca = (trip, date) => {
  const tripDate = new Date(trip.dateStart)
  const targetDate = new Date(date)
  const diffMs = Math.abs(tripDate - targetDate)
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours <= 1
}

const geocodePlace = async (place) => {
  const url = 'https://nominatim.openstreetmap.org/search?'
  const urlQuery = `${url}street=${place.street}&city=${place.city}&state=${place.province}&country=Argentina`

  const response = await axios.get(urlQuery)
  const lat = response[0].lat
  const lng = response[0].lon

  return {
    lat,
    lng
  }
}

const haversineDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371 // Earth radius in km

  const dLat = toRad(coord2.lat - coord1.lat)
  const dLon = toRad(coord2.lng - coord1.lng)
  const lat1 = toRad(coord1.lat)
  const lat2 = toRad(coord2.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const lugarCerca = async (trip, placeStart, placeEnd) => {
  // trip.placeStart, trip.placeEnd: { street, number, city, province }
  // placeStart, placeEnd: { street, number, city, province }
  try {
    const tripStartCoords = await geocodePlace(trip.placeStart)
    const tripEndCoords = await geocodePlace(trip.placeEnd)
    const startCoords = await geocodePlace(placeStart)
    const endCoords = await geocodePlace(placeEnd)

    const startDist = haversineDistance(tripStartCoords, startCoords)
    const endDist = haversineDistance(tripEndCoords, endCoords)
    return (
      startDist <= (trip.searchRadiusKm || 0) &&
      endDist <= (trip.arrivalRadiusKm || 0)
    )
  } catch (error) {
    console.log('error lugarCerca')
    return false
  }
}

const estaDisponible = async (trip) => {
  //verifica si tiene capacidad y si el estado es en pendiente
  //console.log('verificando si esta disponible')

  if (trip.status !== 'pendiente') {
    //console.log('viaje no esta pendiente', trip)
    return false
  }

  //console.log('viaje esta pendiente')

  const vehicleId = trip.vehicle

  const vehicle = await Vehicle.findById(vehicleId)

  //console.log('capacidad', vehicle)

  return Number(vehicle.capacity) < trip.bookings.length
}


const findTrip = async (placeStart, placeEnd, date) => {
  //buscar en la lista de viajes por hacer
  const trips = await Trip.find()
  //console.log('lista de viajes donde buscar', trips)

  let tripElegido = null
  trips.map(async (trip) => {
    if (estaDisponible(trip) && fechaCerca(trip, date) && lugarCerca(trip, placeStart, placeEnd)) {
      tripElegido = trip
    }
  })

  return tripElegido
}

const findCreateReserve = async (placeStart, placeEnd, date, user) => {
  //crear reserve y añadir a usuario
  //primero busco para si esa fecha hay un viaje disponible
  const trip = await findTrip(placeStart, placeEnd, date)

  if (trip === null) {
    return false
  }

  //console.log('date:', date)

  //asumo que hay un viaje elegido, creo la reserva y la guardo
  const newReserve = new Reserve({
    status: 'pendiente',
    placeStart,
    placeEnd,
    dateStart: date,
    user: user.id,
    trip: trip._id
  })

  //console.log('newReserve', newReserve)

  const reserve = await newReserve.save()

  //guardar reserva id en usuario
  user.pendingReserves = user.pendingReserves.concat(reserve._id)
  await user.save()

  //guardar reserva en viaje
  trip.bookings = trip.bookings.concat(reserve._id)
  await Trip.findOneAndReplace({ _id: trip._id }, trip)

  return reserve
}

const createRoutine = async (bodyRequest) => {
  //crear rutina
  const { placeStart, placeEnd, dateStartRoutine, dateEndRoutine, days, user } = bodyRequest

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

  const savedReserves = []
  let allCreate = true

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = dayMap[d.getDay()]

    if (days.includes(dayName)) {
      const reserve = await findCreateReserve(placeStart, placeEnd, d, user)

      if (reserve === false) {
        allCreate = false
      }
    }
  }

  return {
    savedReserves,
    allCreate
  }
}

reservesRouter.post('/', async (request, response) => {
  const user = request.user

  const {
    placeStart,
    placeEnd,
    date,
    isRoutine,
  } = request.body

  //console.log('body recibido', request.body)
  console.log('es rutina:', isRoutine)

  if (isRoutine) {
    const { reserves, allCreate } = await createRoutine(request.body)

    if (reserves === false) {
      return response.status(401).send({ error: 'No ha sido posible crear ninguna reserva' })
    }

    if (allCreate === false) {
      return response.status(200).send({ reserves, message: 'No se han creado todas las reservas, pero si algunas' })
    }


    return response.status(200).send({ reserves })

  } else {
    //crear una sola reserva
    console.log('registrando reserva no rutinaria')
    const reserve =  await findCreateReserve(placeStart, placeEnd, date, user)

    if (reserve === false) {
      return response.status(401).send({ error: 'No ha sido posible crear la reserva' })
    }

    return response.status(200).send({ reserve })
  }
})

async function confirmarReserva(reserve) {
  reserve.status = 'confirmada'
  await Reserve.findByIdAndUpdate(reserve._id, reserve)
}

reservesRouter.patch('/confirm', async (request, response) => {
  //hacer que los reserves enviados pasen a confirmados, para que admita rutinas envio reserves, si es uno solo es un arrray de un elemento
  const { reserves } = request.body

  reserves.map(async (reserve) => {
    await confirmarReserva(reserve)
  })

  return response.status(200).send({ message: 'reservas confirmadas' })
})

reservesRouter.get('/', async (request, response) => {
  const user = request.user

  //console.log('obt reservas pendientes')

  //const reservas = await User.find({ _id: user._id }).populate('pendingReserves')
  //const reserves = reservas[0].pendingReserves

  const reserves = await Reserve.find({ user: user.id }).populate('placeStart').populate('placeEnd')

  return response.status(200).send(reserves)
})

reservesRouter.get('/', async (request, response) => {
  const user = request.user

  const reserves = await Reserve.find({ user: user.id })

  return response.status(200).send(reserves)
})

// obtener reserva con id en url - IMP: NO POPULAR con trip
reservesRouter.get('/:id', async (request, response) => {
  const { id } = request.params

  const reserve = await Reserve.findById(id)
    .populate('placeStart')
    .populate('placeEnd')
    .populate('trip')

  if (!reserve) {
    return response.status(404).send({ error: 'Reserva no encontrada' })
  }

  return response.status(200).send(reserve)
})


//eliminar reserva con id en url
reservesRouter.delete('/:id', async (request, response) => {
  const { id } = request.params

  const reserve = await Reserve.findByIdAndDelete(id)

  if (!reserve) {
    return response.status(404).send({ error: 'Reserva no encontrada' })
  }

  const user = await User.findById(reserve.user)
  user.pendingReserves = user.pendingReserves.filter((reserve) => reserve._id.toString() !== reserve._id.toString())
  await user.save()

  const trip = await Trip.findById(reserve.trip)

  trip.bookings = trip.bookings.filter((booking) => booking.toString() !== reserve.toString())
  await Trip.findOneAndReplace({ _id: trip._id }, trip)

  return response.status(200).send({ message: 'Reserva eliminada' })
})


module.exports = reservesRouter