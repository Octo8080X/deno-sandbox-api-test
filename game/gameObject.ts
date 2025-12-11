export type Operation = "right" | "left" | "up" | "down" | "stay";

export interface BaseGameObject {
  id: string;
  type: "player" | "goal" | "piston";
  position: { x: number; z: number };
}

type PlayerGameObject = BaseGameObject & {
  type: "player";
};

type GoalGameObject = BaseGameObject & {
  type: "goal";
};

type PistonGameObject = BaseGameObject & {
  type: "piston";
  direction: "right" | "left" | "up" | "down";
  eventNumber: number;
};

export type GameObject = PlayerGameObject | GoalGameObject | PistonGameObject;

export interface MovePlanBase {
  id: string;
}

export interface MovePlanPlayer extends MovePlanBase {
  type: "player";
  move: { x: number; z: number };
  action:
    | "start"
    | "move"
    | "failure-up"
    | "failure-right"
    | "failure-down"
    | "failure-left"
    | "success";
}

export interface MovePlanPiston extends MovePlanBase {
  type: "piston";
  direction: "right" | "left" | "up" | "down";
  action: "activate" | "deactivate";
}

export type MovePlan = MovePlanPlayer | MovePlanPiston;

export interface SimulateResult {
  objects: GameObject[];
  movePlan: MovePlan[][];
  energyHistory: number[];
}

export interface SimulateResultAtResponse extends SimulateResult {
  output: string | null;
  error: string | null;
  success: boolean;
}

export function createGoal(x: number, z: number): GameObject {
  return {
    id: `goal-${crypto.randomUUID()}`,
    type: "goal",
    position: { x, z },
  };
}

export function createPlayer(x: number, z: number): GameObject {
  return {
    id: `player-${crypto.randomUUID()}`,
    type: "player",
    position: { x, z },
  };
}

export function createPiston(
  x: number,
  z: number,
  direction: PistonGameObject["direction"],
): GameObject {
  return {
    id: `piston-${crypto.randomUUID()}`,
    type: "piston",
    position: { x, z },
    direction,
    eventNumber: Math.floor(Math.random() * 4) + 1,
  };
}
