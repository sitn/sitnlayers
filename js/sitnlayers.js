/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-shadow */
/* global proj4, ol */
(function (window) {
  function sitnLayers() {
    const sitnLayers = {};
    const _extent = [2420000, 1030000, 2900000, 1350000];
    const _crs = 'EPSG:2056';
    const _WMTSurl = 'https://sitn.ne.ch/services/wmts?SERVICE=WMTS&REQUEST=GetCapabilities';
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
      fetch(_WMTSurl).then((response) => response.text()).then((getCap) => {
        const _parser = new ol.format.WMTSCapabilities();
        const _result = _parser.read(getCap);
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
        const selectElement = document.getElementById(_selectTarget);
        Object.values(_baselayers).forEach((baselayer) => {
          selectElement.append(new Option(_sitnBaseLayers[baselayer], baselayer));
        });

        selectElement.onchange = () => {
          const newSource = document.querySelector(`#${_selectTarget} option:checked`).value;
          sitnLayers.setSource(newSource);
        };
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
            html: `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cursor-fill" viewBox="0 0 16 16">
                <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/>
              </svg>`,
            title: 'Select',
            interaction: new ol.interaction.Select(),
            bar: sbar,
            autoActivate: true,
            active: true,
          });

          sbar.addControl(new ol.control.TextButton({
            html: `
            <svg class="bi" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>`,
            title: 'Effacer',
            handleClick() {
              const features = selectCtrl.getInteraction().getFeatures();
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
            html: `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dot" viewBox="0 0 16 16">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>`,
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
              html: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-slash-lg" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/>
                </svg>`,
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
                    html: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                    </svg>`,
                    title: 'Revenir en arrière',
                    handleClick() {
                      if (ledit.getInteraction().nbpts > 1) ledit.getInteraction().removeLastPoint();
                    },
                  }),
                  new ol.control.TextButton({
                    html: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                    </svg>`,
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
              html: `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pentagon-fill" viewBox="0 0 16 16">
                <path d="M7.685.256a.5.5 0 0 1 .63 0l7.421 6.03a.5.5 0 0 1 .162.538l-2.788 8.827a.5.5 0 0 1-.476.349H3.366a.5.5 0 0 1-.476-.35L.102 6.825a.5.5 0 0 1 .162-.538l7.42-6.03Z"/>
              </svg>`,
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
                    html: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                    </svg>`,
                    title: 'Revenir en arrière',
                    handleClick() {
                      if (fedit.getInteraction().nbpts > 1) fedit.getInteraction().removeLastPoint();
                    },
                  }),
                  new ol.control.TextButton({
                    html: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                    </svg>`,
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
        const point = new ol.geom.Point(coordinates);
        view.fit(point, { maxZoom: zoomLevel });
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

    sitnLayers._searchBoxConfig = {};
    sitnLayers.searchBoxResultList = [];
    sitnLayers._searchBoxCatClean = {
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

    sitnLayers.searchLayer = new ol.layer.Vector({
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

    sitnLayers._searchBoxCreateTemplates = function () {
      const template = document.createElement('template');
      template.innerHTML = `<input
        id="search"
        class="${sitnLayers._searchBoxConfig.inputclasses.join(' ')}"
        length="20"
        maxlength="1000"
        autocomplete="off"
        autocorrect="off"
        placeholder="Recherche un lieu ou un objet géographique" />
          <div id="results" class="${sitnLayers._searchBoxConfig.resultclasses.join(' ')}"></div>`;
      this.searchBoxInput = template.content.firstChild;
      this.searchBoxResults = template.content.lastChild;
      const targetElement = document.getElementById(this._searchBoxConfig.target);
      targetElement.appendChild(sitnLayers.searchBoxInput);
      targetElement.appendChild(sitnLayers.searchBoxResults);
    };

    sitnLayers._searchBoxRegisterEvents = function () {
      this.searchBoxInput.addEventListener('input', (e) => this._searchBoxDoSearch(e));
      this.searchBoxInput.addEventListener('focusin', () => this._searchBoxOnFocusIn());
      this.searchBoxInput.addEventListener('focusout', () => this._searchBoxOnFocusOut());
    };

    sitnLayers._searchBoxOnFocusIn = function () {
      this.ignoreBlur = false;
    };

    sitnLayers._searchBoxOnFocusOut = function () {
      if (!this.ignoreBlur) {
        this.searchBoxResults.style.display = 'none';
        this.searchBoxResultList = [];
      }
    };

    sitnLayers._searchBoxOnSelect = function (e) {
      const result = this.searchBoxResultList[e.target.dataset.resultId];
      const resultGeometry = result.geometry;
      if (_map) {
        const searchSource = this.searchLayer.getSource();
        searchSource.clear();
        if (resultGeometry.coordinates.length > 0) {
          const geojsonFormat = new ol.format.GeoJSON();
          searchSource.addFeatures(geojsonFormat.readFeatures(resultGeometry));
          _map.getView().fit(result.bbox, { maxZoom: 12, padding: [50, 50, 50, 50] });
        } else {
          console.error('No geometry on search result!', result);
        }
      }
      this._searchBoxOnFocusOut();
    };

    sitnLayers._clearSearch = function () {
      this.searchBoxResultList = [];
      this.searchBoxResults.innerHTML = '';
      this.searchBoxResults.style.display = 'none';
    };

    sitnLayers._searchBoxDoSearch = function (e) {
      const term = e.target.value;
      if (term.length <= 0) {
        this._clearSearch();
        return;
      }

      const url = `https://sitn.ne.ch/search?limit=20&query=${term}`;
      fetch(url)
        .then((response) => response.json())
        .then((data) => this._displayResults(data));
    };

    sitnLayers._displayResults = function (results) {
      // First, group the results
      const groupedResults = {};
      results.features.forEach((result) => {
        const type = result.properties.layer_name;
        let resultList = null;
        if (type in groupedResults) {
          resultList = groupedResults[type];
        } else {
          resultList = [];
          groupedResults[type] = resultList;
        }
        resultList.push(result);
      });

      // Then, display the results by group
      this._clearSearch();
      if (results.features.length === 0) {
        const title = document.createElement('li');
        title.className = this._searchBoxConfig.headerclasses;
        title.innerHTML = "Aucun résultat n'a été trouvé";
        this.searchBoxResults.appendChild(title);
      }
      for (const type in groupedResults) {
        // Create a title
        const title = document.createElement('li');
        title.className = this._searchBoxConfig.headerclasses;

        const titleText = document.createElement('span');
        titleText.innerHTML = this._searchBoxCatClean[type];
        title.appendChild(titleText);

        this.searchBoxResults.appendChild(title);

        // Create results
        groupedResults[type].forEach((r) => {
          const result = document.createElement('li');
          result.className = this._searchBoxConfig.itemclasses;
          this.searchBoxResultList[r.id] = r;
          result.dataset.resultId = r.id;

          result.onmousedown = () => { this.ignoreBlur = true; };
          result.onclick = (e) => { this.ignoreBlur = false; this._searchBoxOnSelect(e); };

          result.innerHTML = r.properties.label;
          this.searchBoxResults.appendChild(result);
        });
      }
      this.searchBoxResults.style.display = 'block';
    };

    sitnLayers.searchBox = function (config) {
      // Init config
      if (!config.target) {
        console.error('You need to give a target for searchbox');
      }
      sitnLayers._searchBoxConfig = {
        inputclasses: config.inputclasses || [''],
        resultclasses: config.resultclasses || ['sitn-search-result'],
        headerclasses: config.headerclasses || [''],
        itemclasses: config.itemclasses || [''],
        target: config.target,
      };

      sitnLayers._searchBoxCreateTemplates();
      sitnLayers._searchBoxRegisterEvents();

      if (_map) {
        _map.addLayer(sitnLayers.searchLayer);
      }
    };
    return sitnLayers;
  }

  window.SitnMap = sitnLayers;
}(window));
