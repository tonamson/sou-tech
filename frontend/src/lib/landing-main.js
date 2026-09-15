/**
 * Fade stage carousel + GSAP content motion + mobile bottom sheet (direction A).
 */
import gsap from "gsap";

export function initLandingMain() {
  var track = document.getElementById("landing-track");
  if (!track || track.dataset.souInited === "1") return;
  track.dataset.souInited = "1";
  window.__souLandingMainInited = true;
  var slides = Array.prototype.slice.call(
    document.querySelectorAll(".landing-slide")
  );
  var buttons = Array.prototype.slice.call(
    document.querySelectorAll("a[data-slide], button[data-slide]")
  );
  var progress = document.getElementById("landing-slide-progress");
  var brand = document.querySelector(".landing-brand");
  var sideNav = document.getElementById("landing-side-nav");
  var sheetPill = document.getElementById("landing-sheet-pill");
  var pillNum = document.getElementById("landing-sheet-pill-num");
  var pillFloor = document.getElementById("landing-sheet-pill-floor");
  var pillTitle = document.getElementById("landing-sheet-pill-title");
  var total = slides.length;
  var initialIndex = slides.findIndex(function (slide) {
    return "#" + slide.id === window.location.hash;
  });
  var index = initialIndex >= 0 ? initialIndex : 0;
  var locked = false;
  var lockMs = 700;
  var touchX = null;
  var touchY = null;
  var touchOnSheet = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Match SCSS @include media(md) — full-bleed WebGL + bottom sheet
  var narrowMq = window.matchMedia("(max-width: 1024px)");
  var hasGsap = typeof gsap !== "undefined";
  var slideTl = null;
  // Match 3D floorMeta titles
  var floorPillMeta = [
    { num: "01", floor: "Lobby" },
    { num: "02", floor: "Meet" },
    { num: "03", floor: "Labs" },
    { num: "04", floor: "Ship" },
    { num: "05", floor: "Talk" },
  ];

  if (hasGsap && gsap.ticker && gsap.ticker.lagSmoothing) {
    gsap.ticker.lagSmoothing(500, 33);
  }

  var contentSel = [
    ".landing-eyebrow",
    ".landing-slide__title",
    ".landing-slide__desc",
    ".landing-slide__actions",
    ".landing-slide__trust > *",
    ".landing-feature",
    ".landing-value",
    ".landing-cap-mini",
    ".landing-slide__steps > *",
    ".landing-contact-copy > *",
  ].join(",");

  function isNarrow() {
    return narrowMq.matches;
  }

  function contentNodes(slide) {
    if (!slide) return [];
    return Array.prototype.slice.call(slide.querySelectorAll(contentSel));
  }

  function activeCopy() {
    return slides[index] && slides[index].querySelector(".landing-slide__copy");
  }

  function syncPillLabel() {
    var meta = floorPillMeta[index] || floorPillMeta[0];
    var slide = slides[index];
    var line = slide && slide.querySelector(".landing-slide__title-line");
    var title = line ? line.textContent.trim() : "";
    if (pillNum) pillNum.textContent = meta.num;
    if (pillFloor) pillFloor.textContent = meta.floor;
    if (pillTitle) pillTitle.textContent = title;
  }

  function setPillOpen(open) {
    if (!sheetPill) return;
    sheetPill.classList.toggle("is-open", !!open);
    sheetPill.setAttribute("aria-expanded", open ? "true" : "false");
    sheetPill.setAttribute(
      "aria-label",
      open ? "Thu nội dung section" : "Mở nội dung section"
    );
  }

  function setSheetOpen(open) {
    var copy = activeCopy();
    if (!copy) return;
    copy.classList.toggle("is-sheet-open", !!open);
    setPillOpen(!!open);
    document.body.classList.toggle("is-sheet-open", !!open && isNarrow());
  }

  function collapseSheet() {
    document.body.classList.remove("is-sheet-open");
    setPillOpen(false);
    slides.forEach(function (slide) {
      var copy = slide.querySelector(".landing-slide__copy");
      if (copy) copy.classList.remove("is-sheet-open");
    });
  }

  function initSheetPill() {
    if (!sheetPill) return;
    syncPillLabel();
    sheetPill.addEventListener("click", function (e) {
      e.preventDefault();
      if (!isNarrow()) return;
      var copy = activeCopy();
      if (!copy) return;
      setSheetOpen(!copy.classList.contains("is-sheet-open"));
    });
  }

  function setNav(active) {
    document.querySelectorAll(".landing-side-nav__btn").forEach(function (btn) {
      var i = Number(btn.getAttribute("data-slide"));
      var on = i === active;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-current", on ? "true" : "false");
    });
    if (progress) {
      progress.style.height = ((active + 1) / total) * 100 + "%";
    }
    var currentEl = document.getElementById("landing-slide-current");
    if (currentEl) {
      currentEl.textContent = (active + 1 < 10 ? "0" : "") + (active + 1);
    }
    syncPillLabel();
  }

  function markSlides(active) {
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === active);
      slide.setAttribute("aria-hidden", i === active ? "false" : "true");
    });
  }

  function fadeSlides(prev, next, onDone) {
    var from = slides[prev];
    var to = slides[next];
    if (!from || !to) {
      if (onDone) onDone();
      return;
    }

    if (slideTl) {
      slideTl.kill();
      slideTl = null;
    }

    // Narrow: sheet + WebGL — restore content opacity (form etc.)
    if (isNarrow() || !hasGsap || reduceMotion) {
      if (hasGsap) {
        gsap.set(from, { autoAlpha: 0 });
        gsap.set(to, { autoAlpha: 1 });
        var toContent = to.querySelector(".landing-slide__content");
        if (toContent) gsap.set(toContent, { visibility: "visible" });
        gsap.set(contentNodes(to), { autoAlpha: 1, y: 0 });
        gsap.set(contentNodes(from), { autoAlpha: 0 });
      } else {
        from.style.opacity = "0";
        from.style.visibility = "hidden";
        to.style.opacity = "1";
        to.style.visibility = "visible";
      }
      if (onDone) onDone();
      return;
    }

    var toContent = to.querySelector(".landing-slide__content");
    var fromContent = from.querySelector(".landing-slide__content");
    var toNodes = contentNodes(to);
    var fromNodes = contentNodes(from);

    if (toContent) gsap.set(toContent, { visibility: "visible" });
    gsap.set(to, { autoAlpha: 1 });
    gsap.set(toNodes, { autoAlpha: 0, y: 8 });

    slideTl = gsap.timeline({
      onComplete: function () {
        if (fromContent) gsap.set(fromContent, { visibility: "hidden" });
        gsap.set(from, { autoAlpha: 0 });
        gsap.set(fromNodes, { autoAlpha: 0, y: 8 });
        if (onDone) onDone();
      },
      defaults: { force3D: true, ease: "power2.out" },
    });
    slideTl.to(fromNodes, { autoAlpha: 0, y: -6, duration: 0.28, stagger: 0.015 }, 0);
    slideTl.to(
      toNodes,
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.03 },
      0.12
    );
  }

  function setSlide(next, historyMethod = "replaceState") {
    if (next < 0 || next >= total) return;
    if (next === index) {
      if (isNarrow()) setSheetOpen(true);
      return;
    }
    if (locked) return;
    locked = true;
    var prev = index;
    index = next;

    setNav(index);
    collapseSheet();

    if (typeof window.transitionWebGlBg === "function") {
      window.transitionWebGlBg(prev, index);
    }

    markSlides(index);
    if (isNarrow()) setSheetOpen(true);
    if (historyMethod) {
      window.history[historyMethod](null, "", "#" + slides[index].id);
    }
    fadeSlides(prev, index, function () {
      locked = false;
    });

    window.setTimeout(function () {
      locked = false;
    }, lockMs + 300);
  }

  function introChrome() {
    if (!hasGsap || reduceMotion) return;
    if (brand) {
      gsap.from(brand, {
        autoAlpha: 0,
        y: 16,
        duration: 0.7,
        ease: "power3.out",
      });
    }
    if (sideNav) {
      gsap.from(sideNav.querySelectorAll(".landing-side-nav__btn"), {
        autoAlpha: 0,
        x: 24,
        duration: 0.55,
        stagger: 0.06,
        delay: 0.15,
        ease: "power3.out",
        clearProps: "opacity,visibility,transform",
      });
    }
  }

  initSheetPill();
  slides.forEach(function (slide, i) {
    slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    var content = slide.querySelector(".landing-slide__content");
    var nodes = contentNodes(slide);

    if (hasGsap) {
      gsap.set(slide, { autoAlpha: i === index ? 1 : 0 });
      if (i === index) {
        if (content) gsap.set(content, { visibility: "visible" });
      } else {
        if (content) gsap.set(content, { visibility: "hidden" });
        gsap.set(nodes, { autoAlpha: 0, y: 10 });
      }
    } else {
      slide.style.opacity = i === index ? "1" : "0";
      slide.style.visibility = i === index ? "visible" : "hidden";
    }
  });

  markSlides(index);
  setNav(index);
  if (isNarrow() && initialIndex > 0) setSheetOpen(true);
  introChrome();

  buttons.forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      var next = Number(el.getAttribute("data-slide"));
      if (!Number.isNaN(next)) setSlide(next, "pushState");
    });
  });

  window.addEventListener("hashchange", function () {
    var next = slides.findIndex(function (slide) {
      return "#" + slide.id === window.location.hash;
    });
    if (next < 0 && window.location.hash) return;
    locked = false;
    setSlide(next < 0 ? 0 : next, null);
  });

  var wheelTick = 0;
  window.addEventListener(
    "wheel",
    function (e) {
      if (
        isNarrow() &&
        e.target &&
        e.target.closest &&
        e.target.closest(".landing-slide__copy")
      ) {
        return;
      }
      var dx = e.deltaX;
      var dy = e.deltaY;
      var dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(dominant) < 12) return;
      e.preventDefault();
      var now = Date.now();
      if (now - wheelTick < lockMs) return;
      wheelTick = now;
      if (dominant > 0) setSlide(index + 1);
      else setSlide(index - 1);
    },
    { passive: false }
  );

  window.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
    // Let an expanded mobile sheet scroll with the keyboard.
    if (isNarrow() && document.body.classList.contains("is-sheet-open") &&
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(e.key)) return;
    if (
      e.key === "ArrowRight" ||
      e.key === "ArrowDown" ||
      e.key === "PageDown"
    ) {
      e.preventDefault();
      setSlide(index + 1);
    } else if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowUp" ||
      e.key === "PageUp"
    ) {
      e.preventDefault();
      setSlide(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSlide(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setSlide(total - 1);
    }
  });

  window.addEventListener(
    "touchstart",
    function (e) {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      touchOnSheet = !!(
        e.target &&
        e.target.closest &&
        e.target.closest(".landing-slide__copy, .landing-sheet-pill")
      );
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    function (e) {
      if (touchX == null) return;
      var dx = touchX - e.changedTouches[0].clientX;
      var dy = touchY - e.changedTouches[0].clientY;
      touchX = null;
      touchY = null;
      if (touchOnSheet) {
        touchOnSheet = false;
        return;
      }
      touchOnSheet = false;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0) setSlide(index + 1);
      else setSlide(index - 1);
    },
    { passive: true }
  );

  narrowMq.addEventListener("change", function () {
    collapseSheet();
    if (isNarrow()) setSheetOpen(true);
  });

  // Enhance only after navigation is ready; failed/disabled JS keeps readable HTML.
  document.documentElement.classList.add("landing-enhanced");
}
