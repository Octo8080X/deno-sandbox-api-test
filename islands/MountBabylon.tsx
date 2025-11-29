import { useEffect, useRef } from "preact/hooks";
import { MoveOperation } from "./Game.tsx";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import * as GUI from "@babylonjs/gui";

interface MountBabylonProps {
  movePlan: MoveOperation[];
}

export default function MountBabylon(props: MountBabylonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof globalThis.window === "undefined" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
      const scene = new BABYLON.Scene(engine);

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

      // ライトの作成
      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene,
      );
      light.intensity = 1.5;

      // 地面を作成
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

      // ゴール地点に旗を設置
      const flagPole = BABYLON.MeshBuilder.CreateCylinder(
        "flagPole",
        { height: 1.5, diameter: 0.1 },
        scene,
      );
      flagPole.position = new BABYLON.Vector3(3.5, -1.25, 3.5);

      const poleMaterial = new BABYLON.StandardMaterial("poleMaterial", scene);
      poleMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
      flagPole.material = poleMaterial;

      const flag = BABYLON.MeshBuilder.CreatePlane(
        "flag",
        { width: 2, height: 0.8 },
        scene,
      );
      flag.position = new BABYLON.Vector3(4.5, -1, 3.5);
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

      // キャラクター
      let gridX = 3;
      let gridZ = 3;
      let isMoving = false;
      let energy = 10;

      const player = BABYLON.MeshBuilder.CreateBox(
        "player",
        { height: 0.8, width: 0.8, depth: 0.8 },
        scene,
      );
      player.position = new BABYLON.Vector3(-3.5 + gridX, -1.75, -3.5 + gridZ);

      const playerMaterial = new BABYLON.StandardMaterial(
        "playerMaterial",
        scene,
      );
      playerMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
      player.material = playerMaterial;

      // エネルギー表示
      const energyText = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
      const energyLabel = new GUI.TextBlock();
      energyLabel.text = `Energy: ${energy}`;
      energyLabel.color = "white";
      energyLabel.fontSize = 24;
      energyLabel.textHorizontalAlignment =
        GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      energyLabel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      energyLabel.left = 10;
      energyLabel.top = 10;
      energyText.addControl(energyLabel);

      let currentMoveIndex = 0;

      const executeMove = (direction: string) => {
        if (isMoving) return;

        let newGridX = gridX;
        let newGridZ = gridZ;
        let canMove = false;

        switch (direction) {
          case "up":
            if (gridZ < 7) {
              newGridZ++;
              canMove = true;
            }
            break;
          case "down":
            if (gridZ > 0) {
              newGridZ--;
              canMove = true;
            }
            break;
          case "left":
            if (gridX > 0) {
              newGridX--;
              canMove = true;
            }
            break;
          case "right":
            if (gridX < 7) {
              newGridX++;
              canMove = true;
            }
            break;
        }

        if (canMove) {
          isMoving = true;
          gridX = newGridX;
          gridZ = newGridZ;

          energy -= 1;
          energyLabel.text = `Energy: ${energy}`;

          if (energy <= 0) {
            energyLabel.text = "Energy: 0 - Game Over";
            energyLabel.color = "red";
            return;
          }

          const worldX = -3.5 + gridX;
          const worldZ = -3.5 + gridZ;

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
            () => {
              isMoving = false;

              if (gridX === 7 && gridZ === 7) {
                energyLabel.text = "🎉 GOAL! You Win! 🎉";
                energyLabel.color = "gold";
                energyLabel.fontSize = 36;

                BABYLON.Animation.CreateAndStartAnimation(
                  "goalSpin",
                  player,
                  "rotation.y",
                  60,
                  120,
                  0,
                  Math.PI * 4,
                  BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                );

                BABYLON.Animation.CreateAndStartAnimation(
                  "goalBounce",
                  player,
                  "position.y",
                  60,
                  60,
                  -1.75,
                  -1.25,
                  BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
                );

                return;
              }

              currentMoveIndex++;
              if (currentMoveIndex < props.movePlan.length) {
                setTimeout(
                  () => executeMove(props.movePlan[currentMoveIndex]),
                  200,
                );
              } else {
                if (gridX !== 7 || gridZ !== 7) {
                  energyLabel.text = "❌ Game Over - Goal not reached";
                  energyLabel.color = "red";
                  energyLabel.fontSize = 36;
                }
              }
            },
          );
        } else {
          // Blocked move animation
          isMoving = true;

          energy -= 1;
          energyLabel.text = `Energy: ${energy}`;

          if (energy <= 0) {
            energyLabel.text = "Energy: 0 - Game Over";
            energyLabel.color = "red";
            return;
          }

          const bumpAmount = 0.3;
          let bumpX = 0;
          let bumpZ = 0;

          switch (direction) {
            case "up":
              bumpZ = bumpAmount;
              break;
            case "down":
              bumpZ = -bumpAmount;
              break;
            case "left":
              bumpX = -bumpAmount;
              break;
            case "right":
              bumpX = bumpAmount;
              break;
          }

          const originalPos = player.position.clone();
          const targetPos = originalPos.add(
            new BABYLON.Vector3(bumpX, 0, bumpZ),
          );

          BABYLON.Animation.CreateAndStartAnimation(
            "playerBumpOut",
            player,
            "position",
            60,
            10,
            originalPos,
            targetPos,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            undefined,
            () => {
              BABYLON.Animation.CreateAndStartAnimation(
                "playerBumpIn",
                player,
                "position",
                60,
                10,
                targetPos,
                originalPos,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                undefined,
                () => {
                  isMoving = false;
                  currentMoveIndex++;
                  if (currentMoveIndex < props.movePlan.length) {
                    setTimeout(
                      () => executeMove(props.movePlan[currentMoveIndex]),
                      200,
                    );
                  } else {
                    if (gridX !== 7 || gridZ !== 7) {
                      energyLabel.text = "❌ Game Over - Goal not reached";
                      energyLabel.color = "red";
                      energyLabel.fontSize = 36;
                    }
                  }
                },
              );
            },
          );
        }
      };

      setTimeout(() => {
        if (props.movePlan.length > 0) {
          executeMove(props.movePlan[0]);
        }
      }, 1000);

      return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => {
      scene.render();
    });

    globalThis.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      engine.dispose();
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
