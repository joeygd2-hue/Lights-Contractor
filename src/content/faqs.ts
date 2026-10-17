import { pricing, serviceAreas, site } from "@/config/site";

export type Faq = {
  q: string;
  a: string[];
  category: "Pricing" | "Installation" | "Lights & materials" | "During the season" | "Takedown & storage" | "Scheduling";
  /** Shown in the homepage preview. */
  featured?: boolean;
};

const areaList = serviceAreas.map((a) => a.name).join(", ");

/**
 * Answers are written to be accurate without overpromising. Review each one
 * and adjust to match exactly how you operate before launch.
 */
export const faqs: Faq[] = [
  {
    category: "Pricing",
    featured: true,
    q: "How much does professional Christmas light installation cost?",
    a: [
      pricing.showRange
        ? `${pricing.rangeText} ${pricing.rangeDetail}`
        : "Every home is different, so we quote each one individually. Price depends mostly on the length and height of your roofline, how many trees or other features you want lit, and how complex the installation is.",
      "Your quote covers the full season: design, our lights and materials, installation, upkeep during the season, takedown and storage. The quote is free and there's no obligation.",
    ],
  },
  {
    category: "Pricing",
    q: "Do I have to buy the lights?",
    a: [
      "No. We use our own commercial-grade lights, clips and cords and reuse them each season. You're paying for a finished, maintained display — not for products you'll have to store.",
    ],
  },
  {
    category: "Pricing",
    q: "Why not just buy lights and do it myself?",
    a: [
      "You certainly can. Hiring it out makes sense if you'd rather not spend time on ladders, want a cleaner, more consistent look than store-bought strands usually give, or simply don't want to deal with storage and the annual untangling.",
    ],
  },
  {
    category: "Installation",
    featured: true,
    q: "When do you install, and when should I book?",
    a: [
      `Most installs happen ${site.season.installWindow}. Dates are scheduled in the order proposals are approved, so the earlier you reach out, the more choice you'll have.`,
    ],
  },
  {
    category: "Installation",
    q: "Will installation damage my roof or gutters?",
    a: [
      "We attach lights with clips made for shingles and gutters — no nails, staples or screws into your roof. When everything comes down, the clips come with it.",
    ],
  },
  {
    category: "Installation",
    q: "Do I need to be home during installation?",
    a: [
      "Not always. For most homes we only need access to the exterior and to outdoor outlets. We'll talk it through when we schedule, and we're happy to do the install while you're home if you prefer.",
    ],
  },
  {
    category: "Installation",
    q: "Do you need my outdoor outlets?",
    a: [
      "Yes — the lights run on your home's power. During the consultation we'll look at where your outdoor outlets are and plan the runs so circuits aren't overloaded and cords stay out of walkways.",
    ],
  },
  {
    category: "Lights & materials",
    featured: true,
    q: "What kind of lights do you use?",
    a: [
      "We use LED lights rated for outdoor use. Warm white is the most popular choice, and multicolor is available. We'll show you options during the consultation so you can pick the look you want.",
    ],
  },
  {
    category: "Lights & materials",
    q: "Can I use my own lights or decorations?",
    a: [
      "Our service is built around our own lights so we can stand behind how they look and work. If you have a special decoration you'd like included, mention it in your quote request and we'll talk about it.",
    ],
  },
  {
    category: "During the season",
    featured: true,
    q: "What if a light goes out or the weather is bad?",
    a: [
      "Our lights are designed for outdoor use and our installs are secured to stay put through normal Texas winter weather — rain, wind and the occasional cold snap. If a section stops working during the season, contact us and we'll come back to take care of it.",
      "We don't install during storms or when roofs are wet, so heavy weather can shift an install date by a day or two. We'll keep you posted.",
    ],
  },
  {
    category: "During the season",
    q: "How do the lights turn on and off?",
    a: [
      "We'll walk you through it before we leave. Many homeowners prefer a simple outdoor timer so the lights come on each evening without thinking about it — just ask.",
    ],
  },
  {
    category: "Takedown & storage",
    featured: true,
    q: "Is takedown included?",
    a: [
      `Yes. Takedown is part of every install, not an add-on. We schedule it in ${site.season.takedownWindow}, remove everything we put up, and store the lights until next season.`,
    ],
  },
  {
    category: "Takedown & storage",
    q: "Where are the lights stored?",
    a: [
      "With us. Because the lights are ours, there's nothing to keep in your garage or attic.",
    ],
  },
  {
    category: "Scheduling",
    q: "Which neighborhoods do you serve?",
    a: [
      `We currently serve ${areaList} in ${site.location.city}, ${site.location.region}. If you're nearby but outside that area, send us a message — we're adding neighborhoods over time.`,
    ],
  },
  {
    category: "Scheduling",
    q: "How does the consultation work?",
    a: [
      "You can book a phone consultation or an on-site walkthrough online. On-site visits take about half an hour: we look at your home together, talk through what you'd like and take measurements for your proposal. It's free.",
    ],
  },
];

export const faqCategories = Array.from(new Set(faqs.map((f) => f.category)));
