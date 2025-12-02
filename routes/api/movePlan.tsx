import { define } from "../../utils.ts";
import { Sandbox } from "@deno/sandbox";

const OUTPUT_SPLITTER = "===MOVE_PLAN_START===" as const;
type GameMap = "map1" | "map2" | "map3";

function createSrcCode(userScript: string, gameMap: GameMap): string {
  return `
  import { moveRight, moveUp, moveLeft, moveDown, stay, getSimulateResult } from "./${gameMap}.ts";

  // User Script Start
  ${userScript}
  // User Script End

  console.log("${OUTPUT_SPLITTER}");
  const simulateResult = getSimulateResult();

  console.log(JSON.stringify(simulateResult));
  `;
}

async function simulateSandbox(userScript: string, gameMap: GameMap) {
  const sandbox = await Sandbox.create();

  const libScriptName = "gameObject.ts";
  const libScriptCode = await Deno.readTextFile(
    "./game/gameObject.ts",
  );
  await sandbox.writeTextFile(libScriptName, libScriptCode);
  const libMapName = `${gameMap}.ts`;
  const libMapCode = await Deno.readTextFile(
    `./game/${gameMap}.ts`,
  );
  await sandbox.writeTextFile(libMapName, libMapCode);

  const scriptName = `${crypto.randomUUID()}.ts`;
  const srcCode = createSrcCode(userScript, gameMap);
  console.log(srcCode);

  await sandbox.writeTextFile(scriptName, srcCode);

  const child = await sandbox.spawn("deno", {
    args: ["run", scriptName],
    stdout: "piped",
    stderr: "piped",
    signal: AbortSignal.timeout(5000),
  });

  console.log(await child.status);

  if (child.stdout === null) {
    throw new Error("stdout is null");
  }

  // チャンクを文字列にまとめる
  const stdoutTexts = [];
  for await (const chunk of child.stdout) {
    stdoutTexts.push(new TextDecoder().decode(chunk));
  }
  const stderrTexts = [];
  if (child.stderr) {
    for await (const chunk of child.stderr) {
      stderrTexts.push(new TextDecoder().decode(chunk));
    }
  }
  if (stderrTexts.length > 0) {
    console.error("Sandbox stderr:", stderrTexts.join(""));
  }

  const [stdout, simulateResult] = stdoutTexts.join("").split(OUTPUT_SPLITTER);

  return {
    simulateResult: JSON.parse(simulateResult.trim()),
    stdout,
    stderr: stderrTexts.join(""),
    status: (await child.status).code == 0 ? "success" : "error",
  };
}
export const handler = define.handlers({
  async POST(ctx) {
    const userScript = await ctx.req.json();

    console.log(userScript);
    const simulateResult = await simulateSandbox(
      userScript.code,
      userScript.gameMap,
    );

    console.log("Simulation result:", simulateResult);

    return Response.json(simulateResult);
  },
});
