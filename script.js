(function () {

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = document.getElementById('info');
  var infoPage = document.getElementById('infoPage');
  var workPage = document.getElementById('workPage');
  var pageLinks = document.querySelectorAll('.pill a[data-page-toggle]');
  var pageNav = document.querySelector('.pill');
  var activePage = null;
  var musicHint = document.getElementById('Musichint');

  if (musicHint) {
    window.setTimeout(function () {
      musicHint.classList.add('is-hidden');
    }, 6500);
  }

  var aboutSection = document.getElementById('about');
  var aboutMoreToggle = document.getElementById('aboutMoreToggle');
  var aboutMoreText = document.getElementById('aboutMoreText');
  var aboutDetails = document.getElementById('aboutDetails');
  var aboutMobileQuery = window.matchMedia('(max-width: 600px)');
  if (aboutSection && aboutMoreToggle && aboutMoreText && aboutDetails) {
    function updateAboutMoreLabel() {
      var isExpanded = aboutSection.classList.contains('about-expanded');
      var isMobile = aboutMobileQuery.matches;
      var isJapanese = document.documentElement.lang === 'ja';
      aboutMoreText.textContent = isJapanese
        ? (isExpanded ? '閉じる' : '続きを読む')
        : (isExpanded ? 'See less' : 'See more');
      aboutMoreToggle.setAttribute('aria-expanded', String(isExpanded));
      aboutDetails.setAttribute('aria-hidden', String(isMobile && !isExpanded));
      if (isMobile && !isExpanded) aboutDetails.setAttribute('inert', '');
      else aboutDetails.removeAttribute('inert');
    }

    aboutDetails.addEventListener('transitionend', function (event) {
      if (event.propertyName === 'max-height' && aboutSection.classList.contains('about-expanded')) {
        aboutDetails.style.maxHeight = 'none';
      }
    });

    aboutMoreToggle.addEventListener('click', function () {
      var isExpanding = !aboutSection.classList.contains('about-expanded');
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isExpanding) {
        aboutSection.classList.add('about-expanded');
        aboutDetails.style.maxHeight = reduceMotion ? 'none' : aboutDetails.scrollHeight + 'px';
      } else if (reduceMotion) {
        aboutSection.classList.remove('about-expanded');
        aboutDetails.style.maxHeight = '0px';
      } else {
        aboutDetails.style.maxHeight = aboutDetails.scrollHeight + 'px';
        aboutDetails.offsetHeight;
        aboutSection.classList.remove('about-expanded');
        window.requestAnimationFrame(function () {
          if (!aboutSection.classList.contains('about-expanded')) {
            aboutDetails.style.maxHeight = '0px';
          }
        });
      }
      updateAboutMoreLabel();
    });
    document.addEventListener('site-language-change', updateAboutMoreLabel);
    function syncAboutResponsiveState() {
      var isMobile = aboutMobileQuery.matches;
      var isExpanded = aboutSection.classList.contains('about-expanded');
      if (!isMobile) aboutDetails.style.maxHeight = 'none';
      else if (!isExpanded) aboutDetails.style.maxHeight = '0px';
      updateAboutMoreLabel();
    }
    if (aboutMobileQuery.addEventListener) {
      aboutMobileQuery.addEventListener('change', syncAboutResponsiveState);
    } else {
      aboutMobileQuery.addListener(syncAboutResponsiveState);
    }
    window.addEventListener('resize', syncAboutResponsiveState);
    updateAboutMoreLabel();
  }


  function copyWithLegacyFallback(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } finally {
      field.remove();
    }

    if (!copied) throw new Error('The browser could not copy the contact detail.');
  }

  async function copyContactDetail(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        try {
          copyWithLegacyFallback(text);
          return;
        } catch (fallbackError) {
          console.error('Unable to copy contact detail.', error, fallbackError);
          throw fallbackError;
        }
      }
    }

    copyWithLegacyFallback(text);
  }

  document.querySelectorAll('[data-copy]').forEach(function (element) {
    var badge = element.querySelector('.copy-badge');
    var resetTimer;

    async function copyValue() {
      var text = element.getAttribute('data-copy');
      if (!text || !badge) return;

      window.clearTimeout(resetTimer);
      try {
        await copyContactDetail(text);
        badge.textContent = 'Copied';
      } catch (error) {
        badge.textContent = 'Copy failed';
      }

      resetTimer = window.setTimeout(function () {
        badge.textContent = 'Copy';
      }, 2000);
    }

    element.addEventListener('click', copyValue);
    element.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      copyValue();
    });
  });

  function moveNavIndicator(page) {
    var activeLink = Array.prototype.find.call(pageLinks, function (link) {
      return link.getAttribute('data-page-toggle') === page;
    });

    if (!pageNav || !activeLink) return;

    var navRect = pageNav.getBoundingClientRect();
    var linkRect = activeLink.getBoundingClientRect();
    pageNav.style.setProperty('--indicator-left', (linkRect.left - navRect.left - pageNav.clientLeft) + 'px');
    pageNav.style.setProperty('--indicator-width', linkRect.width + 'px');
    pageNav.setAttribute('data-indicator-ready', 'true');
  }

  function showPage(page, animate) {
    if (!infoPage || !workPage) return;

    if (activePage === page) {
      moveNavIndicator(page);
      return;
    }

    var nextPage = page === 'work' ? workPage : infoPage;
    var previousPage = activePage === 'work' ? workPage : activePage === 'info' ? infoPage : null;
    var showTransition = animate && !reduce && previousPage && previousPage !== nextPage;

    activePage = page;
    nextPage.hidden = false;
    nextPage.inert = false;
    nextPage.setAttribute('aria-hidden', 'false');

    if (showTransition) {
      nextPage.offsetWidth;
      nextPage.classList.add('is-visible');
      previousPage.classList.remove('is-visible');
      previousPage.inert = true;
      previousPage.setAttribute('aria-hidden', 'true');
      window.setTimeout(function () {
        if (!previousPage.classList.contains('is-visible')) {
          previousPage.hidden = true;
        }
      }, 350);
    } else {
      [infoPage, workPage].forEach(function (pageElement) {
        var isActive = pageElement === nextPage;
        pageElement.hidden = !isActive;
        pageElement.inert = !isActive;
        pageElement.setAttribute('aria-hidden', String(!isActive));
        pageElement.classList.toggle('is-visible', isActive);
      });
    }

    pageLinks.forEach(function (link) {
      var isActive = link.getAttribute('data-page-toggle') === page;
      link.classList.toggle('on', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    moveNavIndicator(page);
  }

  function pageFromLocation(animate) {
    if (window.location.hash === '#top') {
      window.history.replaceState({ page: 'info' }, '', '#info');
    }
    showPage(window.location.hash === '#work' ? 'work' : 'info', animate);
  }

  if (infoPage && workPage) {
    pageFromLocation(false);
    window.addEventListener('popstate', function () {
      pageFromLocation(true);
    });
    window.addEventListener('hashchange', function () {
      pageFromLocation(true);
    });
    window.addEventListener('resize', function () {
      moveNavIndicator(activePage);
    });
  }


  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-go]');
    if (!a) return;

    var page = a.getAttribute('data-page-toggle');
    if (page && infoPage && workPage) {
      e.preventDefault();
      showPage(page, true);
      var pageHash = page === 'work' ? '#work' : '#info';
      if (window.location.hash !== pageHash) {
        window.history.pushState({ page: page }, '', pageHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      closeMenu();
      return;
    }

    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    var id = href.slice(1);
    var el = id === 'info' ? document.body : document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (infoPage && workPage && infoPage.contains(el)) {
      showPage('info', true);
      if (window.location.hash !== href) {
        window.history.pushState({ page: 'info' }, '', href);
      }
    } else if (id === 'info') {
      if (window.location.hash !== '#info') {
        window.history.pushState({ page: 'info' }, '', '#info');
      }
    }
    var y = id === 'info' ? 0 : el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
    closeMenu();
  });


const audio = document.getElementById("StarX-audio");
const audioButton = document.getElementById("StarXAudio-button");
const audioIcon = audioButton.querySelector("svg");

audio.volume = 0.05;

function syncAudioControl() {
  const isPlaying = !audio.paused;

  if (isPlaying) {
    audioIcon.unpauseAnimations();
  } else {
    audioIcon.pauseAnimations();
  } 


}

audio.addEventListener("play", syncAudioControl);
audio.addEventListener("pause", syncAudioControl);
syncAudioControl();

audioButton.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      await audio.play();
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  } else {
    audio.pause();
  }
});



