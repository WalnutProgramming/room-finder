import { Direction } from "./Direction";
import { HallwayElement } from "./HallwayElement";

export class Room extends HallwayElement {
  private _type = "Room";

  constructor(
    name?: (string | null) | undefined,
    side: Direction = Direction.LEFT,
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
    super(name, side, {
      edgeLengthFromPreviousNodeInHallway,
      prefix,
      aliases,
    });
  }
}
// export { ForkableRoom as Room };
