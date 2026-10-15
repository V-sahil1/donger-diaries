const img = (name) => `/images/${name}.jpg`;

export const navLinks = [
  { label: 'Home', href: '#top' },
  { label: 'Trips', href: '#featured-adventures' },
  { label: 'Road Trips', href: '#road-trips' },
  { label: 'Treks', href: '#treks' },
  { label: 'Our Story', href: '#storytelling' },
  { label: 'Contact', href: '#contact' },
];

// Valley → Ratangad Fort → snow peaks, crossfaded into one seamless loop.
export const heroVideo = '/video/hero.mp4';
export const heroPoster = '/video/hero-poster.jpg';

export const featuredTrips = [
  {
    id: 'ladakh',
    size: 'wide',
    title: 'Ladakh Road Expedition',
    tagline: 'Trans-Himalayan Crossing',
    taglineTone: 'accent',
    description:
      'Desert passes at 17,500ft, prayer flags fluttering across Khardung La, and nights under the obsidian cosmos beside indigo glacial lakes.',
    image: img('ladakh'),
    alt: 'Turquoise glacial lake set against stark mineral desert peaks in Ladakh',
    badges: [
      { label: '12 Days' },
      { label: 'Moderate Overland', tone: 'green' },
    ],
  },
  {
    id: 'spiti',
    size: 'tall',
    title: 'Spiti Valley Transit',
    tagline: 'Extreme Terrain & Cliffs',
    taglineTone: 'green',
    description:
      'Cut into vertical canyon walls, visiting thousand-year-old cliffside fortresses and fossil villages.',
    image: img('spiti'),
    alt: 'Ancient Buddhist monastery perched on a cliff in Spiti Valley',
    badges: [{ label: '9 Days' }, { label: 'Rugged 4x4', tone: 'accent' }],
  },
  {
    id: 'alpine',
    title: 'Alpine Weekend Escape',
    tagline: 'Forest Meadow Retreat',
    taglineTone: 'accent',
    description: 'Crisp pine scent, woodsmoke banter, and winding alpine trails away from urban hum.',
    image: img('alpine-camp'),
    alt: 'Campfire and tents in a Himalayan cedar forest at dusk',
    badges: [{ label: '4 Days' }],
  },
  {
    id: 'glacial',
    title: 'Glacial Pass Trek',
    tagline: 'Alpine Ridge Traversals',
    taglineTone: 'green',
    description: 'Ascend raw scree corridors and glacier viewpoints into untouched high mountain sanctums.',
    image: img('glacial-trek'),
    alt: 'Solo trekker on a knife-edge ridge above glacial moraines',
    badges: [{ label: '7 Days', tone: 'green' }],
  },
  {
    id: 'lakeside',
    title: 'Lakeside Stargazing',
    tagline: 'Astronomical Nights',
    taglineTone: 'accent',
    description: 'Pitch tents on mineral shores with unpolluted dark sky reserves and infinite stellar arches.',
    image: img('lakeside-stars'),
    alt: 'Milky Way arching over a still mountain lake with a lit tent',
    badges: [{ label: '3 Days' }],
  },
];

export const manifesto = {
  stats: [
    { value: '10,000+', label: 'KM Traversed', tone: 'accent' },
    { value: '48', label: 'Mountain Passes', tone: 'green' },
    { value: '100%', label: 'Candid Stories', tone: 'plain' },
  ],
  mainImage: img('story-group'),
  secondaryImage: img('story-campfire'),
};

export const roadTrip = {
  image: img('canyon-road'),
  pillars: [
    {
      num: '01',
      title: 'Curated Routes',
      text: 'Bypassing tourist highways for ancient trade tracks, switchbacks, and isolated hamlets unknown to typical commercial guides.',
      footer: 'Precision Waypoints',
      tone: 'accent',
    },
    {
      num: '02',
      title: 'Small Group Kinship',
      text: 'Intimate convoys of 8 to 12 explorers max. Strangers on day one, bonded co-pilots by the first gravel plateau breakdown.',
      footer: 'Curated Cohorts',
      tone: 'green',
    },
    {
      num: '03',
      title: 'Scenic Detours',
      text: 'Flexible timelines designed for spontaneous river plunges, chai stops at high passes, and sunset waiting sessions.',
      footer: 'Zero Rush Policy',
      tone: 'plain',
    },
  ],
};

export const treks = [
  {
    title: 'Pin Parvati Wilderness',
    category: 'Pass Crossing',
    altitude: 'Alt. 4,890m',
    description:
      'A grueling, transcendent transition from lush pine valleys of Kullu into the stark moonscape of Spiti.',
    meta: '11 Days • Strenuous',
    image: img('trek-pin-parvati'),
    alt: 'Trekkers crossing a boulder-strewn glacial pass',
  },
  {
    title: 'Kashmir Great Lakes',
    category: 'Alpine Lakes',
    altitude: 'Alt. 4,100m',
    description: 'Seven high-altitude turquoise gems cradled in alpine meadows, traversed along untracked ridges.',
    meta: '8 Days • Moderate',
    image: img('trek-kashmir'),
    alt: 'Emerald alpine meadow and stream in Kashmir',
  },
  {
    title: 'Kuari Pass Panorama',
    category: 'Ridge Summit',
    altitude: 'Alt. 3,850m',
    description: 'Lord Curzon’s famed trail delivering uninhibited amphitheatre views of the sacred Garhwal ranges.',
    meta: '6 Days • Easy-Moderate',
    image: img('trek-kuari'),
    alt: 'Sunrise over Garhwal snow peaks with prayer flags',
  },
];

export const steps = [
  {
    num: '01',
    title: 'Choose Your Adventure',
    text: 'Discover a road trip, rugged trek, or alpine escape that speaks to your curiosity and pace.',
    footer: 'Step 01 / Exploration',
    tone: 'accent',
  },
  {
    num: '02',
    title: 'Join The Journey',
    text: 'Connect directly with the route leaders, review packing briefs, and prep your expedition kit.',
    footer: 'Step 02 / Dispatch',
    tone: 'green',
  },
  {
    num: '03',
    title: 'Make It A Story',
    text: 'Hit the dirt, form lifelong kinship with fellow explorers, and craft unrepeatable memories.',
    footer: 'Step 03 / Living The Wild',
    tone: 'accent',
  },
];

export const gallery = [
  { image: img('gallery-sunset'), caption: 'Khardung La Pass Sunset', shape: 'short' },
  { image: img('gallery-window'), caption: 'Misty Kinnaur Morning', shape: 'tall-up' },
  { image: img('gallery-bonfire'), caption: 'Campfire Kinship • Chandratal', shape: 'short' },
  { image: img('gallery-convoy'), caption: 'Sach Pass Convoy Crossing', shape: 'tall-down' },
];

export const ctaImage = img('cta-mountains');

export const footerColumns = [
  {
    title: 'Expeditions',
    links: ['Ladakh Overland', 'High Alpine Passes', 'Himalayan Treks', 'Private Charters'],
  },
  {
    title: 'Manifesto',
    links: ['Our Philosophy', 'Responsible Travel', 'Bespoke Journeys', 'Press & Archives'],
  },
  {
    title: 'Broadcasts',
    links: ['Instagram Field Journal', 'YouTube Documentaries', 'Spotify Road Audio', 'Substack Logbook'],
  },
];
