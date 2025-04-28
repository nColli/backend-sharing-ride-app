/* eslint-disable @stylistic/js/linebreak-style */
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  const { email, password } = request.body

  const user = await User.findOne({ email })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid email or password'
    })
  }

  const userForToken = {
    email: user.email,
    id: user._id,
  }

  //const token = jwt.sign(userForToken, process.env.SECRET)
  const tokenLogin = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60*60*24*30 }
  )
  console.log('user', user)

  response
    .status(200)
    .send({ tokenLogin })
})

module.exports = loginRouter