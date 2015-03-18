!function(global) {
  global.goog = (global.goog || {});
  global.goog.TransformAnimationNode = TransformAnimationNode;

  function TransformAnimationNode(element) {
    this._element = element;
    this._transformFrom = void 0;
    this._transformTo = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };
    this._easing = void 0;
    this._duration = void 0;
    this._translationLocked = false;
    this._scaleLocked = false;
    this._parent = void 0;
    this._children = void 0;
    this._borderRegions = void 0;
    this._shadowElement = void 0;
    this._update = this._update.bind(this);
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

    addChild: function(child) {
      if (!this._children) {
        this._children = [];
      }
      child._parent = this;
      this._children.push(child);
      return this;
    },

    transformOrigin: function(x, y) {
      var to = x + ' ' + y;
      this._element.style.transformOrigin = to;
      this._transformOrigin = to;
      return this;
    },

    translate: function(x, y) {
      this._transformTo.translateX = x;
      this._transformTo.translateY = y;
      return this;
    },

    scale: function(x, y) {
      this._transformTo.scaleX = x;
      this._transformTo.scaleY = y || x;
      return this;
    },

    transition: function(duration, easing) {
      this._duration = duration;
      this._easing = easing;
      return this;
    },

    withBorderRegions: function(regions, shadowElement) {
      this._borderRegions = regions;
      this._shadowElement = shadowElement;
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

    _prepareToRun: function() {
      this._transformFrom = this._transformToComponents(
          window.getComputedStyle(this._element).transform);

      if ((this._scaleLocked || this._translationLocked) && this._parent) {
        this._element.style.transformOrigin = this._parent._transformOrigin;
      }

      if (this._children) {
        this._children.forEach(function(c) {
          c._prepareToRun();
        });
      }
    },

    _transformToComponents: function(transform) {
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
      var tx = parseFloat(matches[9]);
      var ty = parseFloat(matches[11]);

      return global.goog.math.unmatrix(row0x, row0y, row1x, row1y, tx, ty);
    },

    get _inNormalizedCoordinateSpace() {
      return this._scaleLocked &&
             this._transformTo.scaleX == 1 &&
             this._transformTo.scaleY == 1;
    },

    _componentsToTransform: function(comps) {
      var translate = 'translate(' + comps.translateX + 'px, ' + comps.translateY + 'px)';
      var scale = 'scale(' + comps.scaleX + ', ' + comps.scaleY + ')';
      var rotation = 'rotate(' + comps.rotation + ')';
      var parentTransform = this._parent ? this._parent._transformCurrent : null;
      var functions = [
        translate, scale, rotation
      ];

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

      functions.push('translateZ(0)'); // for Safari

      return functions.join(' ');
    },

    _update: function(time, element, anim) {
      if (time == null) time = 1;

      // if (time > 0.5) debugger;

      this._transformCurrent = {
        translateX: interp(this._transformFrom.translateX, this._transformTo.translateX),
        translateY: interp(this._transformFrom.translateY, this._transformTo.translateY),
        scaleX: interp(this._transformFrom.scaleX, this._transformTo.scaleX),
        scaleY: interp(this._transformFrom.scaleY, this._transformTo.scaleY),
        rotation: interp(this._transformFrom.rotation, this._transformTo.rotation)
      };

      this._element.style.transform =
        this._componentsToTransform(this._transformCurrent);

      if (this._children) {
        this._children.forEach(function(c) {
          c._update(time, c._element, anim);
        });
      }

      function interp(from, to) {
        return time * (to - from) + from;
      }
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

      // Compute rotation
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

    newIdentityMatrix4: function() {
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
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


}(window);
