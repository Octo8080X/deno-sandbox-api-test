import { useSignal } from "@preact/signals";
import MonacoEditor from "./MonacoEditor.tsx";
import MountBabylon from "./MountBabylon.tsx";
import { useEffect, useState } from "preact/hooks";

export type MoveOperation = "right" | "left" | "up" | "down";

export default function Game() {
  const code = useSignal(`// Welcome to Game
moveRight();
moveUp();
moveLeft();    
moveDown();
`);
  const [movePlan, setMovePlan] = useState<MoveOperation[]>([
    "right",
    "up",
    "left",
    "down",
  ]);
  const [resetKey, setResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Current code:", code.value);
  }, [code.value]);

  const handleRetry = async () => {
    await sendCodeToApi();
  };

  const handleShare = () => {
    const text = encodeURIComponent("Deno Sandbox API Game! 🎮\n");
    const url = encodeURIComponent("https://deno-sandbox-api-test.octo8080x.deno.net/");
    const hashtags = encodeURIComponent("Deno,sandbox,BabylonJS");
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`,
      "_blank",
    );
  };

  const sendCodeToApi = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/movePlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.value }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === "error") {
          if (data.stderr == null || data.stderr === "") {
            setError("Unknown error occurred in sandbox");
          } else {
            // ANSIエスケープシーケンスを除去して表示
            // deno-lint-ignore no-control-regex
            setError(data.stderr.replace(/\x1b\[[0-9;]*m/g, ""));
          }
        } else {
          setMovePlan(JSON.parse(data.stdout).movePlan);
          setResetKey((prev) => prev + 1);
        }
      } else {
        console.error("Failed to fetch move plan from API");
        setError("Failed to fetch move plan from API");
      }
    } catch (error) {
      console.error("Error while fetching move plan:", error);
      setError("Error while fetching move plan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div class="fixed top-4 right-4 flex gap-2 z-50">
        <a
          href="https://github.com/Octo8080X/deno-sandbox-api-test"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-neutral shadow-lg hover:scale-105 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-6 h-6"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
        <button
          type="button"
          onClick={handleShare}
          class="btn btn-neutral shadow-lg hover:scale-105 transition-transform"
        >
          Share on 𝕏
        </button>
      </div>

      {/* Left Column: Game View */}
      <div class="flex-1 flex flex-col gap-4">
        <div class="card bg-base-100 shadow-xl border border-base-200">
          <div class="card-body p-4">
            <div class="flex justify-between items-center mb-2">
              <h2 class="card-title text-lg">Game View</h2>
            </div>
            <MountBabylon key={resetKey} movePlan={movePlan} />
          </div>
        </div>

        <div class="flex justify-center">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isLoading}
            class="btn btn-primary btn-lg w-full shadow-lg hover:scale-105 transition-transform disabled:cursor-not-allowed"
          >
            {isLoading
              ? <span class="loading loading-spinner"></span>
              : "Run Code"}
          </button>
        </div>

        {error && (
          <div role="alert" class="alert alert-error shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="font-bold">Error!</h3>
              <div class="text-xs whitespace-pre-wrap font-mono">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Code Editor */}
      <div class="flex-1">
        <div class="card bg-base-100 shadow-xl border border-base-200 h-full">
          <div class="card-body p-4 flex flex-col h-full">
            <div class="flex justify-between items-center mb-2">
              <h2 class="card-title text-lg">Code Editor</h2>
              <div class="tooltip" data-tip="Write your code here">
                <button type="button" class="btn btn-circle btn-ghost btn-xs">
                  ?
                </button>
              </div>
            </div>
            <MonacoEditor code={code} />
          </div>
        </div>
      </div>
    </div>
  );
}
