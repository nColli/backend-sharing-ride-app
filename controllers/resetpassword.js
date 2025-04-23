/* eslint-disable @stylistic/js/linebreak-style */
const jwt = require('jsonwebtoken')
const resetpasswordRouter = require('express').Router()
const User = require('../models/user')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

resetpasswordRouter.post('/', async (request, response) => {
  const { email } = request.body

  const user = await User.findOne({ email })
  /* pasos
  5- cuando app envie token buscarlo con la base de datos e identificar
  6- si token es correcto blanquear contraseña
  */

  if (!(user)) {
    return response.status(401).json({
      error: 'invalid email'
    })
  }

  console.log('user recovering their password', user)
  const tokenResetPassword = crypto.randomBytes(4).toString('hex')
  const tokenExpirationDate = ((new Date()).getTime()) + (1000*60*5) //en milisegundos expira en 5 minutos despues de haberse creado
  console.log('generated token', tokenResetPassword, 'expiration date', tokenExpirationDate)

  //guardar en database token
  const update = {
    tokenResetPassword,
    tokenExpirationDate
  }
  await User.findOneAndUpdate({ email }, update)

  const emailApp = process.env.EMAIL_USER
  const pass = process.env.G_PASSWORD
  const service = process.env.EMAIL_SERVICE
  const host = process.env.HOST
  const port = process.env.PORT_EMAIL
  //enviar token por email
  const objectTransport = {
    service,
    host,
    port,
    secure: true,
    auth: {
      user: emailApp,
      pass: pass
    }
  }
  console.log('transport', objectTransport)


  var transporter = nodemailer.createTransport(objectTransport)

  const emailText = `Tu codigo para resetear tu contraseña es: ${tokenResetPassword}`
  var mailOptions = {
    from: emailApp,
    to: email,
    subject: 'Código para resetear contraseña',
    text: emailText
  }

  console.log('mail options', mailOptions)

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('error', error)
      return response.status(500).json({ //mejor codigo 500 xq es error del server si no puedo enviar mail
        error: 'error sending email'
      })
    } else {
      console.log('info', info)
      response
        .status(200)
        .send({ message: 'token send' })
    }
  })

})

resetpasswordRouter.post('/:token', async (request, response) => {
  const token = request.params.token
  console.log('user token', token)

  const { email } = request.body

  const user = await User.findOne({ email })

  console.log('user', user)

  const dateNow = (new Date()).getTime()

  if (!user) {
    return response.status(401).json({
      error: 'invalid email'
    })
  }

  if (user.tokenResetPassword !== token || user.tokenExpirationDate < dateNow) {
    return response.status(401).json({
      error: 'invalid token'
    })
  }

  const update = {
    tokenResetPassword: '',
    tokenExpirationDate: ''
  }

  const updatedUser = await User.findOneAndUpdate({ email }, update, { new: true }) //blanqueo token para resetear y tiempo por si se tiene que volver a recuperar

  console.log('updated user', updatedUser)

  //generar token de autorizacion para que pueda enviar la nueva contraseña enviando el token de autorizacion como si estuviera logueado
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
    .send({ tokenLogin }) //front - almacenar ese token para hacer request de cambio de contraseña

})

//resetear password se hace en user con el token de validacion

module.exports = resetpasswordRouter