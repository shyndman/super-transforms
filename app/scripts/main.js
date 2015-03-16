!function(global) {
  var frame = document.querySelector('#frame');
  frame.addEventListener('click', function() {
    frame.style.boxShadow = 'none';
    var anim = new Animation(frame, test, {
      easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
      duration: 500
    });
    document.timeline.play(anim);
  });

  var frameFrom = 0.5, frameTo = 16,
      imgFrom = 0, imgTo = 0,
      img = document.querySelector('img');

  function test(t, ele, anim) {
    if (t == null) t = 1;

    var frameScale = t * (frameTo - frameFrom) + frameFrom;
    var imgY = t * (imgTo - imgFrom) + imgFrom;

    ele.style.transform = ele.style.webkitTransform = 'scale(' + frameScale + ') translateZ(0)';
    img.style.transform = img.style.webkitTransform =
      'scale(' + (1 / frameScale) + ') translateY(' + imgY + 'px) translateX(' + imgY + 'px) translateZ(0)';
  }
}(window);
