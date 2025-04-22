/* eslint-disable @stylistic/js/linebreak-style */
//exportar objetos que no son esquemas pero se guardan en muchos schemas
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

const Vehicle = {
  plate: String,
  brand: String,
  model: String,
  year: Number,
  insuranceImage: String //store in Base64
}

module.export = {
  Place,
  RegularPlace,
  Vehicle
}