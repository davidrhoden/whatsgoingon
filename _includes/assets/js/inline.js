if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    if (!user) {
      window.netlifyIdentity.on("login", () => {
        document.location.href = "/admin/";
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollToPlugin);

  var allArticles = Array.from(document.querySelectorAll('main article'));
  if (!allArticles.length) return;

  var currentIndex = 0;
  var INTERVAL = 10000;
  var timer;
  var paused = false;
  var progressBar = document.getElementById('slide-progress');
  var progressTween;
  var counter = document.getElementById('slide-counter');
  var editLink = document.getElementById('admin-edit-link');
  var activeArticles = [];

  function getMarked() {
    try { return JSON.parse(localStorage.getItem('wgo-marked') || '{}'); }
    catch(e) { return {}; }
  }

  function getMarkStatus(entry) {
    if (!entry) return null;
    return typeof entry === 'object' ? entry.status : entry;
  }

  function saveMark(slug, status) {
    var marked = getMarked();
    marked[slug] = { status: status, markedAt: Date.now() };
    localStorage.setItem('wgo-marked', JSON.stringify(marked));
  }

  function refreshActive() {
    var marked = getMarked();
    allArticles.forEach(function(a) {
      a.style.display = getMarkStatus(marked[a.dataset.slug]) ? 'none' : '';
    });
    activeArticles = allArticles.filter(function(a) { return !getMarkStatus(marked[a.dataset.slug]); });
  }

  refreshActive();

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var idx = activeArticles.indexOf(entry.target);
        if (idx !== -1) {
          currentIndex = idx;
          updateCounter();
          updateEditLink();
        }
      }
    });
  }, { threshold: 0.6 });
  allArticles.forEach(function(a) { observer.observe(a); });

  function updateCounter() {
    if (counter) {
      counter.textContent = activeArticles.length
        ? (currentIndex + 1) + ' / ' + activeArticles.length
        : '–';
    }
  }

  function updateEditLink() {
    if (editLink && activeArticles[currentIndex]) {
      var slug = activeArticles[currentIndex].dataset.slug;
      editLink.href = slug ? '/admin/#/collections/blog/entries/' + slug : '/admin/';
    }
  }

  function goTo(index) {
    if (!activeArticles.length) return;
    currentIndex = ((index % activeArticles.length) + activeArticles.length) % activeArticles.length;
    gsap.to(window, {
      duration: 0.8,
      scrollTo: { y: activeArticles[currentIndex], offsetY: 0 },
      ease: 'power2.inOut'
    });
    updateCounter();
    updateEditLink();
    if (!paused) resetTimer();
  }

  function pause() {
    paused = true;
    clearInterval(timer);
    if (progressTween) progressTween.kill();
    if (progressBar) gsap.set(progressBar, { scaleX: 0 });
    var btn = document.getElementById('btn-pause-play');
    if (btn) btn.innerHTML = '&#9654;';
  }

  function play() {
    paused = false;
    var btn = document.getElementById('btn-pause-play');
    if (btn) btn.innerHTML = '&#9646;&#9646;';
    resetTimer();
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  function markCurrent(status) {
    if (!activeArticles.length) return;
    var article = activeArticles[currentIndex];
    var slug = article.dataset.slug;
    if (!slug) return;

    // Persist to GitHub if marking done
    if (status === 'done') {
      var post = (window.WGO_POSTS || []).find(function(p) { return p.slug === slug; });
      if (post && post.inputPath) {
        fetch('/.netlify/functions/mark-done', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputPath: post.inputPath })
        }).catch(function(err) {
          console.warn('mark-done function error:', err);
        });
      }
    }

    saveMark(slug, status);
    refreshActive();
    if (!activeArticles.length) {
      clearInterval(timer);
      if (progressTween) progressTween.kill();
      updateCounter();
      return;
    }
    currentIndex = Math.min(currentIndex, activeArticles.length - 1);
    goTo(currentIndex);
  }

  function resetTimer() {
    clearInterval(timer);
    if (progressTween) progressTween.kill();
    if (progressBar) {
      gsap.set(progressBar, { scaleX: 0 });
      progressTween = gsap.to(progressBar, {
        duration: INTERVAL / 1000,
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center'
      });
    }
    timer = setInterval(next, INTERVAL);
  }

  var btnNext = document.getElementById('btn-next');
  var btnPrev = document.getElementById('btn-prev');
  var btnPausePlay = document.getElementById('btn-pause-play');
  var btnDone = document.getElementById('btn-mark-done');
  var btnWontDo = document.getElementById('btn-mark-wontdo');
  if (btnNext) btnNext.addEventListener('click', next);
  if (btnPrev) btnPrev.addEventListener('click', prev);
  if (btnPausePlay) btnPausePlay.addEventListener('click', function() { paused ? play() : pause(); });
  if (btnDone) btnDone.addEventListener('click', function() { markCurrent('done'); });
  if (btnWontDo) btnWontDo.addEventListener('click', function() { markCurrent('wontdo'); });

  var adminPanel = document.getElementById('admin-panel');
  if (adminPanel) {
    adminPanel.addEventListener('mouseenter', function() {
      clearInterval(timer);
      if (progressTween) progressTween.kill();
      if (progressBar) gsap.set(progressBar, { scaleX: 0 });
    });
    adminPanel.addEventListener('mouseleave', function() {
      if (!paused) resetTimer();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prev();
    }
  });

  updateCounter();
  updateEditLink();
  resetTimer();
});