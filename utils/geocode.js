const axios = require('axios')

const geocode = async (place) => {
  const url = 'https://nominatim.openstreetmap.org/search?'
  const urlQuery = `${url}street=${place.street}+${place.number}&city=${place.city}&state=${place.province}&country=Argentina&format=jsonv2`

  try {
    const response = await axios.get(urlQuery)
    const lat = response.data[0].lat
    const lng = response.data[0].lon

    return {
      lat,
      lng
    }
  } catch (error) {
    return {
      lat: null,
      lng: null
    }
  }
}

module.exports = geocode
