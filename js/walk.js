/* Draws one background simulation, picked at random on each page load. The trail fades with
   a 6-second half-life and is gone after 30 seconds; pausing freezes both motion and fading. */
(() => {
  'use strict';
  const svg = document.getElementById('walk-svg');
  if (!svg || !window.BackgroundModels) return;
  const fallback = document.getElementById('walk-path');
  const head = document.getElementById('walk-head');
  const toggle = document.getElementById('walk-toggle');
  const restart = document.getElementById('walk-restart');
  const controls = document.querySelector('.walk-controls');
  const label = document.getElementById('walk-label');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';

  const names = Object.keys(window.BackgroundModels);
  const model = window.BackgroundModels[names[Math.floor(Math.random() * names.length)]];
  if (label) { label.textContent = 'Tracer: ' + model.caption; label.title = model.description; }
  const svgTitle = document.getElementById('walk-title'), svgDesc = document.getElementById('walk-desc');
  if (svgTitle) svgTitle.textContent = model.caption[0].toUpperCase() + model.caption.slice(1);
  if (svgDesc) svgDesc.textContent = model.description;
  // Drawn icons rather than text glyphs, so the buttons look the same in every browser and font.
  const icons = {
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3.5" y="2.5" width="3" height="11" rx=".6"/><rect x="9.5" y="2.5" width="3" height="11" rx=".6"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 2.6v10.8a.6.6 0 0 0 .9.5l8.4-5.4a.6.6 0 0 0 0-1L5.4 2.1a.6.6 0 0 0-.9.5z"/></svg>'
  };

  const trail = document.createElementNS(ns, 'g');
  trail.setAttribute('class', 'walk-trace');
  trail.setAttribute('fill', 'none');
  svg.insertBefore(trail, head);

  const speed = 100, lifetime = 30, chunkSize = 50;
  let process, current, next, chunks = [], sample = 0, time = 0, fadeTime = 0, frame = 0, last = null;
  let playing = !reduced.matches, visible = true, started = false;
  // Fixed, isotropic coordinates: the scenery never rescales as new points arrive.
  const project = ([x, y]) => [550 + 230 * x, 320 + 230 * y];
  const coords = p => p.map(v => v.toFixed(2)).join(',');

  function build(seed) {
    process = model.create(seed);
    current = project(process.point()); next = project(process.next());
    chunks.forEach(c => c.node.remove()); chunks = []; sample = 0; time = 0; fadeTime = 0;
  }
  function addPoint(point) {
    if (sample % chunkSize === 0) {
      const node = document.createElementNS(ns, 'path');
      trail.appendChild(node);
      chunks.push({ node, d: 'M ' + coords(current), born: fadeTime });
    }
    const chunk = chunks[chunks.length - 1];
    chunk.d += ' L ' + coords(point); chunk.node.setAttribute('d', chunk.d);
  }
  // A still trail for when motion is off: the last stretch of a run, already faded by age.
  function stillTrail() {
    for (let i = 0; i < 3600; i++) { fadeTime = sample / speed; addPoint(next); current = next; next = project(process.next()); sample++; }
    time = sample / speed; fadeTime = time; started = true;
  }
  function draw() {
    if (started) {
      if (fallback.isConnected) fallback.remove();
      const fraction = time * speed - sample;
      const point = current.map((v, i) => v + fraction * (next[i] - v));
      head.setAttribute('cx', point[0]); head.setAttribute('cy', point[1]);
      if (chunks.length) {
        const chunk = chunks[chunks.length - 1];
        chunk.node.setAttribute('d', chunk.d + ' L ' + coords(point));
      }
      while (chunks.length && fadeTime - chunks[0].born >= lifetime) chunks.shift().node.remove();
      chunks.forEach(c => {
        const age = Math.max(0, fadeTime - c.born);
        // A 6-second half-life, gently tapering to zero before disposal.
        const alpha = Math.pow(2, -age / 6) * Math.min(1, (lifetime - age) / 6);
        c.node.style.opacity = alpha.toFixed(4);
      });
    }
    const state = playing ? 'pause' : 'play';
    if (toggle.dataset.icon !== state) { toggle.innerHTML = icons[state]; toggle.dataset.icon = state; }
    toggle.setAttribute('aria-label', playing ? 'Pause tracer' : 'Play tracer');
    toggle.setAttribute('title', playing ? 'Pause tracer' : 'Play tracer');
    toggle.setAttribute('aria-pressed', String(!playing));
  }
  function stopFrame() { cancelAnimationFrame(frame); frame = 0; last = null; }
  function schedule() { if (playing && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick); }
  function tick(now) {
    frame = 0;
    if (!playing || !visible || document.hidden) { last = null; return; }
    if (last !== null) {
      const elapsed = Math.max(0, (now - last) / 1000);
      fadeTime += elapsed;
      time += Math.min(elapsed, .1);
    }
    last = now; started = true;
    while (sample < Math.floor(time * speed)) {
      addPoint(next); current = next; next = project(process.next()); sample++;
    }
    draw(); schedule();
  }

  toggle.addEventListener('click', () => { playing = !playing; stopFrame(); draw(); schedule(); });
  restart.addEventListener('click', () => {
    stopFrame(); build(Math.floor(Math.random() * 4294967295) + 1);
    if (!playing) stillTrail();   // another still path, without turning motion on
    started = true; draw(); schedule();
  });
  document.addEventListener('visibilitychange', () => { stopFrame(); schedule(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; stopFrame(); schedule();
  }).observe(svg);
  reduced.addEventListener('change', event => { if (event.matches) { playing = false; stopFrame(); draw(); } });

  build(42);
  if (!playing) stillTrail();
  controls.hidden = false; draw(); schedule();
})();
