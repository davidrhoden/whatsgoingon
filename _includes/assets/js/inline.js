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

  var articles = Array.from(document.querySelectorAll('main article'));
  if (articles.length < 2) return;

  var currentIndex = 0;
  var INTERVAL = 15000;
  var timer;
  var progressBar = document.getElementById('slide-progress');
  var progressTween;
  var counter = document.getElementById('slide-counter');

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        currentIndex = articles.indexOf(entry.target);
        updateCounter();
      }
    });
  }, { threshold: 0.6 });
  articles.forEach(function(a) { observer.observe(a); });

  function updateCounter() {
    if (counter) {
      counter.textContent = (currentIndex + 1) + ' / ' + articles.length;
    }
  }

  function goTo(index) {
    currentIndex = ((index % articles.length) + articles.length) % articles.length;
    gsap.to(window, {
      duration: 0.8,
      scrollTo: { y: articles[currentIndex], offsetY: 0 },
      ease: 'power2.inOut'
    });
    updateCounter();
    resetTimer();
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

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

  var btn = document.querySelector('header button');
  if (btn) btn.addEventListener('click', next);

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
  resetTimer();
});