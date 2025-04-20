require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
const User = require('./models/user')
const bcrypt = require('bcrypt')

app.use(express.json())
app.use(cors())

app.post('/api/users', async (request, response) => {
    const { email, name, password, surname } = request.body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    const user = new User({
        email,
        name,
        passwordHash,
        surname
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)
})

app.get('/api/users', (request, response) => {
    /*
    const { email, passwordHash } = request.body

    console.log('checking', email, passwordHash);
    
    
    User
        .findOne({ email: email })
        .then((user) => {
            console.log(user);

            //validacion usuario


            response.status(200).end()
        })
        .catch((error) => {
            response.status(400).send( { error: 'error not find' } )
        })*/
    
    User
        .find({})
        .then(users => response.json(users))
})

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})