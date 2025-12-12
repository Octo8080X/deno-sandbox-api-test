import { SimulateResult } from "../game/gameObject.ts";
import { createSlideFloor } from "./../game/gameObject";

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

function createPiston(scene: any, x: number, z: number) {
  // ピストンの土台
  const piston = BABYLON.MeshBuilder.CreateBox(
    "piston",
    { height: 0.5, width: 1, depth: 1 },
    scene,
  );
  piston.position = new BABYLON.Vector3(-3.5 + x, -1.75, -3.5 + z);

  const pistonMaterial = new BABYLON.StandardMaterial(
    "pistonMaterial",
    scene,
  );
  pistonMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.3);
  piston.material = pistonMaterial;

  // ピストンの可動部分
  const pistonHead = BABYLON.MeshBuilder.CreateBox(
    "pistonHead",
    { height: 0.6, width: 0.8, depth: 0.8 },
    scene,
  );
  pistonHead.position = new BABYLON.Vector3(
    -3.5 + x,
    -1.75,
    -3.5 + z,
  );

  const pistonHeadMaterial = new BABYLON.StandardMaterial(
    "pistonHeadMaterial",
    scene,
  );
  pistonHeadMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  pistonHead.material = pistonHeadMaterial;

  return pistonHead;
}

function createSlideFloor(
  scene: any,
  x: number,
  z: number,
  direction: "right" | "left" | "up" | "down",
) {
  const slideFloor = BABYLON.MeshBuilder.CreatePlane(
    "slideFloor",
    { width: 1, height: 1 },
    scene,
  );
  slideFloor.position = new BABYLON.Vector3(-3.5 + x, -1.9, -3.5 + z);
  slideFloor.rotation.x = Math.PI / 2;

  const slideFloorMaterial = new BABYLON.StandardMaterial(
    "slideFloorMaterial",
    scene,
  );

  // 矢印テクスチャを作成
  const textureSize = 256;
  const arrowTexture = new BABYLON.DynamicTexture(
    "arrowTexture",
    { width: textureSize, height: textureSize },
    scene,
    false,
  );

  // 矢印の向きに応じた回転角度
  let rotation = 0;
  switch (direction) {
    case "right":
      rotation = 0;
      break;
    case "down":
      rotation = Math.PI / 2;
      break;
    case "left":
      rotation = Math.PI;
      break;
    case "up":
      rotation = -Math.PI / 2;
      break;
  }

  // アニメーション用のオフセット
  let animOffset = 0;

  const drawArrow = () => {
    const ctx = arrowTexture.getContext();
    const center = textureSize / 2;

    // 背景をクリア
    ctx.fillStyle = "#e6e633";
    ctx.fillRect(0, 0, textureSize, textureSize);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    // アニメーションするオフセットを適用
    const offsetX = Math.sin(animOffset) * 15;

    // 矢印を描画（3つの矢印で流れを表現）
    ctx.fillStyle = "#333333";

    for (let i = -1; i <= 1; i++) {
      const xPos = offsetX + i * 60;

      ctx.beginPath();
      // 矢印の形状
      ctx.moveTo(xPos - 30, -20);
      ctx.lineTo(xPos, -20);
      ctx.lineTo(xPos, -40);
      ctx.lineTo(xPos + 40, 0);
      ctx.lineTo(xPos, 40);
      ctx.lineTo(xPos, 20);
      ctx.lineTo(xPos - 30, 20);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    arrowTexture.update();
  };

  // 初回描画
  drawArrow();

  // アニメーションを設定
  scene.registerBeforeRender(() => {
    animOffset += 0.08;
    drawArrow();
  });

  slideFloorMaterial.diffuseTexture = arrowTexture;
  slideFloorMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.1);
  slideFloor.material = slideFloorMaterial;

  return slideFloor;
}

