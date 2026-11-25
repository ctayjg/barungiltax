/* 모든 페이지 공통: 회사 정보 · 로고 · 상단 메뉴(카테고리) · 푸터 · 모바일 전화 버튼
 *
 * ▶ 전화번호·주소 등 회사 정보는 아래 SITE 한 곳만 고치면 모든 페이지에 반영됩니다.
 * ▶ 메뉴 항목은 아래 MENU 를 고치면 됩니다. */
(function () {
  'use strict';

  /* ---------- 회사 정보 (명함 기준) ---------- */
  var SITE = {
    name: '바른길세무회계',
    nameEn: 'BARUNGIL TAX ACCOUNTING',
    ceo: '양정길',
    phone: '010-8762-2146',
    fax: '02-6008-2146',
    email: 'ctayjg@naver.com',
    blog: 'blog.naver.com/ctayjg',
    address: '서울특별시 서초구 서초대로78길 42, 5층 506호',
    addressNote: '(서초동, 현대기림오피스텔)',
    subway: '강남역 5번 출구에서 도보 약 3분',
    subwayNote: '2호선 · 신분당선',
    // 상담 문의: 카카오톡 채널 채팅 (모든 "상담 문의" 버튼이 여기로 연결됩니다)
    kakao: 'https://pf.kakao.com/_xfhuEn/chat',
    // 네이버 플레이스: 오시는 길의 "네이버 지도" 버튼에만 사용
    naverPlace: 'https://map.naver.com/p/entry/place/1731242998?placePath=%2Fhome'
  };
  SITE.addressFull = SITE.address + ' ' + SITE.addressNote;
  var LINKS = {
    phone: 'tel:' + SITE.phone,
    email: 'mailto:' + SITE.email,
    blog: 'https://' + SITE.blog,
    kakao: SITE.kakao,
    // 오시는 길의 지도 버튼 (화면에는 약도를 보여 주고, 버튼을 누르면 각 지도 서비스가 새 창으로 열림)
    naverMap: SITE.naverPlace,
    kakaoMap: 'https://map.kakao.com/?q=' + encodeURIComponent(SITE.address),
    googleMap: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(SITE.address)
  };
  window.SITE = SITE;

  /* ---------- 로고 (명함의 심볼을 그대로 옮긴 것) ---------- */
  var MARK = '<svg class="logo__mark" viewBox="0 0 658 658" fill="none" stroke="currentColor" stroke-width="42" aria-hidden="true">' +
    '<rect x="21" y="21" width="616" height="616"/><path d="M21 472H204V124H538V637"/><path d="M21 265H442V472H296V637"/></svg>';
  function logoHtml() {
    return MARK + '<span class="logo__type"><span class="logo__ko">' + SITE.name + '</span><span class="logo__en">' + SITE.nameEn + '</span></span>';
  }

  /* ---------- 상단 메뉴 ---------- */
  var page = document.body.getAttribute('data-page');
  var isHome = page === 'home';
  var H = isHome ? '' : 'index.html'; // 메인이 아닌 페이지에서는 index.html#섹션 으로 이동

  var MENU = [
    { label: '소개', href: H + '#about', key: 'about' },
    {
      label: '전문 분야', href: H + '#services', key: 'services',
      sub: [
        { label: '양도소득세', href: H + '#svc-transfer' },
        { label: '상속세', href: H + '#svc-inherit' },
        { label: '증여세', href: H + '#svc-gift' },
        { label: '비거주자', href: H + '#svc-nonresident' },
        { label: '경정청구 · 조세불복', href: H + '#svc-appeal' }
      ]
    },
    {
      label: '세무 자료실', href: 'board.html', key: 'board',
      sub: [{ label: '전체 보기', href: 'board.html' }, { label: '처리 사례', href: 'board.html?cat=case' }].concat(
        (window.CATEGORIES || []).map(function (c) {
          return { label: c.name, href: 'board.html?cat=' + c.id };
        })
      )
    },
    { label: '상담', href: H + '#contact', key: 'contact' },
    { label: '오시는 길', href: H + '#location', key: 'location' }
  ];

  // 메뉴는 화면 크기와 상관없이 항상 맨 위에 보입니다 (좁은 화면에서는 로고 아래 한 줄로).
  function renderHeader() {
    var items = MENU.map(function (m, i) {
      var sub = '';
      if (m.sub) {
        sub = '<ul class="nav__sub" id="sub-' + i + '">' + m.sub.map(function (s) {
          return '<li><a href="' + s.href + '">' + s.label + '</a></li>';
        }).join('') + '</ul>';
      }
      return '<li class="nav__item' + (m.sub ? ' has-sub' : '') + '" data-key="' + m.key + '">' +
        '<a class="nav__link" href="' + m.href + '"' + (m.sub ? ' aria-haspopup="true" aria-expanded="false" aria-controls="sub-' + i + '"' : '') + '>' + m.label + '</a>' + sub + '</li>';
    }).join('');

    return '<div class="container header__inner">' +
      '<a href="' + (isHome ? '#top' : 'index.html') + '" class="logo" aria-label="' + SITE.name + ' 홈">' + logoHtml() + '</a>' +
      '<nav class="nav" id="nav" aria-label="주요 메뉴"><ul class="nav__list">' + items + '</ul></nav>' +
      '<a href="' + H + '#contact" class="nav__cta">상담 문의</a>' +  // 상담 문의 구역으로 이동 (다른 페이지에서는 메인의 상담 문의로)
    '</div>';
  }

  function renderFooter() {
    return '<div class="container footer__inner">' +
      '<div class="footer__brand"><div class="logo logo--light">' + logoHtml() + '</div>' +
        '<p>재산이 움직일 때, 절세의 바른길로 안내합니다.</p></div>' +
      '<div class="footer__info">' +
        '<p>' + SITE.addressFull + '</p>' +
        '<p><b>T</b> ' + SITE.phone + '<span class="sep"></span><b>F</b> ' + SITE.fax + '<span class="sep"></span><b>E</b> ' + SITE.email + '</p>' +
        '<p>대표 세무사 ' + SITE.ceo + '</p>' +
        '<p class="footer__links"><a href="board.html">세무 자료실</a><a href="' + LINKS.kakao + '" target="_blank" rel="noopener">카카오톡 상담 문의</a><a href="' + LINKS.blog + '" target="_blank" rel="noopener">네이버 블로그</a></p>' +
      '</div>' +
      '<p class="footer__copy">© 2026 ' + SITE.name + '. All rights reserved.</p>' +
    '</div>';
  }

  var header = document.getElementById('header');
  var footer = document.getElementById('footer');
  if (header) header.innerHTML = renderHeader();
  if (footer) footer.innerHTML = renderFooter();

  /* ---------- 본문 안의 회사 정보·로고 자리 채우기 ----------
   *  <span data-site="phone"></span>          → 글자
   *  <a data-site-link="phone"></a>           → 링크 주소
   *  <div data-brand="logo|mark"></div>       → 로고 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-site]'), function (el) {
    var v = SITE[el.getAttribute('data-site')];
    if (v != null) el.textContent = v;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-site-link]'), function (el) {
    var v = LINKS[el.getAttribute('data-site-link')];
    if (v) el.setAttribute(el.tagName === 'IFRAME' ? 'src' : 'href', v);
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-brand]'), function (el) {
    el.innerHTML = el.getAttribute('data-brand') === 'mark' ? MARK : logoHtml();
  });

  // 다른 페이지에서 넘어왔을 때 화면이 항상 맨 위에서 시작하도록 (#섹션 주소로 온 경우는 그 위치로)
  // 홈페이지를 다른 화면 안에 넣어 보여 줄 때(예: 공유 링크) 바깥 화면의 스크롤 위치가 남는 문제를 막음
  // 공유 링크 화면은 페이지가 열린 뒤에 이전 페이지의 스크롤 위치를 되살리므로, 열린 뒤 2.5초 동안 맨 위를 지킴.
  // 그사이 방문자가 직접 스크롤하거나 누르면 바로 멈춤.
  if (header && !location.hash) {
    var held = true;
    var stop = function () { held = false; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, stop, { passive: true, once: true });
    });
    var until = Date.now() + 2500;
    var keepTop = function () {
      if (!held) return;
      if (window.scrollY > 0) window.scrollTo(0, 0);
      if (Date.now() < until) requestAnimationFrame(keepTop);
    };
    window.scrollTo(0, 0);
    requestAnimationFrame(keepTop);
    window.addEventListener('load', function () { until = Math.max(until, Date.now() + 1500); requestAnimationFrame(keepTop); });
  }

  if (!header) return; // 관리자 화면 등 메뉴가 없는 페이지

  // 휴대폰 화면 오른쪽 아래에 떠 있는 "상담 문의" 버튼 (카카오톡 채널로 연결)
  var fab = document.createElement('a');
  fab.href = LINKS.kakao;
  fab.target = '_blank';
  fab.rel = 'noopener';
  fab.className = 'call-fab';
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" stroke="none" d="M12 3.5c-5.2 0-9.5 3.3-9.5 7.4 0 2.6 1.8 4.9 4.4 6.2l-.9 3.3c-.1.4.3.6.6.4l3.9-2.6c.5.1 1 .1 1.5.1 5.2 0 9.5-3.3 9.5-7.4S17.2 3.5 12 3.5Z"/></svg>상담 문의';
  document.body.appendChild(fab);

  // 현재 페이지 메뉴 강조 (자료실 페이지)
  if (page === 'board' || page === 'post') {
    var cur = header.querySelector('[data-key="board"]');
    if (cur) cur.classList.add('is-current');
  }

  // 스크롤 시 헤더 밑줄
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 하위 메뉴: PC에서는 마우스를 올리면 열리고,
  // 좁은 화면·터치 화면에서는 카테고리를 누르면 바로 아래에 펼쳐집니다.
  var nav = document.getElementById('nav');
  var tapMode = window.matchMedia('(hover: none), (max-width: 860px)');

  function closeSubs(except) {
    Array.prototype.forEach.call(nav.querySelectorAll('.nav__item.is-open'), function (li) {
      if (li === except) return;
      li.classList.remove('is-open');
      li.querySelector('.nav__link').setAttribute('aria-expanded', 'false');
    });
  }

  nav.addEventListener('click', function (e) {
    var link = e.target.closest('.nav__link');
    var item = link && link.parentNode;
    if (link && item.classList.contains('has-sub') && tapMode.matches) {
      e.preventDefault();
      var open = !item.classList.contains('is-open');
      closeSubs(item);
      item.classList.toggle('is-open', open);
      link.setAttribute('aria-expanded', String(open));
      if (!open) link.blur();
      return;
    }
    if (e.target.closest('a')) {
      closeSubs();
      if (document.activeElement && nav.contains(document.activeElement)) document.activeElement.blur();
    }
  });
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) closeSubs();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeSubs();
      if (document.activeElement && nav.contains(document.activeElement)) document.activeElement.blur();
    }
  });
  window.addEventListener('scroll', function () { closeSubs(); }, { passive: true });
})();
