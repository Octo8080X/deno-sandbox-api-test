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
      <button
        type="button"
        onClick={handleShare}
        class="fixed top-4 right-4 btn btn-neutral shadow-lg hover:scale-105 transition-transform z-50"
      >
        Share on 𝕏
      </button>

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
