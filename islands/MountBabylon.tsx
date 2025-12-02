import { useEffect, useRef } from "preact/hooks";
import { SimulateResult } from "./../game/gameObject.ts";
import { gameViewer } from "../gameViewer/viewer.ts";

// deno-lint-ignore no-explicit-any
declare const BABYLON: any;

interface MountBabylonProps {
  simulateResult: SimulateResult;
}

export default function MountBabylon(props: MountBabylonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const { resize, dispose } = gameViewer(props, canvasRef);

    globalThis.addEventListener("resize", () => {
      resize();
    });

    return () => {
      dispose();
    };
  }, []);

  return (
    <div class="w-full h-full">
      <canvas
        ref={canvasRef}
        class="w-full rounded-box border border-base-300 bg-base-200"
        style={{ height: "400px", width: "100%" }}
      />
    </div>
  );
}
