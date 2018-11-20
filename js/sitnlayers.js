(function (window) {
  function sitnLayers() {
    var sitnLayers = {};
    const _extent = [2420000, 1030000, 2900000, 1350000];
    const _crs = 'EPSG:2056';
    const _WMTSurl= 'https://sitn.ne.ch/web_getcapabilities/WMTSGetCapabilities95.xml'
    const _baseLayers = [
      '1-plan_ville',
      '3-plan_cadastral',
      'ortho2017'
    ]

    sitnLayers.sitnCurrentBaseLayer = new ol.layer.Tile();

    // projection
    proj4.defs(_crs,
      "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333" +
      " +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel " +
      "+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");
    ol.proj.proj4.register(proj4);
    const _projection = new ol.proj.Projection({
      code: _crs,
      extent: _extent
    });

    // TODO: get out source from here when base layer selection will be implemented
    $.ajax(_WMTSurl).then(function (response) {
      let _parser = new ol.format.WMTSCapabilities();
      let _result = _parser.read(response);
      sitnLayers.WMTSOptions = ol.source.WMTS.optionsFromCapabilities(
        _result,
        {
          layer: '1-plan_ville',
          matrixSet: _crs
        });
        source = new ol.source.WMTS(sitnLayers.WMTSOptions)
        sitnLayers.sitnCurrentBaseLayer.setSource(source)
    });

    sitnLayers.view = new ol.View({
      projection: _projection,
      center: ol.proj.fromLonLat([6.80, 47.05], _projection),
      zoom: 4
    });

    sitnLayers.map = new ol.Map({
      target: 'sitn-map',
      layers: [sitnLayers.sitnCurrentBaseLayer],
      view: sitnLayers.view
    });

    return sitnLayers;
  }

  window.map = sitnLayers();

})(window);