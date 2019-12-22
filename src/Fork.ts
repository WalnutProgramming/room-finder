import { Direction } from "./Direction";
import { Room } from "./Room";

/**
 * A Fork represents a connection between 2 [[Hallway]]s on the same
 * floor. You can connect the [[Fork]]s of 2 hallways by
 * adding to the `hallwayConnections` argument of the [[Hallway]]
 * constructor.
 */
export class Fork extends Room {
  /**
   *
   * @param side - The side of the [[Hallway]] that this [[Fork]] is on
   * @param nodeId - The node ID of this fork
   * @param destinationName - This is used when giving directions to turning
   * into this [[Fork]].
   * @param edgeLengthFromPreviousNodeInHallway - The edge length in the graph
   * from the previous node in this [[Hallway]] to this node. Use this if you
   * want to alter the directions to make it less likely that the user will be
   * given directions that take them along that edge in the hallway.
   */
  constructor(
    side: Direction,
    nodeId: string,
    public destinationName: string,
    edgeLengthFromPreviousNodeInHallway: number | undefined = 1
  ) {
    super(null, side, { nodeId, edgeLengthFromPreviousNodeInHallway });
  }

  get fullName() {
    return this.destinationName;
  }
}
