/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BUSINESS CONFIGURATION
 *  Edit this file to update company details across the entire website.
 *
 *  Anything marked `PLACEHOLDER` must be replaced before launch. Fields set to
 *  `null` are hidden on the live site until you fill them in — the site never
 *  shows fake phone numbers, emails or addresses.
 *
 *  See README.md → "Launch checklist" for the full list.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Sugar Land Lighting Solutions",
  shortName: "SL Lighting Solutions",
  tagline: "Your home, lit for the season.",
  /** The two lines of the typeset wordmark (used when `logo` is null). */
  wordmark: { primary: "Sugar Land", secondary: "Lighting Solutions" },
  description:
    "Professional Christmas light installation for homes in New Territory and Sugar Land, Texas. We design, install, maintain and take down your holiday lighting — using our own commercial-grade lights, so there's nothing for you to buy or store.",

  /** PLACEHOLDER — your production domain, no trailing slash. Also set NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",

  /**
   * PLACEHOLDER — contact details. Leave as `null` until confirmed; every
   * component that shows them hides itself when the value is null.
   * phone: display format, e.g. "(281) 555-0123"
   * phoneHref: E.164 format, e.g. "+12815550123"
   */
  phone: null as string | null,
  phoneHref: null as string | null,
  email: null as string | null,

  /**
   * PLACEHOLDER — logo. When `null`, a typeset wordmark is used instead.
   * Put the file in /public/brand/ and set e.g. "/brand/logo.svg".
   */
  logo: null as string | null,

  location: {
    city: "Sugar Land",
    region: "TX",
    regionName: "Texas",
    county: "Fort Bend County",
    timezone: "America/Chicago",
  },

  /**
   * Business hours shown on Contact and in the footer. `null` hides them.
   * Example: [{ days: "Mon–Sat", hours: "9:00 am – 6:00 pm" }]
   */
  hours: null as { days: string; hours: string }[] | null,

  /** How quickly you reply to quote requests. `null` = no promise is shown. */
  responseTime: null as string | null, // e.g. "within one business day"

  /** Social profiles — only set ones that exist. */
  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    nextdoor: null as string | null,
    google: null as string | null, // Google Business Profile link
  },

  team: {
    /** Used in About copy. Don't overstate — we only say "a small local crew". */
    size: 3,
  },

  season: {
    /** Shown in hero/CTA copy. Update each year. */
    year: 2026,
    /** True while you are accepting new installs for the season. */
    accepting: true,
    /** Rough install window, shown in FAQ. */
    installWindow: "early November through mid-December",
    /** Rough takedown window, shown in FAQ. */
    takedownWindow: "the first weeks of January",
  },
} as const;

/* ───────────────────────────── Service area ───────────────────────────── */

export type ServiceArea = {
  name: string;
  city: string;
  /** ZIP codes that are fully or partly within this area. */
  zips: string[];
  /** Short honest note shown under the name. */
  note?: string;
};

/**
 * Neighborhoods you serve. Add more Sugar Land neighborhoods here later —
 * the homepage, contact page, ZIP checker and structured data update
 * automatically.
 */
export const serviceAreas: ServiceArea[] = [
  {
    name: "New Territory",
    city: "Sugar Land",
    // Verify: New Territory sits in ZIP 77498. Add/remove ZIPs as you expand.
    zips: ["77498"],
    note: "Our home neighborhood and primary service area.",
  },
  // { name: "Telfair", city: "Sugar Land", zips: ["77479"] },
  // { name: "Riverstone", city: "Sugar Land", zips: ["77459", "77479"] },
];

/* ─────────────────────────────── Pricing ──────────────────────────────── */

export const pricing = {
  /**
   * OFF by default. Flip to `true` only after you confirm the range.
   * When on, the range appears on Services, FAQ and the quote form.
   */
  showRange: false,
  rangeText: "Most homes range from $800 to $2,000",
  rangeDetail:
    "for a full season — design, installation, maintenance, takedown and storage included. Your quote depends on your roofline, the services you choose and how complex the install is.",

  /**
   * Optional starting prices per service (by service id). Leave empty until
   * confirmed. Example: { roofline: "From $650" }
   */
  startingAt: {} as Partial<Record<ServiceId, string>>,

  /** Optional seasonal offer banner text. `null` = hidden. */
  seasonalOffer: null as string | null,
};

/* ─────────────────────────────── Services ─────────────────────────────── */

