import {
  createGoal,
  createPlayer,
  GameObject,
  MovePlan,
  Operation,
} from "./game/gameObject.ts";

export function map1() {
  const objects: GameObject[] = [];
  objects.push(createGoal(5, 5));
  objects.push(createPlayer(3, 3));
  return objects;
}

function createTick(objects: GameObject[]) {
  const timerStart = Math.floor(Math.random() * 5);

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

const tick = createTick(map1());

const movePlan: MovePlan[][] = [];

// 各処理の中で内部のタイマーが動くようにする。
function moveRight() {
  movePlan.push(tick("right"));
  movePlan.push(tick("stay"));
}
function moveUp() {
  movePlan.push(tick("up"));
  movePlan.push(tick("stay"));
}
function moveLeft() {
  movePlan.push(tick("left"));
  movePlan.push(tick("stay"));
}
function moveDown() {
  movePlan.push(tick("down"));
  movePlan.push(tick("stay"));
}

function stay() {
  tick("stay");
}

moveRight();
moveRight();
moveRight();
moveRight();
moveRight();
moveUp();
moveUp();
moveUp();
moveUp();
moveUp();

//function canMoveRight(): boolean;
//function canMoveUp(): boolean;
//function canMoveLeft(): boolean;
//function canMoveDown(): boolean;
//
