!function() {
  [].slice.apply(document.querySelectorAll('li')).forEach(function(li) {
    console.log(li.getBoundingClientRect());
  });
}();
