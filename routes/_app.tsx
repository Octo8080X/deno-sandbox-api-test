import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html data-theme="halloween">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Deno Sandbox API Test Game</title>
        <meta property="og:title" content="Deno Sandbox API Test Game" />
        <meta property="og:description" content="A sandbox game powered by Deno and Babylon.js" />
        <meta property="og:image" content="https://deno-sandbox-api-test.octo8080x.deno.net/ogp.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://deno-sandbox-api-test.octo8080x.deno.net/ogp.png" />
        <script src="https://cdn.babylonjs.com/babylon.js"></script>
        <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
