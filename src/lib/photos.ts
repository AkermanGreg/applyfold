/**
 * Marketing photography from Unsplash (Unsplash License: free for commercial use, no
 * attribution required). Served through next/image so Vercel resizes and caches them.
 */
const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

export const PHOTOS = {
  heroGoodNews: {
    src: unsplash("1615891081220-9116de3e1afd"),
    alt: "A woman smiling at her laptop at a bright desk",
  },
  nurse: { src: unsplash("1594824476967-48c8b964273f", 900), alt: "A nurse in teal scrubs smiling with arms crossed" },
  teacher: { src: unsplash("1780844824652-091299403e68", 900), alt: "A teacher in a colorful classroom" },
  trades: { src: unsplash("1743130940714-91b221fa49ec", 900), alt: "A smiling tradesperson in a hard hat and hi-vis shirt" },
  office: { src: unsplash("1758598306980-c47a94c6708c", 900), alt: "A professional in a grey suit smiling in an office" },
  offerHandshake: { src: unsplash("1698047682091-782b1e5c6536", 1400), alt: "Two women shaking hands across a table at an interview" },
  celebrate: { src: unsplash("1545315003-c5ad6226c272", 1600), alt: "A woman celebrating with her arms raised" },
} as const;
