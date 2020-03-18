import { HallwayElement } from "./HallwayElement";
import { Direction } from "./Direction";
import { ForkNode } from "./ForkNode";

export class ForkableRoom<ForkName extends string> extends HallwayElement {
  readonly nodeId: ForkNode<ForkName> | undefined;

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
      nodeId?: ForkNode<ForkName>;
    } = {}
  ) {
    super(name, side, {
      edgeLengthFromPreviousNodeInHallway,
      prefix,
      aliases,
    });
    this.nodeId = nodeId;
  }
}
