!function(global) {
  global.goog = (global.goog || {});
  global.goog.HeroTransition = HeroTransition;

  function HeroTransition(rootHeroId, srcHeroesContainer, destHeroesContainer) {
    this._rootHeroId = rootHeroId;
    this._srcHeroesContainer = srcHeroesContainer;
    this._destHeroesContainer = destHeroesContainer;
  }

  HeroTransition._getHeroes = function(parent) {
    return [].slice.apply(parent.querySelectorAll('[hero][hero-id]'))
      .concat(parent.hasAttribute('hero') ? [parent] : [])
      .reduce(function(acc, hero) {
        acc[hero.getAttribute('hero-id')] = hero;
        return acc;
      }, {});
  };

  HeroTransition._getTransforms = function(fromRect, toRect) {
    return {
      dX: fromRect.left - toRect.left,
      dY: fromRect.top - toRect.top,
      scaleX: fromRect.width / toRect.width,
      scaleY: fromRect.height / toRect.height
    };
  };

  HeroTransition._offsetRect = function(parentRect, childRect) {
    return {
      top: childRect.top - parentRect.top,
      right: parentRect.right - childRect.right,
      bottom: parentRect.bottom - childRect.bottom,
      left: childRect.left - parentRect.left,
      width: childRect.width,
      height: childRect.height
    };
  };

  HeroTransition.prototype = {
    build: function() {
      var fromHeroes = HeroTransition._getHeroes(this._destHeroesContainer),
          toHeroes = HeroTransition._getHeroes(this._srcHeroesContainer),
          fromRoot = fromHeroes[this._rootHeroId],
          toRoot = toHeroes[this._rootHeroId],
          rootFromRect = fromRoot.getBoundingClientRect(),
          rootToRect = toRoot.getBoundingClientRect(),
          rootTransforms = HeroTransition._getTransforms(rootFromRect, rootToRect);

      // Fix root properties
      toRoot.style.width = rootToRect.width + 'px';
      toRoot.style.height = rootToRect.height + 'px';

      var root = new goog.TransformAnimationNode(toRoot)
        .transformOrigin(0, 0)
        .translateFrom(rootTransforms.dX, rootTransforms.dY)
        .translateTo(0, 0)
        .scaleFrom(rootTransforms.scaleX, rootTransforms.scaleY)
        .scaleTo(1, 1);

      Object.keys(toHeroes).forEach(function(heroId) {
        if (heroId == this._rootHeroId) {
          return;
        }

        var toHero = toHeroes[heroId]
            fromHero = fromHeroes[heroId] || toHero,
            fromRect = HeroTransition._offsetRect(rootFromRect, fromHero.getBoundingClientRect()),
            toRect = HeroTransition._offsetRect(rootToRect, toHero.getBoundingClientRect()),
            transforms = HeroTransition._getTransforms(fromRect, toRect);

        var child = new goog.TransformAnimationNode(toHero)
          .scaleLocked(true)
          .translateFrom(fromRect.left, fromRect.top)
          .translateTo(toRect.left, toRect.top)
          .scaleFrom(transforms.scaleX, transforms.scaleY)
          .scaleTo(1, 1);

        if (toHero.hasAttribute('translation-lock')) {
          child
            .translateFrom(150, 50)
            .translateTo(toRect.left, 0);
        }

        root.addChild(heroId, child);
      }, this);

      // root._prepareToRun();
      // root._update(0);
      return root;
    }
  };
}(window);
