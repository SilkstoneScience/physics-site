// Builds the YouTube channels, Apps and software, and Simulations pages (resources/youtube.html, apps.html, simulations.html).
// To add or change a link: edit PAGES below, then run: node tools/build-links.mjs
// Each item: [name, url, source, note, flags]   flags: 'older' = older PhET simulation (runs on a computer, not a phone)
// Section keys: 'general', then topic ids 'a1' … 'e5'. Check every link works before adding it.
import fs from 'fs';
import { fileURLToPath } from 'url';
const SITE = fileURLToPath(new URL('..', import.meta.url));

const PHET = s => `https://phet.colorado.edu/en/simulations/${s}`;
const WF = s => `https://www.walter-fendt.de/html5/phen/${s}_en.htm`;
const OP = s => `https://ophysics.com/${s}.html`;
const PX = s => `https://phyphox.org/experiment/${s}/`;
const YT = h => `https://www.youtube.com/@${h}`;

const PAGES = {
 simulations: {
  title: 'Simulations', sub: 'Interactive simulations by topic',
  lead: 'Free simulations you can run in a browser to explore each topic: change the variables, predict what will happen, then check. Most run on phones and tablets too.',
  note: 'Simulations marked <span class="tag older">computer only</span> are older PhET simulations: they run in a browser on a computer, but not on most phones.',
  sections: {
   general: [
    ['PhET Interactive Simulations', 'https://phet.colorado.edu/', 'University of Colorado Boulder', 'Research-based simulations for almost every topic.'],
    ['oPhysics', 'https://ophysics.com/', 'Tom Walsh', 'Hundreds of short simulations, sorted by area of physics.'],
    ['Physics apps by Walter Fendt', 'https://www.walter-fendt.de/html5/phen/', 'Walter Fendt', 'Simple, clear simulations of classic experiments.'],
    ['Physics Interactives', 'https://www.physicsclassroom.com/Physics-Interactives', 'The Physics Classroom', 'Simulations with short tasks to work through.'],
    ['Vector Addition', PHET('vector-addition'), 'PhET', 'Add and resolve vectors (see Skills: vectors).']],
   a1: [
    ['Projectile Motion', PHET('projectile-motion'), 'PhET', 'Change the launch angle, speed and air resistance, and watch the trajectory.'],
    ['Motion with Constant Acceleration', WF('acceleration'), 'Walter Fendt', 'Displacement, velocity and acceleration graphs drawn as an object moves.'],
    ['Projectile Motion', WF('projectile'), 'Walter Fendt', 'Velocity components shown at every point of the path.'],
    ['Kinematics simulations', OP('k'), 'oPhysics', 'Motion graphs, relative velocity, projectiles and more.']],
   a2: [
    ['Forces and Motion: Basics', PHET('forces-and-motion-basics'), 'PhET', 'Balanced and unbalanced forces, friction and acceleration.'],
    ['Friction', PHET('friction'), 'PhET', 'What happens between two surfaces when they rub together.'],
    ['Collision Lab', PHET('collision-lab'), 'PhET', 'Elastic and inelastic collisions in one and two dimensions, with momentum vectors.'],
    ['Elastic and Inelastic Collision', WF('collision'), 'Walter Fendt', 'Momentum and kinetic energy before and after a collision.'],
    ['Uniform Circular Motion', WF('circularmotion'), 'Walter Fendt', 'Velocity and centripetal acceleration vectors around a circle.'],
    ['Forces simulations', OP('f'), 'oPhysics', 'Free-body diagrams, inclined planes, friction and more.']],
   a3: [
    ['Energy Skate Park', PHET('energy-skate-park'), 'PhET', 'Kinetic, potential and thermal energy as a skater moves, with friction on or off.'],
    ["Hooke's Law", PHET('hookes-law'), 'PhET', 'Force, extension and elastic potential energy of springs.'],
    ['Conservation simulations', OP('e'), 'oPhysics', 'Energy and momentum conservation, including the ballistic pendulum.']],
   a4: [
    ['Balancing Act', PHET('balancing-act'), 'PhET', 'Balance torques on a see-saw.'],
    ['Torque', PHET('torque'), 'PhET', 'Torque, moment of inertia and angular acceleration.', 'older'],
    ['Lever Principle', WF('lever'), 'Walter Fendt', 'Moments about a pivot.'],
    ['Rotation simulations', OP('r'), 'oPhysics', 'Rolling motion, moment of inertia and angular momentum.']],
   a5: [
    ['Time Dilation', WF('timedilation'), 'Walter Fendt', 'A moving clock compared with clocks at rest.']],
   b1: [
    ['States of Matter', PHET('states-of-matter'), 'PhET', 'Particles in solids, liquids and gases, and changes of state.'],
    ['Energy Forms and Changes', PHET('energy-forms-and-changes'), 'PhET', 'Heating, thermal energy transfer and thermal equilibrium.'],
    ['Blackbody Spectrum', PHET('blackbody-spectrum'), 'PhET', "How the spectrum of a hot object changes with temperature (Wien's law)."]],
   b2: [
    ['Greenhouse Effect', PHET('greenhouse-effect'), 'PhET', 'Sunlight, infrared and the energy balance of the Earth.'],
    ['Molecules and Light', PHET('molecules-and-light'), 'PhET', 'Which molecules absorb infrared, and what happens when they do.']],
   b3: [
    ['Gas Properties', PHET('gas-properties'), 'PhET', 'Pressure, volume, temperature and the speeds of the particles.'],
    ['Gases Intro', PHET('gases-intro'), 'PhET', "Explore Boyle's law and Charles's law."]],
   b4: [
    ['Special Processes of an Ideal Gas', WF('gasprocesses'), 'Walter Fendt', 'Isobaric, isochoric, isothermal and adiabatic changes on a p–V diagram.'],
    ['Carnot Cycle', WF('carnotcycle'), 'Walter Fendt', 'The four stages of a Carnot engine.']],
   b5: [
    ['Circuit Construction Kit: DC', PHET('circuit-construction-kit-dc'), 'PhET', 'Build circuits and measure current and potential difference.'],
    ['Resistance in a Wire', PHET('resistance-in-a-wire'), 'PhET', 'How resistivity, length and area affect resistance.'],
    ["Ohm's Law", PHET('ohms-law'), 'PhET', 'How V, I and R are related.'],
    ['Circuit Simulator', 'https://www.falstad.com/circuit/', 'Falstad', 'A powerful circuit simulator, with current shown moving.'],
    ['Combinations of Resistors', WF('combinationresistors'), 'Walter Fendt', 'Resistors in series and parallel.'],
    ['Potentiometer', WF('potentiometer'), 'Walter Fendt', 'A potential divider in action.']],
   c1: [
    ['Pendulum Lab', PHET('pendulum-lab'), 'PhET', 'Period, length, mass and energy of a pendulum.'],
    ['Masses and Springs', PHET('masses-and-springs'), 'PhET', 'Oscillating springs, with energy bars.'],
    ['Simple Pendulum', WF('pendulum'), 'Walter Fendt', 'Displacement, velocity and acceleration graphs of SHM.'],
    ['Spring Pendulum', WF('springpendulum'), 'Walter Fendt', 'A mass–spring oscillator with graphs.']],
   c2: [
    ['Waves Intro', PHET('waves-intro'), 'PhET', 'Water, sound and light waves.'],
    ['Wave on a String', PHET('wave-on-a-string'), 'PhET', 'Amplitude, frequency, wavelength and wave speed.'],
    ['Sound Waves', PHET('sound-waves'), 'PhET', 'Sound as a longitudinal wave.', 'older'],
    ['Electromagnetic Wave', WF('electromagneticwave'), 'Walter Fendt', 'Electric and magnetic fields in an electromagnetic wave.'],
    ['Waves simulations', OP('w'), 'oPhysics', 'Transverse and longitudinal waves, superposition and more.']],
   c3: [
    ['Wave Interference', PHET('wave-interference'), 'PhET', 'Two-source and double-slit interference with water, sound and light.'],
    ['Bending Light', PHET('bending-light'), 'PhET', "Refraction, Snell's law and total internal reflection."],
    ['Ripple Tank', 'https://www.falstad.com/ripple/', 'Falstad', 'Diffraction and interference of water waves.'],
    ['Interference of Light at a Double Slit', WF('doubleslit'), 'Walter Fendt', 'Path difference and the double-slit pattern.'],
    ['Diffraction of Light by a Single Slit', WF('singleslit'), 'Walter Fendt', 'The single-slit intensity pattern.'],
    ['Light simulations', OP('l'), 'oPhysics', 'Refraction, interference, diffraction gratings and more.']],
   c4: [
    ['Standing Wave', WF('standingwavereflection'), 'Walter Fendt', 'A standing wave formed by a wave and its reflection.'],
    ['Standing Longitudinal Waves', WF('standinglongitudinalwaves'), 'Walter Fendt', 'Standing waves in pipes, open and closed.'],
    ['Forced Oscillations (Resonance)', WF('resonance'), 'Walter Fendt', 'Amplitude against driving frequency, with damping.'],
    ['Loaded String', 'https://www.falstad.com/loadedstring/', 'Falstad', 'Harmonics on a string.']],
   c5: [
    ['Doppler Effect', WF('dopplereffect'), 'Walter Fendt', 'Wavefronts from a moving source and a moving observer.']],
   d1: [
    ['Gravity and Orbits', PHET('gravity-and-orbits'), 'PhET', 'The Sun, Earth, Moon and a satellite, with force and velocity vectors.'],
    ['Gravity Force Lab', PHET('gravity-force-lab'), 'PhET', "Newton's law of gravitation."],
    ["Kepler's Laws", PHET('keplers-laws'), 'PhET', 'Elliptical orbits, equal areas and the third law.'],
    ['My Solar System', PHET('my-solar-system'), 'PhET', 'Design your own system of orbiting bodies.']],
   d2: [
    ["Coulomb's Law", PHET('coulombs-law'), 'PhET', 'The force between two charges.'],
    ['Charges and Fields', PHET('charges-and-fields'), 'PhET', 'Electric field lines and equipotentials around charges.'],
    ['Magnetic Field of a Bar Magnet', WF('magneticfieldbar'), 'Walter Fendt', 'Field lines around a bar magnet.'],
    ['Magnetic Field of a Straight Current-Carrying Wire', WF('magneticfieldwire'), 'Walter Fendt', 'Field lines around a wire.'],
    ['E & M simulations', OP('em'), 'oPhysics', 'Fields, forces on charges and more.']],
   d3: [
    ['Lorentz Force', WF('lorentzforce'), 'Walter Fendt', 'The force on a current-carrying wire in a magnetic field.'],
    ['Direct Current Electrical Motor', WF('electricmotor'), 'Walter Fendt', 'How the motor effect makes a motor turn.']],
   d4: [
    ["Faraday's Law", PHET('faradays-law'), 'PhET', 'Move a magnet through a coil and watch the induced emf.'],
    ["Faraday's Electromagnetic Lab", PHET('faradays-electromagnetic-lab'), 'PhET', 'Coils, electromagnets, transformers and generators.'],
    ['Generator', PHET('generator'), 'PhET', 'A water wheel turns a magnet to generate electricity.'],
    ['Generator', WF('generator'), 'Walter Fendt', 'An ac generator and its output.']],
   e1: [
    ['Rutherford Scattering', PHET('rutherford-scattering'), 'PhET', 'Alpha particles fired at gold atoms.'],
    ['Models of the Hydrogen Atom', PHET('models-of-the-hydrogen-atom'), 'PhET', 'Compare models of the atom with experiment.'],
    ['Build an Atom', PHET('build-an-atom'), 'PhET', 'Protons, neutrons, electrons, isotopes and ions.'],
    ["Bohr's Theory of the Hydrogen Atom", WF('bohrmodel'), 'Walter Fendt', 'Energy levels and orbits in the Bohr model.']],
   e2: [
    ['Photoelectric Effect', PHET('photoelectric'), 'PhET', 'Change the wavelength and intensity and watch the electrons.', 'older'],
    ['Photoelectric Effect', WF('photoeffect'), 'Walter Fendt', 'Stopping potential against frequency.'],
    ['Davisson–Germer: Electron Diffraction', PHET('davisson-germer'), 'PhET', 'Electrons diffracting off a crystal.', 'older'],
    ['Quantum Wave Interference', PHET('quantum-wave-interference'), 'PhET', 'Photons and electrons through a double slit.']],
   e3: [
    ['Isotopes and Atomic Mass', PHET('isotopes-and-atomic-mass'), 'PhET', 'Stable and unstable isotopes.'],
    ['Alpha Decay', PHET('alpha-decay'), 'PhET', 'Alpha decay and half-life.', 'older'],
    ['Beta Decay', PHET('beta-decay'), 'PhET', 'Beta decay and half-life.', 'older'],
    ['Law of Radioactive Decay', WF('lawdecay'), 'Walter Fendt', 'Random decay of many nuclei, and the decay curve.'],
    ['Radioactive Decay Chains', WF('decaychains'), 'Walter Fendt', 'How heavy nuclei decay step by step.']],
   e4: [
    ['Nuclear Fission', PHET('nuclear-fission'), 'PhET', 'Fission, chain reactions and a model reactor.', 'older']],
   e5: [
    ['Blackbody Spectrum', PHET('blackbody-spectrum'), 'PhET', 'Compare the spectra of stars of different temperatures.'],
    ['Stellarium Web', 'https://stellarium-web.org/', 'Stellarium', 'A planetarium in your browser: find stars and see their colours.']],
  },
 },
 apps: {
  title: 'Apps and software', sub: 'Tools for experiments and data',
  lead: 'Free apps and software for doing physics: measuring with your phone, analysing video, and plotting data.',
  note: 'phyphox experiments open inside the free phyphox app. Each link below explains the experiment and how to set it up.',
  sections: {
   general: [
    ['phyphox', 'https://phyphox.org/', 'RWTH Aachen University', 'Turns your phone into a lab: its accelerometer, microphone, light sensor and more become measuring instruments. Free for Android and iPhone.'],
    ['Tracker', 'https://opensourcephysics.github.io/tracker-website/', 'Open Source Physics', 'Free video analysis: film a motion, then track it frame by frame to get position–time data.'],
    ['Desmos Graphing Calculator', 'https://www.desmos.com/calculator', 'Desmos', 'Plot data, add a best-fit line and test a relationship.'],
    ['Algodoo', 'https://www.algodoo.com/', 'Algoryx', 'A free 2D physics sandbox: build machines and see forces and energy in action.']],
   a1: [
    ['Free Fall', PX('free-fall-2'), 'phyphox', 'Time a fall with the acoustic stopwatch and find g.'],
    ['Tracker: projectile motion', 'https://opensourcephysics.github.io/tracker-website/', 'Open Source Physics', 'Film a thrown ball and analyse its horizontal and vertical motion.']],
   a2: [
    ['Inelastic Collision', PX('inelastic-collision'), 'phyphox', 'Find the energy lost each time a ball bounces.'],
    ['Centrifugal Acceleration', PX('centrifugal-acceleration'), 'phyphox', 'Spin your phone (e.g. in a salad spinner) to test <em>a</em> = <em>ω</em><sup>2</sup><em>r</em> for circular motion. (The app says “centrifugal”; in the course this is the centripetal acceleration.)']],
   b1: [
    ['Light', PX('light'), 'phyphox', 'Measure light intensity at different distances from a lamp to test the inverse-square law.']],
   b3: [
    ['Pressure', PX('pressure'), 'phyphox', "Use your phone's barometer, if it has one, to measure air pressure."]],
   c1: [
    ['Pendulum', PX('pendulum'), 'phyphox', 'Measure the frequency of a pendulum and find g.'],
    ['Spring', PX('spring'), 'phyphox', 'Measure the frequency of a mass on a spring.']],
   c2: [
    ['Speed of Sound', PX('speed-of-sound'), 'phyphox', 'Two phones, a tape measure and the acoustic stopwatch.'],
    ['Audio Scope', PX('audio-scope'), 'phyphox', 'See the waveform of a sound and measure its period.']],
   c4: [
    ['Audio Spectrum', PX('audio-spectrum'), 'phyphox', 'Find the frequencies of a note: the fundamental and the harmonics.'],
    ['Tone Generator', PX('tone-generator'), 'phyphox', 'Play a chosen frequency to find the resonant frequency of a tube or bottle.']],
   c5: [
    ['Doppler Effect', PX('doppler-effect'), 'phyphox', 'Measure the Doppler shift of a moving sound source.']],
   d1: [
    ['NASA Eyes on the Solar System', 'https://eyes.nasa.gov/', 'NASA', 'Follow real spacecraft and planets in 3D.']],
   d2: [
    ['Magnetic Field', PX('magnetic-field'), 'phyphox', "Use your phone's magnetometer to map the field around a magnet or a current-carrying wire."]],
   e5: [
    ['Stellarium', 'https://stellarium-web.org/', 'Stellarium', 'A free planetarium: identify stars and constellations in the sky tonight.']],
  },
 },
 youtube: {
  title: 'YouTube channels', sub: 'Videos to learn and explore',
  lead: 'YouTube channels worth your time, for learning a topic or for going beyond the course.',
  note: 'Channels from other courses (A level, AP) use some different words and symbols, but the physics is the same. Check with the data booklet if in doubt.',
  sections: {
   general: {
    "Learning and problem solving": [
     ['Physics Online', YT('PhysicsOnline'), 'A level lessons', 'Clear lessons and worked examples covering most of the course: good for relearning a topic from scratch.'],
     ['Flipping Physics', YT('FlippingPhysics'), 'AP Physics lessons', 'Concepts explained step by step, then worked problems, especially in mechanics (A.1–A.4).'],
     ['Michel van Biezen', YT('MichelvanBiezen'), 'Worked examples', 'Thousands of short worked examples, one problem at a time.'],
     ['Khan Academy', YT('khanacademy'), 'Lessons', 'Short lessons on core ideas, with worked examples: search the channel for your topic.'],
     ['The Organic Chemistry Tutor', YT('TheOrganicChemistryTutor'), 'Worked examples', 'Despite the name, many physics videos: each works through a type of problem step by step. The channel also covers maths and chemistry, so search for your topic.'],
     ['Crash Course Physics', 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0ge7yDk_UA0ldZJdhwkoV', 'Lesson series', 'A 46-episode series giving a quick, clear overview of each area of physics.']],
    "General interest": [
     ['Veritasium', YT('veritasium'), 'Science', 'Experiments, misconceptions and how we know what we know.'],
     ['3Blue1Brown', YT('3blue1brown'), 'Maths', 'Beautiful visual explanations of maths and the physics that uses it.'],
     ['SmarterEveryDay', YT('smartereveryday'), 'Science and engineering', 'Exploring how things work, often with high-speed cameras.'],
     ['Sixty Symbols', YT('sixtysymbols'), 'Physics and astronomy', 'Physicists at the University of Nottingham explain the ideas behind the symbols.'],
     ['Physics Girl', YT('physicsgirl'), 'Physics', 'Experiments and demonstrations that explore surprising physics.'],
     ['Steve Mould', YT('SteveMould'), 'Science', 'Surprising experiments, explained carefully.'],
     ['Kurzgesagt – In a Nutshell', YT('kurzgesagt'), 'Science', 'Animated big-picture videos on space, energy and the universe.']]},
   a5: [
    ['PBS Space Time', YT('pbsspacetime'), 'Explore', 'Relativity and space-time in depth: goes well beyond the course.']],
   d1: [
    ['NASA', YT('NASA'), 'Explore', 'Missions, orbits and launches, straight from NASA.']],
   d4: [
    ['Practical Engineering', YT('PracticalEngineeringChannel'), 'Explore', 'How real infrastructure works, including power grids and generators.']],
   e3: [
    ['Fermilab', YT('fermilab'), 'Explore', 'Particle physicists explain atoms, nuclei, neutrinos and the forces between particles.']],
   e5: [
    ['Dr. Becky', YT('DrBecky'), 'Explore', 'Astrophysicist Becky Smethurst on stars, galaxies and the latest astronomy news.']],
  },
 },
};

// Topic names and themes, from the topic pages' <h1>
const THEMES = { A: 'Space, time and motion', B: 'The particulate nature of matter', C: 'Wave behaviour', D: 'Fields', E: 'Nuclear and quantum physics' };
const topicName = id => fs.readFileSync(`${SITE}/themes/${id}.html`, 'utf8').match(/<h1>(.*?)<\/h1>/)[1]
  .replace(/<span class="code">([^<]*)<\/span>/, '$1 ').replace(/<span class="tag[^"]*">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const res = fs.readFileSync(SITE + '/resources.html', 'utf8');
const headTemplate = res.slice(res.indexOf('<head>'), res.indexOf('</head>') + 7)
  .replace(/(href|src)="(?!https?:|#)([^"]+)"/g, '$1="../$2"');
const esc = s => s.replace(/&(?!amp;|nbsp;)/g, '&amp;');
const ORDER = ['simulations', 'apps', 'youtube'];

let count = 0;
for (const [key, pg] of Object.entries(PAGES)) {
  const title = `${pg.title} · Mr Silkstone's Physics`;
  const desc = `IB DP Physics ${pg.title.toLowerCase()}: ${pg.lead.split(':')[0].replace(/\.$/, '')}.`.replace(/\s+/g, ' ');
  const head = headTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${desc}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${desc}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1https://physics.silkstone.xyz/resources/${key}.html"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1https://physics.silkstone.xyz/resources/${key}.html"`);
  const o = ['<!doctype html>', '<html lang="en">', head,
    '<body data-root="../" data-section="resources">', '  <header id="site-header"></header>', '  <main>'];
  o.push(`    <h1>${pg.title} <span class="h1-sub">${pg.sub}</span></h1>`);
  o.push(`    <p class="lead">${pg.lead} <a href="../resources.html">All resources</a></p>`);
  o.push(`    <nav class="res-pages" aria-label="Resource pages">` + ORDER.map(k =>
    `<a href="${k}.html"${k === key ? ' aria-current="page"' : ''}>${PAGES[k].title}</a>`).join('') + `</nav>`);
  if (pg.note) o.push(`    <p class="res-note-top">${pg.note}</p>`);
  o.push(`    <!-- Built by tools/build-links.mjs from its link list: change the list and re-run it rather than editing this page. -->`);
  const themesUsed = Object.keys(THEMES).filter(L => Object.keys(pg.sections).some(id => id[0] === L.toLowerCase()));
  o.push(`    <nav class="theme-jump" aria-label="Jump to a section"><a href="#general"><b>★</b> General</a>` +
    themesUsed.map(L => `<a data-theme="${L}" href="#theme-${L.toLowerCase()}"><b>${L}</b> ${THEMES[L]}</a>`).join('') + `</nav>`);
  const item = ([name, url, src, note, flag]) => {
    count++;
    return `        <li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}&nbsp;↗</a> <span class="res-src">${esc(src)}</span>` +
      (flag === 'older' ? ' <span class="tag older">computer only</span>' : '') + `<span class="res-desc">${note}</span></li>`;
  };
  const group = (id, heading, items, L) => {
    o.push(`    <section class="deck-group res-group" id="${id}"${L ? ` data-theme="${L}"` : ''}>`);
    o.push(`      <h2>${heading}</h2>`, '      <ul class="res-list">', ...items.map(item), '      </ul>', '    </section>');
  };
  if (Array.isArray(pg.sections.general)) group('general', 'General', pg.sections.general);
  else Object.entries(pg.sections.general).forEach(([h, items], i) => group(i ? 'general-' + (i + 1) : 'general', h, items));
  for (const L of themesUsed) {
    o.push(`    <h2 class="res-theme" id="theme-${L.toLowerCase()}" data-theme="${L}">Theme ${L}: ${THEMES[L]}</h2>`);
    for (const [id, items] of Object.entries(pg.sections)) {
      if (id[0] !== L.toLowerCase()) continue;
      const name = topicName(id);
      group(`${key}-${id}`, `${name} <a class="deck-notes" href="../themes/${id}.html">Notes →</a>`, items, L);
    }
  }
  o.push('  </main>', '  <footer id="site-footer"></footer>', '</body>', '</html>', '');
  fs.writeFileSync(`${SITE}/resources/${key}.html`, o.join('\r\n'));
}
console.log(`Built 3 pages with ${count} links.`);
