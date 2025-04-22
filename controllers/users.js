/* eslint-disable @stylistic/js/linebreak-style */
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

//sacar que se pueda acceder a todos los usuarios en produccion - solo para pruebas
usersRouter.get('/', async (request, response) => {
  /*
  const users = await User
    .find({}).populate('notes', { content: 1, important: 1 })*/

  const users = await User.find({})

  response.json(users)
})

//signup - registrar usuario con datos basicos
usersRouter.post('/', async (request, response) => {
  const { email, password, name, surname, isAdministrator } = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    passwordHash,
    name,
    surname,
    isAdministrator
  })

  const savedUser = await user.save()

  //dsp de refact - delvolver tambien token para iniciar sesión directamente

  response.status(201).json(savedUser)
})

module.exports = usersRouter