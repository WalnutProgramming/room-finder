import { ForkableRoom } from "./ForkableRoom";
import { Direction } from "./Direction";

export class Room extends ForkableRoom<any> {
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
      nodeId: undefined,
    });
  }
}
