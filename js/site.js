// Shared code used by every page: MathJax settings, the syllabus list,
// and the header, menu and footer.

// MathJax settings: $...$ for inline maths, $$...$$ for displayed equations.
window.MathJax = {
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
};

// The syllabus. Edit here to rename a topic; menus and topic lists update everywhere.
// hl: true marks topics that are HL only (as in the IB guide's syllabus roadmap).
// hlExtra: true marks topics for everyone that also have additional HL content.
window.SYLLABUS = [
  { id: 'A', title: 'Space, time and motion', topics: [
    { id: 'A.1', title: 'Kinematics' },
    { id: 'A.2', title: 'Forces and momentum' },
    { id: 'A.3', title: 'Work, energy and power' },
    { id: 'A.4', title: 'Rigid body mechanics', hl: true },
    { id: 'A.5', title: 'Galilean and special relativity', hl: true },
  ] },
  { id: 'B', title: 'The particulate nature of matter', topics: [
    { id: 'B.1', title: 'Thermal energy transfers' },
    { id: 'B.2', title: 'Greenhouse effect' },
    { id: 'B.3', title: 'Gas laws' },
    { id: 'B.4', title: 'Thermodynamics', hl: true },
    { id: 'B.5', title: 'Current and circuits' },
  ] },
  { id: 'C', title: 'Wave behaviour', topics: [
    { id: 'C.1', title: 'Simple harmonic motion', hlExtra: true },
    { id: 'C.2', title: 'Wave model' },
    { id: 'C.3', title: 'Wave phenomena', hlExtra: true },
    { id: 'C.4', title: 'Standing waves and resonance' },
    { id: 'C.5', title: 'Doppler effect', hlExtra: true },
  ] },
  { id: 'D', title: 'Fields', topics: [
    { id: 'D.1', title: 'Gravitational fields', hlExtra: true },
    { id: 'D.2', title: 'Electric and magnetic fields', hlExtra: true },
    { id: 'D.3', title: 'Motion in electromagnetic fields' },
    { id: 'D.4', title: 'Induction', hl: true },
  ] },
  { id: 'E', title: 'Nuclear and quantum physics', topics: [
    { id: 'E.1', title: 'Structure of the atom', hlExtra: true },
    { id: 'E.2', title: 'Quantum physics', hl: true },
    { id: 'E.3', title: 'Radioactive decay', hlExtra: true },
    { id: 'E.4', title: 'Fission' },
    { id: 'E.5', title: 'Fusion and stars' },
  ] },
];

// "A.1" -> "a1.html"
window.topicFile = (id) => id.replace('.', '').toLowerCase() + '.html';

// Link to the full IB data booklet (a Google Drive share link, set to "Anyone with the link").
// Used by the "Σ Equations" panel and the Resources page. Leave empty until there is a link.
// Never put the PDF itself in this website folder: it is copyrighted and this folder is public.
window.DATA_BOOKLET_URL = 'https://drive.google.com/open?id=1vtP7efHOuywaeqp1YeYcqorHjxl5r49-&usp=drive_fs';