const video = document.querySelector(".background-videoAboutMe");

let reverse = false;

video.addEventListener("ended", () => {
  reverse = !reverse;
  video.playbackRate = reverse ? -1 : 1;

  if (reverse) {
      video.currentTime = video.duration;
      video.play();
  }
});



  var btn = document.getElementById('menuBtn');
  var drawer = document.getElementById('navDrawer');
  var drawerBackdrop = document.getElementById('drawerBackdrop');
  var drawerClose = document.getElementById('drawerClose');
  var previousBodyOverflow = '';

  function closeMenu() {
    if (!drawer || !drawerBackdrop || !btn || !drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    drawerBackdrop.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousBodyOverflow;
    btn.focus();
  }

  function openMenu() {
    if (!drawer || !drawerBackdrop || !btn) return;
    previousBodyOverflow = document.body.style.overflow;
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
    if (drawerClose) drawerClose.focus();
  }

  if (btn && drawer && drawerBackdrop) {
    btn.addEventListener('click', function () {
      if (drawer.classList.contains('open')) closeMenu();
      else openMenu();
    });
    if (drawerClose) drawerClose.addEventListener('click', closeMenu);
    drawerBackdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }


  function onScroll() {
    top.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  var expertiseHeading = document.querySelector('#expertise .big');
  if (expertiseHeading && !reduce && 'IntersectionObserver' in window) {
    var expertiseObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          expertiseHeading.classList.add('is-glitching');
          expertiseObserver.unobserve(expertiseHeading);
        }
      });
    }, { threshold: 0.5 });
    expertiseObserver.observe(expertiseHeading);
  }


  var contactValues = document.querySelectorAll('#contact .contact-detail-value > span:first-child');
  if (contactValues.length && !reduce && 'IntersectionObserver' in window) {
    var contactValueObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var contactValue = entry.target;
          contactValue.classList.add('is-scroll-highlighted');
          window.setTimeout(function () {
            contactValue.classList.remove('is-scroll-highlighted');
          }, 5000);
          contactValueObserver.unobserve(contactValue);
        }
      });
    }, { threshold: 0.5 });
    contactValues.forEach(function (value) {
      contactValueObserver.observe(value);
    });
  }

  var bars = document.querySelectorAll('.meter i');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.style.width = ''; io.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    bars.forEach(function (b) {
      if (b.getBoundingClientRect().top > window.innerHeight) { b.style.width = '0'; io.observe(b); }
    });
  }


  var projectsGrid = document.querySelector('.projects-grid');
  if (projectsGrid) {
    var logoCards = document.createDocumentFragment();
    var logoNames = [
      'GEOMETRIC ANTLER',
      'ANDONI LAW',
      'FIERCE DRAGON',
      'PLG',
      'ELEGANT MONOGRAM',
      'STACT',
      'MINIMALIST DEER',
      'GEOMETRIC ANTLER',
      'INFINITY OWL',
      'SANITY RANCH',
      'PARKAPI',
      'SO YACHT',
      'CHATLEIGH FOUNDATION',
      'KNIGHT',
      'IMPACT PLATFORM',
      'SOLUTIONS CONSULTING',
      'BIRDSCAPE',
      'FIVE 5THS',
      "MAC AND CLAY - MEN'S CLOTHING",
      'HAZZARD COUNTRY',
      'AIOT',
      'GRINNING REBEL',
      'SPIRE',
      'GEOMETRIX APEX',
      'SV ARCHITECTURAL MILLWORK',
      'DEERFIELD',
      'CRAFT COLLECTIVE BREWING CO.'
    ];
    var logoNamesJa = [
      '幾何学的な鹿角',
      'アンドニ法律事務所',
      '猛々しい龍',
      'PLG',
      '優美なモノグラム',
      'STACT',
      'ミニマルな鹿',
      '幾何学的な鹿角紋章',
      '無限大のフクロウ',
      'サニティ・ランチ',
      'パーカピ',
      'ソー・ヨット',
      'チャットリー財団',
      '騎士',
      'インパクト・プラットフォーム',
      'ソリューションズ・コンサルティング',
      'バードスケープ',
      'ファイブ・フィフス',
      'マック＆クレイ - メンズウェア',
      'ハザード・カントリー',
      'AIoT',
      '笑う反逆者',
      'スパイア',
      'ジオメトリクス・エイペックス',
      'SV建築木工',
      'ディアフィールド',
      'クラフト・コレクティブ醸造所'
    ];
    var logoDescriptions = [
      'An abstract line-art emblem combining geometric shapes with graceful stag antlers at the top and sharp triangular structures below.',
      'A sophisticated corporate geometric emblem exploring triangular and circular structures for a professional legal and financial identity.',
      'A minimalist, sleek white silhouette of a dragon rendered in a dynamic, aggressive motion style.',
      'A geometric monogram featuring interlocking square and linear elements forming the brand letters.',
      'A refined circular monogram featuring delicate intertwined curved lines resembling an ornate initial.',
      'A dynamic, abstract geometric logo composed of bold, sweeping parallel curved shapes.',
      'A clean, minimalist line-art outline of a deer head with elegant branching antlers.',
      'An intricate geometric badge featuring stacked triangular frames and stylized antlers with embedded reference markers.',
      'A whimsical yet modern icon merging an infinity symbol with expressive owl eyes and ears.',
      'A rustic typographic wordmark representing an equine and ranch lifestyle brand.',
      'A minimalist, bold geometric monogram forming a stylized letter A with a solid horizontal base line.',
      'A sleek, interlocking geometric monogram forming a continuous dual-loop symbol reminiscent of nautical links.',
      'A sophisticated geometric monogram merging the letters C and F into a unified, balanced emblem.',
      "A clean, minimalist chess piece silhouette representing a knight's head, symbolizing strategy and tactical strength.",
      'A sharp, upward-pointing geometric icon formed by intersecting angular lines symbolizing growth and structural support.',
      'An abstract, flowing ribbon-like monogram forming the letter S with a dynamic layered effect.',
      'A flowing script wordmark paired with a minimalist, sweeping line-art bird perched atop the initial letter.',
      'A sharp, V-shaped geometric monogram constructed from angular parallel lines that interlock to form the brand letters.',
      'An isometric, cube-inspired monogram merging the letters M and C with a subtle bow tie integrated into the base.',
      'A rustic serif wordmark crowned with classic country motifs including a rose, guitar neck, and cowboy hat.',
      'A sleek, futuristic typographic wordmark utilizing geometric shapes and strategic dots to represent advanced IoT technology.',
      'A raw, expressive smiley face rendered with rough, hand-brushed strokes and X-shaped eyes for an edgy streetwear aesthetic.',
      "A sharp, symmetrical vertical emblem modeled directly after the intricate inlay geometry of a pool cue's lower butt sleeve.",
      'A bold circular emblem housing an angular triangle that forms a stylized letter A symbolizing peak performance.',
      'A clean concentric circular stamp surrounding an outlined SV monogram reflecting architectural precision and woodwork.',
      'A detailed vintage outdoor badge featuring a majestic stag framed by woodland ferns and bold condensed lettering.',
      'A bold, high-contrast pint glass icon overflowing with stylized foam paired with weathered serif typography.'
    ];
    var logoDescriptionsJa = [
      '幾何学的な形と優雅な鹿の角を組み合わせた抽象的な線画エンブレム。上部に鹿の角、下部に鋭い三角形を配しています。',
      '三角形と円形を取り入れた洗練された企業向けの幾何学的エンブレム。法律・金融分野にふさわしい印象を表現しています。',
      '躍動感と力強さのある動きを、洗練された白い龍のシルエットで表現したミニマルなデザインです。',
      'ブランド名の文字を形づくる、四角形と直線を組み合わせた幾何学的なモノグラムです。',
      '装飾的なイニシャルを思わせる、繊細に絡み合う曲線で構成した上品な円形モノグラムです。',
      '大胆で流れるような平行曲線を組み合わせた、躍動感のある抽象的なロゴです。',
      '枝分かれした優雅な角を持つ鹿の頭部を、すっきりとした線画で表現したミニマルなデザインです。',
      '三角形のフレームを重ね、鹿の角と参照マークを組み込んだ、精緻な幾何学バッジです。',
      '無限大のシンボルに、表情豊かなフクロウの目と耳を組み合わせた、遊び心のある現代的なアイコンです。',
      '馬と牧場のライフスタイルを表現した、素朴な雰囲気のタイポグラフィによるワードマークです。',
      '太い水平の土台を持つ「A」を、力強くミニマルな幾何学的モノグラムとして表現しています。',
      '航海用の連結具を思わせる、途切れのない二重ループを形づくる、洗練された幾何学的モノグラムです。',
      'CとFの文字を一体化し、調和の取れたエンブレムに仕上げた、洗練された幾何学的モノグラムです。',
      '戦略と戦術的な強さを象徴する、騎士の頭部をかたどったシンプルでミニマルなチェス駒のシルエットです。',
      '成長と構造的な支えを象徴する、交差する角度の鋭い線で形づくった上向きの幾何学的アイコンです。',
      '重なり合う動きのあるリボンで「S」を形づくった、流れるような抽象的モノグラムです。',
      '頭文字の上に、軽やかな線画の鳥をあしらった、流麗な筆記体のワードマークです。',
      '角度のある平行線を組み合わせてブランドの文字を形づくった、鋭いV字型の幾何学的モノグラムです。',
      '立方体を思わせるアイソメトリックな形にMとCを組み合わせ、底部にさりげなく蝶ネクタイを取り入れたモノグラムです。',
      'バラ、ギターのネック、カウボーイハットなど、伝統的なカントリーモチーフをあしらった素朴なセリフ体のワードマークです。',
      '幾何学的な形とドットを効果的に使い、先進的なIoT技術を表現した、未来的で洗練されたワードマークです。',
      '荒々しい筆致とX印の目で描いた、エッジの効いたストリートウェア向けの個性的なスマイルマークです。',
      'ビリヤードキューの下部にある複雑な象嵌模様をもとにデザインした、鋭く左右対称な縦型エンブレムです。',
      '最高のパフォーマンスを象徴する「A」を、角ばった三角形で表現して円形の中に収めた大胆なエンブレムです。',
      '建築の精密さと木工技術を表現する、輪郭線のSVモノグラムを囲む同心円状のスタンプです。',
      '雄大な鹿をシダの葉と太く凝縮した文字で囲んだ、細部まで描き込まれたヴィンテージ風のアウトドアバッジです。',
      '泡があふれるビールグラスのアイコンに、かすれたセリフ体の文字を組み合わせた、コントラストの強いデザインです。'
    ];
    for (var logoNumber = 1; logoNumber <= 27; logoNumber += 1) {
      var logoCard = document.createElement('article');
      logoCard.className = 'project-card project-card--logo';
      logoCard.dataset.category = 'logo';
      logoCard.dataset.details = logoDescriptions[logoNumber - 1];
      logoCard.dataset.detailsJa = logoDescriptionsJa[logoNumber - 1];

      var logoThumbWrap = document.createElement('div');
      logoThumbWrap.className = 'project-thumb-wrap';

      var logoImage = document.createElement('img');
      logoImage.src = 'assets/Logos/Logo ' + logoNumber + '.jpg';
      logoImage.alt = 'Logo ' + logoNumber;
      logoImage.dataset.altJa = 'ロゴ ' + logoNumber;
      logoImage.className = 'project-thumb';
      logoImage.loading = 'lazy';

      var logoOverlay = document.createElement('div');
      logoOverlay.className = 'project-overlay';
      logoOverlay.setAttribute('aria-hidden', 'true');
      var logoViewBadge = document.createElement('span');
      logoViewBadge.className = 'project-view-badge';
      logoViewBadge.dataset.i18n = '';
      logoViewBadge.textContent = 'View Case Study';
      logoOverlay.appendChild(logoViewBadge);

      logoThumbWrap.appendChild(logoImage);
      logoThumbWrap.appendChild(logoOverlay);

      var logoMeta = document.createElement('div');
      logoMeta.className = 'project-meta-box';
      var logoCategory = document.createElement('span');
      logoCategory.className = 'project-category-tag';
      logoCategory.textContent = 'LOGO // ' + logoNames[logoNumber - 1];
      var logoTitle = document.createElement('h2');
      logoTitle.className = 'project-title';
      logoTitle.textContent = logoNames[logoNumber - 1];
      logoTitle.dataset.titleEn = logoNames[logoNumber - 1];
      logoTitle.dataset.titleJa = logoNamesJa[logoNumber - 1];
      var logoDescription = document.createElement('p');
      logoDescription.className = 'project-desc';
      logoDescription.dataset.i18n = '';
      logoDescription.textContent = logoDescriptions[logoNumber - 1];
      logoMeta.appendChild(logoCategory);
      logoMeta.appendChild(logoTitle);
      logoMeta.appendChild(logoDescription);

      logoCard.appendChild(logoThumbWrap);
      logoCard.appendChild(logoMeta);
      logoCards.appendChild(logoCard);
    }
    projectsGrid.insertBefore(logoCards, projectsGrid.firstChild);
  }

  var filterButtons = document.querySelectorAll('.work-filter-btn');
  var projectCards = document.querySelectorAll('.project-card');
  var projectModal = document.getElementById('projectModal');
  var modalImage = document.getElementById('modalImage');
  var modalCategory = document.getElementById('modalCategory');
  var modalTitle = document.getElementById('modalTitle');
  var modalDescription = document.getElementById('modalDesc');
  var modalClose = document.getElementById('modalClose');
  var modalScrollHint = document.getElementById('modalScrollHint');
  var modalPreviousLogo = document.getElementById('modalPreviousLogo');
  var modalNextLogo = document.getElementById('modalNextLogo');
  var modalZoomControls = document.getElementById('modalZoomControls');
  var modalZoomLabel = document.getElementById('modalZoomLabel');
  var modalZoomSlider = document.getElementById('modalZoomSlider');
  var modalZoomValue = document.getElementById('modalZoomValue');
  var modalCard = projectModal && projectModal.querySelector('.modal-card');
  var modalImageWrap = projectModal && projectModal.querySelector('.modal-image-wrap');
  var filterBar = document.querySelector('.work-filter-bar');

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.dataset.filter;

      filterButtons.forEach(function (filterButton) {
        var isActive = filterButton === button;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-pressed', String(isActive));
      });

      projectCards.forEach(function (card) {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    });
  });

  if (projectModal && modalImage && modalCategory && modalTitle && modalDescription && modalClose && modalScrollHint && modalPreviousLogo && modalNextLogo && modalZoomControls && modalZoomLabel && modalZoomSlider && modalZoomValue && modalImageWrap && modalCard) {
    var previouslyFocusedCard = null;
    var openCard = null;
    var logoCards = document.querySelectorAll('.project-card--logo');
    var zoomLevel = 1;
    var panX = 0;
    var panY = 0;
    var panStart = null;

    function updateModalPresentation() {
      var isLogoCard = openCard && openCard.classList.contains('project-card--logo');
      modalCard.classList.toggle('modal-card--zoom', !!openCard);
      projectModal.classList.toggle('modal-overlay--zoom', !!openCard);
      modalPreviousLogo.hidden = !isLogoCard;
      modalNextLogo.hidden = !isLogoCard;
      modalZoomControls.hidden = !openCard;
    }

    function applyZoom() {
      var maxPanX = Math.max((modalImage.offsetWidth * zoomLevel - modalImageWrap.clientWidth) / 2, 0);
      var maxPanY = Math.max((modalImage.offsetHeight * zoomLevel - modalImageWrap.clientHeight) / 2, 0);
      panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
      panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
      modalImage.style.transform = zoomLevel > 1
        ? 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomLevel + ')'
        : '';
      modalImageWrap.classList.toggle('is-zoomed', zoomLevel > 1);
      modalZoomValue.value = Math.round(zoomLevel * 100) + '%';
      modalZoomValue.textContent = modalZoomValue.value;
    }

    function resetZoom() {
      zoomLevel = 1;
      panX = 0;
      panY = 0;
      panStart = null;
      modalZoomSlider.value = '1';
      modalImageWrap.classList.remove('is-dragging');
      applyZoom();
    }

    function showAdjacentLogo(direction) {
      var currentIndex = Array.prototype.indexOf.call(logoCards, openCard);
      if (currentIndex === -1) return;

      openCard = logoCards[(currentIndex + direction + logoCards.length) % logoCards.length];
      modalCard.scrollTop = 0;
      resetZoom();
      if (!reduce) {
        modalImage.classList.remove('logo-preview-changing');
        void modalImage.offsetWidth;
        modalImage.classList.add('logo-preview-changing');
      }
      renderProjectModal(openCard);
      updateModalPresentation();
      window.requestAnimationFrame(updateScrollHint);
    }

    function updateScrollHint() {
      if (!openCard) {
        modalScrollHint.hidden = true;
        return;
      }

      modalScrollHint.hidden =
        !modalImage.complete ||
        modalImage.naturalHeight <= 0 ||
        modalCard.scrollHeight <= modalCard.clientHeight + 24;
    }

    function scrollForMoreImage() {
      modalCard.scrollBy({
        top: Math.max(modalCard.clientHeight * 0.7, 200),
        behavior: reduce ? 'auto' : 'smooth'
      });
    }

    function closeProjectModal() {
      projectModal.classList.remove('open');
      projectModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('project-modal-open');
      document.body.style.overflow = '';
      if (openCard) previouslyFocusedCard = openCard;
      openCard = null;
      modalScrollHint.hidden = true;
      resetZoom();
      updateModalPresentation();
      if (previouslyFocusedCard) previouslyFocusedCard.focus();
    }

    function renderProjectModal(card) {
      var image = card.querySelector('.project-thumb');
      var title = card.querySelector('.project-title');
      var category = card.querySelector('.project-category-tag');
      var isJapanese = document.documentElement.lang === 'ja';
      var description = isJapanese
        ? card.dataset.detailsJa || card.dataset.details || (card.querySelector('.project-desc') && card.querySelector('.project-desc').textContent)
        : card.dataset.details || (card.querySelector('.project-desc') && card.querySelector('.project-desc').textContent);

      if (!image || !title || !category || !description) return;

      modalImage.src = image.src;
      modalImage.alt = isJapanese ? image.dataset.altJa || image.alt : image.dataset.altEn || image.alt;
      modalCategory.textContent = category.textContent;
      modalTitle.textContent = title.textContent;
      modalDescription.textContent = '';
      description.split(/(#[\w-]+)/g).forEach(function (part) {
        if (part.charAt(0) === '#') {
          var hashtag = document.createElement('span');
          hashtag.className = 'project-hashtag';
          hashtag.textContent = part;
          modalDescription.appendChild(hashtag);
        } else {
          modalDescription.appendChild(document.createTextNode(part));
        }
      });
    }

    function updateProjectLanguage() {
      var isJapanese = document.documentElement.lang === 'ja';

      projectCards.forEach(function (card) {
        var title = card.querySelector('.project-title');
        if (!title) return;

        if (title.dataset.titleJa) {
          title.textContent = isJapanese ? title.dataset.titleJa : title.dataset.titleEn;
        }
        var description = card.querySelector('.project-desc');
        if (description && card.dataset.detailsJa) {
          description.textContent = isJapanese ? card.dataset.detailsJa : card.dataset.details;
        }
        card.setAttribute(
          'aria-label',
          isJapanese ? '「' + title.textContent + '」の詳細を見る' : 'View ' + title.textContent + ' details'
        );
      });

      if (filterBar) {
        filterBar.setAttribute('aria-label', isJapanese ? 'プロジェクトを絞り込む' : 'Filter projects');
      }
      modalClose.setAttribute('aria-label', isJapanese ? 'プロジェクトの詳細を閉じる' : 'Close project details');
      modalScrollHint.setAttribute('aria-label', isJapanese ? '下にスクロールして続きを見る' : 'Scroll to see more');
      modalPreviousLogo.setAttribute('aria-label', isJapanese ? '前のロゴ' : 'Previous logo');
      modalNextLogo.setAttribute('aria-label', isJapanese ? '次のロゴ' : 'Next logo');
      modalZoomLabel.textContent = isJapanese ? '拡大' : 'Zoom';
      modalZoomSlider.setAttribute('aria-label', isJapanese ? 'プロジェクト画像を拡大' : 'Zoom project image');

      if (openCard) renderProjectModal(openCard);
      updateScrollHint();
    }

    projectCards.forEach(function (card) {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      var image = card.querySelector('.project-thumb');
      if (image) image.dataset.altEn = image.alt;

      function openProjectModal() {
        if (!image || !card.querySelector('.project-title') || !card.querySelector('.project-category-tag')) return;

        previouslyFocusedCard = card;
        openCard = card;
        modalCard.scrollTop = 0;
        resetZoom();
        renderProjectModal(card);
        projectModal.classList.add('open');
        projectModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('project-modal-open');
        document.body.style.overflow = 'hidden';
        updateModalPresentation();
        modalClose.focus();
        window.requestAnimationFrame(updateScrollHint);
      }

      card.addEventListener('click', openProjectModal);
      card.addEventListener('keydown', function (event) {
        if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        openProjectModal();
      });
    });

    updateProjectLanguage();
    document.addEventListener('site-language-change', updateProjectLanguage);

    modalCard.addEventListener('scroll', updateScrollHint, { passive: true });
    modalImage.addEventListener('load', updateScrollHint);
    window.addEventListener('resize', function () {
      applyZoom();
      updateScrollHint();
    });
    modalScrollHint.addEventListener('click', scrollForMoreImage);
    modalZoomSlider.addEventListener('input', function () {
      zoomLevel = Number(modalZoomSlider.value);
      applyZoom();
    });
    modalImageWrap.addEventListener('pointerdown', function (event) {
      if (zoomLevel <= 1 || event.target !== modalImage) return;
      panStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        panX: panX,
        panY: panY
      };
      modalImageWrap.classList.add('is-dragging');
      modalImageWrap.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    modalImageWrap.addEventListener('pointermove', function (event) {
      if (!panStart || event.pointerId !== panStart.pointerId) return;
      panX = panStart.panX + event.clientX - panStart.x;
      panY = panStart.panY + event.clientY - panStart.y;
      applyZoom();
    });
    function stopPanning(event) {
      if (!panStart || event.pointerId !== panStart.pointerId) return;
      panStart = null;
      modalImageWrap.classList.remove('is-dragging');
      if (modalImageWrap.hasPointerCapture(event.pointerId)) {
        modalImageWrap.releasePointerCapture(event.pointerId);
      }
    }
    modalImageWrap.addEventListener('pointerup', stopPanning);
    modalImageWrap.addEventListener('pointercancel', stopPanning);

    modalClose.addEventListener('click', closeProjectModal);
    modalPreviousLogo.addEventListener('click', function () {
      showAdjacentLogo(-1);
    });
    modalNextLogo.addEventListener('click', function () {
      showAdjacentLogo(1);
    });
    projectModal.addEventListener('click', function (event) {
      if (event.target === projectModal) closeProjectModal();
    });
    document.addEventListener('keydown', function (event) {
      if (!projectModal.classList.contains('open')) return;
      if (event.key === 'Escape') {
        closeProjectModal();
      } else if (openCard && openCard.classList.contains('project-card--logo') && event.key === 'ArrowLeft') {
        event.preventDefault();
        showAdjacentLogo(-1);
      } else if (openCard && openCard.classList.contains('project-card--logo') && event.key === 'ArrowRight') {
        event.preventDefault();
        showAdjacentLogo(1);
      }
    });
  }


  var JA = {
  "Info": "プロフィール",
  "Work": "作品",
  "About me": "自己紹介",
  "See more": "続きを読む",
  "See less": "閉じる",
  "What I do": "できること",
  "Expertise": "専門分野",
  "Contact me": "お問い合わせ",
  "Navigation // Menu": "ナビゲーション",
  "Created by Shanaka Silva": "Shanaka Silva 制作",
  "Portfolio © 2026": "ポートフォリオ © 2026",
  "PORTFOLIO © 2026": "ポートフォリオ © 2026",
  "Shanaka Silva. All rights reserved.": "シャナカ シルヴァ. 無断転載・複製を禁じます。",
  "Graphic Designer": "グラフィックデザイナー",
  "Digital Marketing · Visual Content": "デジタルマーケティング · ビジュアルコンテンツ",
  "I'm a multidisciplinary designer with more than 10 years of experience across graphic design, digital marketing, visual communication, and creative technology. My experience covers a wide range of projects, including branding, advertising materials, social media content, UI/UX design, website design, photography, video, and digital campaigns.": "私は、グラフィックデザイン、デジタルマーケティング、ビジュアルコミュニケーション、クリエイティブテクノロジーの分野で10年以上の経験を持つマルチディシプリナリーなデザイナーです。ブランディング、広告素材、ソーシャルメディアコンテンツ、UI/UXデザイン、ウェブサイトデザイン、写真、動画、デジタルキャンペーンなど、幅広いプロジェクトに携わってきました。",
  "I enjoy working across different stages of a project - from developing an initial concept and visual direction to creating the final design and bringing it to life digitally. With a background that also includes IT, computer hardware, networking, and web technologies, I approach design from both a creative and technical perspective. Currently based in Japan, I continue to expand my skills in web development, digital experiences, photography, and emerging technologies.": "プロジェクトのさまざまな段階に携わることを楽しんでいます。初期コンセプトやビジュアルの方向性の策定から、最終的なデザインの制作、そしてデジタル上での実現まで幅広く取り組んでいます。 また、IT、コンピューターハードウェア、ネットワーク、Webテクノロジーの知識を活かし、クリエイティブと技術の両方の視点からデザインに取り組んでいます。 現在は日本を拠点に、Web開発、デジタル体験、写真、新しいテクノロジーなどの分野で、継続的にスキルの向上に努めています。",
  "Graphic Design": "グラフィックデザイン",
  "Branding": "ブランディング",
  "UI/UX Design": "UI/UXデザイン",
  "UI/UX & Web Design": "UI/UX・ウェブデザイン",
  "Web Design": "ウェブデザイン",
  "Digital Marketing": "デジタルマーケティング",
  "Photo & Video": "写真・動画",
  "Marketing materials, promotional graphics, print design, layouts, and digital assets designed to communicate clearly and consistently.": "マーケティング資料、プロモーション用グラフィック、印刷物のデザイン、レイアウト、デジタルコンテンツなど、明確で一貫性のあるコミュニケーションを実現するデザインを制作します。",
  "Logos, visual identities, brand guidelines, promotional materials, and supporting visual systems that create a consistent brand presence.": "ロゴ、ビジュアルアイデンティティ、ブランドガイドライン、販促素材、そして一貫したブランドの印象をつくるビジュアルシステム。",
  "User interfaces and digital experiences focused on visual clarity, usability, hierarchy, and interaction.": "視覚的な分かりやすさ、使いやすさ、情報の階層、インタラクションを重視したユーザーインターフェースとデジタル体験。",
  "Modern and responsive website designs that combine strong visual communication with practical user experience.": "優れたビジュアルコミュニケーションと実用的なユーザー体験を兼ね備えた、モダンでレスポンシブなウェブサイトのデザイン。",
  "Creative content for social media, online campaigns, property promotion, advertising, and digital communication.": "ソーシャルメディア、オンラインキャンペーン、不動産プロモーション、広告、デジタルコミュニケーションのためのクリエイティブコンテンツ。",
  "Photography, image editing, color grading, video editing, and visual content creation for digital and promotional use.": "デジタルおよびプロモーション用途の写真撮影、画像編集、カラーグレーディング、動画編集、ビジュアルコンテンツ制作。",
  "Brand Identity": "ブランドアイデンティティ",
  "Logo Design": "ロゴデザイン",
  "Typography": "タイポグラフィ",
  "Layout": "レイアウト",
  "Print Design": "印刷デザイン",
  "Advertising": "広告",
  "Interface Design": "インターフェースデザイン",
  "Wireframing": "ワイヤーフレーム",
  "Visual Hierarchy": "ビジュアル階層",
  "Responsive Design": "レスポンシブデザイン",
  "User Experience": "ユーザー体験",
  "Digital": "デジタル",
  "Social Media Design": "ソーシャルメディアデザイン",
  "Visual Content": "ビジュアルコンテンツ",
  "Photography": "写真撮影",
  "Photo Retouching": "写真レタッチ",
  "Color Grading": "カラーグレーディング",
  "Video Editing": "動画編集",
  "Motion Content": "モーションコンテンツ",
  "Tech": "テクノロジー",
  "Design, development, and technology.": "デザイン、開発、テクノロジー。",
  "Technical Troubleshooting": "技術的なトラブルシューティング",
  "Computer Hardware": "コンピューターハードウェア",
  "Networking": "ネットワーク",
  "IT Support": "ITサポート",
  "Design": "デザイン",
  "Video & Photography": "動画・写真",
  "Web": "ウェブ",
  "Audio": "オーディオ",
  "Other": "その他",
  "Email": "メール",
  "Phone": "電話",
  "Back to top": "トップへ戻る",
  "Featured Projects": "注目のプロジェクト",
  "Portfolio / Selected Projects": "ポートフォリオ / 主なプロジェクト",
  "Scroll to see more": "下にスクロールして続きを見る",
  "A selection of Logo design, graphic design and UI/UX projects.": "ロゴデザイン、グラフィックデザイン、UI/UXデザインの制作実績を厳選してご紹介します",
  "All Projects": "すべての実績",
  "Logo": "ロゴ",
  "Logo design project.": "ロゴデザインのプロジェクトです。",
  "3D & Motion": "3D・モーション",
  "View Case Study": "詳細を見る",
  "Branding // Identity": "ブランディング // アイデンティティ",
  "Cyber Visual Identity": "サイバー・ビジュアルアイデンティティ",
  "Complete corporate identity, typographic guidelines, and dynamic digital assets.": "企業アイデンティティ、タイポグラフィのガイドライン、動きのあるデジタル素材を含む包括的なデザインです。",
  "Graphic Design // Editorial": "グラフィックデザイン // エディトリアル",
  "Architectural Grid Monograph": "建築グリッド・モノグラフ",
  "Clean Swiss-inspired magazine spread exploring modern architectural spaces.": "スイス・スタイルの整然とした誌面で、現代建築の空間を紹介します。",
  "Graphic Design // Leaflet": "グラフィックデザイン // リーフレット",
  "Promotional Leaflet Design": "プロモーションリーフレットデザイン",
  "A promotional leaflet designed for Namegawa Onsen, located in Yonezawa, Yamagata, Japan. The design focuses on presenting the natural beauty, unique hot spring characteristics, and traditional Japanese onsen experience.": "山形県米沢市にある滑川温泉のプロモーションリーフレットです。自然の美しさや温泉ならではの魅力、日本の伝統的な温泉文化を紹介しています。",
  "Graphic Design // Social Media": "グラフィックデザイン // ソーシャルメディア",
  "Social Media Design 1": "ソーシャルメディアデザイン 1",
  "Social Media Design 2": "ソーシャルメディアデザイン 2",
  "Social Media Design 3": "ソーシャルメディアデザイン 3",
  "Social media graphic design project.": "ソーシャルメディア向けのグラフィックデザイン作品です。",
  "Packaging // Product": "パッケージ // プロダクト",
  "Dark Luxe Cosmetic Package": "ダーク・ラグジュアリー化粧品パッケージ",
  "Tactile luxury packaging concept with gold foil typography and minimalist form.": "金箔のタイポグラフィとミニマルな造形を組み合わせた、質感にこだわった高級パッケージのコンセプトです。",
  "UI/UX // Web Design": "UI/UX // ウェブデザイン",
  "Web Design 1": "ウェブデザイン 1",
  "Web Design 2": "ウェブデザイン 2",
  "Web Design 3": "ウェブデザイン 3",
  "Web Design 4": "ウェブデザイン 4",
  "Website UI/UX design project.": "ウェブサイトのUI/UXデザイン作品です。",
  "3D // Atmosphere": "3D // 空間演出",
  "Cyber Ronin Environment": "サイバーローニンの3D空間",
  "Cinematic lighting study featuring natural elements and futuristic character staging.": "自然の要素と未来的なキャラクター演出を組み合わせた、シネマティックなライティング作品です。",
};



var langBtn = document.getElementById('langBtn');
  var nodes = document.querySelectorAll('[data-i18n]');
  nodes.forEach(function (el) { el.setAttribute('data-en', el.textContent.trim()); });

  function setLang(lang) {
    var ja = lang === 'ja';
    nodes.forEach(function (el) {
      var en = el.getAttribute('data-en');
      el.textContent = ja && JA[en] ? JA[en] : en;
    });
    document.documentElement.lang = ja ? 'ja' : 'en';
    langBtn.textContent = ja ? 'English' : '日本語';
    langBtn.lang = ja ? 'en' : 'ja';
    langBtn.setAttribute('aria-label', ja ? '言語を英語に切り替える' : 'Switch site language to Japanese');
    window.requestAnimationFrame(function () {
      moveNavIndicator(activePage || (window.location.hash === '#work' ? 'work' : 'info'));
    });
    document.dispatchEvent(new CustomEvent('site-language-change', { detail: { lang: lang } }));
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  langBtn.addEventListener('click', function () {
    setLang(document.documentElement.lang === 'ja' ? 'en' : 'ja');
  });
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  if (saved === 'ja') setLang('ja');
})();
