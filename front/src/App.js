"strict mode"
import React, { Component } from 'react'
import './App.css'
import socketIOClient from "socket.io-client"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'

const graph = require('./graph')
const maps = require('./maps')

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


  componentWillMount() {
    const urlParams = new URLSearchParams(window.location.search)
    this.myParam = urlParams.get('edit')
  }

  componentDidMount() {

    // let sw = L.latLng(0, 500),
    //   ne = L.latLng(-500, 0);
    // let bounds = L.latLngBounds(sw, ne)

    this.map = L.map('map', {
      minZoom: 1,
      maxZoom: 4,
      center: [-255, 255]/*bounds.getCenter()*/,
      zoom: 1,
      crs: L.CRS.Simple
    })

    maps.map(m => {
      this.addMap(`/img/maps/${m.path}.jpg`, m.x, m.y)
    })

    //this.map.setMaxBounds(bounds)

    this.addDrow()

    const poten = 8

    this.layer = L.geoJSON(null, {
      pointToLayer: (feature, latlng) => {
        latlng.lat = latlng.lat * -poten
        latlng.lng = latlng.lng * poten

        let ratIcon = L.icon({
          iconUrl: window.location.origin + '/img/' + graph[feature.properties.graph].path,
          iconSize: [graph[feature.properties.graph].w, graph[feature.properties.graph].h]
        })
        return L.marker(latlng, { icon: ratIcon }).bindPopup('<strong>Árbol sangrado</strong><br>Creado por la sangre derramada de los elfos en las guerras medias.')
      },
      style: (feature) => {
        switch (feature.properties.faction) {
            case 'Dark Legion': return {color: "#ff0000"};
            case 'Real Army':   return {color: "#0000ff"};
        }
      },
      onEachFeature: (feature, layer) => {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.faction && feature.properties.player) {
            layer.bindPopup(
              'Faction: ' + feature.properties.faction +
              '<br>Player: ' + feature.properties.player
              );
        }
      }
    }).addTo(this.map)

    this.refreshData(
    {"type":"FeatureCollection","features":[
      {"type":"Feature","properties":{"faction": "Real Army", "player": "Frezon"},"geometry":{"type":"Polygon","coordinates":[[[303.5625,-116.625],[307.5625,-115.625],[307.5625,-112],[310.25,-112.0625],[310.375,-114.6875],[313.625,-113.8125],[323.4375,-116.5625],[323.75,-130.0625],[322.9375,-129.875],[323.25,-138.1875],[304,-138.3125],[304.125,-129.875],[303.375,-130.4375],[303.5625,-116.625]]]}},
      {"type":"Feature","properties":{"faction": "Dark Legion", "player": "Pampiro"},"geometry":{"type":"Polygon","coordinates":[[[326.875,-97.375],[327,-89.125],[326.1875,-89.25],[326.625,-75.625],[330.5,-74.6875],[330.625,-71.25],[333.25,-71.125],[333.375,-73.8125],[336.4375,-72.8125],[346.5625,-75.625],[346.875,-88.9375],[346.1875,-88.8125],[346.0625,-97.3125],[326.875,-97.375]]]}}]})
  }

  addMap(url, X = 0, Y = 0) {
    // dimensions of the image
    let w = 2048,
      h = 2048

    X = w * X
    Y = h * Y

    // calculate the edges of the image, in coordinate space
    let southWest = this.map.unproject([X, h + Y], this.map.getMaxZoom() - 1)
    let northEast = this.map.unproject([w + X, Y], this.map.getMaxZoom() - 1)

    let bounds = new L.LatLngBounds(southWest, northEast)

    L.imageOverlay(window.location.origin + url, bounds).addTo(this.map)

    this.map.on('click', e => {
      document.getElementById('ll').innerHTML = '<span>Y: ' + Math.floor(e.latlng.lng) + '<br/>X: ' + Math.floor(e.latlng.lat - e.latlng.lat * 2) + '</span>'
    })
  }

  addDrow() {
    if (this.myParam === 'true') {

      let featureGroup = L.featureGroup().addTo(this.map)

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
      }
    }
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

        {this.myParam === 'true' &&
          <span>
            <div id='delete'>Eliminar</div>
            <a href='#' id='export'>Guardar</a>
          </span>
        }

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
