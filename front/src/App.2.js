"strict mode"
import React, { Component } from 'react'
import ullathorpe from './img/ullathorpe.jpg'
import './App.css'
import socketIOClient from "socket.io-client"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const graph = require('./graph')

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
    this.endpoint = "http://localhost:3005"

    this.socket = new socketIOClient(this.endpoint)

    this.socket.on('refresh-data', data => {
      this.refreshData(data)
    })

    this.basemaps = {
      Grayscale: L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }),
      Streets: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
    }
  }

  componentDidMount() {
    this.map = L.map('map', {
      minZoom: 1,
      maxZoom: 4,
      center: [0, 0],
      zoom: 4,
      crs: L.CRS.pr
    })

    // dimensions of the image
    let w = 2048,
      h = 2048,
      url = ullathorpe,
      poten = 32

    // calculate the edges of the image, in coordinate space
    var southWest = this.map.unproject([0, h], this.map.getMaxZoom() - 1)
    var northEast = this.map.unproject([w, 0], this.map.getMaxZoom() - 1)
    var bounds = new L.LatLngBounds(southWest, northEast)
    
    L.imageOverlay(url, bounds).addTo(this.map)

    this.map.on('click', e => {
      console.log(e.latlng)
    })

    
    this.layer = L.geoJSON(null, {
      pointToLayer: function (feature, latlng) {
        let ratIcon = L.icon({
          iconUrl: 'img/' + graph[feature.properties.graph].path,
          iconSize: [graph[feature.properties.graph].w, graph[feature.properties.graph].h]
        })
        return L.marker(latlng, { icon: ratIcon }).bindPopup('<strong>Science Hall</strong><br>Where the GISC was born.')
      }
    }).addTo(this.map)
  }

  refreshData(data) {
    this.layer.clearLayers()
    this.layer.addData(data)
  }
/* 
  refreshData(data) {
    data.features.map(ft => {
      let w = graph[ft.properties.graph].w,
        h = graph[ft.properties.graph].h,
        url = 'img/' + graph[ft.properties.graph].path

      var southWest = this.map.unproject([ft.geometry.coordinates[1], h], this.map.getMaxZoom() - 1)
      var northEast = this.map.unproject([w, ft.geometry.coordinates[0]], this.map.getMaxZoom() - 1)
      var bounds = new L.LatLngBounds(southWest, northEast)

      L.imageOverlay(url, bounds, {draggable: true}).addTo(this.map)
    })
  } */

  render() {
    return (
      <div className="App">
        <div id='map' className='map' />
        <style jsx='true'>{`
        html, body {
          height: 100%;
          background: black;
        }
        .map { height: 1080px; width: 100%}
        `}</style>
      </div>
    )
  }
}

export default App
