# sitnLayers

An openlayers widget that allows drawing and retrieving geometries with sitn base layers.

## Getting started
Clone this repository and open a shell at the root of your project.

Get assets by downloading them in the assets folder.

```powershel
curl https://code.jquery.com/jquery-3.3.1.min.js -o assets\jquery\jquery-3.3.1.min.js
curl https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/build/ol.js -o assets\ol\ol.js
curl https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/css/ol.css -o assets\ol\ol.css
curl https://raw.githubusercontent.com/proj4js/proj4js/2.5.0/dist/proj4.js -o assets\proj4\proj4.js
```

## Dev environment

If you want live reload, install live-server:

```powershel
npm install -g live-server
```

Download mappings for debug:

```powershel
curl https://code.jquery.com/jquery-3.3.1.min.map -o assets\jquery\jquery-3.3.1.min.map
curl https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/build/ol.js.map -o assets\ol\ol.js.map
curl https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/css/ol.css.map -o assets\ol\ol.css.map
```

then just run `live-server` at the root of your project.
