!function(global) {
  global.goog = (global.goog || {});
  global.goog.TransformAnimationNode = TransformAnimationNode;

  function TransformAnimationNode(element) {
    this._element = element;
    this._transformFrom = {
      translateX: void 0,
      translateY: void 0,
      scaleX: void 0,
      scaleY: void 0,
      rotation: void 0
    };
    this._transformTo = {
      translateX: void 0,
      translateY: void 0,
      scaleX: void 0,
      scaleY: void 0,
      rotation: void 0
    };
    this._easing = void 0;
    this._duration = void 0;
    this._translationLocked = false;
    this._scaleLocked = false;
    this._parent = void 0;
    this._children = void 0;
    this._labelledChildren = void 0;
    this._borderRegions = void 0;
    this._borderElements = void 0;
    this._borderContainer = void 0;
    this._isReset = void 0;
    this._update = this._update.bind(this);

    // TODO(shyndman): Refactor required
    var style = window.getComputedStyle(element);
    this._elementRect = {
      left: element.offsetLeft,
      right: element.offsetLeft + parseInt(style.width, 10),
      top: element.offsetTop,
      bottom: element.offsetTop + parseInt(style.height, 10),
      get corners() {
        return {
          tl: { x: this.left, y: this.top },
          tr: { x: this.right, y: this.top },
          br: { x: this.right, y: this.bottom },
          bl: { x: this.left, y: this.bottom }
        }
      }
    };
  }

  TransformAnimationNode.prototype = {
    scaleLocked: function(flag) {
      if (flag === undefined) {
        return this._scaleLocked;
      }
      this._scaleLocked = flag;
      return this;
    },

    translationLocked: function(flag) {
      if (flag === undefined) {
        return this._translationLocked;
      }
      this._translationLocked = flag;
      return this;
    },

    addChild: function(label, child) {
      if (!this._children) {
        this._children = [];
        this._labelledChildren = {};
      }
      child._parent = this;
      this._children.push(child);
      this._labelledChildren[label] = child;
      return this;
    },

    getChild: function(label) {
      return this._labelledChildren ? this._labelledChildren[label] : null;
    },

    transformOrigin: function(x, y) {
      // TODO(shyndman): Support units other than pixels
      var to = x + 'px ' + y + 'px';
      this._transformOrigin = to;
      return this;
    },

    translateFrom: function(x, y) {
      this._transformFrom.translateX = x;
      this._transformFrom.translateY = y;
      return this;
    },

    translateTo: function(x, y) {
      this._transformTo.translateX = x;
      this._transformTo.translateY = y;
      return this;
    },

    scaleFrom: function(x, y) {
      this._transformFrom.scaleX = x;
      this._transformFrom.scaleY = y;
      return this;
    },

    scaleTo: function(x, y) {
      this._transformTo.scaleX = x;
      this._transformTo.scaleY = y || x;
      return this;
    },

    transition: function(duration, easing) {
      this._duration = duration;
      this._easing = easing;
      return this;
    },

    withBorderRegions: function(regions, borderContainer) {
      this._borderRegions = regions;
      this._borderContainer = borderContainer;
      this._borderElements = {};

      // TODO(shyndman): Clean up any previously built images

      for (var regionName in regions) {
        var img = new Image();
        img.src = regions[regionName].data;
        img.classList.add('__ta-region-' + regionName);
        img.style.display = 'none';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.transformOrigin = '0 0';
        img.style.willChange = 'transform';
        this._borderContainer.appendChild(img);
        this._borderElements[regionName] = img;
      }

      return this;
    },

    build: function() {
      // Root animation node always kicks it off
      if (this._parent) {
        return this._parent.build();
      }

      this._prepareToRun();
      var anim = new Animation(this.element_, this._update, {
        duration: this._duration,
        easing: this._easing,
        playbackRate: 0.5
      });

      return anim;
    },

    /**
     * Resets the elements that contribute to this
     */
    reset: function() {
      this._isReset = true;
      this._resetElement();

      // Prepare the children
      if (this._children) {
        this._children.forEach(function(c) {
          c.reset();
        });
      }
    },

    _prepareToRun: function() {
      var style = window.getComputedStyle(this._element);
      // Fill in missing source properties based on the element's current state
      setDefaults(this._transformFrom, this._transformToComponents(style.transform));
      // Fill in missing destination properties based on the source properties
      setDefaults(this._transformTo, this._transformFrom);

      // Set the transform origin
      if ((this._scaleLocked || this._translationLocked) && this._parent) {
        this._element.style.transformOrigin = this._parent._transformOrigin;
      } else {
        this._element.style.transformOrigin = this._transformOrigin || style.transformOrigin;
      }

      // Absolutely position all elements
      this._absolutizeElement(style);

      // Prepare the children
      if (this._children) {
        this._children.forEach(function(c) {
          c._prepareToRun();
        });
      }
    },

    _absolutizeElement: function(style) {
      // Order is important here, because style will mutate on element style
      // changes
      this._element.style.width = style.width;
      this._element.style.height = style.height;
      this._element.style.position = 'absolute';
      this._element.style.left = '0';
      this._element.style.top = '0';
    },

    _resetElement: function() {
      this._element.style.width = '';
      this._element.style.height = '';
      this._element.style.position = '';
      this._element.style.top = '';
      this._element.style.left = '';
      this._element.style.transform = '';
      this._element.style.transformOrigin = '';
    },

    _transformToMatrix: function(transform) {
      if (transform == 'none') {
        return goog.math.newIdentityMatrix3();
      }

      var float = '(-?\\d+(\\.\\d+)?)';
      var sep = ',\\s*';
      var pattern = new RegExp(
          '^matrix\\(' +
              float + sep +
              float + sep +
              float + sep +
              float + sep +
              float + sep +
              float);
      var matches = pattern.exec(transform);
      var row0x = parseFloat(matches[1]);
      var row0y = parseFloat(matches[3]);
      var row1x = parseFloat(matches[5]);
      var row1y = parseFloat(matches[7]);
      var tx = parseInt(matches[9]);
      var ty = parseInt(matches[11]);

      return [
        [row0x, row0y, tx],
        [row1x, row1y, ty],
        [0, 0, 1]
      ];
    },

    _transformToComponents: function(transform) {
      var matrix = this._transformToMatrix(transform);
      return global.goog.math.unmatrix(
        matrix[0][0], matrix[0][1],
        matrix[1][0], matrix[1][1],
        matrix[0][2], matrix[1][2]);
    },

    _componentsToTransform: function(comps) {
      var translate = 'translate(' + comps.translateX + 'px, ' + comps.translateY + 'px)';
      var scale = 'scale(' + comps.scaleX + ', ' + comps.scaleY + ')';
      var rotation = 'rotate(' + comps.rotation + ')';
      var parentTransform = this._parent ? this._parent._transformCurrent : null;
      var functions = [
        translate, scale, rotation
      ];

      // Apply transforms that counter the parent's
      if (this._translationLocked) {
        var invTranslateX = -parentTransform.translateX;
        var invTranslateY = -parentTransform.translateY;
        functions.unshift('translate(' + invTranslateX + 'px, ' + invTranslateY + 'px)');
      }

      if (this._scaleLocked) {
        var normScaleX = 1 / parentTransform.scaleX;
        var normScaleY = 1 / parentTransform.scaleY;
        functions.unshift('scale(' + normScaleX + ', ' + normScaleY + ')');
      }

      // Give Safari what it needs
      functions.push('translateZ(0)');

      return functions.join(' ');
    },

    _update: function(time, element, anim) {
      if (this._isReset) {
        return;
      }

      time = time || 1;
      this._transformCurrent = {
        translateX: lerp(this._transformFrom.translateX, this._transformTo.translateX),
        translateY: lerp(this._transformFrom.translateY, this._transformTo.translateY),
        scaleX: lerp(this._transformFrom.scaleX, this._transformTo.scaleX),
        scaleY: lerp(this._transformFrom.scaleY, this._transformTo.scaleY),
        rotation: lerp(this._transformFrom.rotation, this._transformTo.rotation)
      };

      this._element.style.transform =
        this._componentsToTransform(this._transformCurrent);
      this._positionBorders();

      if (this._children) {
        this._children.forEach(function(c) {
          c._update(time, c._element, anim);
        });
      }

      function lerp(from, to) {
        return time * (to - from) + from;
      }
    },

    _positionBorders: function() {
      if (!this._borderRegions || !this._borderContainer) {
        return;
      }

      var matrix = this._transformToMatrix(
        window.getComputedStyle(this._element).transform);
      var corners = this._elementRect.corners;
      var transformedCorners = Object.keys(corners).reduce(
        function(acc, cornerName) {
          var corner = corners[cornerName];
          var cornerMatrix = goog.math.newPointMatrix3(corner.x, corner.y);
          cornerMatrix = goog.math.matrixMultiply(matrix, cornerMatrix);
          acc[cornerName] = {
            x: cornerMatrix[0][0],
            y: cornerMatrix[1][0]
          };
          return acc;
        }, {});

      var regionPositions = this._borderRegions.getRegionPositions(transformedCorners);
      Object.keys(regionPositions).forEach(function(regionName) {
        var region = this._borderRegions[regionName];
        var element = this._borderElements[regionName];
        var transform =
          'translate(' +
            regionPositions[regionName].x + 'px, ' +
            regionPositions[regionName].y + 'px) ';

        switch (regionName) {
          case 't':
          case 'b':
            var scale = (regionPositions.tr.x - regionPositions.t.x) / region.width;
            scale *= 0.99999; // HACK(shyndman): fudge for Chrome
            transform += 'scaleX(' + scale + ')'
            break;

          case 'l':
          case 'r':
            var scale = (regionPositions.bl.y - regionPositions.l.y) / region.height;
            scale *= 0.99999; // HACK(shyndman): fudge for Chrome
            transform += 'scaleY(' + scale + ')';
            break;
        }

        element.style.transform = transform;
        element.style.display = '';
      }, this);
    }
  };


  global.goog.math = {
    radToDeg: function(rads) {
      return rads * 180 / Math.PI;
    },

    degToRad: function(degrees) {
      return degrees * Math.PI / 180;
    },

    unmatrix: function(row0x, row0y, row1x, row1y, tx, ty) {
      var m11, m12, m21, m22;
      var scaleX = Math.sqrt(row0x * row0x + row0y * row0y)
      var scaleY = Math.sqrt(row1x * row1x + row1y * row1y)

      // If determinant is negative, one axis was flipped.
      var determinant = row0x * row1y - row0y * row1x
      if (determinant < 0) {
        // Flip axis with minimum unit vector dot product.
        if (row0x < row1y) {
          scaleX = -scaleX;
        } else {
          scaleY = -scaleY;
        }
      }

      // Renormalize matrix to remove scale.
      if (scaleX) {
        row0x *= 1 / scaleX;
        row0y *= 1 / scaleX;
      }
      if (scaleY) {
        row1x *= 1 / scaleY;
        row1y *= 1 / scaleY;
      }

      // Compute rotation and renormalize matrix.
      var angle = Math.atan2(row0y, row0x);
      if (angle) {
        // Rotate(-angle) = [cos(angle), sin(angle), -sin(angle), cos(angle)]
        //                = [row0x, -row0y, row0y, row0x]
        // Thanks to the normalization above.
        var sn = -row0y
        var cs = row0x
        m11 = row0x
        m12 = row0y
        m21 = row1x
        m22 = row1y
        row0x = cs * m11 + sn * m21
        row0y = cs * m12 + sn * m22
        row1x = -sn * m11 + cs * m21
        row1y = -sn * m12 + cs * m22
      }

      // Convert into degrees because our rotation functions expect it.
      angle = this.radToDeg(angle);

      return {
        translateX: tx,
        translateY: ty,
        scaleX: scaleX,
        scaleY: scaleY,
        rotation: angle,
        m11: row0x,
        m12: row0y,
        m21: row1x,
        m22: row1y
     };
    },

    rematrix: function(comps) {
      var matrix = this.newIdentityMatrix4();

      matrix[0][0] = comps.m11;
      matrix[0][1] = comps.m12;
      matrix[1][0] = comps.m21;
      matrix[1][1] = comps.m22;

      // Translate matrix.
      matrix[3][0] = comps.translateX * comps.m11 + comps.translateY * comps.m21;
      matrix[3][1] = comps.translateX * comps.m12 + comps.translateY * comps.m22;

      // Rotate matrix.
      var angle = this.deg2rad(this.angle);
      var cosAngle = Math.cos(angle);
      var sinAngle = Math.sin(angle);

      // New temporary, identity initialized, 4x4 matrix rotateMatrix
      var rotateMatrix = this.newIdentityMatrix4();
      rotateMatrix[0][0] = cosAngle;
      rotateMatrix[0][1] = sinAngle;
      rotateMatrix[1][0] = -sinAngle;
      rotateMatrix[1][1] = cosAngle;

      matrix = this.matrixMultiply(matrix, rotateMatrix);

      // Scale matrix
      matrix[0][0] *= scale[0]
      matrix[0][1] *= scale[0]
      matrix[1][0] *= scale[1]
      matrix[1][1] *= scale[1]

      return matrix;
    },

    newIdentityMatrix3: function() {
      return [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];
    },

    newIdentityMatrix4: function() {
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ];
    },

    newPointMatrix3: function(x, y) {
      return [
        [x],
        [y],
        [1]
      ];
    },

    matrixMultiply: function(m1, m2) {
      var result = [];
      for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
          var sum = 0;
          for (var k = 0; k < m1[0].length; k++) {
            sum += m1[i][k] * m2[k][j];
          }
          result[i][j] = sum;
        }
      }
      return result;
    }
  };

  function extend(target, source) {
    for (var key in source) {
      target[key] = source[key];
    }
    return target;
  }

  function setDefaults(target, defaults) {
    for (var key in defaults) {
      if (target[key] === undefined) {
        target[key] = defaults[key];
      }
    }
    return target;
  }

}(window);
