const path = require('path');
const http = require('http');
const express = require('express');
const socektio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage,generateLocationMessage } = require('./src/utils/messages');
const {addUser,removeUser,getUser,getUsersInRoom} = require('./src/utils/users')

const app = express();

//socket io needs raw http server to work
const server = http.createServer(app);
const io = socektio(server);

const publicDirectoryPath = path.join(__dirname, './public');

app.use(express.static(publicDirectoryPath));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
	res.render('index');
});

io.on('connection', (socket) => {
	console.log('New websocket connection');

	socket.on('join',({username,room},callback) => {
		const { error,user } = addUser({ id: socket.id,username,room })

		if (error) {
			return callback(error)
		}

		socket.join(user.room)

		socket.emit('sendMessage', generateMessage('welcome!','Admin'));
		socket.broadcast.to(user.room).emit('sendMessage', generateMessage(`${user.username} has joined!`,'Admin'));

		callback()
	})
	
	socket.on('sendMessage', (message, callback) => {
		const filter = new Filter();
		const user = getUser(socket.id)

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed');
		}

		io.to(user.room).emit('sendMessage', generateMessage(message,user.username));
		callback();
	});

	socket.on('sendLocation', (locationData, callback) => {
		const user = getUser(socket.id)
		const url = `https://google.com/maps?q=${locationData.longitude},${locationData.latitude}`;
		
		io.to(user.room).emit('locationMessage', generateLocationMessage(url,user.username));
		callback();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)

		if(user){
			io.to(user.room).emit('sendMessage', generateMessage(`${user.username} has left!`,'Admin'));
		}

	});

	
});

server.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});
