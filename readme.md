# sitnLayers

An openlayers widget that allows drawing and retrieving geometries with sitn base layers.

## Getting started
Clone this repository and open a shell at the root of your project.

Get assets by downloading them in the assets folder.

```powershel
curl https://cdn.jsdelivr.net/npm/ol@v7.2.2/dist/ol.js -o assets\ol\ol.js
curl https://cdn.jsdelivr.net/npm/ol@v7.2.2/ol.css -o assets\ol\ol.css
curl https://raw.githubusercontent.com/proj4js/proj4js/2.8.1/dist/proj4.js -o assets\proj4\proj4.js
curl https://raw.githubusercontent.com/Viglino/ol-ext/master/dist/ol-ext.min.js -o assets\ol-ext\ol-ext.min.js
curl https://raw.githubusercontent.com/Viglino/ol-ext/master/dist/ol-ext.min.css -o assets\ol-ext\ol-ext.min.css
```

## Dev environment

If you want live reload, install live-server:

```powershel
npm install -g live-server
npm install
```

Download mappings for debug:

```powershel
curl https://cdn.jsdelivr.net/npm/ol@v7.2.2/dist/ol.js.map -o assets\ol\ol.js.map
curl https://cdn.jsdelivr.net/npm/ol@v7.2.2/ol.css.map -o assets\ol\ol.css.map
```

then just run `live-server` at the root of your project.
