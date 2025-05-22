/* eslint-disable @stylistic/js/linebreak-style */
const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const userRouter = require('./controllers/user')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const resetpasswordRouter = require('./controllers/resetpassword')
const vehiclesRouter = require('./controllers/vehicles')
const tripsRouter = require('./controllers/trips')
const placesRouter = require('./controllers/places')
const reservesRouter = require('./controllers/reserves')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)

app.use(middleware.userExtractor) //permite que en request.user este el token

app.use('/api/login', loginRouter)
app.use('/api/resetpassword', resetpasswordRouter)
//agregar a users middleware tokenValidation cuando este separado del signup -> se puede acceder sin token solo a loginRouter y SignupRouter - det si dejar users o sacarlo y dividirlo x completo
app.use('/api/users', usersRouter) //separar signup con users para agregar o modificar cosas de un usuario o crear nuevo router user para modificar un usuario individual

//para acceder aca tiene que si o si tener un token valido
app.use('/api/user', middleware.tokenValidation, userRouter)
app.use('/api/vehicles', middleware.tokenValidation, vehiclesRouter)
app.use('/api/trips', middleware.tokenValidation, tripsRouter)
app.use('/api/places', middleware.tokenValidation, placesRouter)
app.use('/api/reserves', middleware.tokenValidation, reservesRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)


module.exports = app