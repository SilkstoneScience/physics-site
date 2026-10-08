// Context families (retrospective MUST FIX 1, proposal C3): catches a batch or the bank reusing essentially the same
// set-up even when the wording differs (Batch 1 had three elastic-stretching datasets and two electrical-heating
// specific-heat experiments, and nothing flagged them).
//
// Each dataset declares (design metadata: not published, not in the fingerprint):
//   contextFamily:  ONE id from CONTEXT_FAMILIES: the kind of physical set-up, whatever the topic or wording
//   contextObjects: ids from CONTEXT_OBJECTS: the main physical objects a student would picture
// The check uses the declared metadata, and also reads the free-text `apparatus` with OBJECT_KEYWORDS, so an
// object the author forgot to declare (a spring mentioned in the apparatus but not listed) is still found.
//
// Repetition rules (warnings; a batch can't be accepted with an unwaived diversity warning):
//   • two datasets in the same batch with the same family;
//   • two datasets in the same batch sharing a main object (both use a spring);
//   • a family already used by FAMILY_BANK_LIMIT or more datasets elsewhere in the bank;
//   • an object already used by OBJECT_BANK_LIMIT or more datasets elsewhere in the bank.
// Each warning names the datasets it resembles, the family or object, and why it counts as repetition.

export const FAMILY_BANK_LIMIT = 2;
export const OBJECT_BANK_LIMIT = 3;
// Everyday instruments that appear in many set-ups (a ruler, a stopwatch, slotted masses): declared for the
// description, but sharing them is not repetition of a context.
export const GENERIC_OBJECTS = new Set(['slotted-masses', 'metre-rule', 'stopwatch', 'thermometer', 'water-bath', 'database']);

export const CONTEXT_FAMILIES = {
  'projectile': 'an object launched or thrown and its flight path',
  'trolley-motion': 'a trolley or glider moving along a track, timed by gates or sensors',
  'elastic-stretching': 'a spring, wire, band or other object stretched by a load (Hooke\'s law, limit of proportionality)',
  'electrical-heating': 'an electrical heater warming a block or liquid (specific heat, heat loss)',
  'gas-pressure': 'a fixed mass of gas: pressure, volume and temperature',
  'dc-circuit': 'a cell or supply with meters and resistors',
  'oscillation': 'a mass or pendulum oscillating, timed by a person or a sensor',
  'standing-waves': 'a string or air column vibrating at its harmonics',
  'orbital-data': 'published orbital data of planets or moons',
  'magnetic-force': 'force on a current or charge in a magnetic field',
  'radioactive-counting': 'counts from a radioactive source with a detector',
  'collision-impact': 'bouncing, impact or collision of objects (energy or momentum)',
  'force-sensor-motion': 'a body\'s motion measured by a force plate or force sensor',
  'atomic-spectra': 'emission or absorption lines of atoms viewed through a spectroscope or spectrometer',
  'radiation-energy-balance': 'radiative energy balance of planets, surfaces or bodies',
  'stellar-observation': 'astronomical observations of stars',
  'charge-quantisation': 'charged drops or particles in an electric field',
  'nuclear-power-data': 'operating data from a nuclear power station',
  'light-intensity-distance': 'intensity of light measured at different distances from a source',
};

export const CONTEXT_OBJECTS = {
  'spring': 'a helical spring',
  'stretched-wire': 'a wire stretched by a load',
  'current-carrying-wire': 'a wire carrying a current in a field',
  'slotted-masses': 'a hanger with slotted masses',
  'metre-rule': 'a metre rule or ruler read by eye',
  'electric-heater': 'an electric heater or immersion heater',
  'thermometer': 'a thermometer or temperature probe',
  'light-gate': 'a light gate and timer',
  'trolley': 'a trolley or glider on a track',
  'ball': 'a ball',
  'launcher': 'a launcher or catapult',
  'stopwatch': 'a hand-held stopwatch',
  'pressure-gauge': 'a pressure gauge',
  'water-bath': 'a water bath or beaker of water',
  'cell-and-meters': 'a cell with an ammeter and voltmeter',
  'vibrating-string': 'a string driven by a vibration generator',
  'top-pan-balance': 'a top-pan balance',
  'magnet': 'a permanent magnet',
  'gm-tube': 'a Geiger–Müller tube and counter',
  'database': 'a published table of values',
  'video': 'video or frame-by-frame analysis',
  'force-plate': 'a force plate or force sensor',
  'spectroscope': 'a spectroscope or spectrometer with a scale',
  'telescope-spectra': 'spectra of stars from a telescope',
  'charged-plates': 'parallel charged plates',
  'light-sensor': 'a light sensor or light meter',
  'lamp': 'a lamp or light source',
};

