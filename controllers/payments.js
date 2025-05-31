//solo accesible por usuarios admin
const paymentsRouter = require('express').Router()
const Payment = require('../models/payment')

//middleware chequea que sea admin

paymentsRouter.post('/', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const actualPayment = await Payment.findOne({})

  if (actualPayment) {
    return response.status(400).json({ error: 'Payment already exists' })
  }

  const { alias, alias1, alias2, fee } = request.body

  const newPayment = new Payment({ alias, alias1, alias2, fee })

  await newPayment.save()

  response.status(201).json(newPayment)
})

paymentsRouter.patch('/alias', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const { alias } = request.body

  //tiene que coincidir con alias1 o 2
  const payment = await Payment.findOne({})

  const alias1 = payment.alias1
  const alias2 = payment.alias2

  if (alias !== alias1 && alias !== alias2) {
    return response.status(400).json({ error: 'Invalid alias' })
  }

  if (alias === alias1) {
    payment.alias = alias1
  } else {
    payment.alias = alias2
  }

  await payment.save()

  response.status(200).end()
})

paymentsRouter.patch('/fee', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }
})

paymentsRouter.get('/', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const payments = await Payment.find({})

  response.status(200).json(payments)
})

paymentsRouter.patch('/alias1', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const { alias1 } = request.body

  const payment = await Payment.findOne({})

  payment.alias1 = alias1

  await payment.save()

  response.status(200).end()
})

paymentsRouter.patch('/alias2', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const { alias2 } = request.body

  const payment = await Payment.findOne({})

  payment.alias2 = alias2

  await payment.save()

  response.status(200).end()
})

module.exports = paymentsRouter