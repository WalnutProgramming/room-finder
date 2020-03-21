import { ForkableRoom } from "./ForkableRoom";
import { dirToString, dirToTurnString, isLeftOrRight } from "./Direction";
import { HallwayElement } from "./HallwayElement";
import { Room } from "./Room";

/**
 * This class represents a turn in a single [[Hallway]].
 */
export class Turn {
  constructor(public direction: -1 | 1) {}

  onPass(forwardOrBackward: -1 | 1, prevRoom: HallwayElement | Turn): string {
    let ret = "";
    const direction = this.direction * forwardOrBackward;
    ret += "continue, then " + dirToTurnString(direction);
    if (
      prevRoom instanceof ForkableRoom ||
      (prevRoom instanceof Room && isLeftOrRight(prevRoom.side))
    ) {
      ret += ` (after passing ${prevRoom.fullName} on your ${dirToString(
        prevRoom.side * forwardOrBackward
      )})`;
    }
    ret += "\n";
    return ret;
  }
}
