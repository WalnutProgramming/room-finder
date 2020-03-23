import { Direction, isLeftOrRight, dirToTurnString } from "./Direction";

type Turn = typeof import("./Turn").Turn;

/**
 * This class represents a single element in a hallway that is not a [[Turn]].
 * This can be a room, but it can also be a [[Fork]] or [[Stairs]].
 */
export abstract class HallwayElement {
  /**
   * The prefix that should be given whenever mentioning the name of this room.
   * The default prefix is "room", which is useful when specifying a room with
   * a number. But if you have a room with a name such as "Library", you should
   * change the prefix to "the" so that the directions say "the Library" instead
   * of "room Library". Use an empty string for no prefix.
   */
  public prefix: string | undefined = "room";
  /**
   * Other names for this room. These aliases will not be used in the generated
   * directions between rooms, but if you use an alias in [[Building.getDirections]],
   * it will know which room you want to go to.
   */
  public aliases: string[] = [];
  /**
   * The edge length in the graph from the previous node in this Hallway to this
   * node. Use this if you want to alter the directions to make it less likely
   * that the user will be given directions that take them along that edge in
   * the hallway.
   *
   * This property has no effect if this hallway element is not a node (has no
   * node ID).
   */
  public edgeLengthFromPreviousNodeInHallway: number | null | undefined = null;

  /**
   *
   * @param name - The name of this hallway element
   * @param side - The side of the [[Hallway]] that this element is on.
   * You should decide which side the element is on based on how you've
   * ordered the elementss in the [[Hallway]] - that is, which direction you've
   * arbitrarily decided is "forward."
   * @param edgeLengthFromPreviousNodeInHallway - See
   * [[edgeLengthFromPreviousNodeInHallway]]
   * @param prefix - See [[prefix]]
   * @param aliases - See [[aliases]]
   */
  constructor(
    public name?: (string | null) | undefined,
    public side: Direction = Direction.LEFT,
    {
      edgeLengthFromPreviousNodeInHallway,
      prefix = "room",
      aliases = [],
    }: {
      prefix?: string;
      aliases?: string[];
      edgeLengthFromPreviousNodeInHallway?: number | null;
    } = {}
  ) {
    this.prefix = prefix;
    this.aliases = aliases;
    this.edgeLengthFromPreviousNodeInHallway = edgeLengthFromPreviousNodeInHallway;
  }

  get fullName(): string {
    return (this.prefix === "" ? "" : this.prefix + " ") + this.name;
  }

  /**
   * @param forwardOrBackward - Whether we're going forward or backward through this hallway
   * @param prevRoom - The previous room
   * @returns What we should say when you pass this room
   */
  onPass(forwardOrBackward: -1 | 1, prevRoom: HallwayElement | Turn): string {
    return "";
  }

  /**
   *
   * @param forwardOrBackward - Whether we're going forward or backward through
   * this hallway
   * @param isBeginningOfDirections - Is this sentence the first sentence in the
   * whole set of directions created in [[Building.getDirections]]?
   * @param entranceWasStraight - When we entered this hallway, were we going
   * straight (as opposed to turning left or right into this hallway)? (not
   * applicable if isBeginningOfDirections is true; in this case, the argument
   * is ignored)
   * @returns What we should say when we go out of this room or hallway
   */
  onLeave(
    forwardOrBackward: -1 | 1,
    isBeginningOfDirections: boolean,
    entranceWasStraight: boolean
  ): string {
    if (isBeginningOfDirections) {
      let ret = "";
      ret += dirToTurnString(forwardOrBackward * this.side);
      if (this.fullName) ret += ` out of ${this.fullName}`;
      ret += "\n";
      return ret;
    } else if (entranceWasStraight) {
      return (
        dirToTurnString(forwardOrBackward * this.side).replace(
          /^go /,
          "continue "
        ) + "\n"
      );
    } else if (isLeftOrRight(this.side)) {
      return `, and then ${dirToTurnString(forwardOrBackward * this.side)}\n`;
    } else {
      return "";
    }
  }

  /**
   *
   * @param forwardOrBackward - Whether we're going forward or backward through
   * this hallway
   * @param isEndOfDirections - Is this sentence the last sentence in the whole
   * in the whole set of directions created in [[Building.getDirections]]?
   * @returns What we should say when we enter this room or hallway
   */
  onArrive(forwardOrBackward: -1 | 1, isEndOfDirections: boolean): string {
    if (isLeftOrRight(this.side) || isEndOfDirections) {
      return `continue, then ${dirToTurnString(
        this.side * forwardOrBackward
      )} into ${this.fullName}\n`;
    } else {
      return `continue, then after entering ${this.fullName}, `;
    }
  }
}
