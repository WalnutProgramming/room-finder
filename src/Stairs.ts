import { Direction } from "./Direction";
import { Room } from "./Room";
import { dirToTurnString } from "./Direction";

/**
 * [[Stairs]] represents one entrance to a set of stairs in a [[Hallway]]. You
 * can connect the [[Stairs]] of 2 hallways by adding to the `stairConnections`
 * argument of the [[Hallway]] constructor.
 */
export class Stairs extends Room {
  constructor(
    side?: Direction | undefined,
    nodeId?: (string | null) | undefined,
    public stairNumber?: string | undefined,
    edgeLengthFromPreviousNodeInHallway?: number | undefined
  ) {
    super(null, side, { nodeId, edgeLengthFromPreviousNodeInHallway });
  }

  get fullName() {
    if (this.stairNumber) {
      return "the " + this.stairNumber + " stairs";
    }
    return "the stairs";
  }

  onLeave(
    forwardOrBackward: -1 | 1,
    _isBeginningOfDirections: boolean,
    entranceWasStraight: boolean
  ): string {
    // Set isBeginningOfDirections to true for onLeave so that it'll say
    // "Turn right out of the [#] stairs"
    return super.onLeave(forwardOrBackward, true, entranceWasStraight);
  }

  onArrive(forwardOrBackward: -1 | 1) {
    return `continue, then ${dirToTurnString(
      this.side * forwardOrBackward
    )} into ${this.fullName}\n`;
  }
}
