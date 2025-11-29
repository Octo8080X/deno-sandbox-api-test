import { define } from "../../utils.ts";
import { Sandbox } from "@deno/sandbox";

function createSrcCode(userScript: string) {
  return `
  const  movePlan: string[] = [];
  function moveRight() {
    movePlan.push("right");
  }
  function moveLeft() {
    movePlan.push("left");
  }
  function moveUp() {
    movePlan.push("up");
  }
  function moveDown() {
    movePlan.push("down");
  }

  // User Script Start
  ${userScript}
  // User Script End

  console.log(JSON.stringify({movePlan}));
  `;
}

async function simulateSandbox(userScript: string) {
  await using sandbox = await Sandbox.create();

  const scriptName = `${crypto.randomUUID()}.ts`;

  console.log(createSrcCode(userScript));

  await sandbox.writeTextFile(scriptName, createSrcCode(userScript));

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

  return {
    stdout: stdoutTexts.join(""),
    stderr: stderrTexts.join(""),
    status: (await child.status).code == 0 ? "success" : "error",
  }

}
export const handler = define.handlers({
  async POST(ctx) {
    const userScript = await ctx.req.json();

    console.log(userScript);
    const simulateResult = await simulateSandbox(userScript.code);

    console.log("Simulation result:", simulateResult);

    return Response.json(simulateResult);
  },
});
