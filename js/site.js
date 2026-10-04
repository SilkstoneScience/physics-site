// Shared code used by every page: MathJax settings, the syllabus list,
// and the header, menu and footer.

// MathJax settings: $...$ for inline maths, $$...$$ for displayed equations.
window.MathJax = {
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
};

// The syllabus. Edit here to rename a topic; menus and topic lists update everywhere.
// hl: true marks topics that are HL only.
window.SYLLABUS = [
  { id: 'A', title: 'Space, time and motion', topics: [
    { id: 'A.1', title: 'Kinematics' },
    { id: 'A.2', title: 'Forces and momentum' },
    { id: 'A.3', title: 'Work, energy and power' },
    { id: 'A.4', title: 'Rigid body mechanics', hl: true },
    { id: 'A.5', title: 'Galilean and special relativity', hl: true },
  ] },
  { id: 'B', title: 'The particle nature of matter', topics: [
    { id: 'B.1', title: 'Thermal energy transfers' },
    { id: 'B.2', title: 'Greenhouse effect' },
    { id: 'B.3', title: 'Gas laws' },
    { id: 'B.4', title: 'Thermodynamics', hl: true },
    { id: 'B.5', title: 'Current and circuits' },
  ] },
  { id: 'C', title: 'Wave behaviour', topics: [
    { id: 'C.1', title: 'Simple harmonic motion' },
    { id: 'C.2', title: 'Wave model' },
    { id: 'C.3', title: 'Wave phenomena' },
    { id: 'C.4', title: 'Standing waves and resonance' },
    { id: 'C.5', title: 'Doppler effect' },
  ] },
  { id: 'D', title: 'Fields', topics: [
    { id: 'D.1', title: 'Gravitational fields' },
    { id: 'D.2', title: 'Electric and magnetic fields' },
    { id: 'D.3', title: 'Motion in electromagnetic fields' },
    { id: 'D.4', title: 'Induction', hl: true },
  ] },
  { id: 'E', title: 'Nuclear and quantum physics', topics: [
    { id: 'E.1', title: 'Structure of the atom' },
    { id: 'E.2', title: 'Quantum physics', hl: true },
    { id: 'E.3', title: 'Radioactive decay' },
    { id: 'E.4', title: 'Fission' },
    { id: 'E.5', title: 'Fusion and stars' },
  ] },
];

// "A.1" -> "a1.html"
window.topicFile = (id) => id.replace('.', '').toLowerCase() + '.html';

(function () {
  const body = document.body;
  const root = body.dataset.root || '';
  const section = body.dataset.section || '';
  const hlTag = '<span class="tag hl">HL</span>';

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
        <h3><span class="code">${s.id}</span>${s.title} ${s.hl ? hlTag : ''}</h3>
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
})();
