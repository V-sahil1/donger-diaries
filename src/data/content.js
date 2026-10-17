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

// "The Route" fly-through: one chapter per map pin, Sahyadri → Ladakh.
// `altitude` is the waypoint's real elevation; `km` is the illustrative road
// distance from Mumbai shown on the odometer.
export const journey = {
  start: { altitude: 560, km: 0 },
  chapters: [
    {
      num: '01',
      region: 'Sahyadri · Maharashtra',
      title: 'Monsoon Ghats',
      accent: 'where it all began.',
      text: 'Basalt mesas, waterfalls spilling off the Deccan traps, and the rainy Kalsubai weekends that started the diaries.',
      place: 'Kalsubai Peak',
      altitude: 1646,
      km: 180,
    },
    {
      num: '02',
      region: 'Kullu · Himachal',
      title: 'Pine Country',
      accent: 'into the deodars.',
      text: 'Cedar forests, cold river crossings and the first snow line glinting above Rohtang La.',
      place: 'Rohtang La',
      altitude: 3978,
      km: 2050,
    },
    {
      num: '03',
      region: 'Spiti · Himachal',
      title: 'Cold Desert',
      accent: 'canyons of time.',
      text: 'Fossil villages, cliffside gompas and banded canyon walls glowing at golden hour over Kunzum La.',
      place: 'Kunzum La',
      altitude: 4551,
      km: 2240,
    },
    {
      num: '04',
      region: 'Leh · Ladakh',
      title: 'Roof Of The World',
      accent: 'under a billion stars.',
      text: 'High-lake blues at dusk, prayer flags snapping on Khardung La, and a night sky with no ceiling.',
      place: 'Khardung La',
      altitude: 5359,
      km: 2710,
    },
  ],
  // Real footage behind the flight, in route order. `at` is the scroll progress
  // (0..1) where each shot fades in; swap in your own clips/photos per region.
  media: [
    { at: 0, video: heroVideo, poster: heroPoster },
    { at: 0.25, image: img('glacial-trek') },
    { at: 0.5, image: img('spiti') },
    { at: 0.75, image: img('ladakh') },
    { at: 0.9, image: img('lakeside-stars') }, // the night sky finale
  ],
};

/*
 * "Stories From The Forts" — one chapter per place.
 *
 * PHOTOS ARE PLACEHOLDERS. To use your own:
 *   1. put them in  public/images/places/<slug>/   (e.g. public/images/places/gorakhgad/01.jpg)
 *   2. replace the `dummy(...)` call with an object like
 *        { src: '/images/places/gorakhgad/01.jpg', alt: 'What the photo shows', caption: 'Short caption' }
 * `cover` is the big photo, `inset` the two floating ones; `photos` can hold as many as you like.
 */
const DUMMY_POOL = [
  'gallery-window', 'story-group', 'trek-kuari', 'gallery-convoy', 'canyon-road', 'alpine-camp',
  'gallery-sunset', 'trek-pin-parvati', 'story-campfire', 'trek-kashmir', 'glacial-trek', 'cta-mountains',
  'gallery-bonfire', 'spiti', 'lakeside-stars', 'ladakh',
];
let dummyIndex = 0;
const dummy = (caption) => ({
  src: img(DUMMY_POOL[dummyIndex++ % DUMMY_POOL.length]),
  alt: `${caption} (placeholder photo)`,
  caption,
});
const photoSet = (place, captions) => captions.map((c) => dummy(`${place} — ${c}`));
// Real photos, converted from the phone's HEIC originals in public/images/KALSUBAI.
const kalsubai = (n, caption) => ({
  src: `/images/places/kalsubai/${String(n).padStart(2, '0')}.jpg`,
  alt: `Kalsubai — ${caption}`,
  caption: `Kalsubai — ${caption}`,
});

