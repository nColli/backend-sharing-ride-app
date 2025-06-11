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

  const { value } = request.body

  //tiene que coincidir con alias1 o 2
  const payment = await Payment.findOne({})

  payment.alias = value

  await payment.save()

  response.status(200).end()
})

paymentsRouter.patch('/fee', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const payment = await Payment.findOne({})
  console.log('payment', payment)

  const newFee = request.body.value

  console.log('request.body', request.body)

  payment.fee = newFee

  await payment.save()

  response.status(200).end()
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

  const { value } = request.body

  const payment = await Payment.findOne({})

  payment.alias1 = value

  await payment.save()

  response.status(200).end()
})

paymentsRouter.patch('/alias2', async (request, response) => {
  const user = request.user

  if (!user.isAdministrator) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  const { value } = request.body

  const payment = await Payment.findOne({})

  payment.alias2 = value

  await payment.save()

  response.status(200).end()
})

module.exports = paymentsRouter