function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

async function getRecentPackages() {
  const maintenance = getRandomFloat(0, 1.0);
  const quality = getRandomFloat(0.5, 1.0);
  const popularity = getRandomFloat(0.3, 1.0);
  const url = `https://registry.npmjs.org/-/v1/search?text=not:insecure&maintenance=${maintenance}&quality=${quality}&popularity=${popularity}`;

  const result = await fetch(url);
  const recentPackages = await result.json();

  return recentPackages;
}

const pageServingHeaders = {
  "content-type": "text/html; charset=UTF-8",
  "Cache-Control":
    "s-maxage=1500, public, immutable, stale-while-revalidate=1501",
  Link: `<https://ga.jspm.io>; rel="preconnect",<https://fonts.googleapis.com>; rel="preconnect", <https://ga.jspm.io/npm:normalize.css@8.0.1/normalize.css>; rel="preload"; as="style", <https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Major+Mono+Display&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&family=Vollkorn&family=Inter:wght@200;400;800&display=swap>; rel="preload"; as="style"`,
};

export {
  getRandomFloat,
  getRecentPackages,
  pageServingHeaders,
};