export const placeStories = [
  {
    slug: 'gorakhgad',
    name: 'Gorakhgad',
    tagline: 'the hermit’s fort.',
    region: 'Murbad · Thane',
    story: [
      'Named after the saint Gorakhnath, who is said to have meditated in its caves, Gorakhgad rises like a stone finger above the forests of Dehri village. Its twin pinnacle, Machhindragad, keeps it company on the ridge.',
      'The final climb is the story everyone takes home: steps carved straight into the rock face, a narrow doorway, and then caves cool enough to nap in while the clouds roll through the valley below.',
    ],
    facts: [
      { label: 'Height', value: '~651 m' },
      { label: 'Base village', value: 'Dehri' },
      { label: 'Grade', value: 'Moderate · rock steps' },
      { label: 'Best season', value: 'Jul – Feb' },
    ],
    cover: dummy('Gorakhgad pinnacle in the monsoon'),
    inset: [dummy('Rock-cut steps to the top'), dummy('Caves on the summit')],
    photos: photoSet('Gorakhgad', ['Dehri village trailhead', 'Forest trail', 'Machhindragad view', 'Rock-cut steps', 'Summit caves', 'Sunset from the top']),
  },
  {
    slug: 'harishchandragad',
    name: 'Harishchandragad',
    tagline: 'the edge of the world.',
    region: 'Akole · Ahilyanagar',
    story: [
      'Harishchandragad is where we take people who think they have seen the Sahyadri. The trail climbs past the carved Harishchandreshwar temple to the Kedareshwar cave, where a stone lingam stands in waist-deep, ice-cold water.',
      'Then comes Konkan Kada — a curved cliff that falls away hundreds of metres into the Konkan. On lucky evenings the clouds rise up the wall and you see your own shadow on them, ringed by a rainbow.',
    ],
    facts: [
      { label: 'Height', value: '1,424 m (Taramati)' },
      { label: 'Base village', value: 'Pachnai / Khireshwar' },
      { label: 'Grade', value: 'Moderate · long day' },
      { label: 'Best season', value: 'Aug – Jan' },
    ],
    cover: dummy('Konkan Kada cliff at sunset'),
    inset: [dummy('Kedareshwar cave'), dummy('Harishchandreshwar temple')],
    photos: photoSet('Harishchandragad', ['Khireshwar trail', 'Temple carvings', 'Kedareshwar cave', 'Konkan Kada', 'Camp under the stars', 'Taramati sunrise']),
  },
  {
    slug: 'rajmachi',
    name: 'Rajmachi',
    tagline: 'twin forts, a million fireflies.',
    region: 'Lonavala · Pune',
    story: [
      'Two forts — Shrivardhan and Manaranjan — share one saddle above the old trade route through the Bor Ghat. We walk in from Lonavala along forest roads and reach Udhewadi as the cooking fires start.',
      'Come just before the monsoon and the trees around the village blink with fireflies, thousands at once, as if the forest is breathing light.',
    ],
    facts: [
      { label: 'Height', value: '~830 m' },
      { label: 'Base village', value: 'Udhewadi' },
      { label: 'Grade', value: 'Easy · long walk' },
      { label: 'Best season', value: 'May – Oct' },
    ],
    cover: dummy('Shrivardhan and Manaranjan forts'),
    inset: [dummy('Udhewadi village'), dummy('Firefly night')],
    photos: photoSet('Rajmachi', ['Forest road from Lonavala', 'Udhewadi homestay', 'Shrivardhan walls', 'Manaranjan gate', 'Fireflies at dusk', 'Monsoon waterfalls']),
  },
  {
    slug: 'ratangad',
    name: 'Ratangad',
    tagline: 'the jewel with an eye.',
    region: 'Bhandardara · Ahilyanagar',
    story: [
      'We start at the old Amruteshwar temple in Ratanwadi, cross the Pravara, and climb through jungle and iron ladders to a fort that feels like it was built for the view.',
      'At the top waits Nedhe — a natural hole punched through the rock pinnacle, framing the Bhandardara basin like a window. The Pravara river begins its journey right here.',
    ],
    facts: [
      { label: 'Height', value: '~1,297 m' },
      { label: 'Base village', value: 'Ratanwadi' },
      { label: 'Grade', value: 'Moderate · ladders' },
      { label: 'Best season', value: 'Jul – Feb' },
    ],
    cover: dummy('Ratangad from Ratanwadi'),
    inset: [dummy('Nedhe rock window'), dummy('Amruteshwar temple')],
    photos: photoSet('Ratangad', ['Amruteshwar temple', 'Pravara crossing', 'Iron ladders', 'Fort gateway', 'Nedhe window', 'Bhandardara view']),
  },
  {
    slug: 'kalsubai',
    name: 'Kalsubai',
    tagline: 'the roof of Maharashtra.',
    region: 'Igatpuri · Nashik',
    story: [
      'At 1,646 m, Kalsubai is the highest point in Maharashtra, and for many of us it was the very first summit. The trail from Bari village climbs through fields, then up iron ladders bolted to the steepest rock bands.',
      'A tiny temple to the goddess Kalsubai waits at the top. Arrive before sunrise and the Sahyadri spreads out below you in layers of blue, with Alang, Madan and Kulang standing in a row.',
    ],
    facts: [
      { label: 'Height', value: '1,646 m' },
      { label: 'Base village', value: 'Bari' },
      { label: 'Grade', value: 'Moderate · ladders' },
      { label: 'Best season', value: 'Jul – Feb' },
    ],
    cover: kalsubai(3, 'Sunrise over the Sahyadri from the summit'),
    inset: [kalsubai(5, 'Golden light on the summit'), kalsubai(11, 'The crew under the summit flags')],
    photos: [
      kalsubai(1, 'Night climb — village lights below'),
      kalsubai(2, 'First light on the ridge'),
      kalsubai(3, 'Sunrise over the Sahyadri'),
      kalsubai(4, 'Watching the sun come up'),
      kalsubai(5, 'Golden light on the summit'),
      kalsubai(6, 'Made it to the top'),
      kalsubai(7, 'Above the Bhandardara basin'),
      kalsubai(8, 'Catching breath on the rocks'),
      kalsubai(9, 'The whole crew at the summit'),
      kalsubai(10, 'One more for the diaries'),
      kalsubai(11, 'Under the summit flags'),
      kalsubai(12, 'Summit selfie'),
    ],
  },
  {
    slug: 'sandhan-valley',
    name: 'Sandhan Valley',
    tagline: 'the valley of shadows.',
    region: 'Samrad · Ahilyanagar',
    story: [
      'Sandhan is a crack in the earth — a canyon so narrow and deep that sunlight barely reaches its floor. From Samrad village we wade through cold pools and scramble over boulders between walls that close in overhead.',
      'We camp at the canyon mouth and rappel down the rock patches the next morning. It is the trip people describe to their friends with their hands.',
    ],
    facts: [
      { label: 'Length', value: '~1.5 km canyon' },
      { label: 'Base village', value: 'Samrad' },
      { label: 'Grade', value: 'Moderate · rappelling' },
      { label: 'Best season', value: 'Nov – May' },
    ],
    cover: dummy('Inside the Sandhan canyon'),
    inset: [dummy('Wading through the pools'), dummy('Rappelling the rock patch')],
    photos: photoSet('Sandhan Valley', ['Samrad village', 'Canyon entrance', 'Water pools', 'Narrow walls', 'Rappel', 'Canyon-mouth camp']),
  },
];
