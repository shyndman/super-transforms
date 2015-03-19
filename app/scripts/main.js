!function(global) {
  var borderRegions,
      frame = document.querySelector('#frame'),
      frameBounds = frame.getBoundingClientRect(),
      shadowLayer = document.querySelector('#shadows'),
      canvas = document.querySelector('canvas'),
      ctx = canvas.getContext('2d');

  global.goog.shadowPatches.generate().then(function(patches) {
    canvas.style.opacity = 1;
    borderRegions = patches[4];
  });

  var p1, isMouseDown = false;

  document.body.onmousedown = function(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('fade-out');
    isMouseDown = true;
    p1 = { x: e.offsetX, y: e.offsetY };
  };

  document.body.onmousemove = function(e) {
    if (!isMouseDown) {
      return;
    }

    var cur = { x: e.offsetX, y: e.offsetY };
    var rect = extractRect(p1, cur);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    ctx.restore();
  };

  document.body.onmouseup = function(e) {
    canvas.classList.add('fade-out');
    isMouseDown = false;
    run(extractRect(p1, { x: e.offsetX, y: e.offsetY }));
  };

  var anim, player;

  function run(rect) {
    shadowLayer.innerHTML = '';
    frame.style.boxShadow = 'none';

    var scaleX = rect.width / frameBounds.width,
        scaleY = rect.height / frameBounds.height

    anim = new global.goog.TransformAnimationNode(frame)
        .translate(rect.left, rect.top)
        .scale(scaleX, scaleY)
        .transition(500, 'cubic-bezier(0.4, 0.0, 1, 1)')
        .withBorderRegions(borderRegions, shadowLayer)
        .build();
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
