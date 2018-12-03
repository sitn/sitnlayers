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
curl https://raw.githubusercontent.com/Viglino/ol-ext/master/dist/ol-ext.min.js -o assets\ol-ext\ol-ext.min.js
curl https://raw.githubusercontent.com/Viglino/ol-ext/master/dist/ol-ext.min.css -o assets\ol-ext\ol-ext.min.css
curl https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/web-fonts-with-css/css/solid.min.css -o assets\fontawesome\css\solid.min.css
curl https://use.fontawesome.com/releases/v5.5.0/fontawesome-free-5.5.0-web.zip -o assets\fa.zip
Expand-Archive assets\fa.zip -DestinationPath assets
get-childitem -Path "assets\fontawesome*" | rename-item -NewName fontawesome
del assets\fa.zip
curl https://gist.githubusercontent.com/matijs/d1e0bdce90b507b9dbe7e280a34f0e59/raw/6a361fdef1a68c2b808a8a1adc9320b977cd25da/classList.js -o assets\polyfills\classList.js
curl https://gist.githubusercontent.com/spiralx/68cf40d7010d829340cb/raw/96a9385eddb8cc401d5965d348a463f961e4762a/object-assign.js -o assets\polyfills\object-assign.js
curl https://cdn.jsdelivr.net/npm/url-polyfill@1.1.3/url-polyfill.min.js -o assets\polyfills\url-polyfill.min.js
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
