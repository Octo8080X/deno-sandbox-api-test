export type Operation = "right" | "left" | "up" | "down" | "stay";

export interface GameObject {
  id: string;
  type: "player" | "goal";
  position: { x: number; z: number };
}

export interface MovePlanBase {
  id: string;
  type: "player";
}

export interface MovePlanPlayer extends MovePlanBase {
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

export type MovePlan = MovePlanPlayer;

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
