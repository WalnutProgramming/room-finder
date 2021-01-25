import { Direction } from "./Direction";
import { Room } from "./Room";
import { ForkNode } from "./ForkNode";

/**
 * A Fork represents a connection between 2 [[Hallway]]s on the same floor.
 * (Technically, Fork is a subclass of Room, and it does not add any additional
 * functionality to Room.)
 */
export class Fork<ForkName extends string> extends Room<ForkName> {
  /**
   *
   * @param side - The side of the [[Hallway]] that this Fork is on
   * @param nodeId - The node ID of this fork. This can either be a string
   * (e.g. `"myConnection"`) to represent a forward connection or a ForkNode (e.g.
   * `reverseConnection("myConnection"`)).
   * @param destinationName - This is used when giving directions to enter
   * this Fork.
   * @param edgeLengthFromPreviousNodeInHallway - See [[HallwayElement.edgeLengthFromPreviousNodeInHallway]]
   */
  constructor(
    side: Direction,
    nodeId: ForkNode<ForkName> | ForkName,
    public destinationName: string,
    edgeLengthFromPreviousNodeInHallway: number | undefined = 1
  ) {
    super(null, side, { nodeId, edgeLengthFromPreviousNodeInHallway });
  }

  get fullName() {
    return this.destinationName;
  }
}
