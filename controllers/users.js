/* eslint-disable @stylistic/js/linebreak-style */
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const Place = require('../models/place')
const multer  = require('multer')
const upload = multer()
const jwt = require('jsonwebtoken')

//sacar que se pueda acceder a todos los usuarios en produccion - solo para pruebas
usersRouter.get('/', async (request, response) => {
  /*
  const users = await User
    .find({}).populate('notes', { content: 1, important: 1 })*/

  const users = await User.find({})

  response.json(users)
})

//signup - registrar usuario con datos basicos
usersRouter.post('/', upload.fields([
  { name: 'dni_frente', maxCount: 1 },
  { name: 'dni_dorso', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (request, response) => {
  console.log('request body', request.body)
  console.log('request files', request.files)

  const userData = JSON.parse(request.body.userData)

  const dniFrenteFile = request.files['dni_frente'][0]
  const dniDorsoFile = request.files['dni_dorso'][0]
  const selfieFile = request.files['selfie'][0]

  console.log('Parsed userData:', userData)
  console.log('dni frente file:', dniFrenteFile)
  console.log('dni dorso file:', dniDorsoFile)
  console.log('selfie file:', selfieFile)

  const { dni, email, password, name, surname, birthDate, street, number, city, province } = userData

  if (!password) {
    return response.status(401).json({ error: 'Ingrese la contraseña' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const placeHome = new Place({
    name: 'Casa',
    street,
    number,
    city,
    province
  })

  const savedPlaceHome = await placeHome.save()

  console.log('home', savedPlaceHome)

  const user = new User({
    dni,
    email,
    passwordHash,
    name,
    surname,
    isAdministrator: false,
    birthDate,
  })

  const savedUser = await user.save()
  savedUser.regularPlaces = savedUser.regularPlaces.concat(savedPlaceHome._id)
  const lastSavedUser = await savedUser.save() //reescribir con la casa agregada

  //devolver token de usuario logueado
  const userForToken = {
    email: lastSavedUser.email,
    id: lastSavedUser._id,
  }

  //const token = jwt.sign(userForToken, process.env.SECRET)
  const tokenLogin = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60*60*24*30 }
  )
  console.log('user', lastSavedUser)

  response
    .status(200)
    .send({ tokenLogin })
})



module.exports = usersRouter