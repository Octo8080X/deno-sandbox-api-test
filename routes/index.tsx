import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import Game from "../islands/Game.tsx";

export default define.page(function Home(_ctx) {
  return (
    <div class="min-h-screen bg-base-200">
      <Head>
        <title>Fresh x Babylon.js x Deno sandbox</title>
      </Head>

      <div class="hero bg-base-100 py-2 mb-4 shadow-sm">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-3xl font-bold text-primary">
              Deno Sandbox API Test
            </h1>
            <p class="py-2">
              Fresh x Babylon.js x Monaco Editor on Deno Sandbox API
            </p>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 pb-12 flex flex-col items-center gap-8">
        <Game />
      </div>
    </div>
  );
});
