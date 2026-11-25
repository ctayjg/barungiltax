/* 메인 페이지 전용: 메뉴 강조, 스크롤 등장 효과
 * (상단 메뉴·푸터·회사 정보는 js/layout.js) */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;
  var nav = document.getElementById('nav');

  // 현재 보고 있는 섹션의 상단 메뉴 강조
  var items = Array.prototype.slice.call(nav.querySelectorAll('.nav__item'));
  var map = { about: 'about', services: 'services', cases: 'board', insights: 'board', contact: 'contact', location: 'location' };
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var key = map[entry.target.id];
      items.forEach(function (li) { li.classList.toggle('is-current', li.getAttribute('data-key') === key); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['top', 'about', 'services', 'cases', 'insights', 'contact', 'location'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  // 스크롤 등장 효과
  var targets = document.querySelectorAll('.section__head, .creed__list li, .about__photo, .about__text, .area, .case, .post-card, .contact__info, .prep, .loc__info, .sketch');
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  targets.forEach(function (el) {
    el.classList.add('reveal');
    reveal.observe(el);
  });
})();
