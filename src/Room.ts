import { HallwayElement } from "./HallwayElement";
import { Direction } from "./Direction";
import { ForkNode, getConnection } from "./ForkNode";

/**
 * This class can represent a room or a [[Fork]]. It might seem illogical that
 * a [[Fork]] is a type of Room, but this is because it is sometimes necessary
 * for a room to have a node (for example, when there is a room inside another
 * room). Most of the members of this class are inherited from HallwayElement.
 */
export class Room<ForkName extends string> extends HallwayElement {
  /**
   * The node ID of the node belonging to this Room. This can be either
   *   * a string, like `"myConnection"`, to represent a forward connection, or
   *   * a ForkNode made with [[reverseConnection]], like `reverseConnection("myConnection")`.
   */
  readonly nodeId: ForkNode<ForkName> | undefined;

  /**
   *
   * @param name - The name of this Room
   * @param side - The side of the [[Hallway]] that this Room is on
   * @param edgeLengthFromPreviousNodeInHallway - See [[Room.edgeLengthFromPreviousNodeInHallway]]
   * @param prefix - See [[Room.prefix]]
   * @param aliases - See [[Room.aliases]]
   * @param nodeId - See [[Room.nodeId]]
   */
  constructor(
    name?: (string | null) | undefined,
    side: Direction = Direction.LEFT,
    {
      edgeLengthFromPreviousNodeInHallway,
      prefix = "room",
      aliases = [],
      nodeId,
    }: {
      prefix?: string;
      aliases?: string[];
      edgeLengthFromPreviousNodeInHallway?: number | null;
      nodeId?: ForkNode<ForkName> | ForkName;
    } = {}
  ) {
    super(name, side, {
      edgeLengthFromPreviousNodeInHallway,
      prefix,
      aliases,
    });
    if (nodeId != null) this.nodeId = getConnection<ForkName>(nodeId);
  }
}
