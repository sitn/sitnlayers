/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-shadow */
/* global proj4, ol, $ */
(function (window) {
  function sitnLayers() {
    const sitnLayers = {};
    const _extent = [2420000, 1030000, 2900000, 1350000];
    const _crs = 'EPSG:2056';
    const _WMTSurl = 'https://sitn.ne.ch/web_getcapabilities/WMTSGetCapabilities95.xml';
    const _WMSurl = 'https://sitn.ne.ch/mapserv_proxy?ogcserver=source+for+image%2Fpng';
    const _drawSource = new ol.source.Vector();
    const _markerColor = '#8959A8';
    const _markerSource = new ol.source.Vector();
    const _sitnBaseLayers = {
      plan_ville: 'Plan de ville',
      plan_cadastral: 'Plan cadastral',
      ortho: 'Images aériennes',
    };
    // A dictionnary containing named layers in the form of { layer_name: ol.layer.Image(), }
    const _sitnWMSLayers = {};
    let _buttons = [];
    let _baselayers = [];
    let _wmslayers = [];
    let _target;
    let _selectTarget;
    let _drawSimpleGeom = false;
    let _markerImage = 'img/marker.svg';
    let _drawColor = 'cornflowerblue';
    let _drawFillColor;
    let _drawWidth = 4;
    let _pointStyle = 'circle';
    let _searchColor = 'red';
    let _map = false;
    let _minZoom = 0;
    let _maxZoom = 28;

    sitnLayers.sitnCurrentBaseLayer = new ol.layer.Tile();
    sitnLayers.sitnDrawLayer = new ol.layer.Vector({
      source: _drawSource,
    });

    // projection
    proj4.defs(_crs,
      '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333'
      + ' +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel '
      + '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
    ol.proj.proj4.register(proj4);
    const _projection = new ol.proj.Projection({
      code: _crs,
      extent: _extent,
    });

    sitnLayers._createMarkerStyle = function (color) {
      return new ol.style.Icon({
        anchor: [0.5, 1],
        color,
        opacity: 1,
        src: _markerImage,
      });
    };
    // TODO: get out source from here when base layer selection will be implemented
    sitnLayers.setSource = function (layerName) {
      $.ajax(_WMTSurl).then((response) => {
        const _parser = new ol.format.WMTSCapabilities();
        const _result = _parser.read(response);
        sitnLayers.WMTSOptions = ol.source.WMTS.optionsFromCapabilities(
          _result, {
            layer: layerName,
            matrixSet: _crs,
          },
        );
        const source = new ol.source.WMTS(sitnLayers.WMTSOptions);
        sitnLayers.sitnCurrentBaseLayer.setSource(source);
      });
    };

    sitnLayers.view = new ol.View({
      projection: _projection,
      center: ol.proj.fromLonLat([6.80, 47.05], _projection),
      zoom: 4,
    });

    /**
     * Toogles multiple geometry mode, if it's set to simple geometry
     * and multiple geometries were already drawn -> only keeps the last drawn geometry
     */
    sitnLayers.setSimpleGeom = function (value) {
      _drawSimpleGeom = value;
      if (_drawSimpleGeom && _drawSource.getFeatures().length > 1) {
        const lastFeature = _drawSource.getFeatures().slice(-1)[0];
        _drawSource.clear();
        _drawSource.addFeature(lastFeature);
      }
    };

    /**
     * Sets color and width to draw layer
     */
    sitnLayers.setDrawStyle = function (options) {
      _drawColor = ol.color.asArray(options.drawColor || _drawColor);
      _drawWidth = options.drawWidth || _drawWidth;
      _pointStyle = options.pointStyle || _pointStyle;
      const _drawFillColor = [
        _drawColor[0],
        _drawColor[1],
        _drawColor[2],
        _drawColor[3] / 2,
      ];

      let _imageStyle;
      if (_pointStyle === 'marker') {
        _imageStyle = this._createMarkerStyle(_drawColor);
      } else {
        _imageStyle = new ol.style.Circle({
          fill: new ol.style.Fill({ color: _drawFillColor }),
          stroke: new ol.style.Stroke({ color: _drawColor, width: _drawWidth / 2 }),
          radius: 5,
        });
      }
      sitnLayers.sitnDrawLayer.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({ color: _drawFillColor }),
        stroke: new ol.style.Stroke({ color: _drawColor, width: _drawWidth }),
        image: _imageStyle,
      }));
    };

    sitnLayers.createMap = function (options) {
      _buttons = options.buttons;
      _baselayers = options.baseLayers;
      _wmslayers = options.wmslayers;
      _target = options.target;
      _selectTarget = options.selectTarget;
      _drawSimpleGeom = options.drawSimpleGeom; // controls wether or not an user can draw multiple geometries
      _drawColor = options.drawColor || _drawColor;
      _drawWidth = options.drawWidth || _drawWidth;
      _pointStyle = options.pointStyle || _pointStyle;
      _markerImage = options.markerImage || _markerImage;
      _searchColor = options.searchColor || _searchColor;
      _minZoom = options.minZoom || _minZoom;
      _maxZoom = options.maxZoom || _maxZoom;
      _drawFillColor;
      let _mainbar;
      sitnLayers.setDrawStyle({});

      if (_wmslayers) {
        _wmslayers.forEach((layername) => {
          _sitnWMSLayers[layername] = new ol.layer.Image({
            extent: _extent,
            source: new ol.source.ImageWMS({
              url: _WMSurl,
              params: { LAYERS: layername },
              serverType: 'mapserver',
            }),
          });
        });
      }
      _map = new ol.Map({
        target: _target,
        layers: [
          sitnLayers.sitnCurrentBaseLayer,
          ...Object.values(_sitnWMSLayers), // insert array of wms layers
          sitnLayers.sitnDrawLayer,
          new ol.layer.Vector({ source: _markerSource }),
        ],
        view: sitnLayers.view,
      });
      sitnLayers.view.setZoom(options.minZoom || 4);
      sitnLayers.view.setMinZoom(_minZoom);
      sitnLayers.view.setMaxZoom(_maxZoom);

      /**
       * Creates select options, sets first baseLayer as default
       * or sets plan_ville if no _baselayers are defined
       */
      if (_baselayers) {
        $.each(_baselayers, (key, value) => {
          $(`#${_selectTarget}`)
            .append(new Option(_sitnBaseLayers[value], value));
        });
        $(`#${_selectTarget}`).change(() => {
          const newSource = $(`#${_selectTarget} option:selected`).val();
          sitnLayers.setSource(newSource);
        });
        this.setSource(_baselayers[0]);
      } else {
        this.setSource('plan_ville');
      }

      /**
       * Will set up button bar with editing activated by default
       */
      if (_buttons) {
        _mainbar = new ol.control.Bar();
        _map.addControl(_mainbar);
        _mainbar.setPosition('top-left');
        const editbar = new ol.control.Bar({
          toggleOne: true, // one control active at the same time
          group: false, // group controls together
        });
        _mainbar.addControl(editbar);

        // Edit control bar
        if (_buttons.indexOf('edit') !== -1) {
          // Add selection tool:
          //  1- a toggle control with a select interaction
          //  2- an option bar to delete / get information on the selected feature
          const sbar = new ol.control.Bar();
          const selectCtrl = new ol.control.Toggle({
            html: '<small class="fas fa-mouse-pointer"></small>',
            title: 'Select',
            interaction: new ol.interaction.Select(),
            bar: sbar,
            autoActivate: true,
            active: true,
          });

          sbar.addControl(new ol.control.TextButton({
            html: '<i class="fas fa-trash"></i>',
            title: 'Effacer',
            handleClick() {
              const features = selectCtrl.getInteraction().getFeatures();
              // if (!features.getLength()) console.log('Select an object first...');
              // else console.log(`${features.getLength()} object(s) deleted.`);
              let i = 0;
              do {
                _drawSource.removeFeature(features.item(i));
                i += 1;
              } while (features.item(i));
              selectCtrl.getInteraction().getFeatures().clear();
            },
          }));

          editbar.addControl(selectCtrl);
        }

        // Add editing tools
        if (_buttons.indexOf('createPoint') !== -1) {
          let active = true;
          if (_buttons.indexOf('edit') !== -1) {
            active = false;
          }
          const pedit = new ol.control.Toggle({
            html: '<small class="fas fa-map-pin"></small>',
            title: 'Point',
            active,
            interaction: new ol.interaction.Draw({
              type: 'Point',
              source: _drawSource,
            }),
          });
          editbar.addControl(pedit);
        }
        if (_buttons.indexOf('createLineString') !== -1) {
          const ledit = new ol.control.Toggle(
            {
              html: '<small class="fas fa-check fa-rotate-270 fa-flip-vertical"></small>',
              title: 'LineString',
              interaction: new ol.interaction.Draw({
                type: 'LineString',
                source: _drawSource,
                // Count inserted points
                geometryFunction(coordinates, geometry) {
                  let newGeom;
                  if (geometry) {
                    geometry.setCoordinates(coordinates);
                    newGeom = geometry;
                  } else newGeom = new ol.geom.LineString(coordinates);
                  this.nbpts = newGeom.getCoordinates().length;
                  return newGeom;
                },
              }),
              // Options bar associated with the control
              bar: new ol.control.Bar(
                {
                  controls: [new ol.control.TextButton({
                    html: '<i class="fas fa-undo"></i>',
                    title: 'Revenir en arrière',
                    handleClick() {
                      if (ledit.getInteraction().nbpts > 1) ledit.getInteraction().removeLastPoint();
                    },
                  }),
                  new ol.control.TextButton({
                    html: '<i class="fas fa-check"></i>',
                    title: 'Terminer la construction',
                    handleClick() { // Prevent null objects on finishDrawing
                      if (ledit.getInteraction().nbpts > 2) ledit.getInteraction().finishDrawing();
                    },
                  }),
                  ],
                },
              ),
            },
          );
          editbar.addControl(ledit);
        }

        if (_buttons.indexOf('createPolygon') !== -1) {
          const fedit = new ol.control.Toggle(
            {
              html: '<small class="fas fa-play fa-rotate-270"></small>',
              title: 'Polygon',
              interaction: new ol.interaction.Draw({
                type: 'Polygon',
                source: _drawSource,
                // Count inserted points
                geometryFunction(coordinates, geometry) {
                  this.nbpts = coordinates[0].length;
                  let newGeom = geometry;
                  if (geometry) {
                    newGeom.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
                  } else newGeom = new ol.geom.Polygon(coordinates);
                  return newGeom;
                },
              }),
              // Options bar associated with the control
              bar: new ol.control.Bar(
                {
                  controls: [new ol.control.TextButton({
                    html: '<i class="fas fa-undo"></i>',
                    title: 'Revenir en arrière',
                    handleClick() {
                      if (fedit.getInteraction().nbpts > 1) fedit.getInteraction().removeLastPoint();
                    },
                  }),
                  new ol.control.TextButton({
                    html: '<i class="fas fa-check"></i>',
                    title: 'Terminer la construction',
                    handleClick() { // Prevent null objects on finishDrawing
                      if (fedit.getInteraction().nbpts > 3) fedit.getInteraction().finishDrawing();
                    },
                  }),
                  ],
                },
              ),
            },
          );
          editbar.addControl(fedit);
        }

        // If this option is enabled, then the user can only draw simple geometries
        _drawSource.on('addfeature', (event) => {
          if (_drawSimpleGeom && _drawSource.getFeatures().length > 1) {
            _drawSource.clear();
            _drawSource.addFeature(event.feature);
          }
        });
      }
    };

    sitnLayers.getLayerByName = function (layerName) {
      return _sitnWMSLayers[layerName];
    };

    /**
     * Loads WKT and adds it to _drawsource
     * @param {String} wkt
     */
    sitnLayers.loadWKT = function (wkt) {
      const format = new ol.format.WKT({
        splitCollection: true,
      });
      const data = wkt;
      const features = format.readFeatures(data, {
        dataProjection: _crs,
        featureProjection: _crs,
      });
      _drawSource.addFeatures(features);
    };

    /**
     * Exports _drawSource as WKT
     */
    sitnLayers.getWKTData = function () {
      const features = _drawSource.getFeatures();
      if (features) {
        const wktData = new ol.format.WKT().writeFeatures(features);
        return wktData;
      }
      return '';
    };

    /**
     * Exports _drawsource as GeoJSON
     */
    sitnLayers.getGeoJSONData = function () {
      const features = _drawSource.getFeatures();
      if (features) {
        const jsonData = new ol.format.GeoJSON().writeFeatures(features);
        return jsonData;
      }
      return '';
    };

    /**
     * Adds a marker based on coordinates: an array of 2 numbers
     * and clears another existing maker before. The color is optional
     */
    sitnLayers.addMarker = function (coordinates, color) {
      _markerSource.clear();
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(coordinates),
      });
      marker.setStyle(new ol.style.Style({
        image: this._createMarkerStyle(color || _markerColor),
      }));

      _markerSource.addFeature(marker);
    };

    /**
     * Updates marker position based
     * on coordinates: an array of 2 numbers
     */
    sitnLayers.updateMarker = function (coordinates) {
      sitnLayers.addMarker(coordinates);
    };

    /**
     * Removes marker
     */
    sitnLayers.removeMarker = function () {
      _markerSource.clear();
    };

    /**
     * Recenters the map based
     * on coordinates: an array of 2 numbers
     */
    sitnLayers.recenterMap = function (coordinates, zoomLevel) {
      if (_map) {
        const view = _map.getView();
        view.setCenter(coordinates);
        view.setZoom(zoomLevel);
      }
    };

    /**
     * Gets center point of the extent an optionnaly recenters de map
     */
    sitnLayers.getCenterPoint = function (recenter) {
      let center = [0, 0];
      let extent;
      if (_drawSource.getFeatures().length > 0) {
        extent = _drawSource.getExtent();
        center = ol.extent.getCenter(extent);
      } else if (_drawSource.getFeatures.length === 0 && _markerSource.getFeatures().length > 0) {
        extent = _markerSource.getExtent();
        center = ol.extent.getCenter(_markerSource.getExtent());
      }
      if (recenter && center[0] !== 0) {
        if (Math.round(extent[0]) === Math.round(extent[2])) {
          sitnLayers.recenterMap(center, 14);
        } else {
          _map.getView().fit(extent);
        }
      }
      return center;
    };

    sitnLayers.searchBox = function (config) {
      let inputclasses;
      let resultclasses;
      let headerclasses;
      let itemclasses;
      const searchLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
          fill: new ol.style.Fill({ color: 'yellow' }),
          stroke: new ol.style.Stroke({ color: _searchColor, width: 8 }),
          image: new ol.style.RegularShape({
            fill: new ol.style.Fill({ color: 'yellow' }),
            stroke: new ol.style.Stroke({ color: _searchColor, width: 4 }),
            points: 4,
            radius: 10,
            radius2: 0,
            angle: Math.PI / 4,
          }),
        }),
        opacity: 0.5,
      });

      if (_map) {
        _map.addLayer(searchLayer);
      }
      let width = 'auto';

      if (config.width) {
        width = config.width;
      }

      if (config) {
        inputclasses = config.inputclasses || [''];
        resultclasses = config.resultclasses || ['sitn-search-result'];
        headerclasses = config.headerclasses || [''];
        itemclasses = config.itemclasses || [''];
      }

      // alias list for category names
      const catClean = {
        neophytes: 'Plantes invasives',
        search_satac: 'N° SATAC',
        search_entree_sortie: 'Entrée/sortie autoroute',
        rt16_giratoires: 'Giratoires',
        batiments_ofs: 'Bâtiments regBL et n° egid',
        axe_mistra: 'Routes et axes',
        search_arrets_tp: 'Arrêts transports publics',
        ImmeublesCantonHistorique: 'Biens-fonds historiques',
        point_interet: "Points d'intérêt",
        axe_rue: 'Axes et rues',
        nom_local_lieu_dit: 'Noms locaux et lieux-dits',
        search_cours_eau: "Cours d'eau",
        ImmeublesCanton: 'Biens-fonds',
        search_fo_administrations: 'Administrations forestières',
        search_uap_publique: "Unité d'aménagement publique",
        adresses_sitn: 'Adresses',
        localite: 'Localité',
        search_fo09: 'Secours en forêt',
        search_conc_hydr: 'Concessions hydrauliques',
      };

      // create required divs
      document.getElementById(config.target).innerHTML = `<input id=placeInput type=text class="${
        inputclasses.join(' ')}"/>`
        + `<ol id="selectable" class=" ${resultclasses.join(' ')
        }"></ol>`;
      $(`#${config.target}`).width(width);

      // start setting up events
      $('#placeInput').val('Recherche un lieu ou un objet géographique');

      $('#placeInput').focusin(() => {
        $('#placeInput').val('');
        searchLayer.getSource().clear();
      });

      $('#placeInput').focusout(() => {
        $('#selectable').hide();
      });

      $('#selectable').hide();
      // stop setting up events

      // start get data from server
      let inputTerm = '';
      let recCopy = '';

      $('#placeInput').keyup(() => {
        inputTerm = $('#placeInput').val();
        if (inputTerm.length > 2) {
          $.ajax({
            url: 'https://sitn.ne.ch/search',
            crossDomain: true,
            data: {
              limit: 20,
              query: inputTerm,
            },
            success(rec) {
              // get the results
              if (rec.features.length === 0) {
                document.getElementById('selectable').innerHTML = 'Aucun résultat';
                $('#selectable').show();
                return;
              }
              // process results: group by categories
              const itLength = rec.features.length;
              const cat = [];
              // get categories
              for (let i = 0; i < itLength; i++) {
                cat.push(rec.features[i].properties.layer_name);
              }
              // sort categories in ascending order and keep only unique
              cat.sort();
              const catUnique = [];
              catUnique.push(cat[0]);
              for (let i = 1; i < cat.length; i++) {
                if (cat[i] !== cat[i - 1]) {
                  catUnique.push(cat[i]);
                }
              }
              // group the features by categories and fill the ordered list used for place selection
              recCopy = $.extend(true, {}, rec);
              let index = 0;
              let listItems = '';
              let catTest; let
                catName;
              for (let i = 0; i < catUnique.length; i++) {
                catTest = catUnique[i];
                $.each(catClean, (key, val) => {
                  if (catTest === key) {
                    catName = val;
                  }
                });
                listItems += `<div class="${headerclasses.join(' ')}"><b>${catName}</b></div>`;
                for (let j = 0; j < itLength; j++) {
                  if (catUnique[i].toUpperCase() === rec.features[j].properties.layer_name.toUpperCase()) {
                    recCopy.features[index] = rec.features[j];
                    listItems += `<li class="${itemclasses.join(' ')}">${
                      rec.features[j].properties.label}</li>`;
                    index += 1;
                  }
                }
              }
              document.getElementById('selectable').innerHTML = listItems;
              $('#selectable').show();
            },
            error() {
              $('#placeInput').val('Échec de la recherche');
            },
          });
        } else if (!inputTerm) {
          searchLayer.getSource().clear();
        }
      });
      // stop get data from server

      // fill selectable list and zoom to selected feature
      $(() => {
        $('#selectable').selectable({
          stop() {
            const result = $('#select-result').empty();
            $('.ui-selected', this).each(function () {
              const index = $('#selectable li').index(this);
              if (index !== -1) {
                $('#placeInput').val(recCopy.features[index].properties.label);
                if (_map) {
                  const geojsonFormat = new ol.format.GeoJSON();
                  searchLayer.getSource().clear();
                  const nGeom = recCopy.features[index].geometry.coordinates.length;
                  // geometry is not empty
                  if (nGeom !== 0) {
                    searchLayer.getSource().addFeatures(geojsonFormat.readFeatures(recCopy.features[index]));
                  } else if (recCopy.features[index].bbox.length > 1) { // geometry is empty
                    const point = new ol.geom.Point(recCopy.features[index].bbox[0], recCopy.features[index].bbox[1]);
                    const pointFeature = new ol.Feature(point);
                    searchLayer.addFeatures(pointFeature);
                  }
                  if (recCopy.features[index].geometry.type === 'Point') {
                    _map.getView().fit(recCopy.features[index].bbox);
                    _map.getView().setZoom(12);
                  } else {
                    _map.getView().fit(recCopy.features[index].bbox);
                  }
                }
                result.append(` #${index + 1}`);
                $('#selectable').hide();
              }
            });
          },
        });
      });

      const css = ' \n'
      + '.sitn-search-result { \n'
      + '  position: absolute; \n'
      + '  top: 100%; \n'
      + '  left: 0; \n'
      + '  z-index: 1000; \n'
      + '  float: left; \n'
      + '  min-width: 10rem; \n'
      + '  padding: .5rem 0; \n'
      + '  margin: .125rem 0 0; \n'
      + '  text-align: left; \n'
      + '  list-style: none; \n'
      + '  background-color: #fff; \n'
      + '  background-clip: padding-box; \n'
      + '}';
      const head = document.head || document.getElementsByTagName('head')[0];
      const style = document.createElement('style');

      head.appendChild(style);

      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
    };
    return sitnLayers;
  }

  window.SitnMap = sitnLayers;
}(window));
