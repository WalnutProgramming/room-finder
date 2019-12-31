import { Room } from "./Room";
import { Turn } from "./Turn";

/**
 * This class represents a single hallway. The hallway may have turns,
 * but if you need a fork, you need to add another [[Hallway]] to the list
 * and connect them with 2 [[Fork]]s.
 */
export class Hallway {
  /**
   *
   * @param partList - An array of every [[Room]] or [[Turn]] in the hallway.
   * You can choose arbitrarily which end of the hallway to start at, but make
   * sure to keep the sides and directions of the [[Room]]s and [[Turn]]s
   * consistent with the direction you choose as forward.
   * @param name - The name of this [[Hallway]].
   */
  constructor(public partList: (Room | Turn)[], public name?: string | null) {}

  /**
   * @param - name The name of the room
   * @returns The index of the room, or -1 if there's no room with that name
   */
  getRoomInd(name: string): number {
    return this.partList.findIndex(elem => {
      return (
        "name" in elem &&
        elem.name != null &&
        (elem.name.toUpperCase().trim() === name.toUpperCase().trim() ||
          elem.aliases!.map(a => a.toUpperCase()).includes(name.toUpperCase()))
      );
    });
  }

  /**
   * @param roomInd - The index of the room in the hallway
   * @returns The id of the "closest" node to the room in the hallway
   */
  idOfClosestNodeToIndex(roomInd: number): string {
    let closestNodeInd: number;
    this.partList.forEach((r, currentInd) => {
      if (
        "nodeId" in r &&
        r.nodeId &&
        (closestNodeInd === undefined ||
          Math.abs(currentInd - roomInd) < Math.abs(closestNodeInd - roomInd))
      ) {
        closestNodeInd = currentInd;
      }
    });

    const closest = this.partList[closestNodeInd!];
    return (closest as Room).nodeId!;
  }

  get nodes(): {
    nodeId: string;
    edgeLengthFromPreviousNodeInHallway: number;
  }[] {
    return this.partList
      .filter(
        (r): r is Room & { nodeId: string } => "nodeId" in r && r.nodeId != null
      )
      .map(({ nodeId, edgeLengthFromPreviousNodeInHallway }) => ({
        nodeId,
        edgeLengthFromPreviousNodeInHallway:
          edgeLengthFromPreviousNodeInHallway == null
            ? 1
            : edgeLengthFromPreviousNodeInHallway,
      }));
  }

  /**
   * Gives the directions to get from one room to another in a single hallway
   * given the indices of the rooms in the hallway.
   * @param from - The index of the starting room
   * @param to - The index of the room to go to
   * @param isBeginningOfDirections - Are these directions the first set of
   * directions in the whole set of directions created in [[Building.getDirections]]?
   * @param isEndOfDirections - Are these directions the last set of directions
   * in the whole set of directions created in [[Building.getDirections]]?
   * @param entranceWasStraight - When we entered this hallway, were we going
   * straight (as opposed to turning left or right into this hallway)? (not
   * applicable if isBeginningOfDirections is true; in this case, the argument
   * is ignored)
   * @returns The directions. Steps are separated with newlines.
   */
  getDirectionsFromIndices(
    from: number,
    to: number,
    {
      isBeginningOfDirections,
      isEndOfDirections,
      entranceWasStraight,
    }: {
      isBeginningOfDirections: boolean;
      isEndOfDirections: boolean;
      entranceWasStraight: boolean;
    }
  ): string {
    const fromRoom = this.partList[from] as Room;

    const toRoom = this.partList[to] as Room;

    if (from === to) {
      return `Bruh. You at ${fromRoom.fullName}\n`;
    }

    let ret = "";
    const forwardOrBackward = to > from ? 1 : -1;

    ret += fromRoom.onLeave(
      forwardOrBackward,
      isBeginningOfDirections,
      entranceWasStraight
    );

    for (let i = from; i !== to; i += forwardOrBackward) {
      const current = this.partList[i];
      const prevInd = i - forwardOrBackward;
      const prevRoom =
        prevInd >= 0 &&
        prevInd < this.partList.length &&
        this.partList[i - forwardOrBackward];
      ret += current.onPass(forwardOrBackward, prevRoom as Room);
    }

    ret += toRoom.onArrive(forwardOrBackward, isEndOfDirections);

    return ret;
  }
}
