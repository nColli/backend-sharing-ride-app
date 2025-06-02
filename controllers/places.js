/* eslint-disable @stylistic/js/linebreak-style */
const express = require('express')
const router = express.Router()
const Place = require('../models/place') // Adjust the path as needed

router.post('/', async (req, res) => {
  try {
    //asumo que en body solo estan los datos necesarios para crear un lugar
    const user = req.user
    console.log('req.body', req.body)
    const newPlace = new Place({
      ...req.body,
      user: user.id
    })

    // Save the place to the database
    const savedPlace = await newPlace.save()

    console.log('saved place', savedPlace)

    console.log('user', user)

    if (!user) {
      // If user not found, remove the place we just created
      await Place.findByIdAndDelete(savedPlace._id)
      return res.status(404).json({ message: 'User not found' })
    }

    // Add the place ID to the user's regularPlaces array
    user.regularPlaces = user.regularPlaces.concat(savedPlace._id)
    console.log('reg', user.regularPlaces)

    const updatedUser = await user.save()

    console.log('user saved', updatedUser)


    // Return the created place
    res.status(201).json(savedPlace)
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      // Share only field-specific validation issues
      const validationErrors = {}
      Object.keys(error.errors).forEach(field => {
        validationErrors[field] = error.errors[field].kind
      })
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      })
    }

    // Log the full error for debugging but don't expose details to client
    console.error('Error creating place:', error)
    res.status(500).json({ message: 'Failed to create place' })
  }
})

router.get('/', async (req, res) => {
  try {
    // Retrieve places using IDs from the user's regularPlaces array
    const places = await Place.find({
      _id: { $in: req.user.regularPlaces }
    })

    res.status(200).json(places)
  } catch (error) {
    console.error('Error fetching places:', error)
    res.status(500).json({ message: 'Failed to retrieve places' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    // Find place by ID and verify it belongs to the user
    const placeId = req.params.id

    // Check if this place is in the user's regularPlaces array
    if (!req.user.regularPlaces.includes(placeId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const place = await Place.findById(placeId)

    if (!place) {
      return res.status(404).json({ message: 'Place not found' })
    }

    res.status(200).json(place)
  } catch (error) {
    // Check if error is due to invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid place ID format' })
    }

    console.error('Error fetching place:', error)
    res.status(500).json({ message: 'Failed to retrieve place' })
  }
})

module.exports = router