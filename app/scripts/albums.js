!function() {
  var viewStateEle = document.querySelector('#view'),
      listStateEle = document.querySelector('#list'),
      albumsEle = document.querySelector('.albums'),
      albumTemplate = _.template(document.getElementById('album-item').innerHTML),
      albums = [
        {
          artPath: 'images/kodaline.png',
          album: 'In a Perfect World',
          artist: 'Kodaline',
          primary: '#4db7ac',
          secondary: '#1a8479',
          extraClasses: 'dark'
        },
        {
          artPath: 'images/fitz.png',
          album: 'More Than Just A Dream',
          artist: 'Fitz &amp; The Tantrums',
          primary: '#ff4080',
          secondary: '#e62767',
          extraClasses: ''
        },
        {
          artPath: 'images/jamie.png',
          album: 'Jamie Lidell',
          artist: 'Jamie Lidell',
          primary: '#ff4080',
          secondary: '#e62767',
          extraClasses: ''
        },
        {
          artPath: 'images/yuna.png',
          album: 'Nocturnal',
          artist: 'Yuna',
          primary: '#ffe900',
          secondary: '#e6d000',
          extraClasses: 'dark'
        },
        {
          artPath: 'images/kendrick.png',
          album: 'To Pimp A Butterfly',
          artist: 'Kendrick Lamar',
          primary: '#e9e9e9',
          secondary: '',
          extraClasses: 'dark'
        },
        {
          artPath: 'images/misty.png',
          album: 'I Love You, Honeybear',
          artist: 'Father John Misty',
          primary: '#ce0721',
          secondary: '#b50008',
          extraClasses: ''
        }
      ];

  albumsEle.innerHTML = _.map(albums, function(album) {
    return albumTemplate(album);
  }).join('');

  document.querySelector('.fullscreen').onclick = fullscreenClicked;
  _.forEach(document.querySelectorAll('.album-item'), function(item, i) {
    item.onclick = albumClicked.bind(item, albums[i]);
  });

  function albumClicked(album, e) {
    configureViewState(album);

    // Clear previous heroes
    _.each(albumsEle.querySelectorAll('[hero]'), function(hero) {
      hero.removeAttribute('hero');
    });

    // Set the new ones
    this.setAttribute('hero', 'hero');
    _.each(this.querySelectorAll('[hero-id]'), function(hero) {
      hero.setAttribute('hero', 'hero');
    });

    var transition = new goog.HeroTransition('album', viewStateEle, listStateEle);
    var transform = transition.build();
    transform.transition(200, 'cubic-bezier(0.4, 0.0, 1, 1)');
    var anim = transform.build();
    document.timeline.play(anim);

    viewStateEle.style.visibility = '';

    // this.querySelector('.album-info').style.background = album.secondary;
  }

  function configureViewState(album) {
    viewStateEle.querySelector('.album-art').src = album.artPath;
    viewStateEle.querySelector('.album-info').style.background = album.primary;
    viewStateEle.querySelector('h2').innerHTML = album.artist;
    viewStateEle.querySelector('h3').innerHTML = album.album;
  }

  function fullscreenClicked() {
    document.querySelector('#app').webkitRequestFullScreen();
  }
}();
