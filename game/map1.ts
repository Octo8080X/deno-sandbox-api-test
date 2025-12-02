import {
  createGoal,
  createPlayer,
  type GameObject,
  type MovePlan,
  type Operation,
  SimulateResult,
} from "./gameObject.ts";

export function map1() {
  const objects: GameObject[] = [];
  objects.push(createGoal(5, 5));
  objects.push(createPlayer(3, 3));
  return {
    gameObjects: objects,
    defaultEnergy: 5,
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
    if (timer % 5 !== 0) {
      timer = 0;
    }

    // ゴールの座標なので成功
    for (const obj of objects.filter((obj) => obj.type === "goal")) {
      console.log(
        "Goal position:",
        obj.position,
        "Player target position:",
        tmpPos,
      );
      if (obj.position.x === tmpPos.x && obj.position.z === tmpPos.z) {
        // ゴールに到達
        console.log("Goal reached at position:", tmpPos);
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

    for (const obj of objects) {
      if (obj.type === "goal") {
        // ゴールは動かない何もしない
      }
    }
    return movePlans;
  };
}

const { gameObjects, defaultEnergy } = map1();
const tick = createTick(gameObjects);

const movePlan: MovePlan[][] = [];
const energyHistory: number[] = [];

function createStart() {
  console.log("Game started");
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
  energyHistory.push(energyHistory[energyHistory.length - 1] - 1);
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
  "moveLeft();",
  "moveDown();",
];

export const defaultSimulateResult = {
      objects: [{
        id: "goal-a2b778e2-c2e5-44ea-aa08-00cb0b3dd083",
        type: "goal",
        position: { x: 5, z: 5 },
      }, {
        id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
        type: "player",
        position: { x: 3, z: 3 },
      }],
      movePlan: [
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
          move: { x: 3, z: 4 },
          action: "move",
        }],
        [],
        [{
          id: "player-508b9a78-3dc0-49bf-8896-570156a0be39",
          type: "player",
          move: { x: 3, z: 3 },
          action: "move",
        }],
        [],
      ],
      energyHistory: [5, 4, 4, 3, 3, 2, 2, 1, 1],
    }
  
