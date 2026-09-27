/** Sources for the numbers on the "Why now" slide. Each was checked against the page on Sep 26, 2026. */
export type Source = { id: string; publisher: string; date: string; title: string; url: string };

export const SOURCES = {
  flmm: {
    id: "flmm",
    publisher: "ImmigCanada",
    date: "July 23, 2026",
    title: "Canada Moves Faster on Foreign Credential Recognition to Help Skilled Newcomers Find Jobs",
    url: "https://immigcanada.com/canada-moves-faster-on-foreign-credential-recognition/",
  },
  flmmRelease: {
    id: "flmmRelease",
    publisher: "Employment and Social Development Canada (Canada.ca)",
    date: "July 2026",
    title: "Forum of Labour Market Ministers met in Halifax to discuss shared priorities",
    url: "https://www.canada.ca/en/employment-social-development/news/2026/07/forum-of-labour-market-ministers-met-in-halifax-to-discuss-shared-priorities.html",
  },
  fcr: {
    id: "fcr",
    publisher: "CIC News",
    date: "April 6, 2026",
    title: "Canada affirms foreign credential recognition target for 2026-27",
    url: "https://www.cicnews.com/2026/04/canada-sets-new-foreign-credential-recognition-target-for-2026-27-0473769.html",
  },
} satisfies Record<string, Source>;

/** The two facts quoted from those sources (not in our data files, so they live here with their URLs). */
export const WHY_NOW = {
  flmmMeeting: "July 2026",
  flmmRecommendationsDue: "fall 2026",
  fcrAgreements: 58,
  fcrProfessionals: 32_000,
} as const;
