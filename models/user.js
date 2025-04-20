const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI
console.log('connecting to', url);
mongoose.connect(url)
    .then(() => {
        console.log('connected to MongoDB');
    })
    .catch(error => {
        console.log('error connecting to MongoDB', error.message);
    })
/*
const Place = {
    street: String,
    number: String,
    city: String,
    province: String
}

const RegularPlace = {
    name: String,
    place: Place
}

//si es un schema mongo dif, no deberia almaacenarlo aca, los otros si xq se usan solo aca y en viaje, se pueden exportar en su archivo e imporealos como import { Place } from './structures/
//lo mismo con user se puede sacar el obj y mandarlo a su archivo
const Vehicle = {
    plate: String,
    brand: String,
    model: String,
    year: Number,
    insuranceImage: String
}*/

const stringRequired = {
    type: String,
    required: true
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: stringRequired,
  name: stringRequired,
  surname: String,
  /*documentNumber: stringRequired,
  dateBirth: Date,
  documentFrontImage: String, //almacena codificado en Base64
  docuemntBackImage: String,
  profilePicture: String,
  //home: RegularPlace, 
  regularPlaces: [
    RegularPlace //Adentro almaceno la casa con nombre casa, creo el primer lugar regular haitual
  ],
  vehicles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    }
  ],
  travels: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Travel'
    }
  ],
  reservations: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation'
    }
  ]*/
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // el passwordHash no debe mostrarse
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User