export type ServiceId =
  | "roofline"
  | "architectural"
  | "trees"
  | "wreaths"
  | "entryway"
  | "custom"
  | "takedown";

export type Service = {
  id: ServiceId;
  name: string;
  /** One-line summary for lists. */
  summary: string;
  /** Longer description for the Services page. */
  description: string;
  /** Practical considerations — honest, no unverifiable claims. */
  considerations: string[];
  image: PhotoKey;
  /** Set to false to hide a service everywhere (site + forms). */
  offered: boolean;
  /** Whether customers can pick it in the quote form. */
  quotable: boolean;
};

export const services: Service[] = [
  {
    id: "roofline",
    name: "Roofline lighting",
    summary:
      "Clean, evenly spaced lights traced along your roof peaks and eaves — the look most people picture.",
    description:
      "Roofline lighting is the backbone of most installs. We measure your roofline, plan where runs start and end, and attach lights with clips suited to your shingles and gutters — no nails, staples or holes. Bulbs are spaced evenly and aimed consistently so the outline reads crisply from the street.",
    considerations: [
      "Two-story and steep rooflines take more time and equipment, which affects the quote.",
      "We plan power runs ahead of time so cords stay tidy and out of walkways.",
      "Warm white is the most requested; multicolor is available.",
    ],
    image: "homeOutline",
    offered: true,
    quotable: true,
  },
  {
    id: "architectural",
    name: "Gutterline & architectural outlines",
    summary:
      "Highlight gables, dormers, windows, columns and porch lines to show off your home's shape.",
    description:
      "Beyond the main roofline, outlining architectural details — gables, dormers, window frames, porch beams and columns — adds depth and makes the design feel intentional rather than strung up. We'll suggest which features are worth highlighting on your home and which are better left dark.",
    considerations: [
      "Not every feature needs light; restraint usually looks more expensive.",
      "Columns and posts can be wrapped or outlined depending on the look you want.",
    ],
    image: "porchOutline",
    offered: true,
    quotable: true,
  },
  {
    id: "trees",
    name: "Tree & landscape lighting",
    summary:
      "Wrapped trunks and canopies, lit shrubs and garden beds that carry the glow across the yard.",
    description:
      "Wrapping tree trunks and branches — especially the live oaks common around Sugar Land — creates a dramatic effect that photographs beautifully. We also light shrubs, hedges and beds so the whole property feels finished, not just the house.",
    considerations: [
      "Tree wraps are quoted by size and how far up the canopy you want to go.",
      "We protect bark and avoid wrapping too tightly so trees aren't damaged.",
      "Outdoor-rated power is planned so beds and trees don't overload a single outlet.",
    ],
    image: "wrappedOaks",
    offered: true,
    quotable: true,
  },
  {
    id: "wreaths",
    name: "Wreaths & garland",
    summary:
      "Fresh-looking greenery for windows, doors, railings and balconies, lit or unlit.",
    description:
      "Wreaths and garland soften the architecture and look good during the day as well as at night. We hang them level and secure, size them to your windows and doors, and can add integrated lights so they glow after dark.",
    considerations: [
      "Sizes are chosen to suit the opening — oversized wreaths read better from the street.",
      "Balcony and railing garland is secured to stay put in wind.",
    ],
    image: "garlandDay",
    offered: true,
    quotable: true,
  },
  {
    id: "entryway",
    name: "Entryway & porch",
    summary:
      "A welcoming front door — lit garland, framed entries and porch details guests notice up close.",
    description:
      "The entry is what guests see at arm's length, so details matter. We frame doorways with lit garland, add wreaths, and light porch beams, railings and steps so the approach to your home is as polished as the view from the street.",
    considerations: [
      "We keep walkways and door swings clear of cords and fixtures.",
      "Planters, urns and other décor can be worked into the design.",
    ],
    image: "entryDoor",
    offered: true,
    quotable: true,
  },
  {
    id: "custom",
    name: "Custom designs",
    summary:
      "Something specific in mind? We'll design a layout around your home and your ideas.",
    description:
      "If you have a particular look in mind — a single color, a mix of warm white and color, or a design built around a feature of your home — we'll plan it with you during the consultation and include it in your proposal.",
    considerations: [
      "Bring photos of looks you like; they make the conversation much faster.",
      "Custom elements may need more lead time, so earlier in the season is better.",
    ],
    image: "porchColor",
    offered: true,
    quotable: true,
  },
  {
    id: "takedown",
    name: "Takedown & storage",
    summary:
      "Included with every install. After the holidays we take everything down and store it for next year.",
    description:
      "Because we own and reuse the lights, takedown is part of the service — not an add-on. After the season we remove everything, check it, and store it. Nothing ends up in your garage or attic, and there's nothing for you to buy.",
    considerations: [
      "Takedown is scheduled in the new year; we'll confirm your date with you.",
      "If you'd like your lights up longer, just let us know when we schedule.",
    ],
    image: "rooflineCloseup",
    offered: true,
    quotable: false,
  },
];