// Data-booklet equations for each topic, shown in the "Σ Equations" panel.
// Written from the 2025 IB Physics data booklet (same symbols); the labels are ours.
// Add a topic here when its notes page is written. Backslashes are doubled inside JS strings.
window.DATA_BOOKLET = {
  'A.1': {
    equations: [
      ['Displacement from the average velocity', 's = \\frac{u + v}{2}\\,t'],
      ['Velocity after time t', 'v = u + at'],
      ['Displacement after time t', 's = ut + \\tfrac{1}{2}at^2'],
      ['Linking velocity and displacement (no t)', 'v^2 = u^2 + 2as'],
    ],
    note: 'These four equations only apply when the acceleration is constant. $s$ = displacement, $u$ = initial velocity, $v$ = final velocity, $a$ = acceleration, $t$ = time.',
    constants: ['g'],
  },
  'A.2': {
    equations: [
      ['Static friction (maximum is μ<sub>s</sub>F<sub>N</sub>)', 'F_f \\le \\mu_s F_N'],
      ['Dynamic friction', 'F_f = \\mu_d F_N'],
      ["Hooke's law (elastic restoring force)", 'F_H = -kx'],
      ["Viscous drag on a small sphere (Stokes' law)", 'F_d = 6\\pi\\eta r v'],
      ['Buoyancy', 'F_b = \\rho V g'],
      ['Weight', 'F_g = mg'],
      ['Momentum', 'p = mv'],
      ['Impulse', 'J = F\\Delta t'],
      ["Newton's second law", 'F = ma = \\frac{\\Delta p}{\\Delta t}'],
      ['Centripetal acceleration', 'a = \\frac{v^2}{r} = \\omega^2 r = \\frac{4\\pi^2 r}{T^2}'],
      ['Speed in circular motion', 'v = \\frac{2\\pi r}{T} = \\omega r'],
    ],
    constants: ['g'],
  },
  'A.3': {
    equations: [
      ['Work done by a constant force', 'W = Fs\\cos\\theta'],
      ['Kinetic energy', 'E_k = \\tfrac{1}{2}mv^2 = \\frac{p^2}{2m}'],
      ['Change in gravitational potential energy (near the Earth)', '\\Delta E_p = mg\\Delta h'],
      ['Elastic potential energy', 'E_H = \\tfrac{1}{2}k(\\Delta x)^2'],
      ['Power', 'P = \\frac{\\Delta W}{\\Delta t} = Fv'],
      ['Efficiency (energy)', '\\eta = \\frac{\\text{useful work out}}{\\text{total work in}}'],
      ['Efficiency (power)', '\\eta = \\frac{\\text{useful power out}}{\\text{total power in}}'],
    ],
    note: '$\\theta$ is the angle between the force and the displacement. 1 kWh = 3.6 MJ.',
    constants: ['g'],
  },
  // A third item `true` marks an equation as HL only (shown with an HL tag).
  'C.1': {
    equations: [
      ['Defining equation of SHM', 'a = -\\omega^2 x'],
      ['Period, frequency and angular frequency', 'T = \\frac{1}{f} = \\frac{2\\pi}{\\omega}'],
      ['Period of a mass–spring system', 'T = 2\\pi\\sqrt{\\frac{m}{k}}'],
      ['Period of a simple pendulum', 'T = 2\\pi\\sqrt{\\frac{l}{g}}'],
      ['Displacement', 'x = x_0\\sin(\\omega t + \\phi)', true],
      ['Velocity', 'v = \\omega x_0\\cos(\\omega t + \\phi)', true],
      ['Velocity at displacement x', 'v = \\pm\\,\\omega\\sqrt{x_0^2 - x^2}', true],
      ['Total energy', 'E_T = \\tfrac{1}{2}m\\omega^2 x_0^2', true],
      ['Potential energy', 'E_p = \\tfrac{1}{2}m\\omega^2 x^2', true],
    ],
    note: 'Use radians for $\\omega t + \\phi$.',
    constants: ['g'],
  },
  'C.2': {
    equations: [
      ['Wave speed', 'v = f\\lambda = \\frac{\\lambda}{T}'],
    ],
    note: 'Visible light: about 400 nm (violet) to 700 nm (red). The data booklet shows the wavelength range of each part of the EM spectrum.',
    constants: ['c'],
  },
  'C.3': {
    equations: [
      ["Snell's law", '\\frac{n_1}{n_2} = \\frac{\\sin\\theta_2}{\\sin\\theta_1} = \\frac{v_2}{v_1}'],
      ['Constructive interference', '\\text{path difference} = n\\lambda'],
      ['Destructive interference', '\\text{path difference} = \\left(n + \\tfrac{1}{2}\\right)\\lambda'],
      ["Young's double slit (fringe spacing)", 's = \\frac{\\lambda D}{d}'],
      ['Single slit: first minimum (θ in radians)', '\\theta = \\frac{\\lambda}{b}', true],
      ['Diffraction grating / multiple slits', 'n\\lambda = d\\sin\\theta', true],
    ],
    note: 'Angles are measured from the normal. $d$ = slit separation, $D$ = slit-to-screen distance, $b$ = slit width.',
    constants: ['c'],
  },
};
// Fundamental constants from the data booklet (add more as topics need them; check each value against the PDF).
window.CONSTANTS = {
  g: ["Acceleration of free fall (Earth's surface)", 'g = 9.8\\ \\text{m s}^{-2}'],
  c: ['Speed of light in a vacuum', 'c = 3.00 \\times 10^{8}\\ \\text{m s}^{-1}'],
};

