!function(global) {
  var frame = document.querySelector('#frame');
  frame.addEventListener('click', function() {
    frame.style.boxShadow = 'none';
    var anim = new Animation(frame, test, {
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      duration: 600
    });
    document.timeline.play(anim);
  });

  var frameFrom = 0.5, frameTo = 10,
      img = document.querySelector('img');

  function test(t, ele, anim) {
    if (t == null) t = 1;

    var frameScale = t * (frameTo - frameFrom) + frameFrom;

    ele.style.transform = 'scale(' + frameScale + ')';
    img.style.transform = 'scale(' + (1 / frameScale) + ')';
  }
}(window);