export const offeredServices = services.filter((s) => s.offered);
export const quotableServices = services.filter((s) => s.offered && s.quotable);

/* ─────────────────────────── Consultation types ───────────────────────── */

export type ConsultationTypeId = "phone" | "onsite";

export const consultationTypes: {
  id: ConsultationTypeId;
  name: string;
  description: string;
  offered: boolean;
}[] = [
  {
    id: "phone",
    name: "Phone consultation",
    description:
      "A quick call to talk through what you'd like. Good if you already know the look you want.",
    offered: true,
  },
  {
    id: "onsite",
    name: "On-site walkthrough",
    description:
      "We come by, walk the property with you and measure. Best for first-time installs and larger homes.",
    offered: true,
  },
];

/* ─────────────────────────────── Testimonials ─────────────────────────── */

/**
 * ONLY add genuine reviews from real customers, with their permission.
 * The testimonials section is hidden while this list is empty.
 */
export const testimonials: {
  quote: string;
  name: string; // e.g. "Jennifer M."
  neighborhood?: string;
  source?: string; // e.g. "Google review"
}[] = [];

/* ──────────────────────────────── Photography ─────────────────────────── */

export type PhotoKey = keyof typeof photos;

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /**
   * "stock" = licensed stock photography, NOT our work. Shown with a
   * "Representative photo" note. Change to "project" only for photos of
   * installs you actually did.
   */
  source: "stock" | "project";
  /** Where a stock image came from (for your records / credits page). */
  credit?: string;
  categories: GalleryCategory[];
  /** Only for real projects, e.g. "New Territory · 2026". */
  caption?: string;
};

export type GalleryCategory = "roofline" | "trees" | "wreaths" | "entryway";

export const galleryCategories: { id: GalleryCategory; label: string }[] = [
  { id: "roofline", label: "Rooflines" },
  { id: "entryway", label: "Entryways & porches" },
  { id: "trees", label: "Trees & landscape" },
  { id: "wreaths", label: "Wreaths & garland" },
];

/**
 * STOCK PHOTOGRAPHY — licensed under the Unsplash License
 * (https://unsplash.com/license). These are NOT photos of our installs.
 * Replace with your own project photos as soon as you have them: drop the
 * file in /public/images/projects/, add an entry with source: "project".
 */
const unsplash = (id: string) => `Unsplash (photo-${id}), Unsplash License`;

