import { Direction } from "./Direction";
import { dirToTurnString } from "./Direction";
import { HallwayElement } from "./HallwayElement";
import { StairNode } from "./StairNode";

/**
 * [[Stairs]] represents one entrance to a set of stairs in a [[Hallway]]. You
 * can connect the [[Stairs]] of 2 hallways by adding to the `stairConnections`
 * argument of the [[Hallway]] constructor.
 */
export class Stairs<StairName extends string> extends HallwayElement {
  readonly nodeId: StairNode<StairName>;

  constructor(
    side: Direction,
    nodeId: StairNode<StairName>,
    public stairNumber?: string | undefined,
    edgeLengthFromPreviousNodeInHallway?: number | undefined
  ) {
    super(null, side, { edgeLengthFromPreviousNodeInHallway });
    this.nodeId = nodeId;
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
