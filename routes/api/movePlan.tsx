import { define } from "../../utils.ts";
import { Sandbox } from "@deno/sandbox";

const OUTPUT_SPLITTER = "===MOVE_PLAN_START===" as const;
type GameMap = "map1" | "map2" | "map3";

// while や for ループの使用をチェックする関数
function validateUserScript(
  userScript: string,
): { valid: boolean; error?: string } {
  // コメントと文字列リテラルを除去してからチェック
  const codeWithoutComments = userScript
    .replace(/\/\/.*$/gm, "") // 単一行コメントを除去
    .replace(/\/\*[\s\S]*?\*\//g, "") // 複数行コメントを除去
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // ダブルクォート文字列を除去
    .replace(/'(?:[^'\\]|\\.)*'/g, "''") // シングルクォート文字列を除去
    .replace(/`(?:[^`\\]|\\.)*`/g, "``"); // テンプレートリテラルを除去

  // while ループのチェック（while の後に ( があるパターン）
  if (/\bwhile\s*\(/.test(codeWithoutComments)) {
    return {
      valid: false,
      error:
        "Error: 'while' loops are not allowed. Please use the repeat() function instead.",
    };
  }

  // for ループのチェック（for の後に ( があるパターン）
  if (/\bfor\s*\(/.test(codeWithoutComments)) {
    return {
      valid: false,
      error:
        "Error: 'for' loops are not allowed. Please use the repeat() function instead.",
    };
  }

  return { valid: true };
}

function createSrcCode(userScript: string, gameMap: GameMap): string {
  return `
  import { moveRight, moveUp, moveLeft, moveDown, stay, getSimulateResult, isObstacleRight, isObstacleUp, isObstacleLeft, isObstacleDown, repeat } from "./${gameMap}.ts";

  // User Script Start
  ${userScript}
  // User Script End

  console.log("${OUTPUT_SPLITTER}");
  const simulateResult = getSimulateResult();

  console.log(JSON.stringify(simulateResult));
  `;
}

async function simulateSandbox(userScript: string, gameMap: GameMap) {
  await using sandbox = await Sandbox.create();

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

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 40000);

  try {
    const child = await sandbox.spawn("deno", {
      args: ["run", scriptName],
      stdout: "piped",
      stderr: "piped",
      signal: abortController.signal,
    });

    // タイムアウト用のPromise
    const timeoutPromise = new Promise<never>((_, reject) => {
      abortController.signal.addEventListener("abort", () => {
        reject(new Error("Timeout"));
      });
    });

    // 子プロセスの実行とタイムアウト両方走らせる
    const executeProcess = async () => {
      if (child.stdout === null) {
        throw new Error("stdout is null");
      }

      // stdout と stderr を並行して読み取る
      const [stdoutTexts, stderrTexts] = await Promise.all([
        (async () => {
          const texts: string[] = [];
          for await (const chunk of child.stdout!) {
            texts.push(new TextDecoder().decode(chunk));
          }
          return texts;
        })(),
        (async () => {
          const texts: string[] = [];
          if (child.stderr) {
            for await (const chunk of child.stderr) {
              texts.push(new TextDecoder().decode(chunk));
            }
          }
          return texts;
        })(),
      ]);

      const status = await child.status;

      if (stderrTexts.length > 0) {
        console.error("Sandbox stderr:", stderrTexts.join(""));
      }

      // タイムアウトによる終了（SIGTERM: 143）
      if (status.success === false && status.code === 143) {
        return {
          simulateResult: {},
          stdout: "",
          stderr:
            "Timeout: The script execution exceeded the time limit of 4 seconds.",
          status: "error",
        };
      }

      const [stdout, simulateResult] = stdoutTexts.join("").split(
        OUTPUT_SPLITTER,
      );

      return {
        simulateResult: JSON.parse(simulateResult.trim()),
        stdout,
        stderr: stderrTexts.join(""),
        status: status.code === 0 ? "success" : "error",
      };
    };

    return await Promise.race([executeProcess(), timeoutPromise]);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Timeout" || error.name === "AbortError")
    ) {
      return {
        simulateResult: {},
        stdout: "",
        stderr:
          "Timeout: The script execution exceeded the time limit of 3 seconds.",
        status: "error",
      };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
export const handler = define.handlers({
  async POST(ctx) {
    const userScript = await ctx.req.json();

    console.log(userScript);

    // while や for ループの使用をチェック
    const validation = validateUserScript(userScript.code);
    if (!validation.valid) {
      return Response.json({
        simulateResult: {},
        stdout: "",
        stderr: validation.error,
        status: "error",
      });
    }

    const simulateResult = await simulateSandbox(
      userScript.code,
      userScript.gameMap,
    );

    console.log("Simulation result:", JSON.stringify(simulateResult, null, 2));

    return Response.json(simulateResult);
  },
});
