const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 * @see {@link https://docs.base.org/mini-apps/core-concepts/manifest}
 */
export const minikitConfig = {
  
  
  
  accountAssociation: {
    header: "eyJmaWQiOjE2MDg5MzQsInR5cGUiOiJhdXRoIiwia2V5IjoiMHgzM2FlNmYyZTUxNjUwM2Q0NDEzMTc3MjM5RTE4ZENiNEJENTRGQjZiIn0",
    payload: "eyJkb21haW4iOiJtaW5pLWFwcC1xdWlja3N0YXJ0LXRlbXBsYXRlLXVtYmVyLnZlcmNlbC5hcHAifQ",
    signature: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJMHnm8_7mEbd_Jz2g4Rt9MkWpTlT5UG6aYLq_Zt17eYeqFavvuHR1xhWMVuc6mdYOEZVqLj9tC_Pz32idvTliQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAl8ZgIay2xclZzG8RWZzuWvO8j9R0fus3XxDee9lRlVy8dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACKeyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiTHREZUxfTm85MnRVNFBLUEo3Q1pIUHJURzFTRUYzSnNFMFl0ck5IX2NIbyIsIm9yaWdpbiI6Imh0dHBzOi8va2V5cy5jb2luYmFzZS5jb20iLCJjcm9zc09yaWdpbiI6ZmFsc2V9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  },



  miniapp: {
    version: "1",
    name: "Mini App Quickstart Template",
    subtitle: "Quickstart Template",
    description:
      "A starter template for building Base Mini Apps using Next.js. By Trio Blockchain Labs.",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "developer-tools",
    tags: ["developer-tools", "productivity"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Ship mini apps faster. By TriO",
    ogTitle: "Mini App Quickstart Template",
    ogDescription:
      "A template for building Base Mini Apps using Next.js and TypeScript. By Trio Blockchain Labs",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
