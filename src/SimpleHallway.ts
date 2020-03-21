import { Hallway } from "./Hallway";
import { Room } from "./Room";
import { Fork } from "./Fork";
import { Direction } from "./Direction";
import { ForkNode } from "./ForkNode";

export class SimpleHallway<
  ForkName extends string,
  StairName extends string
> extends Hallway<ForkName, StairName> {
  constructor(
    nodeId: ForkNode<ForkName>,
    partList: Room<ForkName>[],
    public hallwayName: string
  ) {
    super([new Fork(Direction.FRONT, nodeId, ""), ...partList]);
  }

  getDirectionsFromIndices(from: number, to: number) {
    const toRoomName = (this.partList[to] as Room<ForkName>).fullName;
    const fromRoomName = (this.partList[from] as Room<ForkName>).fullName;
    if (from === 0) {
      // We're starting from the fork and going into the room
      return `Enter ${toRoomName}, which is in ${this.hallwayName}\n`;
    } else if (to === 0) {
      // We're starting at the room and going out of the fork
      return `Exit ${fromRoomName}\n`;
    } else {
      return `Exit ${fromRoomName} and enter ${toRoomName} (both of which are in ${this.hallwayName})\n`;
    }
  }
}
