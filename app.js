// Portfolio interactions — plain JS port of the original Claude Design dc-script.
// Behaviours: hover-lift on cards, reveal-on-scroll for sections, count-up on stats.
(function () {
  function init() {
    var root = document;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Hover lift
    root.querySelectorAll('[data-lift]').forEach(function (n) {
      n.addEventListener('mouseenter', function () { n.style.transform = 'translateY(-6px)'; });
      n.addEventListener('mouseleave', function () { n.style.transform = 'none'; });
    });

    // Reveal on scroll — strictly additive: hide only once an observer callback
    // proves it works, and never leave anything hidden if observation goes quiet.
    if (!reduce) {
      var items = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]'));
      var clear = function (n) { n.style.opacity = ''; n.style.transform = ''; n.style.transition = ''; };
      var armed = false, alive = true;
      var bail = function () { alive = false; items.forEach(clear); };
      var failsafe = setTimeout(bail, 1600);
      var show = function (n) {
        if (n.dataset.shown) return;
        n.dataset.shown = '1';
        n.style.opacity = '1';
        n.style.transform = 'none';
      };
      var inView = function (n) {
        var r = n.getBoundingClientRect();
        var h = window.innerHeight;
        return r.top < h * 0.92 && r.bottom > 0;
      };
      var sweep = function () {
        if (!alive) return;
        items.forEach(function (n) { if (inView(n) || n.getBoundingClientRect().top < 0) show(n); });
        if (items.every(function (n) { return n.dataset.shown; })) { clearTimeout(failsafe); detach(); }
      };
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; sweep(); });
      };
      var detach = function () {
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('scroll', onScroll);
      };
      var io = new IntersectionObserver(function (es) {
        if (!armed) {
          armed = true;
          clearTimeout(failsafe);
          items.forEach(function (n) {
            if (n.dataset.shown || inView(n)) { show(n); return; }
            n.style.opacity = '0';
            n.style.transform = 'translateY(20px)';
          });
        }
        es.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.top < 0) show(e.target); });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });
      items.forEach(function (n) {
        n.style.transition = 'opacity 700ms ease-out, transform 700ms cubic-bezier(.2,.7,.3,1)';
        io.observe(n);
      });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('hashchange', sweep);
    }

    // Count-up on stats
    var nums = root.querySelectorAll('[data-count]');
    if (nums.length && !reduce) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var target = parseFloat(e.target.getAttribute('data-count'));
          var dec = (target % 1 !== 0) ? 1 : 0;
          var pre = e.target.getAttribute('data-prefix') || '';
          var suf = e.target.getAttribute('data-suffix') || '';
          var start = performance.now(), dur = 1100;
          var step = function (now) {
            var t = Math.min(1, (now - start) / dur);
            var v = target * (1 - Math.pow(1 - t, 3));
            e.target.textContent = pre + (dec ? v.toFixed(1) : Math.round(v).toLocaleString()) + suf;
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      }, { threshold: 0.4 });
      nums.forEach(function (n) { cio.observe(n); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
