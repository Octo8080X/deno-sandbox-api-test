import { SimulateResult } from "../game/gameObject.ts";

declare const BABYLON: any;
interface MountBabylonProps {
  simulateResult: SimulateResult;
}

function createCamera(scene: any) {
  // カメラの作成（斜め上から見下ろす）
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    10,
    new BABYLON.Vector3(0, -1, 0),
    scene,
  );
  camera.inputs.clear();
}

function createLight(scene: any) {
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  light.intensity = 1.5;
}

function createGround(scene: any) {
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 8, height: 8, subdivisions: 8 },
    scene,
  );
  ground.position.y = -2;

  // チェッカーボードパターンのマテリアル
  const groundMaterial = new BABYLON.StandardMaterial(
    "groundMaterial",
    scene,
  );
  const texture = new BABYLON.DynamicTexture(
    "checkerboard",
    512,
    scene,
    false,
  );
  const ctx = texture.getContext();
  const squareSize = 512 / 8;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "#000000";
      ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
    }
  }
  texture.update();

  groundMaterial.diffuseTexture = texture;
  ground.material = groundMaterial;
}

function createGoalFlag(scene: any, x: number, z: number) {
  const flagPole = BABYLON.MeshBuilder.CreateCylinder(
    "flagPole",
    { height: 1.5, diameter: 0.1 },
    scene,
  );
  flagPole.position = new BABYLON.Vector3(-3.5 + x, -1.25, -3.5 + z);

  const poleMaterial = new BABYLON.StandardMaterial("poleMaterial", scene);
  poleMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
  flagPole.material = poleMaterial;

  const flag = BABYLON.MeshBuilder.CreatePlane(
    "flag",
    { width: 2, height: 0.8 },
    scene,
  );
  flag.position = new BABYLON.Vector3(-2.5 + x, -1, -3.5 + z);
  flag.rotation.y = Math.PI;

  const flagMaterial = new BABYLON.StandardMaterial("flagMaterial", scene);
  const flagTexture = new BABYLON.DynamicTexture(
    "flagTexture",
    { width: 256, height: 256 },
    scene,
    false,
  );
  const flagCtx = flagTexture.getContext();

  flagCtx.fillStyle = "#ff0000";
  flagCtx.fillRect(0, 0, 256, 256);
  flagCtx.save();
  flagCtx.translate(256, 0);
  flagCtx.scale(-1, 1);
  flagCtx.font = "bold 89px Arial";
  flagCtx.fillStyle = "#ffffff";
  flagCtx.textAlign = "center";
  flagCtx.textBaseline = "middle";
  flagCtx.fillText("GOAL", 128, 128);
  flagCtx.restore();
  flagTexture.update();

  flagMaterial.diffuseTexture = flagTexture;
  flagMaterial.backFaceCulling = false;
  flag.material = flagMaterial;
}

function createPlayer(scene: any, x: number, z: number) {
  const player = BABYLON.MeshBuilder.CreateBox(
    "player",
    { height: 0.8, width: 0.8, depth: 0.8 },
    scene,
  );
  player.position = new BABYLON.Vector3(-3.5 + x, -1.75, -3.5 + z);

  const playerMaterial = new BABYLON.StandardMaterial(
    "playerMaterial",
    scene,
  );
  playerMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
  player.material = playerMaterial;
  return player;
}

function createGameStateMessageUI() {
  const text = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    "GameStateMessageUI",
  );
  const label = new BABYLON.GUI.TextBlock();
  label.text = "";
  label.color = "white";
  label.fontSize = 24;
  label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
  label.left = 10;
  label.top = 10;
  text.addControl(label);

  return {
    updateFail: () => {
      label.text = "❌ Game Over - Goal not reached";
      label.color = "red";
      label.fontSize = 36;
      label.left = 5;
    },
    updateSuccess: () => {
      label.text = "🎉 GOAL! You Win! 🎉";
      label.color = "gold";
      label.fontSize = 36;
      label.left = 5;
    },
  };
}

function createStatusMessageUI(text?: string) {
  const energyText = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    "StatusMessageUI",
  );
  const energyLabel = new BABYLON.GUI.TextBlock();
  energyLabel.text = text || "";
  energyLabel.color = "white";
  energyLabel.fontSize = 24;
  energyLabel.textHorizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  energyLabel.textVerticalAlignment =
    BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
  energyLabel.left = 10;
  energyLabel.top = 52;
  energyText.addControl(energyLabel);

  return {
    updateStatusMessage: (text?: string) => {
      energyLabel.text = text;
    },
  };
}

function createReplayMessageUI() {
  const energyText = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    "ReplayMessageUI",
  );
  const energyLabel = new BABYLON.GUI.TextBlock();
  energyLabel.text = "Simulating...";
  energyLabel.color = "white";
  energyLabel.fontSize = 24;
  energyLabel.textHorizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  energyLabel.textVerticalAlignment =
    BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
  energyLabel.left = 10;
  energyLabel.top = 82;
  energyText.addControl(energyLabel);

  return {
    updateReplay: () => {
      energyLabel.text = "Replay...";
    },
  };
}

