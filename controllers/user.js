/* eslint-disable @stylistic/js/linebreak-style */
const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/user')

userRouter.get('/', async (request, response) => {
  const user = request.user
  const userPopulate = await user.populate('notes', { content: 1, important: 1 })

  response.json(userPopulate)
})
/*
//modificar datos de un usuario - para resetear - logica de contraseñas
userRouter.put('/', async (request, response) => {
  const { email, password } = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})
*/
//logica para modificar datos - agregar nuevo viaje - reservas -etc.


module.exports = userRouter