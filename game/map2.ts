import {
  createGoal,
  createPiston,
  createPlayer,
  type GameObject,
  type MovePlan,
  type Operation,
  SimulateResult,
} from "./gameObject.ts";

export function map2() {
  const objects: GameObject[] = [];
  objects.push(createGoal(7, 7));
  objects.push(createPlayer(3, 3));
  objects.push(createPiston(5, 6, "down"));
  return {
    gameObjects: objects,
    defaultEnergy: 9,
  };
}

export function createTick(objects: GameObject[]) {
  let timer = Math.floor(Math.random() * 5);

  return function (operation: Operation): MovePlan[] {
    const player = objects.find((obj) => obj.type === "player")!;
    const tmpPos = { ...player.position };

    if (operation !== "stay") {
      if (operation === "right") {
        tmpPos.x += 1;
      } else if (operation === "left") {
        tmpPos.x -= 1;
      } else if (operation === "up") {
        tmpPos.z += 1;
      } else if (operation === "down") {
        tmpPos.z -= 1;
      }

      if (tmpPos.x < 0 || 7 < tmpPos.x || tmpPos.z < 0 || 7 < tmpPos.z) {
        // マップ外なので戻す
        return [{
          id: player.id,
          type: "player",
          move: { ...player.position },
          action: `failure-${operation}`,
        }];
      }

      // ゴールではない
      for (const obj of objects.filter((obj) => obj.type !== "goal")) {
        if (obj.position.x === tmpPos.x && obj.position.z === tmpPos.z) {
          // 他のオブジェクトがいるので戻す
          return [{
            id: player.id,
            type: "player",
            move: { ...player.position },
            action: `failure-${operation}`,
          }];
        }
        if (obj.type === "piston" && timer === obj.eventNumber) {
          // ピストンが出てくるタイミングでその位置に行こうとしているので戻す
          if (
            obj.direction === "right" && tmpPos.x === obj.position.x + 1 &&
              tmpPos.z === obj.position.z ||
            obj.direction === "left" && tmpPos.x === obj.position.x - 1 &&
              tmpPos.z === obj.position.z ||
            obj.direction === "up" && tmpPos.z === obj.position.z + 1 &&
              tmpPos.x === obj.position.x ||
            obj.direction === "down" && tmpPos.z === obj.position.z - 1 &&
              tmpPos.x === obj.position.x
          ) {
            return [{
              id: player.id,
              type: "player",
              move: { ...player.position },
              action: `failure-${operation}`,
            }];
          }
        }
      }

      // 問題なく移動できた
      player.position = tmpPos;

      return [{
        id: player.id,
        type: "player",
        move: { ...player.position },
        action: "move",
      }];
    }

    // 積極的なstay もしくは、後手番及び評価の操作

    timer++;
    if (timer % 5 === 0) {
      timer = 0;
    }

    // ゴールの座標なので成功
    for (const obj of objects.filter((obj) => obj.type === "goal")) {
      if (obj.position.x === tmpPos.x && obj.position.z === tmpPos.z) {
        // ゴールに到達
        player.position = tmpPos;
        return [{
          id: player.id,
          type: "player",
          move: { ...player.position },
          action: "success",
        }];
      }
    }

    const movePlans: MovePlan[] = [];

    for (const obj of objects.filter((obj) => obj.type !== "player")) {
      if (obj.type === "goal") {
        // ゴールは動かない何もしない
      }
      if (obj.type === "piston") {
        const piston = obj;
        if (timer !== piston.eventNumber) {
          movePlans.push({
            id: piston.id,
            type: "piston",
            action: "deactivate",
            direction: piston.direction,
          });
        } else {
          // ピストンを動かす
          const playerNewPos = { ...player.position };
          if (
            piston.direction === "right" &&
            player.position.x === piston.position.x + 1 &&
            player.position.z === piston.position.z
          ) {
            playerNewPos.x += 1;
          } else if (
            piston.direction === "left" &&
            player.position.x === piston.position.x - 1 &&
            player.position.z === piston.position.z
          ) {
            playerNewPos.x -= 1;
          } else if (
            piston.direction === "up" &&
            player.position.z === piston.position.z + 1 &&
            player.position.x === piston.position.x
          ) {
            playerNewPos.z += 1;
          } else if (
            piston.direction === "down" &&
            player.position.z === piston.position.z - 1 &&
            player.position.x === piston.position.x
          ) {
            playerNewPos.z -= 1;
          }
          objects.find((obj) => obj.id === player.id)!.position = playerNewPos;
          movePlans.push({
            id: player.id,
            type: "player",
            move: { ...playerNewPos },
            action: "move",
          });
          movePlans.push({
            id: piston.id,
            type: "piston",
            action: "activate",
            direction: piston.direction,
          });
          // プレイヤーの新しい位置がマップ外か他のオブジェクトと重なる場合、押し出し失敗
        }
      }
    }

    return movePlans;
  };
}

