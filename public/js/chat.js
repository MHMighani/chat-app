const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
$messageFormInput.focus()

$messageForm.addEventListener('submit',e => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage',message,(error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log("the message was delivered")
    })
})

socket.on('sendMessage',message => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        message
    })
    $messages.insertAdjacentHTML('beforeend',html)
})

socket.on('message',message => {
    console.log(message)
})

socket.on('locationMessage',locationURL => {
    const html = Mustache.render(locationTemplate,{
        locationURL
    })
    $messages.insertAdjacentHTML('beforeend',html)
})

const emitLocationData = locationData => {
    socket.emit('sendLocation',locationData,() => {
        $sendLocationButton.removeAttribute('disabled')    
        console.log('location shared!')
    })
}

document.querySelector('#send-location').addEventListener('click',(e) => {
    $sendLocationButton.setAttribute('disabled','disabled')

    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition(position => {
        locationData = {latitude:position.coords.latitude,longitude:position.coords.longitude}
        emitLocationData(locationData)
    },error => {
        locationData = {latitude:0,longitude:0}
        emitLocationData(locationData)
    })
})