// Free-text apparatus → objects, to catch an object the author didn't declare.
export const OBJECT_KEYWORDS = [
  [/\bsprings?\b/i, 'spring'],
  [/\b(heater|heating element)\b/i, 'electric-heater'],
  [/\bthermometer|temperature probe|thermocouple\b/i, 'thermometer'],
  [/\blight gate\b/i, 'light-gate'],
  [/\btrolley|glider\b/i, 'trolley'],
  [/\bstopwatch\b/i, 'stopwatch'],
  [/\b(metre rule|ruler)\b/i, 'metre-rule'],
  [/\bslotted masses|hanger\b/i, 'slotted-masses'],
  [/\b(pressure gauge|bourdon)\b/i, 'pressure-gauge'],
  [/\bwater bath\b/i, 'water-bath'],
  [/\b(ammeter|voltmeter)\b/i, 'cell-and-meters'],
  [/\bvibration generator\b/i, 'vibrating-string'],
  [/\btop-pan balance\b/i, 'top-pan-balance'],
  [/\bmagnet\b/i, 'magnet'],
  [/\bgeiger/i, 'gm-tube'],
  [/\b(published|database|catalogue)\b/i, 'database'],
  [/\b(video|frames?)\b/i, 'video'],
  [/\bforce (plate|sensor)\b/i, 'force-plate'],
  [/\bspectro(scope|meter)\b/i, 'spectroscope'],
  [/\b(light sensor|light meter|lux)\b/i, 'light-sensor'],
  [/\bballs?\b/i, 'ball'],
];

// The objects of a dataset: declared, plus any the apparatus text mentions.
export function objectsOf(def) {
  const out = new Set(def.contextObjects || []);
  for (const [re, obj] of OBJECT_KEYWORDS) if (re.test(def.apparatus || '')) out.add(obj);
  return out;
}

// Problems with a dataset's own declaration (each becomes an AMBER reason).
export function contextProblems(def) {
  const out = [];
  if (!def.contextFamily) out.push('no context family declared (contextFamily)');
  else if (!(def.contextFamily in CONTEXT_FAMILIES)) out.push(`unknown context family "${def.contextFamily}" (see CONTEXT_FAMILIES in contexts.mjs)`);
  for (const o of def.contextObjects || []) if (!(o in CONTEXT_OBJECTS)) out.push(`unknown context object "${o}" (see CONTEXT_OBJECTS in contexts.mjs)`);
  const declared = new Set(def.contextObjects || []);
  for (const [re, obj] of OBJECT_KEYWORDS) {
    if (re.test(def.apparatus || '') && !declared.has(obj)) out.push(`the apparatus mentions ${CONTEXT_OBJECTS[obj]} ("${(def.apparatus.match(re) || [''])[0]}"), but contextObjects doesn't list "${obj}"`);
  }
  return out;
}

const describe = (r) => `${r.id} (${r.def.apparatus || 'no apparatus given'})`;

// Repetition of context families and objects: within a batch (members), and against the rest of the bank (others).
export function contextRepetition(members, others = []) {
  const out = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const [a, b] = [members[i], members[j]];
      if (a.def.contextFamily && a.def.contextFamily === b.def.contextFamily) {
        out.push(`context family "${a.def.contextFamily}" (${CONTEXT_FAMILIES[a.def.contextFamily] || '?'}) used twice in the batch: ${describe(a)} and ${describe(b)}. `
          + 'Different wording, but students meet essentially the same set-up');
      }
      const shared = [...objectsOf(a.def)].filter((o) => objectsOf(b.def).has(o) && !GENERIC_OBJECTS.has(o));
      if (shared.length) out.push(`${describe(a)} and ${describe(b)} both use ${shared.map((o) => CONTEXT_OBJECTS[o] || o).join(' and ')}: the same object twice in one batch`);
    }
  }
  for (const r of members) {
    const fam = r.def.contextFamily;
    const sameFam = others.filter((o) => fam && o.def.contextFamily === fam);
    if (sameFam.length >= FAMILY_BANK_LIMIT) {
      out.push(`${r.id}: context family "${fam}" (${CONTEXT_FAMILIES[fam] || '?'}) is already used by ${sameFam.length} other dataset(s) in the bank (${sameFam.map(describe).join('; ')}): `
        + `one more makes this set-up overrepresented (limit: ${FAMILY_BANK_LIMIT} others)`);
    }
    for (const obj of objectsOf(r.def)) {
      if (GENERIC_OBJECTS.has(obj)) continue;
      const same = others.filter((o) => objectsOf(o.def).has(obj));
      if (same.length >= OBJECT_BANK_LIMIT) {
        out.push(`${r.id}: ${CONTEXT_OBJECTS[obj] || obj} already appears in ${same.length} other dataset(s) in the bank (${same.map((o) => o.id).join(', ')}): students would meet it again (limit: ${OBJECT_BANK_LIMIT} others)`);
      }
    }
  }
  return out;
}
