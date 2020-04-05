const path = require('path')
const http = require('http')
const express = require('express')
const socektio = require('socket.io')
const Filter = require('bad-words')

const app = express()

//socket io needs raw http server to work
const server = http.createServer(app)
const io = socektio(server)

const publicDirectoryPath = path.join(__dirname,'./public')

app.use(express.static(publicDirectoryPath))

const PORT = process.env.PORT || 3000


app.get('/',(req,res) => {
    res.render('index')
})

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.emit('message',"welcome")
    socket.broadcast.emit('message','A new user joined')

    socket.on('sendMessage',(message,callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.emit("sendMessage",message)
        callback()
    })

    socket.on('sendLocation',(locationData,callback) => {
        io.emit('locationMessage',`https://google.com/maps?q=${locationData.longitude},${locationData.latitude}`)
        callback()
    })

    socket.on('disconnect', () => {
        io.emit('message','A user has left')
    } )
})

server.listen(PORT,() => {
    console.log(`listening on port ${PORT}`)
})