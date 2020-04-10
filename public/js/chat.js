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
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

$messageFormInput.focus()

// Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages comtainer
    const containerHeight = $messages.scrollHeight

    // How far have I scrolles
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

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
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        username:message.username,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)

    autoScroll()
})

socket.on('locationMessage',locationData => {
    console.log(locationData)

    const html = Mustache.render(locationTemplate,{
        url: locationData.url,
        username: locationData.username,
        createdAt: moment(locationData.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    
    document.querySelector("#sidebar").innerHTML = html
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


socket.emit('join',{username,room},(error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})