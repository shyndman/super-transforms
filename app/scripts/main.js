!function(global) {

  var borderRegions;
  var frame = document.querySelector('#frame');
  var shadowLayer = document.querySelector('#shadows');
  var img = frame.querySelector('img');

  global.goog.shadowPatches.generate().then(function(patches) {
    borderRegions = patches[4];
  });

  frame.addEventListener('click', function() {
    frame.style.boxShadow = 'none';

    var anim = new global.goog.TransformAnimationNode(frame)
        .scale(32)
        .transformOrigin('18px', '18px')
        .transition(500, 'cubic-bezier(0.4, 0.0, 1, 1)')
        .translate(32, 32)
        .withBorderRegions(borderRegions, shadowLayer)
        .addChild(
          new global.goog.TransformAnimationNode(img)
            .scaleLocked(true)
            .scale(0.75)
            .translate(-32, -32))
        .build();
    console.log(anim);
    document.timeline.play(anim);

  });
}(window);
