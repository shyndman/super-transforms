!function(global) {
  var borderRegions,
      container = document.querySelector('#container'),
      frame = document.querySelector('#frame'),
      frameBounds = frame.getBoundingClientRect(),
      background = document.querySelector('.background'),
      shadowLayer = document.querySelector('#shadows'),
      canvas = document.querySelector('canvas'),
      ctx = canvas.getContext('2d'),
      backgroundCheck = document.querySelector('#has-background');

  global.goog.shadowPatches.generate().then(function(patches) {
    canvas.style.opacity = 1;
    borderRegions = patches[3];
  });

  var p1, isMouseDown = false;

  container.onmousedown = function(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('fade-out');
    isMouseDown = true;
    p1 = getEventPoint(e);
  };

  container.onmousemove = function(e) {
    if (!isMouseDown) {
      return;
    }

    var cur = getEventPoint(e);
    var rect = extractRect(p1, cur);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    ctx.restore();
  };

  container.onmouseup = function(e) {
    canvas.classList.add('fade-out');
    isMouseDown = false;
    run(extractRect(p1, getEventPoint(e)));
  };

  function getEventPoint(e) {
    var bounds = e.target.offsetParent.getBoundingClientRect();
    return { x: e.pageX - bounds.left, y: e.pageY - bounds.top };
  }

  backgroundCheck.onchange = function() {
    background.style.display = backgroundCheck.checked ? '' : 'none';
  };
  backgroundCheck.onchange();

  var anim, player;

  function run(rect) {
    shadowLayer.innerHTML = '';
    background.style.transform = '';
    frame.style.boxShadow = 'none';

    var scaleX = rect.width / frameBounds.width,
        scaleY = rect.height / frameBounds.height

    var node =
      new global.goog.TransformAnimationNode(frame)
        .translate(rect.left, rect.top)
        .scale(scaleX, scaleY)
        .transition(500, 'cubic-bezier(0.4, 0.0, 1, 1)')
        .withBorderRegions(borderRegions, shadowLayer)

    if (backgroundCheck.checked) {
      node.addChild(
        new global.goog.TransformAnimationNode(background)
          .scaleLocked(true)
          .translationLocked(true))
    }

    anim = node.build();
    player = document.timeline.play(anim);
  }

  function extractRect(p1, p2) {
    return {
      left: Math.min(p1.x, p2.x),
      top: Math.min(p1.y, p2.y),
      width: Math.max(Math.abs(p1.x - p2.x), 75),
      height: Math.max(Math.abs(p1.y - p2.y), 75)
    };
  }
}(window);
