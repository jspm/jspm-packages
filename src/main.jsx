import h from "solid-js/h";
import { HydrationScript } from "solid-js/web";

function App () {
  return (
    <html lang="en">
      <head>
        <title>🔥 Solid SSR 🔥</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles.css" />
        <HydrationScript />
      </head>
      <body>{/*... rest of App*/}</body>
    </html>
  );
}

export default App;