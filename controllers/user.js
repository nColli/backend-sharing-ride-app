/* eslint-disable @stylistic/js/linebreak-style */
const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/user')

userRouter.get('/', async (request, response) => {
  const user = request.user //extraido por el midddleware
  console.log('user', user)

  const userPopulate = await user.populate('vehicles', { content: 1, important: 1 })

  response.json(userPopulate)
})

//cambiar contraseña
userRouter.put('/changepassword', async (request, response) => {
  const newPassword = request.body.password
  const user = request.user //extraido x el middleware

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(newPassword, saltRounds)

  const newUser = await User.findOneAndUpdate({ _id: user._id }, { passwordHash }, { new: true })

  console.log('old hash: ', user.passwordHash, 'new hash:', newUser.passwordHash)

  console.log('new user', newUser)

  response.status(200).send({ message: 'password updated' }) //o cod 201
})


module.exports = userRouter