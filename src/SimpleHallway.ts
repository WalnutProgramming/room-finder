import { Hallway } from "./Hallway";
import { Room } from "./Room";
import { Fork } from "./Fork";
import { Direction } from "./Direction";
import { ForkNode } from "./ForkNode";

/**
 * This class represents a "hallway" that is simple enough that it is redundant
 * to give further directions from it to any room inside of it. This can be
 * useful when describing a room that's inside of another room.
 *
 * Example:
 */
export class SimpleHallway<
  ForkName extends string,
  StairName extends string
> extends Hallway<ForkName, StairName> {
  constructor(
    nodeId: ForkNode<ForkName>,
    partList: Room<ForkName>[],
    public hallwayName: string
  ) {
    super([new Fork(Direction.LEFT, nodeId, ""), ...partList], {
      allowFrontConnectionsInMiddle: true,
    });
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
