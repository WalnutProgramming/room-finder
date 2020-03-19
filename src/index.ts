export { Building } from "./Building";
export {
  Direction,
  dirToString,
  dirToTurnString,
  isLeftOrRight,
} from "./Direction";
export { Fork } from "./Fork";
export { Hallway } from "./Hallway";
export { ForkableRoom } from "./ForkableRoom";
export { Room } from "./Room";
export { SimpleHallway } from "./SimpleHallway";
export { Stairs } from "./Stairs";
export { Turn } from "./Turn";
export { reverseConnection } from "./ForkNode";
export { onFloor } from "./StairNode";
export { assertValidBuilding, isValidBuilding } from "./buildingValidity";

// We can't directly re-export types because Babel's
// TypeScript uses --isolatedModules.
import { ForkNode as ForkNodeType } from "./ForkNode";
export type ForkNode<A extends string> = ForkNodeType<A>;

import { StairNode as StairNodeType } from "./StairNode";
export type StairNode<A extends string> = StairNodeType<A>;
