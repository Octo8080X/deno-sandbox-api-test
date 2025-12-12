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

export function map2() {
  const objects: GameObject[] = [];
  objects.push(createGoal(7, 2));
  objects.push(createPlayer(1, 3));
  objects.push(createPiston(3, 4, "down"));
  objects.push(createPiston(6, 4, "down"));
  objects.push(createBox(4, 2));
  objects.push(createSlideFloor(2, 2, "left"));
  objects.push(createSlideFloor(1, 2, "left"));

  return {
    gameObjects: objects,
    defaultEnergy: 7,
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
  "",
  "repeat(()=>isObstacleRight(),()=>{",
  '  console.log("Obstacle on the right!");',
  "  stay();",
  "})",
  "",
  'console.log("No obstacles")',
  "moveRight();",
  "moveRight();",
];

export const defaultSimulateResult = {
  "objects": [
    {
      "id": "goal-aa693e29-356b-49ff-b710-820119266d97",
      "type": "goal",
      "position": {
        "x": 7,
        "z": 2,
      },
    },
    {
      "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
      "type": "player",
      "position": {
        "x": 1,
        "z": 3,
      },
    },
    {
      "id": "piston-88e0d452-8609-43e9-b218-37b9549c50d5",
      "type": "piston",
      "position": {
        "x": 3,
        "z": 4,
      },
      "direction": "down",
      "eventNumber": 2,
    },
    {
      "id": "piston-d00c78c2-2645-4786-a29b-21718ef2c844",
      "type": "piston",
      "position": {
        "x": 6,
        "z": 4,
      },
      "direction": "down",
      "eventNumber": 1,
    },
    {
      "id": "box-56ecd4c1-5f8e-4320-bd56-36b9401b8b31",
      "type": "box",
      "position": {
        "x": 4,
        "z": 2,
      },
    },
    {
      "id": "slideFloor-07c90e5e-ed21-4584-bccb-91411d1f5ad4",
      "type": "slideFloor",
      "position": {
        "x": 2,
        "z": 2,
      },
      "direction": "left",
    },
    {
      "id": "slideFloor-5fa81355-3f28-4389-bcdf-ef24c45205b8",
      "type": "slideFloor",
      "position": {
        "x": 1,
        "z": 2,
      },
      "direction": "left",
    },
    {
      "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
      "type": "player",
      "position": {
        "x": 1,
        "z": 3,
      },
    },
  ],
  "movePlan": [
    [
      {
        "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
        "type": "player",
        "move": {
          "x": 1,
          "z": 3,
        },
        "action": "start",
      },
    ],
    [
      {
        "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
        "type": "player",
        "move": {
          "x": 2,
          "z": 3,
        },
        "action": "move",
      },
    ],
    [
      {
        "id": "piston-88e0d452-8609-43e9-b218-37b9549c50d5",
        "type": "piston",
        "action": "deactivate",
        "direction": "down",
      },
      {
        "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
        "type": "player",
        "move": {
          "x": 2,
          "z": 3,
        },
        "action": "move",
      },
      {
        "id": "piston-d00c78c2-2645-4786-a29b-21718ef2c844",
        "type": "piston",
        "action": "activate",
        "direction": "down",
      },
    ],
    [
      {
        "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
        "type": "player",
        "move": {
          "x": 3,
          "z": 3,
        },
        "action": "move",
      },
    ],
    [
      {
        "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
        "type": "player",
        "move": {
          "x": 3,
          "z": 2,
        },
        "action": "move",
      },
      {
        "id": "piston-88e0d452-8609-43e9-b218-37b9549c50d5",
        "type": "piston",
        "action": "activate",
        "direction": "down",
      },
      {
        "id": "piston-d00c78c2-2645-4786-a29b-21718ef2c844",
        "type": "piston",
        "action": "deactivate",
        "direction": "down",
      },
    ],
    [
      {
        "id": "player-9bb1ae86-6ff4-4f23-bcd0-bddc6ebb330f",
        "type": "player",
        "move": {
          "x": 3,
          "z": 2,
        },
        "action": "failure-right",
      },
    ],
    [
      {
        "id": "piston-88e0d452-8609-43e9-b218-37b9549c50d5",
        "type": "piston",
        "action": "deactivate",
        "direction": "down",
      },
      {
        "id": "piston-d00c78c2-2645-4786-a29b-21718ef2c844",
        "type": "piston",
        "action": "deactivate",
        "direction": "down",
      },
    ],
  ],
  "energyHistory": [
    7,
    6,
    6,
    5,
    5,
    4,
    4,
  ],
};
