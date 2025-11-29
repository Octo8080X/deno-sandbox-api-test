import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html data-theme="halloween">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Deno Sandbox API Test</title>
        <script src="https://cdn.babylonjs.com/babylon.js"></script>
        <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
