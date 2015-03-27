!function() {
  var viewStateEle = document.querySelector('#view'),
      listStateEle = document.querySelector('#list'),
      artistHeaderEle = viewStateEle.querySelector('h2'),
      albumHeaderEle = viewStateEle.querySelector('h3'),
      albumInfoEle = viewStateEle.querySelector('.album-info'),
      albumArtEle = viewStateEle.querySelector('.album-art'),
      albumTracklistEle = viewStateEle.querySelector('.album-tracklist'),
      fabEle = viewStateEle.querySelector('.fab'),
      albumsEle = listStateEle.querySelector('.albums'),
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
          secondary: '#ea5085',
          extraClasses: 'dark'
        },
        {
          artPath: 'images/kendrick.png',
          album: 'To Pimp A Butterfly',
          artist: 'Kendrick Lamar',
          primary: '#e9e9e9',
          secondary: '#575757',
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
      ],
      player, transformNode;

  // Fill albumbs
  albumsEle.innerHTML = _.map(albums, function(album) {
    return albumTemplate(album);
  }).join('');

  // Full-screen support
  document.querySelector('.fullscreen').onclick = fullscreenClicked;

  // Animation triggers
  _.forEach(document.querySelectorAll('.album-item'), function(item, i) {
    item.onclick = transitionToViewState.bind(item, albums[i]);
  });

  // Reversing animation trigger
  viewStateEle.querySelector('.back-button').onclick = transitionToListState;

  function transitionToViewState(album, e) {
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

    transformNode = new goog.HeroTransition('album', viewStateEle, listStateEle)
      .build()
      .transition(250, 'cubic-bezier(0.4, 0.0, 0.2, 1)');

    // Scale the fab
    transformNode.getChild('fab').scaleFrom(0, 0);

    var heroAnim = transformNode.build();
    var group = new AnimationGroup([
      heroAnim,
      buildHeaderFadeIn(artistHeaderEle),
      buildHeaderFadeIn(albumHeaderEle),
      buildBackgroundDarken(album),
      buildTrackListFade()
    ])

    viewStateEle.style.visibility = '';
    player = document.timeline.play(group);
  }

  function transitionToListState() {
    if (!player) {
      return;
    }

    player.reverse();
    player.onfinish = function() {
      viewStateEle.style.visibility = 'hidden';
      transformNode.reset();
      albumTracklistEle.style.position = '';
      albumTracklistEle.style.top = '';
      albumTracklistEle.style.width = '';
      albumTracklistEle.style.transformOrigin = '';
    };
    player = null;
  }

  function buildHeaderFadeIn(ele) {
    return new Animation(ele, [
      { opacity: 0 }, { opacity: 1 }
    ], {
      duration: 500,
      delay: 0,
      fill: 'both',
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    });
  }

  function buildBackgroundDarken(album) {
    return new Animation(albumInfoEle, [
      { background: album.primary }, { background: album.secondary }
    ], {
      duration: 200,
      delay: 100,
      fill: 'both',
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    });
  }

  function buildTrackListFade() {
    return new Animation(albumTracklistEle.querySelector('ol'), [
      { opacity: 0 }, { opacity: 1 }
    ], {
      duration: 200,
      delay: 200,
      fill: 'both',
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    });
  }

  function configureViewState(album) {
    albumArtEle.src = album.artPath;
    fabEle.style.background = album.primary;
    albumInfoEle.style.background = album.primary;
    artistHeaderEle.innerHTML = album.artist;
    albumHeaderEle.innerHTML = album.album;
  }

  function fullscreenClicked() {
    document.querySelector('#app').webkitRequestFullScreen();
  }
}();
