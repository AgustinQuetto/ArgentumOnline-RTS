"strict mode"
import React, { Component } from 'react'
import './App.css'
import socketIOClient from "socket.io-client"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'

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

    let sw = L.latLng(0, 255),
      ne = L.latLng(-255, 0);
    let bounds = L.latLngBounds(sw, ne)

    this.map = L.map('map', {
      minZoom: 1,
      maxZoom: 4,
      center: bounds.getCenter(),
      zoom: 1,
      crs: L.CRS.Simple
    })

    //this.map.setMaxBounds(bounds)

    this.addDrow()

    const poten = 8

    this.layer = L.geoJSON(null, {
      pointToLayer: function (feature, latlng) {
        latlng.lat = latlng.lat * -poten
        latlng.lng = latlng.lng * poten

        let ratIcon = L.icon({
          iconUrl: window.location.origin + '/img/' + graph[feature.properties.graph].path,
          iconSize: [graph[feature.properties.graph].w, graph[feature.properties.graph].h]
        })
        return L.marker(latlng, { icon: ratIcon }).bindPopup('<strong>Árbol sangrado</strong><br>Creado por la sangre derramada de los elfos en las guerras medias.')
      }
    }).addTo(this.map)


    this.addMap('/img/maps/ullathorpe.jpg')
    this.addMap('/img/maps/banderbill-no.jpg', 1, 0)
  }

  addMap(url, X=0, Y=0) {
    // dimensions of the image
    let w = 2048,
        h = 2048

    X = X + 2048 * X
    Y = Y + 2048 * Y

    // calculate the edges of the image, in coordinate space
    let southWest = this.map.unproject([X, h + X], this.map.getMaxZoom() - 1)
    let northEast = this.map.unproject([w + Y, Y], this.map.getMaxZoom() - 1)
    let bounds = new L.LatLngBounds(southWest, northEast)

    L.imageOverlay(window.location.origin + url, bounds).addTo(this.map)

    this.map.on('click', e => {
      document.getElementById('ll').innerHTML = '<span>Y: ' + Math.floor(e.latlng.lng) + '<br/>X: ' + Math.floor(e.latlng.lat - e.latlng.lat * 2) + '</span>'
    })
  }

  addDrow() {

    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('edit')
    if (myParam === 'true') {let featureGroup = L.featureGroup().addTo(this.map);

    new L.Control.Draw({
      edit: {
        featureGroup: featureGroup
      }
    }).addTo(this.map);

    this.map.on('draw:created', function (e) {

      // Each time a feaute is created, it's added to the over arching feature group
      featureGroup.addLayer(e.layer);
    });


    // on click, clear all layers
    document.getElementById('delete').onclick = function (e) {
      featureGroup.clearLayers();
    }

    document.getElementById('export').onclick = function (e) {
      // Extract GeoJson from featureGroup
      let data = featureGroup.toGeoJSON();

      // Stringify the GeoJson
      let convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));

      // Create export
      document.getElementById('export').setAttribute('href', 'data:' + convertedData);
      document.getElementById('export').setAttribute('download', 'data.geojson');
    }}
  }

  refreshData(data) {
    this.layer.clearLayers()
    this.layer.addData(data)
  }

  getMeta(url) {
    let img = new Image()
    img.addEventListener('load', () => {
      return [this.naturalWidth, this.naturalHeight]
    })
    img.src = url
  }

  render() {
    return (
      <div className="App">
        <div id='ll'></div>
        <div id='map' className='map' />
        <div id='delete'>Eliminar</div>
        <a href='#' id='export'>Guardar</a>
        <style jsx='true'>{`
        html, body {
          height: 100%;
          background: black;
        }
        .leaflet-container {
          background-color:rgba(255,0,0,0.0);
        }
        #ll {
          position: absolute;
          bottom: 0;
          z-index: 9999;
          background-color: white;
          color: blue;
          padding: 20px;
          text-align: left;
        }
        .map { height: 1080px; width: 100%}
        #delete, #export {
          position: absolute;
          top:10px;
          right:10px;
          z-index:100000;
          background:white;
          color:black;
          padding:6px;
          border-radius:4px;
          font-family: 'Helvetica Neue';
          cursor: pointer;
          font-size:12px;
          text-decoration:none;
      }
      #export {
          top:40px;
      }
        `}</style>
      </div>
    )
  }
}

export default App
