/* 세무 자료실: 메인의 사례·글 미리보기 / 목록(board.html) / 상세(post.html) 화면 그리기
 *
 * 글은 두 곳에서 옵니다.
 *   1) 네이버 블로그 글 목록 — js/blog.js (「블로그 글 새로 가져오기.bat」으로 갱신). 누르면 블로그가 새 창으로 열림
 *   2) 홈페이지에 직접 쓴 글 — js/posts.js (관리자 화면 admin.html 에서 작성). 누르면 post.html 로 열림
 * 분류(양도소득세·상속세·증여세·비거주자·경정청구·조세불복·기타)는 js/posts.js 의 categories 를 함께 씁니다. */
(function () {
  'use strict';

  var CATS = window.CATEGORIES || [];
  var BLOG = window.BLOG || { id: '', posts: [] };

  function catName(id) {
    if (id === 'case') return '처리 사례';
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].name;
    return '';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function decode(s) {
    return String(s == null ? '' : s)
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }

  // 유튜브 주소/ID → 영상 ID
  function ytId(v) {
    if (!v) return '';
    v = String(v).trim();
    var m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(v) ? v : '';
  }

  // 이미지 주소: 올린 파일(uploads/…) 또는 https 주소만 허용
  function safeSrc(src) {
    src = String(src || '').trim();
    if (/^uploads\/[\w.\-]+$/.test(src)) return src;
    if (/^https:\/\/[^\s"'<>]+$/i.test(src)) return src;
    return '';
  }

  function fmtDate(d) {
    var m = String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일' : String(d || '');
  }

  // 본문 규칙 → HTML
  //   빈 줄 = 문단 나누기 / ## 소제목 / - 목록 / **굵게** / ![설명](이미지주소)
  function renderBody(text) {
    var lines = String(text || '').replace(/\r/g, '').split('\n');
    var html = [], para = [], list = [];
    function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
    function flushPara() { if (para.length) { html.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } }
    function flushList() { if (list.length) { html.push('<ul>' + list.map(function (l) { return '<li>' + inline(l) + '</li>'; }).join('') + '</ul>'); list = []; } }
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flushPara(); flushList(); return; }
      var img = line.match(/^!\[(.*?)\]\((.+?)\)$/);
      if (img) {
        flushPara(); flushList();
        var src = safeSrc(img[2]);
        if (src) html.push('<figure><img src="' + esc(src) + '" alt="' + esc(img[1]) + '" loading="lazy">' + (img[1] ? '<figcaption>' + esc(img[1]) + '</figcaption>' : '') + '</figure>');
        return;
      }
      if (line.indexOf('## ') === 0) { flushPara(); flushList(); html.push('<h2>' + inline(line.slice(3)) + '</h2>'); return; }
      if (line.indexOf('- ') === 0) { flushPara(); list.push(line.slice(2)); return; }
      flushList(); para.push(line);
    });
    flushPara(); flushList();
    return html.join('\n');
  }

  /* ---------- 분야별 해시태그 (세무사가 직접 정한 키워드) ----------
   * 자료실에서 분야를 고르면 제목 아래에 나오고, 누르면 그 말로 검색합니다. */
  var TAGS = {
    transfer: ['비과세', '주택임대사업자', '재개발·재건축', '세액감면', '세액공제', '다주택자', '중과배제', '가족간거래', '교환', '세대분리'],
    inherit: ['상속세 계산', '상속세컨설팅', '상속재산분할', '상속공제', '사전증여재산', '연부연납', '세무조사'],
    gift: ['증여세 계산', '증여세컨설팅', '증여재산공제', '부담부증여', '저가양수도', '가족간금전대여', '자금출처조사', '가업승계', '10년합산'],
    nonresident: ['거주자판정', '재외국민', '영주권자', '시민권자', '해외이주', '양도신고확인서', '매각자금확인서', '해외송금', 'Tie-Breaker Rule', '해외출국', '비과세'],
    appeal: ['경정청구', '세금환급', '과세예고통지', '과세전적부심사', '이의신청', '심사청구', '심판청구', '조세심판원']
  };

  /* ---------- 블로그 글을 전문 분야로 나누는 규칙 ----------
   * 블로그의 분류 이름(cat)을 먼저 보고, 애매한 분류는 제목의 낱말로 정합니다. */
  var BY_BLOG_CAT = {
    transfer: ['양도소득세', '비과세', '거주주택', '농지', '재개발, 재건축', '상생임대주택', '주택임대사업자', '조합원입주권',
      '다주택자 중과', '겸용주택, 상가주택', '저가양도', '이월과세', '1세대', '부동산매매업', '농어촌주택', '대체주택',
      '토지수용', '고가양도', '상속주택', '가족간 거래'],
    inherit: ['상속공제'],
    gift: ['증여공제', '부담부증여', '자금조달'],
    nonresident: ['비거주자', '해외부동산']
  };
  var CAT_TO_SPEC = {};
  Object.keys(BY_BLOG_CAT).forEach(function (spec) {
    BY_BLOG_CAT[spec].forEach(function (name) { CAT_TO_SPEC[name] = spec; });
  });

  function specOf(blogCat, title) {
    if (/경정청구|조세불복|불복|심판청구|조세심판|조심\d|이의신청|과세전적부/.test(title)) return 'appeal';
    if (CAT_TO_SPEC[blogCat]) return CAT_TO_SPEC[blogCat];
    if (/비거주자|영주권|시민권|재외국민|해외/.test(title)) return 'nonresident';
    var i = title.indexOf('상속'), g = title.indexOf('증여');
    if (i > -1 && (g < 0 || i < g)) return 'inherit';
    if (g > -1) return 'gift';
    if (/양도|비과세/.test(title)) return 'transfer';
    return 'etc';
  }

  // "처리 사례"로 보는 글: 제목에 성공 사례·절세 사례·받은 사례 등이 들어간 글
  function isCase(title) {
    if (/추징된 사례|과세 사례|사례로 살펴|유사매매사례|사례 분석/.test(title)) return false;
    return /성공\s*사례|성공한\s*사례|절세\s*사례|받은\s*사례|인정받은\s*사례|면제\s*사례|종결된/.test(title);
  }

  // 블로그 요약 다듬기: 맨 앞에 되풀이되는 제목과 인사말을 빼고 짧게
  function cleanBrief(brief, title) {
    var s = decode(brief).trim();
    if (s.indexOf(title) === 0) s = s.slice(title.length).trim();
    s = s.replace(/^안녕하세요[.!,]?\s*[^.]{0,40}세무사[^.]{0,20}입니다[.!]?\s*/, '');
    return s.length > 96 ? s.slice(0, 96).replace(/\s+\S*$/, '') + '…' : s;
  }

  /* ---------- 글 목록 합치기 ---------- */
  var LOCAL = (window.POSTS || []).map(function (p) {
    return {
      key: 'p' + p.id, id: p.id, local: true, category: p.category, tag: catName(p.category), title: p.title, date: p.date,
      summary: p.summary || '', body: p.body || '', youtube: p.youtube, image: p.image,
      href: 'post.html?id=' + encodeURIComponent(p.id), isCase: isCase(p.title || '')
    };
  });
  var REMOTE = (BLOG.posts || []).map(function (b) {
    var title = decode(b.title);
    return {
      key: 'b' + b.no, local: false, category: specOf(b.cat, title), tag: b.cat || '블로그', title: title, date: b.date,
      summary: cleanBrief(b.brief, title), body: '', href: 'https://blog.naver.com/' + BLOG.id + '/' + b.no, isCase: isCase(title)
    };
  });
  var POSTS = LOCAL.concat(REMOTE).sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  // 썸네일: 홈페이지에 직접 쓴 글에만 (대표 이미지 > 유튜브 썸네일)
  function thumb(p) {
    if (!p.local) return '';
    var img = safeSrc(p.image);
    var id = ytId(p.youtube);
    if (!img && id) img = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
    if (!img) return '';
    return '<div class="thumb"><img src="' + esc(img) + '" alt="" loading="lazy">' + (id ? '<span class="thumb__play">' + PLAY + '</span>' : '') + '</div>';
  }

  function tag(p) {
    return '<span class="tag">' + (p.local && ytId(p.youtube) ? PLAY : '') + esc(p.tag) + '</span>';
  }

  function card(p) {
    return '<li><a class="post-card' + (p.isCase ? ' post-card--case' : '') + '" href="' + esc(p.href) + '"' + (p.local ? '' : ' target="_blank" rel="noopener"') + '>' +
      thumb(p) +
      '<div class="post-card__body">' +
        '<div class="post-card__meta"><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time>' + tag(p) + '</div>' +
        '<h3 class="post-card__title">' + esc(p.title) + '</h3>' +
        (p.summary ? '<p class="post-card__summary">' + esc(p.summary) + '</p>' : '') +
        '<span class="post-card__more">' + (p.local ? '자세히 읽기 →' : '블로그에서 읽기 ↗') + '</span>' +
      '</div></a></li>';
  }

  // 사례용 한 줄 카드 (메인 페이지)
  function caseRow(p) {
    return '<li><a class="case" href="' + esc(p.href) + '"' + (p.local ? '' : ' target="_blank" rel="noopener"') + '>' +
      '<span class="case__tag">' + esc(catName(p.category) || p.tag) + '</span>' +
      '<strong class="case__title">' + esc(p.title) + '</strong>' +
      '<time class="case__date" datetime="' + esc(p.date) + '">' + esc(String(p.date).slice(0, 7).replace('-', '.')) + '</time>' +
      '<i aria-hidden="true">↗</i></a></li>';
  }

  // 상세 화면의 영상/대표 이미지 영역 (홈페이지에 직접 쓴 글)
  function media(p) {
    var vid = ytId(p.youtube);
    if (vid) {
      return '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + vid + '" title="' + esc(p.title) + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
    }
    var img = safeSrc(p.image);
    return img ? '<figure class="post__cover"><img src="' + esc(img) + '" alt=""></figure>' : '';
  }

  function count(cat) {
    return POSTS.filter(function (p) { return cat === 'all' ? true : cat === 'case' ? p.isCase : p.category === cat; }).length;
  }

  // 관리자 화면에서도 같은 함수를 씁니다
  window.Board = { esc: esc, ytId: ytId, safeSrc: safeSrc, fmtDate: fmtDate, catName: catName, renderBody: renderBody, media: media };

  function params() {
    var out = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
      out[k] = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
    });
    return out;
  }

  /* ---------- 메인 페이지 ---------- */
  // 처리 사례 (최신 6건)
  var caseList = document.getElementById('caseList');
  if (caseList) {
    var cases = POSTS.filter(function (p) { return p.isCase; });
    caseList.innerHTML = cases.length ? cases.slice(0, 6).map(caseRow).join('') : '<li class="empty">등록된 사례가 없습니다.</li>';
  }
  // 직접 쓴 글 (최신 6편)
  var preview = document.getElementById('insightList');
  if (preview) {
    preview.innerHTML = POSTS.length ? POSTS.slice(0, 6).map(card).join('') : '<li class="empty">등록된 글이 없습니다.</li>';
  }
  // 숫자 자리 채우기: <span data-count="all|case|transfer|…"></span>
  Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
    el.textContent = count(el.getAttribute('data-count'));
  });

  /* ---------- 자료실 목록 ---------- */
  var listEl = document.getElementById('boardList');
  if (listEl) {
    var tabsEl = document.getElementById('boardTabs');
    var searchEl = document.getElementById('boardSearch');
    var countEl = document.getElementById('boardCount');
    var moreBtn = document.getElementById('boardMore');
    var PAGE = 12;
    var q = params();
    var state = { cat: q.cat && catName(q.cat) ? q.cat : 'all', keyword: q.q || '', shown: PAGE };
    searchEl.value = state.keyword;

    var tabs = [{ id: 'all', name: '전체' }, { id: 'case', name: '처리 사례' }].concat(CATS);
    tabsEl.innerHTML = tabs.map(function (t) {
      return '<button type="button" role="tab" class="tab" data-cat="' + t.id + '">' + esc(t.name) + ' <span class="tab__n">' + count(t.id) + '</span></button>';
    }).join('');

    var filtered = function () {
      var kw = state.keyword.trim().toLowerCase();
      return POSTS.filter(function (p) {
        if (state.cat === 'case' ? !p.isCase : (state.cat !== 'all' && p.category !== state.cat)) return false;
        if (!kw) return true;
        return (p.title + ' ' + p.tag + ' ' + p.summary + ' ' + p.body).toLowerCase().indexOf(kw) > -1;
      });
    };

    var syncUrl = function () {
      var qs = [];
      if (state.cat !== 'all') qs.push('cat=' + state.cat);
      if (state.keyword.trim()) qs.push('q=' + encodeURIComponent(state.keyword.trim()));
      history.replaceState(null, '', 'board.html' + (qs.length ? '?' + qs.join('&') : ''));
    };

    var draw = function () {
      Array.prototype.forEach.call(tabsEl.children, function (b) {
        var on = b.getAttribute('data-cat') === state.cat;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      var items = filtered();
      countEl.textContent = '총 ' + items.length + '편';
      if (!items.length) {
        listEl.innerHTML = '<li class="empty">' + (state.keyword ? '‘' + esc(state.keyword) + '’에 대한 ' : '') + '글이 없습니다.</li>';
      } else {
        listEl.innerHTML = items.slice(0, state.shown).map(card).join('');
      }
      moreBtn.hidden = items.length <= state.shown;
      moreBtn.textContent = '더 보기 (' + Math.min(state.shown, items.length) + ' / ' + items.length + ')';
      var title = document.getElementById('boardTitle');
      if (title) title.textContent = state.cat === 'all' ? '세무 자료실' : catName(state.cat);
      var tagsEl = document.getElementById('boardTags');
      if (tagsEl) {
        var list = TAGS[state.cat] || [];
        tagsEl.hidden = !list.length;
        tagsEl.innerHTML = list.map(function (t) { return '<li><button type="button" data-tag="' + esc(t) + '">' + esc(t) + '</button></li>'; }).join('');
      }
    };

    // 해시태그를 누르면 그 말로 검색 (전체 글에서)
    document.addEventListener('click', function (e) {
      var b = e.target.closest('#boardTags button');
      if (!b) return;
      state.keyword = b.getAttribute('data-tag'); searchEl.value = state.keyword; state.shown = PAGE;
      syncUrl(); draw();
    });

    tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      state.shown = PAGE;
      syncUrl(); draw();
    });
    var timer;
    searchEl.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.keyword = searchEl.value; state.shown = PAGE; syncUrl(); draw(); }, 200);
    });
    document.getElementById('boardSearchForm').addEventListener('submit', function (e) {
      e.preventDefault(); state.keyword = searchEl.value; state.shown = PAGE; syncUrl(); draw();
    });
    moreBtn.addEventListener('click', function () { state.shown += PAGE; draw(); });

    // 상단 메뉴에서 같은 페이지의 다른 분류를 눌렀을 때
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="board.html"]');
      var nav = document.getElementById('nav');
      if (!a || !nav || !nav.contains(a)) return;
      e.preventDefault();
      state.cat = (a.getAttribute('href').match(/cat=([\w-]+)/) || [])[1] || 'all';
      state.keyword = ''; searchEl.value = ''; state.shown = PAGE;
      syncUrl(); draw();
      window.scrollTo(0, 0);
    });

    draw();
  }

  /* ---------- 자료 상세 (홈페이지에 직접 쓴 글) ---------- */
  var viewEl = document.getElementById('postView');
  if (viewEl) {
    var pid = params().id;
    var locals = POSTS.filter(function (x) { return x.local; });
    var idx = -1;
    for (var i = 0; i < locals.length; i++) if (String(locals[i].id) === String(pid)) { idx = i; break; }
    var p = locals[idx];

    if (!p) {
      viewEl.innerHTML = '<div class="post-missing"><h1>글을 찾을 수 없습니다</h1><p>삭제되었거나 주소가 잘못되었습니다.</p><a class="btn btn--primary" href="board.html">자료실로 가기</a></div>';
    } else {
      document.title = p.title + ' | 바른길세무회계';
      var newer = locals[idx - 1], older = locals[idx + 1];
      var related = POSTS.filter(function (x) { return x.category === p.category && x.key !== p.key; }).slice(0, 3);

      viewEl.innerHTML =
        '<nav class="crumb" aria-label="현재 위치"><a href="index.html">홈</a><span>›</span><a href="board.html">세무 자료실</a><span>›</span><a href="board.html?cat=' + esc(p.category) + '">' + esc(catName(p.category)) + '</a></nav>' +
        '<header class="post__head">' + tag(p) +
          '<h1 class="post__title">' + esc(p.title) + '</h1>' +
          '<p class="post__meta"><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + '</time><span>바른길세무회계 양정길 세무사</span></p>' +
        '</header>' +
        media(p) +
        '<div class="post__body">' + renderBody(p.body) + '</div>' +
        '<aside class="post__cta"><div><strong>내 상황에 맞는 답이 필요하신가요?</strong><p>카카오톡 채널로 문의해 주시면 제가 직접 답변드립니다.</p></div><a class="btn btn--primary" href="' + esc((window.SITE && window.SITE.kakao) || 'index.html#contact') + '" target="_blank" rel="noopener">카카오톡 상담 문의 ↗</a></aside>' +
        '<nav class="post__nav" aria-label="이전 다음 글">' +
          (older ? '<a href="' + esc(older.href) + '"><span>이전 글</span>' + esc(older.title) + '</a>' : '<span></span>') +
          (newer ? '<a class="is-next" href="' + esc(newer.href) + '"><span>다음 글</span>' + esc(newer.title) + '</a>' : '<span></span>') +
        '</nav>' +
        '<div class="post__list-btn"><a class="btn btn--line" href="board.html">목록으로</a></div>' +
        (related.length ? '<section class="related"><h2>같은 분야의 글</h2><ul class="post-grid">' + related.map(card).join('') + '</ul></section>' : '');
    }
  }
})();