(function () {
  const body = document.body;
  const root = body.dataset.root || '';
  const section = body.dataset.section || '';
  const hlTag = '<span class="tag hl">HL only</span>';
  const hlExtraTag = '<span class="tag hl">+ HL extra</span>';

  // ----- Header and menu -----
  const links = [
    ['themes', 'themes/index.html', 'Themes'],
    ['questions', 'questions.html', 'Question bank'],
    ['experimental', 'experimental/index.html', 'Experimental programme'],
    ['ee', 'ee/index.html', 'Extended essay'],
    ['resources', 'resources.html', 'Resources'],
  ];
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <div class="inner">
        <a class="brand" href="${root}index.html">DP Physics <span>Study Guide</span></a>
        <button class="menu-btn" aria-expanded="false" aria-controls="site-nav">Menu</button>
        <nav class="site-nav" id="site-nav" aria-label="Main">
          <ul>${links.map(([key, href, label]) =>
            `<li><a href="${root}${href}"${key === section ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}
          </ul>
        </nav>
      </div>`;
    const btn = header.querySelector('.menu-btn');
    const nav = header.querySelector('.site-nav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  }

  // ----- Footer -----
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `<div class="inner">A study guide for IB Diploma Programme Physics students.
      This site is not produced or endorsed by the International Baccalaureate Organization.</div>`;
  }

  // ----- List of all themes: <div data-theme-list></div> -----
  document.querySelectorAll('[data-theme-list]').forEach((el) => {
    el.innerHTML = `<ul class="card-grid">${SYLLABUS.map((t) => `
      <li><a class="card" data-theme="${t.id}" href="${root}themes/${t.id.toLowerCase()}.html">
        <h3>Theme ${t.id}: ${t.title}</h3>
        <p>${t.topics.map((s) => s.id).join(' · ')}</p>
      </a></li>`).join('')}</ul>`;
  });

  // ----- Subtopics of one theme: <div data-topic-list="A"></div> -----
  document.querySelectorAll('[data-topic-list]').forEach((el) => {
    const theme = SYLLABUS.find((t) => t.id === el.dataset.topicList);
    if (!theme) return;
    el.innerHTML = `<ul class="card-grid">${theme.topics.map((s) => `
      <li><a class="card" data-theme="${theme.id}" href="${root}themes/${topicFile(s.id)}">
        <h3><span class="code">${s.id}</span>${s.title} ${s.hl ? hlTag : s.hlExtra ? hlExtraTag : ''}</h3>
      </a></li>`).join('')}</ul>`;
  });

  // ----- Previous / next links on subtopic pages: <body data-topic="A.1"> + <nav id="topic-nav"> -----
  const topicNav = document.getElementById('topic-nav');
  if (topicNav && body.dataset.topic) {
    const all = SYLLABUS.flatMap((t) => t.topics);
    const i = all.findIndex((s) => s.id === body.dataset.topic);
    const prev = all[i - 1];
    const next = all[i + 1];
    topicNav.className = 'topic-nav';
    topicNav.innerHTML =
      (prev ? `<a class="card" href="${topicFile(prev.id)}">← ${prev.id} ${prev.title}</a>` : '<span></span>') +
      (next ? `<a class="card next" href="${topicFile(next.id)}">${next.id} ${next.title} →</a>` : '');
  }

  // ----- Data booklet card on the Resources page uses DATA_BOOKLET_URL -----
  const bookletCard = document.querySelector('#data-booklet a');
  if (bookletCard) {
    if (DATA_BOOKLET_URL) {
      bookletCard.href = DATA_BOOKLET_URL;
    } else {
      bookletCard.removeAttribute('href');
      bookletCard.removeAttribute('target');
    }
  }

  // ----- "Back to previous page" button at the bottom of every page -----
  let cameFromSite = false;
  try {
    const ref = new URL(document.referrer);
    cameFromSite = ref.origin === location.origin && ref.pathname !== location.pathname;
  } catch (e) { /* no referrer: opened from a bookmark, a typed address or another site */ }
  const main = document.querySelector('main');
  if (main && !(section === 'home' && !cameFromSite)) {
    // Where to go if the student didn't arrive from another page of this site.
    let fallbackHref = root + 'index.html';
    let fallbackLabel = 'home page';
    if (body.dataset.topic) {
      const theme = body.dataset.topic.charAt(0);
      fallbackHref = `${root}themes/${theme.toLowerCase()}.html`;
      fallbackLabel = `Theme ${theme}`;
    } else if (section === 'themes' && !/themes\/(index\.html)?$/.test(location.pathname)) {
      fallbackHref = root + 'themes/index.html';
      fallbackLabel = 'all themes';
    }
    const back = document.createElement('p');
    back.className = 'page-back';
    back.innerHTML = cameFromSite
      ? `<a class="button secondary" href="${document.referrer}">← Back to previous page</a>`
      : `<a class="button secondary" href="${fallbackHref}">← Back to ${fallbackLabel}</a>`;
    if (cameFromSite) {
      // The browser's own "back" returns to the same scroll position on the previous page.
      back.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); history.back(); });
    }
    main.appendChild(back);
  }

  // In-page links (e.g. the contents list) jump without adding a history step,
  // so "Back to previous page" leaves the page instead of just scrolling up it.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView();
    history.replaceState(null, '', '#' + id);
  });

  // ----- "Σ Equations" button and panel (topic pages and the question bank) -----
  // The question bank tells the panel which topic is showing by calling window.setEquationTopic('A.2').
  const usesMathJax = !!document.querySelector('script[src*="mathjax"]');
  if (usesMathJax && (body.dataset.topic || section === 'questions')) buildEquationPanel();

  function buildEquationPanel() {
    const allTopics = SYLLABUS.flatMap((t) => t.topics);
    const withData = allTopics.filter((s) => DATA_BOOKLET[s.id]);
    let currentTopic = body.dataset.topic || '';

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'eq-fab';
    fab.setAttribute('aria-controls', 'eq-panel');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '<span aria-hidden="true">Σ</span> Equations';

    const panel = document.createElement('aside');
    panel.className = 'eq-panel';
    panel.id = 'eq-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Data booklet equations');
    panel.innerHTML = `
      <div class="eq-head">
        <strong>Data booklet equations</strong>
        <button type="button" class="eq-close" aria-label="Close equations">×</button>
      </div>
      <label class="eq-pick">Topic
        <select>${withData.map((s) => `<option value="${s.id}">${s.id} ${s.title}</option>`).join('')}</select>
      </label>
      <div class="eq-body" aria-live="polite"></div>
      <p class="eq-foot">${DATA_BOOKLET_URL
        ? `<a href="${DATA_BOOKLET_URL}" target="_blank" rel="noopener">Open the annotated data booklet ↗</a>`
        : '<span class="eq-note">A link to the full data booklet is coming soon.</span>'}</p>`;
    document.body.append(fab, panel);
    body.classList.add('has-eq');

    const select = panel.querySelector('select');
    const out = panel.querySelector('.eq-body');

    function render() {
      const d = DATA_BOOKLET[currentTopic];
      const info = allTopics.find((s) => s.id === currentTopic);
      if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([out]);
      if (!d) {
        out.innerHTML = `<p class="eq-note">${info ? `Equations for ${info.id} ${info.title} haven't been added yet.` : 'Choose a topic.'}
          Pick another topic above, or open the full data booklet.</p>`;
        select.selectedIndex = -1;
      } else {
        select.value = currentTopic;
        out.innerHTML = d.equations.map(([label, tex, hl]) =>
          `<div class="eq-item"><div class="eq-label">${label}${hl ? ' <span class="tag hl">HL</span>' : ''}</div>$$${tex}$$</div>`).join('') +
          (d.note ? `<p class="eq-note">${d.note}</p>` : '') +
          (d.constants && d.constants.length ? `<h4>Constants</h4>` + d.constants.map((c) =>
            `<div class="eq-item"><div class="eq-label">${CONSTANTS[c][0]}</div>$$${CONSTANTS[c][1]}$$</div>`).join('') : '');
      }
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(console.error);
    }
    function open() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      render();
      panel.querySelector('.eq-close').focus();
    }
    function close() {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
      fab.focus();
    }

    fab.addEventListener('click', () => (panel.hidden ? open() : close()));
    panel.querySelector('.eq-close').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
    select.addEventListener('change', () => { currentTopic = select.value; render(); });

    window.setEquationTopic = (id) => {
      if (id === currentTopic) return;
      currentTopic = id;
      if (!panel.hidden) render();
    };
  }
})();
