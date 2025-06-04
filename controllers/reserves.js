const reservesRouter = require('express').Router()
const Reserve = require('../models/reserve')
const Trip = require('../models/trip')
const Vehicle = require('../models/vehicle')
const User = require('../models/user')
const Place = require('../models/place')
const geocode = require('../utils/geocode')

const fechaCerca = (trip, date) => {
  const tripDate = new Date(trip.dateStart)
  const targetDate = new Date(date)
  const diffMs = Math.abs(tripDate - targetDate)
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours <= 1
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
    const tripStartCoords = await geocode(trip.placeStart)
    const tripEndCoords = await geocode(trip.placeEnd)
    const startCoords = await geocode(placeStart)
    const endCoords = await geocode(placeEnd)

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
  if (trip.status !== 'pendiente') {
    return false
  }

  const vehicleId = trip.vehicle

  const vehicle = await Vehicle.findById(vehicleId)

  return Number(vehicle.capacity) < trip.bookings.length
}


const findTrip = async (placeStart, placeEnd, date) => {
  const trips = await Trip.find()

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

  //creo el lugar de partida y el de llegada
  const placeStartSaved = new Place({
    street: placeStart.street,
    number: placeStart.number,
    city: placeStart.city,
    province: placeStart.province,
    user: user.id
  })

  const placeStartWithID = await placeStartSaved.save()

  const placeEndSaved = new Place({
    street: placeEnd.street,
    number: placeEnd.number,
    city: placeEnd.city,
    province: placeEnd.province,
    user: user.id
  })

  const placeEndWithID = await placeEndSaved.save()

  const newReserve = new Reserve({
    status: 'pendiente',
    placeStart: placeStartWithID._id,
    placeEnd: placeEndWithID._id,
    dateStart: date,
    user: user.id,
    trip: trip._id
  })

  const reserve = await newReserve.save()

  //guardar reserva id en usuario
  user.pendingReserves = user.pendingReserves.concat(reserve._id)
  await user.save()

  //guardar reserva en viaje
  trip.bookings = trip.bookings.concat(reserve._id)
  await Trip.findOneAndReplace({ _id: trip._id }, trip)

  return reserve
}

const createRoutine = async (bodyRequest, user) => {
  //crear rutina
  const { placeStart, placeEnd, dateStart, dateEnd, days } = bodyRequest

  const start = new Date(dateStart)
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

  const savedReserves = []
  let allCreate = true

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = dayMap[d.getDay()]

    if (days.includes(dayName)) {
      const reserve = await findCreateReserve(placeStart, placeEnd, d, user)

      if (reserve === false) {
        allCreate = false
      } else {
        savedReserves.push(reserve)
      }
    }
  }

  console.log('savedReserves en routine', savedReserves)

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
    const { savedReserves, allCreate } = await createRoutine(request.body, user)

    console.log('savedReserves en routine', savedReserves)

    if (savedReserves.length === 0) {
      return response.status(401).send({ error: 'No ha sido posible crear ninguna reserva' })
    }

    if (allCreate === false) {
      return response.status(200).send({ savedReserves, message: 'No se han creado todas las reservas, pero si algunas' })
    }


    return response.status(200).send({ savedReserves })

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
  const reserves = request.body

  reserves.map(async (reserve) => {
    await confirmarReserva(reserve)
  })

  return response.status(200).send({ message: 'reservas confirmadas' })
})

//retorna solo las que tienen estado confirmada
reservesRouter.get('/', async (request, response) => {
  const user = request.user

  const reserves = await Reserve.find({ user: user.id, status: 'confirmada' }).populate('placeStart').populate('placeEnd')

  return response.status(200).send(reserves)
})

reservesRouter.get('/all', async (request, response) => {
  const user = request.user

  const reserves = await Reserve.find({ user: user.id }).populate('placeStart').populate('placeEnd')

  return response.status(200).send(reserves)
})


reservesRouter.get('/next-reserve', async (request, response) => {
  const user = request.user
  const reserves = await Reserve.find({ user: user.id, status: 'confirmada' }).populate('placeStart').populate('placeEnd')
  if (reserves.length === 0) {
    return response.status(404).send({ error: 'No reserves found' })
  }
  let nextReserve = reserves[0]
  const today = new Date()
  reserves.map(reserve => {
    if (reserve.dateStart < nextReserve.dateStart && reserve.dateStart > today) {
      nextReserve = reserve
    }
  })
  if (!nextReserve) {
    return response.status(404).send({ error: 'No next reserve found' })
  }
  return response.status(200).send(nextReserve)
})

reservesRouter.get('/trip/:id', async (request, response) => {
  const { id } = request.params

  const trip = await Trip.findById(id)

  if (!trip) {
    return response.status(404).send({ error: 'Viaje no encontrado' })
  }

  const reserves = await Reserve.find({ trip: trip._id }).populate('placeStart').populate('placeEnd')

  return response.status(200).send(reserves)
})

//retorna si tiene reservas pendientes de evaluación al conductor, solo un flag para mostrar en el frontend botón
reservesRouter.get('/pending-review', async (request, response) => {
  const user = request.user

  const reserve = await Reserve.findOne({ user: user.id, status: 'completada' }) //reserva de un viaje terminado pero sin reseña al conductor

  if (reserve) {
    return response.status(200).send({ pendiente: true })
  }

  return response.status(200).send({ pendiente: false })
})

reservesRouter.get('/review-driver', async (request, response) => {
  const user = request.user

  //tengo que retornar para mostrar a quien le hago la review y en que viaje
  const reserve = await Reserve.findOne({ user: user.id, status: 'completada' }).populate('trip').populate('placeStart').populate('placeEnd')

  console.log('reserveReview', reserve)

  const driverTrip = await User.findById(reserve.trip.driver)

  const driver = {
    name: driverTrip.name,
    surname: driverTrip.surname,
    id: driverTrip.id
  }

  return response.status(200).send({ reserve, driver })
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