# sitnLayers

An openlayers widget that allows drawing and retrieving geometries with sitn base layers.

## Getting started
Clone this repository and open a shell at the root of your project.

Get assets by downloading them in the assets folder.

```powershel
curl https://code.jquery.com/jquery-3.3.1.min.js -o assets\jquery\jquery-3.3.1.min.js
curl https://code.jquery.com/ui/1.12.1/jquery-ui.min.js -o assets\jquery-ui\jquery-ui.min.js
curl https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v5.3.0/build/ol.js -o assets\ol\ol.js
curl https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v5.3.0/css/ol.css -o assets\ol\ol.css
curl https://raw.githubusercontent.com/proj4js/proj4js/2.5.0/dist/proj4.js -o assets\proj4\proj4.js
curl https://raw.githubusercontent.com/Viglino/ol-ext/master/dist/ol-ext.min.js -o assets\ol-ext\ol-ext.min.js
curl https://raw.githubusercontent.com/Viglino/ol-ext/master/dist/ol-ext.min.css -o assets\ol-ext\ol-ext.min.css
curl https://use.fontawesome.com/releases/v5.5.0/fontawesome-free-5.5.0-web.zip -o assets\fa.zip
Expand-Archive assets\fa.zip -DestinationPath assets
get-childitem -Path "assets\fontawesome*" | rename-item -NewName fontawesome
del assets\fa.zip
```

## Dev environment

If you want live reload, install live-server:

```powershel
npm install -g live-server
npm install
```

Download mappings for debug:

```powershel
curl https://code.jquery.com/jquery-3.3.1.min.map -o assets\jquery\jquery-3.3.1.min.map
curl https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v5.3.0/build/ol.js.map -o assets\ol\ol.js.map
curl https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v5.3.0/css/ol.css.map -o assets\ol\ol.css.map
```

then just run `live-server` at the root of your project.
