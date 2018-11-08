var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)


app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>')
})

let lng = 0
let lat = 0

io.on('connection', (socket) => {

  setInterval(()=> {
    let data = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "graph": "pirate-head"
          },
          "geometry": {
            "type": "Point",
            "coordinates": [
              lng,
              lat
            ]
          }
        }
      ]
    }

    io.sockets.emit('refresh-data', data)

    lat = lat + 0.0001
    lng = lng + 0.0001
  },10)

  console.log('a user connected')
  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
  socket.on('data', (data) => {
    io.sockets.emit('refresh-data', JSON.parse(data))
  })
})

http.listen(3005, () => {
  console.log('listening on *:3005')
})