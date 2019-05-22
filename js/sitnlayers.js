/* global proj4, ol, $ */
(function (window) {
  function sitnLayers() {
    var sitnLayers = {}
    const _extent = [2420000, 1030000, 2900000, 1350000]
    const _crs = 'EPSG:2056'
    const _WMTSurl = 'https://sitn.ne.ch/web_getcapabilities/WMTSGetCapabilities95.xml'
    const _drawSource = new ol.source.Vector()
    const _markerSource = new ol.source.Vector()
    const _sitnBaseLayers = {
      'plan_ville': 'Plan de ville',
      'plan_cadastral': 'Plan cadastral',
      'ortho': 'Images aériennes'
    }
    var _buttons = []
    var _baselayers = []
    var _target
    var _selectTarget
    var _drawSimpleGeom = false
    var _map = false
    var _markerColor

    sitnLayers.sitnCurrentBaseLayer = new ol.layer.Tile()

    // projection
    proj4.defs(_crs,
      '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333' +
      ' +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel ' +
      '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs')
    ol.proj.proj4.register(proj4)
    const _projection = new ol.proj.Projection({
      code: _crs,
      extent: _extent
    })

    // TODO: get out source from here when base layer selection will be implemented
    sitnLayers.setSource = function (layerName) {
      $.ajax(_WMTSurl).then(function (response) {
        let _parser = new ol.format.WMTSCapabilities()
        let _result = _parser.read(response)
        sitnLayers.WMTSOptions = ol.source.WMTS.optionsFromCapabilities(
          _result, {
            layer: layerName,
            matrixSet: _crs
          })
        let source = new ol.source.WMTS(sitnLayers.WMTSOptions)
        sitnLayers.sitnCurrentBaseLayer.setSource(source)
      })
    }

    sitnLayers.view = new ol.View({
      projection: _projection,
      center: ol.proj.fromLonLat([6.80, 47.05], _projection),
      zoom: 4
    })

    /**
     * Toogles multiple geometry mode, if it's set to simple geometry
     * and multiple geometries were already drawn -> only keeps the last drawn geometry
     */
    sitnLayers.setSimpleGeom = function (value) {
      _drawSimpleGeom = value
      if (_drawSimpleGeom && _drawSource.getFeatures().length > 1) {
        let lastFeature = _drawSource.getFeatures().slice(-1)[0]
        _drawSource.clear()
        _drawSource.addFeature(lastFeature)
      }
    }

    sitnLayers.createMap = function (options) {
      _buttons = options['buttons']
      _baselayers = options['baseLayers']
      _target = options['target']
      _selectTarget = options['selectTarget']
      _drawSimpleGeom = options['drawSimpleGeom'] // controls wether or not an user can draw multiple geometries
      let _mainbar
      _map = new ol.Map({
        target: _target,
        layers: [
          sitnLayers.sitnCurrentBaseLayer,
          new ol.layer.Vector({ source: _drawSource }),
          new ol.layer.Vector({ source: _markerSource })
        ],
        view: sitnLayers.view
      })

      /**
       * Creates select options, sets first baseLayer as default
       * or sets plan_ville if no _baselayers are defined
       */
      if (_baselayers) {
        $.each(_baselayers, function (key, value) {
          $('#' + _selectTarget)
            .append(new Option(_sitnBaseLayers[value], value))
        })
        $('#' + _selectTarget).change(function () {
          let newSource = $('#' + _selectTarget + ' option:selected').val()
          sitnLayers.setSource(newSource)
        })
        this.setSource(_baselayers[0])
      } else {
        this.setSource('plan_ville')
      }

      if (_buttons) {
        _mainbar = new ol.control.Bar()
        _map.addControl(_mainbar)
        _mainbar.setPosition('top-left')
        var editbar = new ol.control.Bar({
          toggleOne: true, // one control active at the same time
          group: false // group controls together
        })
        _mainbar.addControl(editbar)

        // Edit control bar
        if (_buttons.indexOf('edit') !== -1) {
          // Add selection tool:
          //  1- a toggle control with a select interaction
          //  2- an option bar to delete / get information on the selected feature
          var sbar = new ol.control.Bar()
          sbar.addControl(new ol.control.TextButton({
            html: '<i class="fas fa-trash"></i>',
            title: 'Effacer',
            handleClick: function () {
              var features = selectCtrl.getInteraction().getFeatures()
              if (!features.getLength()) console.log('Select an object first...')
              else console.log(features.getLength() + ' object(s) deleted.')
              for (var i = 0, f; (f = features.item(i)); i++) {
                _drawSource.removeFeature(f)
              }
              selectCtrl.getInteraction().getFeatures().clear()
            }
          }))

          var selectCtrl = new ol.control.Toggle({
            html: '<small class="fas fa-mouse-pointer"></small>',
            title: 'Select',
            interaction: new ol.interaction.Select(),
            bar: sbar,
            autoActivate: true,
            active: true
          })
          editbar.addControl(selectCtrl)
        }

        // Add editing tools
        if (_buttons.indexOf('createPoint') !== -1) {
          var pedit = new ol.control.Toggle({
            html: '<small class="fas fa-map-pin"></small>',
            title: 'Point',
            interaction: new ol.interaction.Draw({
              type: 'Point',
              source: _drawSource
            })
          })
          editbar.addControl(pedit)
        }
        if (_buttons.indexOf('createLineString') !== -1) {
          var ledit = new ol.control.Toggle(
            {
              html: '<small class="fas fa-check fa-rotate-270 fa-flip-vertical"></small>',
              title: 'LineString',
              interaction: new ol.interaction.Draw({
                type: 'LineString',
                source: _drawSource,
                // Count inserted points
                geometryFunction: function (coordinates, geometry) {
                  if (geometry) {
                    geometry.setCoordinates(coordinates)
                  } else geometry = new ol.geom.LineString(coordinates)
                  this.nbpts = geometry.getCoordinates().length
                  return geometry
                }
              }),
              // Options bar associated with the control
              bar: new ol.control.Bar(
                {
                  controls: [new ol.control.TextButton({
                    html: '<i class="fas fa-undo"></i>',
                    title: 'Revenir en arrière',
                    handleClick: function () {
                      if (ledit.getInteraction().nbpts > 1) ledit.getInteraction().removeLastPoint()
                    }
                  }),
                  new ol.control.TextButton({
                    html: '<i class="fas fa-check"></i>',
                    title: 'Terminer la construction',
                    handleClick: function () { // Prevent null objects on finishDrawing
                      if (ledit.getInteraction().nbpts > 2) ledit.getInteraction().finishDrawing()
                    }
                  })
                  ]
                })
            })
          editbar.addControl(ledit)
        }

        if (_buttons.indexOf('createPolygon') !== -1) {
          var fedit = new ol.control.Toggle(
            {
              html: '<small class="fas fa-play fa-rotate-270"></small>',
              title: 'Polygon',
              interaction: new ol.interaction.Draw({
                type: 'Polygon',
                source: _drawSource,
                // Count inserted points
                geometryFunction: function (coordinates, geometry) {
                  this.nbpts = coordinates[0].length
                  if (geometry) geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])])
                  else geometry = new ol.geom.Polygon(coordinates)
                  return geometry
                }
              }),
              // Options bar associated with the control
              bar: new ol.control.Bar(
                {
                  controls: [new ol.control.TextButton({
                    html: '<i class="fas fa-undo"></i>',
                    title: 'Revenir en arrière',
                    handleClick: function () {
                      if (fedit.getInteraction().nbpts > 1) fedit.getInteraction().removeLastPoint()
                    }
                  }),
                  new ol.control.TextButton({
                    html: '<i class="fas fa-check"></i>',
                    title: 'Terminer la construction',
                    handleClick: function () { // Prevent null objects on finishDrawing
                      if (fedit.getInteraction().nbpts > 3) fedit.getInteraction().finishDrawing()
                    }
                  })
                  ]
                })
            })
          editbar.addControl(fedit)
        }

        // If this option is enabled, then the user can only draw simple geometries
        _drawSource.on('addfeature', function (event) {
          if (_drawSimpleGeom && _drawSource.getFeatures().length > 1) {
            _drawSource.clear()
            _drawSource.addFeature(event.feature)
          }
        });
      }
    }

    sitnLayers.loadWKT = function (wkt) {
      let format = new ol.format.WKT()
      let data = wkt;
      let features = format.readFeatures(data, {
        dataProjection: _crs,
        featureProjection: _crs
      })
      _drawSource.addFeatures(features)
    }

    sitnLayers.getWKTData = function () {
      let features = _drawSource.getFeatures()
      if (features) {
        let wktData = new ol.format.WKT().writeFeatures(features)
        return wktData
      }
    }

    /**
     * Adds a marker based on coordinates: an array of 2 numbers
     * and clears another existing maker before. The color is optional
     */
    sitnLayers.addMarker = function (coordinates, color) {
      _markerColor = color
      _markerSource.clear()
      let marker = new ol.Feature({
        geometry: new ol.geom.Point(coordinates)
      })
      marker.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          color: _markerColor || '#8959A8',
          opacity: 1,
          src: 'img/marker.svg'
        })
      }))
      _markerSource.addFeature(marker)
    }

    /**
     * Updates marker position based
     * on coordinates: an array of 2 numbers
     */
    sitnLayers.updateMarker = function (coordinates) {
      sitnLayers.addMarker(coordinates)
    }

    /**
     * Removes marker
     */
    sitnLayers.removeMarker = function () {
      _markerSource.clear()
    }

    /**
     * Recenters the map based
     * on coordinates: an array of 2 numbers
     */
    sitnLayers.recenterMap = function (coordinates, zoomLevel) {
      if (_map) {
        let view = _map.getView()
        view.setCenter(coordinates)
        view.setZoom(zoomLevel)
      }
    }

    sitnLayers.searchBox = function (config) {
      var searchLayer = new ol.layer.Vector({ source: new ol.source.Vector() })
      if (_map) {
        _map.addLayer(searchLayer)
      }
      var width = 'auto'

      if (config.width) {
        width = config.width;
      }

      if (config) {
        var inputclasses = config['inputclasses'] || ['']
        var resultclasses = config['resultclasses'] || ['sitn-search-result']
        var headerclasses = config['headerclasses'] || ['']
        var itemclasses = config['itemclasses'] || ['']
      }

      // alias list for category names
      var catClean = {
        "neophytes": "Plantes invasives",
        "search_satac": "N° SATAC",
        "search_entree_sortie": "Entrée/sortie autoroute",
        "rt16_giratoires": "Giratoires",
        "batiments_ofs": "Bâtiments regBL et n° egid",
        "axe_mistra": "Routes et axes",
        "search_arrets_tp": "Arrêts transports publics",
        "ImmeublesCantonHistorique": "Biens-fonds historiques",
        "point_interet": "Points d'intérêt",
        "axe_rue": "Axes et rues",
        "nom_local_lieu_dit": "Noms locaux et lieux-dits",
        "search_cours_eau": "Cours d'eau",
        "ImmeublesCanton": "Biens-fonds",
        "search_fo_administrations": "Administrations forestières",
        "search_uap_publique": "Unité d'aménagement publique",
        "adresses_sitn": "Adresses",
        "localite": "Localité",
        "search_fo09": "Secours en forêt",
        "search_conc_hydr": "Concessions hydrauliques"
      };

      // create required divs
      document.getElementById(config.target).innerHTML = '<input id=placeInput type=text class="' +
        inputclasses.join(' ') + '"/>' +
        '<ol id="selectable" class=" ' + resultclasses.join(' ') +
        '"></ol>';
      $('#' + config.target).width(width);

      //start setting up events
      $("#placeInput").val("Recherche un lieu ou un objet géographique");

      $("#placeInput").focusin(function () {
        $("#placeInput").val("");
        searchLayer.getSource().clear();
      });

      $("#placeInput").focusout(function () {
        $("#selectable").hide();
      });

      $("#selectable").hide();
      //stop setting up events

      //start get data from server
      var inputTerm = "";
      var recCopy = "";

      $("#placeInput").keyup(function () {
        inputTerm = $("#placeInput").val();
        if (inputTerm.length > 2) {
          $.ajax({
            url: "https://sitn.ne.ch/production/wsgi/fulltextsearch",
            crossDomain: true,
            data: {
              limit: 20,
              query: inputTerm
            },
            success: function (rec) {
              // get the results
              if (rec.features.length == 0) {
                document.getElementById("selectable").innerHTML = "Aucun résultat";
                $("#selectable").show();
                return;
              }
              // process results: group by categories
              var itLength = rec.features.length;
              var cat = new Array();
              // get categories
              for (let i = 0; i < itLength; i++) {
                cat.push(rec.features[i].properties.layer_name);
              }
              // sort categories in ascending order and keep only unique
              cat.sort();
              var catUnique = [];
              catUnique.push(cat[0]);
              for (let i = 1; i < cat.length; i++) {
                if (cat[i] != cat[i - 1]) {
                  catUnique.push(cat[i]);
                }
              }
              // group the features by categories and fill the ordered list used for place selection
              recCopy = $.extend(true, {}, rec);
              var index = 0;
              var listItems = "";
              var catTest, catName;
              for (let i = 0; i < catUnique.length; i++) {
                catTest = catUnique[i];
                $.each(catClean, function (key, val) {
                  if (catTest === key) {
                    catName = val;
                  }
                });
                listItems += '<div class="' + headerclasses.join(' ') + '"><b>' + catName + "</b></div>";
                for (var j = 0; j < itLength; j++) {
                  if (catUnique[i].toUpperCase() == rec.features[j].properties.layer_name.toUpperCase()) {
                    recCopy.features[index] = rec.features[j];
                    listItems += '<li class="' + itemclasses.join(' ') + '">'
                      + rec.features[j].properties.label + "</li>";
                    index += 1;
                  }
                }
              }
              document.getElementById("selectable").innerHTML = listItems;
              $("#selectable").show();
            },
            error: function () {
              $("#placeInput").val("Échec de la recherche")
            }
          });
        } else if (!inputTerm) {
          searchLayer.getSource().clear();
        }
      });
      //stop get data from server

      // fill selectable list and zoom to selected feature
      $(function () {
        $("#selectable").selectable({
          stop: function () {
            var result = $("#select-result").empty();
            $(".ui-selected", this).each(function () {
              var index = $("#selectable li").index(this);
              if (index != -1) {
                $("#placeInput").val(recCopy.features[index].properties.label);
                if (_map) {
                  var geojson_format = new ol.format.GeoJSON();
                  searchLayer.getSource().clear();
                  var nGeom = recCopy.features[index].geometry.coordinates.length;
                  // geometry is not empty
                  if (nGeom != 0) {
                    searchLayer.getSource().addFeatures(geojson_format.readFeatures(recCopy.features[index]));
                  } else { //geometry is empty;
                    if (recCopy.features[index].bbox.length > 1) {
                      var point = new ol.geom.Point(recCopy.features[index].bbox[0], recCopy.features[index].bbox[1]);
                      var pointFeature = new ol.Feature(point);
                      searchLayer.addFeatures(pointFeature);
                    }
                  }
                  if (recCopy.features[index].geometry.type == 'Point') {
                    _map.getView().fit(recCopy.features[index].bbox);
                    _map.getView().setZoom(12);
                  } else {
                    _map.getView().fit(recCopy.features[index].bbox);
                  }
                }
                result.append(" #" + (index + 1));
                $("#selectable").hide();
              }
            });
          }
        });
      });

      var css = `
      .sitn-search-result {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        float: left;
        min-width: 10rem;
        padding: .5rem 0;
        margin: .125rem 0 0;
        text-align: left;
        list-style: none;
        background-color: #fff;
        background-clip: padding-box;
      }`;
      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');

      head.appendChild(style);

      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
    }
    return sitnLayers
  }

  window.SitnMap = sitnLayers
})(window)