export function gameViewer(
  props: MountBabylonProps,
  canvasRef: { current: HTMLCanvasElement | null },
): { resize: () => void; dispose: () => void } {
  if (typeof globalThis.window === "undefined" || !canvasRef.current) {
    return { resize: () => {}, dispose: () => {} };
  }

  if (typeof BABYLON === "undefined") {
    console.warn("BabylonJS is not loaded yet.");
    return { resize: () => {}, dispose: () => {} };
  }

  const canvas = canvasRef.current;

  const engine = new BABYLON.Engine(canvas, true);
  let intervalId: number | undefined;

  const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    createCamera(scene);

    // ライトの作成
    createLight(scene);

    // 地面を作成
    createGround(scene);

    // UIの作成
    //const { updateStatusMessage } = createStatusMessageUI();
    //const { updateFail, updateSuccess } = createGameStateMessageUI();
    //const { updateReplay } = createReplayMessageUI();

    console.log(props.simulateResult);

    for (const obj of props.simulateResult.objects) {
      if (obj.type === "goal") {
        // ゴール地点に旗を設置
        createGoalFlag(scene, obj.position.x, obj.position.z);
      }
    }

    const player = createPlayer(scene, 3, 3);

    let count = 0;
    let countSkip = false;

    intervalId = setInterval(() => {
      const movePlan = props.simulateResult.movePlan;
      if (!movePlan || movePlan.length === 0) return;
      if (countSkip) return;

      //updateStatusMessage(`Enegy ${props.simulateResult.energyHistory[count]}`);
      if (props.simulateResult.energyHistory[count] <= 0) {
        //updateFail();
        //updateReplay();
        countSkip = true;
        setTimeout(() => {
          count = 0;
          countSkip = false;
        }, 1000);
        return;
      }

      console.log("Executing move plan:", count);
      if (count < movePlan.length) {
        for (const move of movePlan[count]) {
          if (move.action === "move") {
            const worldX = -3.5 + move.move.x;
            const worldZ = -3.5 + move.move.z;
            BABYLON.Animation.CreateAndStartAnimation(
              "playerMove",
              player,
              "position",
              60,
              30,
              player.position,
              new BABYLON.Vector3(worldX, -1.75, worldZ),
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
              undefined,
            );
          }

          if (move.action.startsWith("failure-")) {
            let anim = null;
            if (move.action === "failure-right") {
              anim = BABYLON.Animation.CreateAndStartAnimation(
                "playerShakeX",
                player,
                "position.x",
                60,
                30,
                player.position.x,
                player.position.x + 0.5,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
              );
            }
            if (move.action === "failure-left") {
              anim = BABYLON.Animation.CreateAndStartAnimation(
                "playerShakeX",
                player,
                "position.x",
                60,
                30,
                player.position.x,
                player.position.x - 0.5,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
              );
            }
            if (move.action === "failure-up") {
              anim = BABYLON.Animation.CreateAndStartAnimation(
                "playerShakeZ",
                player,
                "position.z",
                60,
                30,
                player.position.z,
                player.position.z + 0.5,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
              );
            }
            if (move.action === "failure-down") {
              anim = BABYLON.Animation.CreateAndStartAnimation(
                "playerShakeZ",
                player,
                "position.z",
                60,
                30,
                player.position.z,
                player.position.z - 0.5,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
              );
            }
            setTimeout(() => {
              anim.stop();
              player.position.x = -3.5 + move.move.x;
              player.position.z = -3.5 + move.move.z;
            }, 800);
          }

          if (move.action === "start") {
            player.position.x = -3.5 + move.move.x;
            player.position.z = -3.5 + move.move.z;
          }
          if (move.action === "success") {
            countSkip = true;
            //updateSuccess();

            const bounceAnim = BABYLON.Animation.CreateAndStartAnimation(
              "goalBounce",
              player,
              "position.y",
              60,
              60,
              -1.75,
              -1.25,
              BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
            );

            BABYLON.Animation.CreateAndStartAnimation(
              "goalSpin",
              player,
              "rotation.y",
              60,
              120,
              0,
              Math.PI * 4,
              BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
              undefined,
              () => {
                if (bounceAnim) bounceAnim.stop();
                player.position.y = -1.75;
                if (countSkip) {
                  count = 0;
                  countSkip = false;
                }
                //updateReplay();
              },
            );
          }
        }
        count++;
      } else {
        count = 0;
        //updateFail();
        //updateReplay();
      }
    }, 1000);

    return scene;
  };

  const scene = createScene();

  engine.runRenderLoop(() => {
    scene.render();
  });

  return {
    resize: () => engine.resize(),
    dispose: () => {
      if (intervalId !== undefined) clearInterval(intervalId);
      engine.dispose();
    },
  };
}
