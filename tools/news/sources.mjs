// The news sources the collector reads. Feeds tested October 2026.
// To add a source: add an entry here, run `node tools/news/collect.mjs --dry-run` and check what it finds.
//   key     short name used in story ids (never change it once stories from the source are published)
//   name    publisher name shown on the card ("Summary written automatically with AI, from <name>'s article")
//   feed    RSS or Atom address
//   bonus   added to every story's score (open-licence sources and physics specialists score higher)
//   open    true when the publisher's press-release text may be fetched in full to give the AI more to work from
//   image   null = use the category icon (images are copyright or the licence varies per image);
//           otherwise the credit and licence to show with the publisher's own images (used from Stage 2)
//   keep    optional filter: return false to skip an item (item has title, url, text, categories)
//   quote   false = never show this publisher's own description word for word (used when a short description
//           can't be summarised honestly); APS's feed says "Personal use only, all commercial or other reuse prohibited"

const CC_BY = { licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' };
const NASA_PD = { credit: 'NASA', licence: 'Public domain', licenceUrl: 'https://www.nasa.gov/nasa-brand-center/images-and-media/' };
const ESA = { credit: '© ESA', licence: 'ESA standard licence (educational use)', licenceUrl: 'https://www.esa.int/ESA_Multimedia/Copyright_Notice_Images' };

export const SOURCES = [
  { key: 'aps', name: 'APS Physics Magazine', feed: 'https://feeds.aps.org/rss/recent/physics.xml', bonus: 10, open: false, image: null, quote: false },
  { key: 'physicsworld', name: 'Physics World', feed: 'https://physicsworld.com/feed/', bonus: 6, open: false, image: null },
  { key: 'cern', name: 'CERN', feed: 'https://home.cern/feed/', bonus: 4, open: false, image: null },
  { key: 'esa', name: 'ESA', feed: 'https://www.esa.int/rssfeed/Science_Exploration/Space_Science', bonus: 6, open: true, image: ESA },
  { key: 'esawebb', name: 'ESA/Webb', feed: 'https://esawebb.org/news/feed/', bonus: 8, open: true, image: { credit: 'ESA/Webb, NASA & CSA', ...CC_BY } },
  { key: 'esahubble', name: 'ESA/Hubble', feed: 'https://esahubble.org/news/feed/', bonus: 8, open: true, image: { credit: 'ESA/Hubble & NASA', ...CC_BY } },
  { key: 'eso', name: 'ESO', feed: 'https://www.eso.org/public/news/feed/', bonus: 8, open: true, image: { credit: 'ESO', ...CC_BY } },
  { key: 'nasa-iotd', name: 'NASA', feed: 'https://www.nasa.gov/feeds/iotd-feed/', bonus: 2, open: true, image: NASA_PD },
  // Very busy feed: most items are mission updates, events and features; scoring sorts them out.
  // Skip APOD (images belong to their photographers) and evergreen explainer pages (not news).
  { key: 'nasa', name: 'NASA Science', feed: 'https://science.nasa.gov/feed/', bonus: 0, open: true, image: NASA_PD,
    keep: (it) => !/apod|astronomy picture of the day|science-explainers/i.test(it.url + ' ' + it.title) },
  { key: 'ars', name: 'Ars Technica', feed: 'https://feeds.arstechnica.com/arstechnica/science', bonus: 0, open: false, image: null },
  // Quanta covers maths, biology and computing too: physics categories only.
  { key: 'quanta', name: 'Quanta Magazine', feed: 'https://www.quantamagazine.org/feed/', bonus: 4, open: false, image: null,
    keep: (it) => it.categories.some((c) => /physic|cosmolog|astronom|quantum/i.test(c)) },
  { key: 'esa-eo', name: 'ESA', feed: 'https://www.esa.int/rssfeed/Applications/Observing_the_Earth', bonus: 2, open: true, image: ESA },
  { key: 'nasa-eo', name: 'NASA Earth Observatory', feed: 'https://earthobservatory.nasa.gov/feeds/image-of-the-day.rss', bonus: 0, open: true, image: NASA_PD },
];
