import {
  createBox,
  createGoal,
  createPiston,
  createPlayer,
  createSlideFloor,
  type GameObject,
  type MovePlan,
  type Operation,
  SimulateResult,
} from "./gameObject.ts";

export function map3() {
  const objects: GameObject[] = [];
  objects.push(createGoal(7, 2));
  objects.push(createPlayer(1, 4));
  objects.push(createSlideFloor(2, 4, "right"));
  objects.push(createSlideFloor(3, 4, "right"));
  objects.push(createSlideFloor(4, 4, "right"));
  objects.push(createSlideFloor(5, 4, "right"));
  objects.push(createSlideFloor(6, 4, "up"));
  objects.push(createSlideFloor(6, 5, "up"));
  objects.push(createSlideFloor(6, 6, "left"));
  objects.push(createBox(4, 5));
  objects.push(createBox(7, 4));
  objects.push(createPiston(3, 2, "right"));
  objects.push(createSlideFloor(5, 2, "right"));
  objects.push(createSlideFloor(6, 2, "right"));

  return {
    gameObjects: objects,
    defaultEnergy: 4,
  };
}

let timer = 0;

export function createTick(objects: GameObject[]) {
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
      for (
        const obj of objects.filter((obj) =>
          obj.type !== "goal" && obj.type !== "slideFloor"
        )
      ) {
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
    let isPlayerActioned = false;

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
      if (obj.type === "slideFloor") {
        if (
          obj.position.x === player.position.x &&
          obj.position.z === player.position.z && !isPlayerActioned
        ) {
          isPlayerActioned = true;
          const slideFloor = obj;
          const playerNewPos = { ...player.position };
          if (slideFloor.direction === "right") {
            playerNewPos.x += 1;
          } else if (slideFloor.direction === "left") {
            playerNewPos.x -= 1;
          } else if (slideFloor.direction === "up") {
            playerNewPos.z += 1;
          } else if (slideFloor.direction === "down") {
            playerNewPos.z -= 1;
          }
          objects.find((obj) => obj.id === player.id)!.position = playerNewPos;

          movePlans.push({
            id: player.id,
            type: "player",
            move: { ...playerNewPos },
            action: "move",
          });
        }
      }
      if (obj.type === "box") {
        // boxは動かない何もしない
      }
    }

    return movePlans;
  };
}

const { gameObjects, defaultEnergy } = map3();
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

function isObstacle(pos1: { x: number; z: number }, object: GameObject) {
  if (object.type === "piston") {
    if (timer === object.eventNumber) {
      // ピストンが出ているので障害物とみなす
      if (
        object.direction === "right" && pos1.x === object.position.x + 1 &&
          pos1.z === object.position.z ||
        object.direction === "left" && pos1.x === object.position.x - 1 &&
          pos1.z === object.position.z ||
        object.direction === "up" && pos1.z === object.position.z + 1 &&
          pos1.x === object.position.x ||
        object.direction === "down" && pos1.z === object.position.z - 1 &&
          pos1.x === object.position.x
      ) {
        return true;
      }
    }
    // ピストン自体も障害物である
    if (pos1.x === object.position.x && pos1.z === object.position.z) {
      return true;
    }
  }
  if (object.type === "box") {
    if (pos1.x === object.position.x && pos1.z === object.position.z) {
      return true;
    }
  }

  return false;
}

// 障害物があるか確認する
export function isObstacleRight() {
  const player = gameObjects.find((obj) => obj.type === "player")!;
  const lookPos = { x: player.position.x + 1, z: player.position.z };
  for (const obj of gameObjects.filter((obj) => obj.id !== player.id)) {
    if (isObstacle(lookPos, obj)) {
      return true;
    }
  }
  return false;
}

export function isObstacleLeft() {
  const player = gameObjects.find((obj) => obj.type === "player")!;
  const lookPos = { x: player.position.x - 1, z: player.position.z };
  for (const obj of gameObjects.filter((obj) => obj.id !== player.id)) {
    if (isObstacle(lookPos, obj)) {
      return true;
    }
  }
  return false;
}

export function isObstacleUp() {
  const player = gameObjects.find((obj) => obj.type === "player")!;
  const lookPos = { x: player.position.x, z: player.position.z + 1 };
  for (const obj of gameObjects.filter((obj) => obj.id !== player.id)) {
    if (isObstacle(lookPos, obj)) {
      return true;
    }
  }
  return false;
}

export function isObstacleDown() {
  const player = gameObjects.find((obj) => obj.type === "player")!;
  const lookPos = { x: player.position.x, z: player.position.z - 1 };
  for (const obj of gameObjects.filter((obj) => obj.id !== player.id)) {
    if (isObstacle(lookPos, obj)) {
      return true;
    }
  }
  return false;
}

// 第一引数に渡された関数を実行して判定し、trueであれば
// 第二引数に渡された関数を実行し、falseであれば何もしない。
// ただし、最大10回まで。処理が返ってこないことを防止する
export function repeat(conditionFn: () => boolean, actionFn: () => void) {
  let count = 0;
  while (conditionFn() && count < 10) {
    actionFn();
    count++;
  }
}