function createBox(scene: any, x: number, z: number) {
  const box = BABYLON.MeshBuilder.CreateBox(
    "box",
    { height: 0.8, width: 0.8, depth: 0.8 },
    scene,
  );
  box.position = new BABYLON.Vector3(-3.5 + x, -1.75, -3.5 + z);

  const boxMaterial = new BABYLON.StandardMaterial(
    "boxMaterial",
    scene,
  );

  // Xの模様を持つテクスチャを作成
  const textureSize = 256;
  const boxTexture = new BABYLON.DynamicTexture(
    "boxTexture",
    { width: textureSize, height: textureSize },
    scene,
    false,
  );
  const ctx = boxTexture.getContext();

  // 背景色（茶色）
  ctx.fillStyle = "#996633";
  ctx.fillRect(0, 0, textureSize, textureSize);

  // Xの模様を描画
  ctx.strokeStyle = "#4d3319";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";

  // 左上から右下への線
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(textureSize - 40, textureSize - 40);
  ctx.stroke();

  // 右上から左下への線
  ctx.beginPath();
  ctx.moveTo(textureSize - 40, 40);
  ctx.lineTo(40, textureSize - 40);
  ctx.stroke();

  // 枠線を追加
  ctx.strokeStyle = "#4d3319";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, textureSize - 20, textureSize - 20);

  boxTexture.update();

  boxMaterial.diffuseTexture = boxTexture;
  box.material = boxMaterial;
  return box;
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
    const { updateStatusMessage } = createStatusMessageUI();
    const { updateFail, updateSuccess } = createGameStateMessageUI();
    const { updateReplay } = createReplayMessageUI();

    console.log(props.simulateResult);
    const objects: { [key: string]: any } = {};

    for (const obj of props.simulateResult.objects) {
      if (obj.type === "goal") {
        // ゴール地点に旗を設置
        createGoalFlag(scene, obj.position.x, obj.position.z);
      }
      if (obj.type === "piston") {
        // ピストンを設置
        const piston = createPiston(scene, obj.position.x, obj.position.z);
        objects[obj.id] = piston;
      }
      if (obj.type === "slideFloor") {
        // スライド床を設置
        const slideFloor = createSlideFloor(
          scene,
          obj.position.x,
          obj.position.z,
          obj.direction || "right",
        );
        objects[obj.id] = slideFloor;
      }
      if (obj.type === "box") {
        // 箱を設置
        const box = createBox(scene, obj.position.x, obj.position.z);
        objects[obj.id] = box;
      }
    }

    const playerObject = props.simulateResult.objects.find(
      (o) => o.type === "player",
    )!;
    const player = createPlayer(
      scene,
      playerObject.position.x,
      playerObject.position.z,
    );

    let count = 0;
    let countSkip = false;

    intervalId = setInterval(() => {
      const movePlan = props.simulateResult.movePlan;
      if (!movePlan || movePlan.length === 0) return;
      if (countSkip) return;
      if (props.simulateResult.movePlan.length <= count) {
        updateFail();
        updateReplay();
        countSkip = true;
        count = 0;
        setTimeout(() => {
          countSkip = false;
        }, 1000);
        return;
      }

      if (props.simulateResult.energyHistory[count] <= 0) {
        updateStatusMessage(
          `Energy ${props.simulateResult.energyHistory[count]}`,
        );
        updateFail();
        updateReplay();
        countSkip = true;
        count = 0;
        setTimeout(() => {
          countSkip = false;
        }, 1000);
        return;
      }

      if (props.simulateResult.energyHistory.length <= count) {
        count = 0;
        updateFail();
        updateReplay();
        return;
      }
      updateStatusMessage(
        `Energy ${props.simulateResult.energyHistory[count]}`,
      );

      if (count < movePlan.length) {
        for (const move of movePlan[count]) {
          if (move.type === "piston") {
            // ピストンのアニメーション
            const piston = objects[move.id];
            // objects 配列からピストンオブジェクトを取得
            const pistonBaseProp = props.simulateResult.objects.find(
              (o) => o.id === move.id,
            );

            const basePosition = pistonBaseProp!.position;
            const newPistonheadPos = piston.position.clone();
            let actionProp = "";
            if (move.direction === "down" && move.action === "activate") {
              actionProp = "position.z";
              newPistonheadPos.z = basePosition?.z - 1 - 3.5;
            }
            if (move.direction === "down" && move.action === "deactivate") {
              actionProp = "position.z";
              newPistonheadPos.z = basePosition?.z - 3.5;
            }
            if (move.direction === "up" && move.action === "activate") {
              actionProp = "position.z";
              newPistonheadPos.z = basePosition?.z + 1 - 3.5;
            }
            if (move.direction === "up" && move.action === "deactivate") {
              actionProp = "position.z";
              newPistonheadPos.z = basePosition?.z - 3.5;
            }
            if (move.direction === "right" && move.action === "activate") {
              actionProp = "position.x";
              newPistonheadPos.x = basePosition?.x + 1 - 3.5;
            }
            if (move.direction === "right" && move.action === "deactivate") {
              actionProp = "position.x";
              newPistonheadPos.x = basePosition?.x - 3.5;
            }
            if (move.direction === "left" && move.action === "activate") {
              actionProp = "position.x";
              newPistonheadPos.x = basePosition?.x - 1 - 3.5;
            }
            if (move.direction === "left" && move.action === "deactivate") {
              actionProp = "position.x";
              newPistonheadPos.x = basePosition?.x - 3.5;
            }
            if (actionProp === "position.x") {
              BABYLON.Animation.CreateAndStartAnimation(
                "pistonMove",
                piston,
                actionProp,
                60,
                30,
                piston.position.x,
                newPistonheadPos.x,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
              );
            }

            if (actionProp === "position.z") {
              BABYLON.Animation.CreateAndStartAnimation(
                "pistonMove",
                piston,
                actionProp,
                60,
                30,
                piston.position.z,
                newPistonheadPos.z,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
              );
            }
          }
          if (move.type === "player") {
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
              updateSuccess();

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
                  updateReplay();
                },
              );
            }
          }
        }
        count++;
      } else {
        count = 0;
        updateFail();
        updateReplay();
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
