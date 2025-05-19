/* eslint-disable @stylistic/js/linebreak-style */
const vehiclesRouter = require('express').Router()
const multer  = require('multer')
const jwt = require('jsonwebtoken')
const Vehicle = require('../models/vehicle')
const upload = multer()
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

const userExtractor = async (request) => {
  const token = getTokenFrom(request)
  if (token) {
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
    if (decodedToken.id) {
      const user = await User.findById(decodedToken.id)

      return user
    }
  }

  return null
}

const verifyCredentials = (seguroFile, licenciaFile) => {
  return (seguroFile && licenciaFile)
}


vehiclesRouter.post('/', upload.fields([
  { name: 'seguro', maxCount: 1 },
  { name: 'licencia', maxCount: 1 }
]), async (request, response) => {
  //solo accede si pasa el middleware de validation de token entonces no hace falta validarlo
  const seguroFile = request.files['seguro'][0]
  const licenciaFile = request.files['licencia'][0]
  const vehicleData = JSON.parse(request.body.vehicleData)

  if (!seguroFile || !licenciaFile || !vehicleData) {
    return response.status(401).json({ error: 'faltan completara campos' })
  }

  //para asociar vehiculo con usuario tengo que sacar email de usuario del token
  //tengo que descifrarlo como en reset password
  const userOwner = await userExtractor(request)
  const userId = userOwner._id

  if (!userId) {
    return response.status(401).json({ error: 'usuario no valido' })
  }

  if (!verifyCredentials(seguroFile, licenciaFile)) {
    return response.status(401).json({ error: 'seguro o licencia invalidos' })
  }

  const {
    patente,
    marca,
    modelo,
    anio,
    capacidad,
    kilometros
  } = vehicleData

  const newVehicle = new Vehicle({
    plate: patente,
    brand: marca,
    model: modelo,
    year: anio,
    capacity: capacidad,
    kilometers: kilometros,
    ownerId: userId
  })

  const savedVehicle = await newVehicle.save()

  if (!savedVehicle) {
    response.status(401).send({ error: 'error al crear vehiculo' })
  }

  //almacenar vehicleId en user
  const userToUpdate = await User.findById(userId)
  //const userToUpdate.vehicles = user.vehicles.concat(savedVehicle._id)
  const newUserToUpdate = userToUpdate
  newUserToUpdate.vehicles = newUserToUpdate.vehicles.concat(savedVehicle._id)
  await User.findOneAndReplace(userId, newUserToUpdate)

  //retornar ok vehiculo registrado
  response
    .status(200)
    .send({ vehicle: savedVehicle })
})


vehiclesRouter.get('/', async (request, response) => {
  const user = request.user

  console.log('user', user)

  const vehicles = await Vehicle.find({ ownerId: user.id })

  console.log('vehicles owned by', user, ' are: ', vehicles)

  response.status(200).send(vehicles)
})




module.exports = vehiclesRouter