export function stay() {
  movePlan.push(tick("stay"));
  energyHistory.push(energyHistory[energyHistory.length - 1]);
}

createStart();

export function getSimulateResult(): SimulateResult {
  // 座標更新されているので初期に戻す
  const player = gameObjects.find((obj) => obj.type === "player")!;
  player.position.x = movePlan[0].find((o) => o.id === player.id)!.move.x;
  player.position.z = movePlan[0].find((o) => o.id === player.id)!.move.z;

  return {
    objects: [...gameObjects, player],
    movePlan: movePlan,
    energyHistory: energyHistory,
  };
}

export const defaultCommands = [
  "// Welcome to Game",
  "moveRight();",
  "repeat(()=>!isObstacleRight(),()=>{",
  "  stay();",
  "})",
  "moveLeft();",
  "stay();",
  "stay();",
  "stay();",
  "stay();",
];

export const defaultSimulateResult = {
  "objects": [
    {
      "id": "goal-081ed0d3-e544-45d9-899f-2b1d74057918",
      "type": "goal",
      "position": {
        "x": 7,
        "z": 2,
      },
    },
    {
      "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
      "type": "player",
      "position": {
        "x": 1,
        "z": 4,
      },
    },
    {
      "id": "slideFloor-7db6222c-3a1c-4bfb-9923-0217c84d3046",
      "type": "slideFloor",
      "position": {
        "x": 2,
        "z": 4,
      },
      "direction": "right",
    },
    {
      "id": "slideFloor-2707929f-3a33-43ba-973b-5fbb5e2d0385",
      "type": "slideFloor",
      "position": {
        "x": 3,
        "z": 4,
      },
      "direction": "right",
    },
    {
      "id": "slideFloor-8802fdee-63b9-4394-8094-08cf35695d39",
      "type": "slideFloor",
      "position": {
        "x": 4,
        "z": 4,
      },
      "direction": "right",
    },
    {
      "id": "slideFloor-e05af97b-ead3-465f-a67d-e487a419a3d4",
      "type": "slideFloor",
      "position": {
        "x": 5,
        "z": 4,
      },
      "direction": "right",
    },
    {
      "id": "slideFloor-20e63ed7-a12a-49f6-b29a-8141586d1993",
      "type": "slideFloor",
      "position": {
        "x": 6,
        "z": 4,
      },
      "direction": "up",
    },
    {
      "id": "slideFloor-c9394d25-89f5-4a7c-a167-f49e7ca873b3",
      "type": "slideFloor",
      "position": {
        "x": 6,
        "z": 5,
      },
      "direction": "up",
    },
    {
      "id": "slideFloor-603901f3-8046-4cd1-aeac-b37ef8968645",
      "type": "slideFloor",
      "position": {
        "x": 6,
        "z": 6,
      },
      "direction": "left",
    },
    {
      "id": "box-5fbadfb6-9ada-4716-9408-dc7d5d3bf856",
      "type": "box",
      "position": {
        "x": 4,
        "z": 5,
      },
    },
    {
      "id": "box-d52014b8-5ac2-4ffd-89d8-2fe88f410d8d",
      "type": "box",
      "position": {
        "x": 7,
        "z": 4,
      },
    },
    {
      "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
      "type": "piston",
      "position": {
        "x": 3,
        "z": 2,
      },
      "direction": "right",
      "eventNumber": 2,
    },
    {
      "id": "slideFloor-55330590-b59f-408f-ae02-070968327fa0",
      "type": "slideFloor",
      "position": {
        "x": 5,
        "z": 2,
      },
      "direction": "right",
    },
    {
      "id": "slideFloor-8c6ae569-b9ab-4189-99dd-bbb8574a81e2",
      "type": "slideFloor",
      "position": {
        "x": 6,
        "z": 2,
      },
      "direction": "right",
    },
    {
      "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
      "type": "player",
      "position": {
        "x": 1,
        "z": 4,
      },
    },
  ],
  "movePlan": [
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 1,
          "z": 4,
        },
        "action": "start",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 2,
          "z": 4,
        },
        "action": "move",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 3,
          "z": 4,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 4,
          "z": 4,
        },
        "action": "move",
      },
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 4,
          "z": 4,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "activate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 5,
          "z": 4,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 6,
          "z": 4,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 5,
          "z": 4,
        },
        "action": "move",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 6,
          "z": 4,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 6,
          "z": 5,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 6,
          "z": 6,
        },
        "action": "move",
      },
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 6,
          "z": 6,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "activate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "player-33ee7d07-1674-4c58-859c-a82ebe1b3ac6",
        "type": "player",
        "move": {
          "x": 5,
          "z": 6,
        },
        "action": "move",
      },
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
    [
      {
        "id": "piston-24b8b9d0-ef8a-4fca-afb9-67574fd20bcf",
        "type": "piston",
        "action": "deactivate",
        "direction": "right",
      },
    ],
  ],
  "energyHistory": [
    4,
    3,
    3,
    3,
    3,
    3,
    2,
    2,
    2,
    2,
    2,
    2,
  ],
};
