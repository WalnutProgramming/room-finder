import { Direction, isLeftOrRight, dirToTurnString } from "./Direction";

type Turn = typeof import("./Turn");

/**
 * This class represents a single element in a hallway that is not a [[Turn]].
 * This can be a room, but it can also be a [[Fork]] or [[Stairs]].
 */
export class Room {
  /**
   * afkdsjkfaj
   */
  public nodeId: (string | null) | undefined = null;
  public prefix: string | undefined = "room";
  public aliases: string[] = [];
  public edgeLengthFromPreviousNodeInHallway: number | null | undefined = null;

  /**
   *
   * @param name - The name of this [[Room]]
   * @param side - The side of the [[Hallway]] that this [[Room]] is on.
   * You should decide which side the [[Room]] is on based on how you've
   * ordered the [[Room]]s in the [[Hallway]] - that is, which direction you've
   * arbitrarily decided is "forward."
   * @param nodeId - See [[nodeId]]
   * @param edgeLengthFromPreviousNodeInHallway - See
   * [[edgeLengthFromPreviousNodeInHallway]]
   * @param prefix - See [[prefix]]
   * @param aliases - See [[aliases]]
   */
  constructor(
    public name?: (string | null) | undefined,
    public side: Direction = Direction.LEFT,
    {
      nodeId,
      edgeLengthFromPreviousNodeInHallway,
      prefix = "room",
      aliases = [],
    }: {
      nodeId?: string | null;
      prefix?: string;
      aliases?: string[];
      edgeLengthFromPreviousNodeInHallway?: number | null;
    } = {}
  ) {
    this.nodeId = nodeId;
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
  onPass(forwardOrBackward: -1 | 1, prevRoom: Room | Turn): string {
    return "";
  }

  /**
   *
   * @param forwardOrBackward - Whether we're going forward or backward through this hallway
   * @returns What we should say when we go out of this room
   */
  onLeave(forwardOrBackward: -1 | 1): string {
    let ret = "";
    if (isLeftOrRight(this.side)) {
      ret += dirToTurnString(forwardOrBackward * this.side);
      if (this.fullName) ret += ` out of ${this.fullName}`;
      ret += "\n";
    }
    return ret;
  }

  onArrive(forwardOrBackward: -1 | 1): string {
    return `Continue, then ${dirToTurnString(
      this.side * forwardOrBackward,
      true
    )} into ${this.fullName}\n`;
  }
}