export const photos = {
  homeOutline: {
    src: "/images/stock/home-outline-warm-white.jpg",
    width: 2000,
    height: 1333,
    alt: "Two-story home at night with warm white lights tracing the roofline, a lit garland along the front fence and glowing shrubs",
    source: "stock",
    credit: unsplash("1664289342468-fa99588e60b8"),
    categories: ["roofline", "trees"],
  },
  porchOutline: {
    src: "/images/stock/porch-roofline-outline.jpg",
    width: 2000,
    height: 1333,
    alt: "Covered front porch with warm white lights outlining the gable and wrapping the porch posts, wreath on the front door",
    source: "stock",
    credit: unsplash("1606946184955-a8cb11e66336"),
    categories: ["roofline", "entryway"],
  },
  rooflineCloseup: {
    src: "/images/stock/roofline-c9-closeup.jpg",
    width: 2000,
    height: 1331,
    alt: "Close view of large C9 bulbs clipped evenly along a roof edge at dusk",
    source: "stock",
    credit: unsplash("1470938017644-581bd9737a31"),
    categories: ["roofline"],
  },
  victorianDusk: {
    src: "/images/stock/victorian-dusk.jpg",
    width: 2000,
    height: 3001,
    alt: "Victorian-style home at dusk with lights outlining the turret, gables and wraparound porch",
    source: "stock",
    credit: unsplash("1754522616772-c829b747541c"),
    categories: ["roofline"],
  },
  brickHome: {
    src: "/images/stock/brick-home-warm-white.jpg",
    width: 2000,
    height: 1333,
    alt: "Brick home at night with lit trees flanking the entry and a lit star in the upstairs window",
    source: "stock",
    credit: unsplash("1664289339684-3e9ce30752c7"),
    categories: ["trees", "entryway"],
  },
  porchTree: {
    src: "/images/stock/porch-evergreen-tree.jpg",
    width: 2000,
    height: 1331,
    alt: "Wraparound porch lined with icicle lights and garland beside a tall evergreen covered in warm white lights",
    source: "stock",
    credit: unsplash("1544397838-37a35169ebf0"),
    categories: ["entryway", "trees", "wreaths"],
  },
  entryDoor: {
    src: "/images/stock/entry-door-wreath-lights.jpg",
    width: 2000,
    height: 2746,
    alt: "Arched front entry framed in warm lights with a wreath on a dark green door",
    source: "stock",
    credit: unsplash("1609280133391-59f548c31edc"),
    categories: ["entryway", "wreaths"],
  },
  wrappedOaks: {
    src: "/images/stock/wrapped-oaks.jpg",
    width: 2000,
    height: 1399,
    alt: "Two large spreading oak trees with trunks and branches wrapped in multicolor lights at night",
    source: "stock",
    credit: unsplash("1671202101063-a1c52c035df1"),
    categories: ["trees"],
  },
  yardTree: {
    src: "/images/stock/lit-yard-tree.jpg",
    width: 2000,
    height: 3000,
    alt: "Front-yard tree wrapped in red lights with lit hedges below",
    source: "stock",
    credit: unsplash("1730989886271-086aab6cb3ab"),
    categories: ["trees"],
  },
  landscape: {
    src: "/images/stock/landscape-reindeer.jpg",
    width: 2000,
    height: 1333,
    alt: "Lit reindeer and sleigh figures among small lit evergreens in front of a brick home",
    source: "stock",
    credit: unsplash("1663792263353-7082742e73bb"),
    categories: ["trees"],
  },
  garlandDay: {
    src: "/images/stock/garland-wreaths-day.jpg",
    width: 2000,
    height: 2000,
    alt: "Shingled two-story home in daylight with wreaths in every window and garland draped along the balcony and porch",
    source: "stock",
    credit: unsplash("1602628902352-73639e174673"),
    categories: ["wreaths"],
  },
  doorWreath: {
    src: "/images/stock/door-wreath-day.jpg",
    width: 2000,
    height: 3019,
    alt: "White front door with a frosted evergreen wreath, framed by brick",
    source: "stock",
    credit: unsplash("1511893838767-e62649737e8e"),
    categories: ["wreaths", "entryway"],
  },
  brickDoorWreath: {
    src: "/images/stock/brick-door-wreath.jpg",
    width: 2000,
    height: 1500,
    alt: "Red brick home with a pale green front door, iron fence and a red-ribboned wreath",
    source: "stock",
    credit: unsplash("1766407329157-bbb726286c50"),
    categories: ["wreaths", "entryway"],
  },
  porchColor: {
    src: "/images/stock/porch-colorful.jpg",
    width: 2000,
    height: 1333,
    alt: "Front porch and picket fence lit with a mix of multicolor and warm white lights",
    source: "stock",
    credit: unsplash("1664289340914-e88538627c02"),
    categories: ["entryway", "roofline"],
  },
  gableNight: {
    src: "/images/stock/gable-roofline-night.jpg",
    width: 2000,
    height: 2942,
    alt: "Steep gabled roofline outlined in small white lights against a night sky",
    source: "stock",
    credit: unsplash("1642737530478-e4da1d14fcd5"),
    categories: ["roofline"],
  },
} satisfies Record<string, Photo>;

export const galleryOrder: PhotoKey[] = [
  "homeOutline",
  "entryDoor",
  "porchOutline",
  "wrappedOaks",
  "victorianDusk",
  "garlandDay",
  "porchTree",
  "rooflineCloseup",
  "brickDoorWreath",
  "yardTree",
  "brickHome",
  "doorWreath",
  "landscape",
  "porchColor",
  "gableNight",
];

/* ─────────────────────────────── Helpers ──────────────────────────────── */

export function isInServiceArea(zip: string): ServiceArea | undefined {
  const z = zip.trim().slice(0, 5);
  return serviceAreas.find((a) => a.zips.includes(z));
}

export const serviceAreaNames = serviceAreas.map((a) => a.name);