const { gameObjects, defaultEnergy } = map2();
const tick = createTick(gameObjects);

const movePlan: MovePlan[][] = [];
const energyHistory: number[] = [];

function createStart() {
  //console.log("Game started");
  movePlan.push([{
    id: gameObjects.find((obj) => obj.type === "player")!.id,
    type: "player",
    move: { ...gameObjects.find((obj) => obj.type === "player")!.position },
    action: "start",
  }]);
  energyHistory.push(defaultEnergy);
}

// 各処理の中で内部のタイマーが動くようにする。
export function moveRight() {
  if (energyHistory[energyHistory.length - 1] <= 0) {
    return;
  }
  movePlan.push(tick("right"));
  energyHistory.push(energyHistory[energyHistory.length - 1] - 1);
  movePlan.push(tick("stay"));
  energyHistory.push(energyHistory[energyHistory.length - 1]);
}
export function moveUp() {
  if (energyHistory[energyHistory.length - 1] <= 0) {
    return;
  }
  movePlan.push(tick("up"));
  energyHistory.push(energyHistory[energyHistory.length - 1] - 1);
  movePlan.push(tick("stay"));
  energyHistory.push(energyHistory[energyHistory.length - 1]);
}
export function moveLeft() {
  if (energyHistory[energyHistory.length - 1] <= 0) {
    return;
  }
  movePlan.push(tick("left"));
  energyHistory.push(energyHistory[energyHistory.length - 1] - 1);
  movePlan.push(tick("stay"));
  energyHistory.push(energyHistory[energyHistory.length - 1]);
}
export function moveDown() {
  if (energyHistory[energyHistory.length - 1] <= 0) {
    return;
  }
  movePlan.push(tick("down"));
  energyHistory.push(energyHistory[energyHistory.length - 1] - 1);
  movePlan.push(tick("stay"));
  energyHistory.push(energyHistory[energyHistory.length - 1]);
}

export function stay() {
  tick("stay");
  energyHistory.push(energyHistory[energyHistory.length - 1]);
}

createStart();

export function getSimulateResult(): SimulateResult {
  return {
    objects: gameObjects,
    movePlan: movePlan,
    energyHistory: energyHistory,
  };
}

export const defaultCommands = [
  "// Welcome to Game",
  "moveRight();",
  "moveUp();",
  "moveRight();",
  "moveUp();",
  "moveLeft();",
  "moveDown();",
];

export const defaultSimulateResult = {
  objects: [{
    id: "goal-a2b778e2-c2e5-44ea-aa08-00cb0b3dd083",
    type: "goal",
    position: { x: 7, z: 7 },
  }, {
    id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
    type: "player",
    position: { x: 3, z: 3 },
  }, {
    id: "piston-df6ffef2-0d82-4f5c-be0c-e9660a5c5a07",
    type: "piston",
    position: { x: 5, z: 6 },
    direction: "up",
  }],
  movePlan: [
    [
      {
        action: "start",
        id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
        move: { x: 3, z: 3 },
        type: "player",
      },
    ],
    [{
      id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
      type: "player",
      move: { x: 4, z: 3 },
      action: "move",
    }],
    [],
    [{
      id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
      type: "player",
      move: { x: 4, z: 4 },
      action: "move",
    }],
    [],
    [{
      id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
      type: "player",
      move: { x: 5, z: 4 },
      action: "move",
    }],
    [],
    [{
      id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
      type: "player",
      move: { x: 5, z: 5 },
      action: "move",
    }],
    [],
    [{
      id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
      type: "player",
      move: { x: 4, z: 5 },
      action: "move",
    }],
    [],
    [{
      id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
      type: "player",
      move: { x: 4, z: 4 },
      action: "move",
    }],
    [],
  ],
  energyHistory: [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1],
};
