!function(global) {
  global.goog = (global.goog || {});
  global.goog.shadowPatches = {
    generate: getPatches
  };

  // Build incubator
  var incubator = document.createElement('div')
  incubator.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="145" height="153">' +
      '<foreignObject width="100%" height="100%">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" style="width: 145px; height: 153px; display: flex; justify-content: center; align-items: center;">' +
          '<div class="box" style="width: 100px; height: 100px;"></div>' +
        '</div>' +
      '</foreignObject>' +
    '</svg>';

  // Constants
  var WIDTH = 145,
      HEIGHT = 153,
      TOP = 52,
      RIGHT = 30,
      BOTTOM = 60,
      LEFT = 30,
      REGION_DIMS = {
        tl: [0, 0, LEFT, TOP, 8, 25],
        t:  [LEFT, 0, WIDTH - LEFT - RIGHT, TOP],
        tr: [WIDTH - RIGHT, 0, RIGHT, TOP],
        r:  [WIDTH - RIGHT, TOP, RIGHT, HEIGHT - TOP - BOTTOM],
        br: [WIDTH - RIGHT, HEIGHT - BOTTOM, RIGHT, BOTTOM],
        b:  [LEFT, HEIGHT - BOTTOM, WIDTH - LEFT - RIGHT, BOTTOM],
        bl: [0, HEIGHT - BOTTOM, LEFT, BOTTOM],
        l:  [0, TOP, LEFT, HEIGHT - TOP - BOTTOM]
      },
      // TODO(shyndman): These should be determined programmatically. One
      // possibility is to use a red background on the rect, and scan inwards
      // on each of the corner regions.
      REGION_INSETS = {
        tl: [7, 25],
        t:  [0, 25],
        tr: [8, 25],
        r:  [8, 0],
        br: [8, 34],
        b:  [0, 34],
        bl: [7, 34],
        l:  [7, 0]
      },
      SHADOW_STYLES = [
        '0 1.5px 2.5px 0 rgba(0, 0, 0, 0.24),   0 0.5px 3.5px 0 rgba(0, 0, 0, 0.16)',
        '0 2.5px 3.5px 0 rgba(0, 0, 0, 0.24),   0 1.0px 5px 0 rgba(0, 0, 0, 0.16)',
        '0 3.5px 5px 0 rgba(0, 0, 0, 0.24),     0 1.5px 6.5px 0 rgba(0, 0, 0, 0.16)',
        '0 5px  7.5px 0 rgba(0, 0, 0, 0.24),    0 2px 10.0px 0 rgba(0, 0, 0, 0.16)',
        '0 7.5px 10px 1px rgba(0, 0, 0, 0.24),  0 2.5px 13.5px 2px rgba(0, 0, 0, 0.16)',
        '0 14.0px 20px 1px rgba(0, 0, 0, 0.24), 0 5.5px 26px 5px rgba(0, 0, 0, 0.16)'
      ],
      SHADOW_NAMES = [
        '2dp', '3dp', '4dp', '6dp', '8dp', '16dp'
      ],
      BOX = incubator.querySelector('.box'),
      SVG = incubator.querySelector('svg');

  function getPatches() {
    // Apply each of the classes in turn
    return Promise.all(SHADOW_STYLES.map(generate9Patch));
  };

  /**
   * Returns a promise that will resolve to the shadow 9-patch for the specified
   * shadow class.
   */
  function generate9Patch(shadowStyle) {
    BOX.style.boxShadow = shadowStyle;
    console.time(shadowStyle);
    return beginPatchExtraction().then(function(p) {
      console.timeEnd(shadowStyle);
      return p;
    });
  }

  function beginPatchExtraction() {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        img = new Image(),
        url = 'data:image/svg+xml;charset=utf8,' + SVG.outerHTML;

    img.crossOrigin
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    return new Promise(function(resolve, reject) {
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
        resolve(extractRegions(canvas, ctx));
      };
      img.src = url;
    });
  }

  function extractRegions(canvas, ctx) {
    var regions = new BorderRegions(),
        patchCanvas = document.createElement('canvas'),
        patchCtx = patchCanvas.getContext('2d');

    Object.keys(regions).forEach(function(regionName) {
      // Size the patch canvas to match the border size
      var dims = REGION_DIMS[regionName],
          insets = REGION_INSETS[regionName];
      patchCanvas.width = dims[2];
      patchCanvas.height = dims[3];

      // Extract the border, and produce a PNG data URI
      var borderImg = ctx.getImageData(dims[0], dims[1], dims[2], dims[3]);
      patchCtx.putImageData(borderImg, 0, 0);

      regions[regionName].width = dims[2];
      regions[regionName].height = dims[3];
      regions[regionName].xInset = insets[0];
      regions[regionName].xInset = insets[1];
      regions[regionName].data = patchCanvas.toDataURL('image/png');
    });

    return patches;
  }

  function newRegions() {
    return new BorderRegions();
  }

  function BorderRegions() {
    this.tl = this._newRegion();
    this.t = this._newRegion();
    this.tr = this._newRegion();
    this.r = this._newRegion();
    this.br = this._newRegion();
    this.b = this._newRegion();
    this.bl = this._newRegion();
    this.l = this._newRegion();
  }

  BorderRegions.prototype = {
    _newRegion: function() {
      return {
        width: void 0,
        height: void 0,
        data: void 0,
        xInset: void 0,
        yInset: void 0
      }
    },

    position: function(rect) {
      // switch (regionName) {
      //   case 'tl':
      //     translate = (bounds.left - 30 + 8) + 'px, ' + (bounds.top - 52 + 25) + 'px';
      //     break;

      //   case 't':
      //     translate = (bounds.left + 30 - 8 - 14) + 'px, ' + (bounds.top - 52 + 25) + 'px';
      //     scale = ((bounds.right - 8) - ((bounds.left + 30 - 8 - 14))) / region.width + ',1';
      //     break;

      //   case 'tr':
      //     translate = (bounds.right - 10) + 'px, ' + (bounds.top - 52 + 25) + 'px';
      //     break;

      //   case 'r':
      //     translate = (bounds.right - 10) + 'px, ' + (bounds.top + 52 - 25 - 2) + 'px';
      //     scale = '1,' + (((bounds.bottom - 34) - (bounds.top + 52 - 25 - 2)) / region.height);
      //     break;

      //   case 'br':
      //     translate = (bounds.right - 10) + 'px, ' + (bounds.bottom - 34) + 'px';
      //     break;

      //   case 'b':
      //     translate = (bounds.left + 30 - 8 - 14) + 'px, ' + (bounds.bottom - 34) + 'px';
      //     var scaleY = ((bounds.right - 8) - ((bounds.left + 30 - 8 - 14))) / region.width;
      //     scale = scaleY + ',1';
      //     break;

      //   case 'bl':
      //     translate = (bounds.left - 30 + 8) + 'px, ' + (bounds.bottom - 34) + 'px';
      //     break;

      //   case 'l':
      //     translate = (bounds.left - 30 + 8) + 'px, ' + (bounds.top + 52 - 25 - 2) + 'px';
      //     scale = '1,' + (((bounds.bottom - 34) - (bounds.top + 52 - 25 - 2)) / region.height);
      //     break;

      //   default:
      //     translate = '0,0';
      //     break;
      // }
    }
  };
}(window);
