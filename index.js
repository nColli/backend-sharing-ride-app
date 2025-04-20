const express = require('express')
const app = express()
require('dotenv').config()

app.get('/', (request, response) => {
    response.send('<h1>Hello world!</h1>')
})

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})