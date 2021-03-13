import { Room } from "./Room";
import { Turn } from "./Turn";
import { Stairs } from "./Stairs";
import { Node, isConnectorNode } from "./node";

export type OneWay = "forward" | "backward" | false;

/**
 * This class represents a single hallway. The hallway may have turns,
 * but if you need a fork, you need to add another [[Hallway]] to the list
 * and connect them with 2 [[Fork]]s.
 */
export class Hallway<ForkName extends string, StairName extends string> {
  readonly allowFrontConnectionsInMiddle: boolean;
  readonly oneWay: OneWay;

  /**
   *
   * @param partList - An array of every [[Room]], [[Stairs]], or [[Turn]] in the hallway.
   * You can choose arbitrarily which end of the hallway to start at, but make
   * sure to keep the sides and directions of the [[Room]]s, [[Stairs]], and [[Turn]]s
   * consistent with the direction you choose as forward.
   * @param allowFrontConnectionsInMiddle - If true, this hallway may have
   * [[Rooms]] and [[Stairs]] that are not at the ends of the hallway, but are
   * marked as FRONT. This is used by [[isValidBuilding]].
   * @param oneWay - false if you can travel both ways in this hallway.
   * "forward" if you can only travel from the first to the last element of this
   * hallway. "backward" if you can only travel from the last element to the first.
   */
  constructor(
    public partList: (Room<ForkName> | Stairs<StairName> | Turn)[],
    {
      allowFrontConnectionsInMiddle = false,
      oneWay = false,
    }: {
      allowFrontConnectionsInMiddle?: boolean;
      oneWay?: OneWay;
    } = {}
  ) {
    this.allowFrontConnectionsInMiddle = allowFrontConnectionsInMiddle;
    this.oneWay = oneWay;
  }

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
   * @param roomInd - The index of the room in this hallway
   * @returns The id of the "closest" node to the given room within this hallway
   */
  idOfClosestNodeToIndex(
    roomInd: number,
    allowedConnections: (ForkName | StairName)[]
  ): Node<ForkName, StairName> {
    // let closestNodeInd: number;
    // this.partList.forEach((r, currentInd) => {
    //   if (
    //     "nodeId" in r &&
    //     r.nodeId != null &&
    //     allowedConnections.includes(r.nodeId.name) &&
    //     (closestNodeInd === undefined ||
    //       Math.abs(currentInd - roomInd) < Math.abs(closestNodeInd - roomInd))
    //   ) {
    //     closestNodeInd = currentInd;
    //   }
    // });

    // const closest = this.partList[closestNodeInd!] as
    //   | Room<ForkName>
    //   | Stairs<StairName>;
    // return closest.nodeId!;
    return (this.partList[roomInd] as Room<ForkName>).nodeId!;
  }

  /**
   * An array of all of the node IDs in this hallway.
   */
  get nodes(): {
    nodeId: Node<ForkName, StairName>;
    edgeLengthFromPreviousNodeInHallway: number;
  }[] {
    // return this.partList
    //   .filter(
    //     (r): r is Room<ForkName> | Stairs<StairName> =>
    //       "nodeId" in r && r.nodeId != null
    //   )
    //   .map(({ nodeId, edgeLengthFromPreviousNodeInHallway }) => ({
    //     nodeId: nodeId!,
    //     edgeLengthFromPreviousNodeInHallway:
    //       edgeLengthFromPreviousNodeInHallway == null
    //         ? 1
    //         : edgeLengthFromPreviousNodeInHallway,
    //   })
    // );

    let list = this.partList.filter(
      (
        r
      ): r is (Room<ForkName> | Stairs<StairName>) & {
        nodeId: Node<ForkName, StairName>;
      } => "nodeId" in r && r.nodeId != null
    );

    let prevConnectorNodeIndex: number | undefined;

    const nodes = list.map((item, i) => {
      let nextConnectorNodeIndex: number | undefined;
      for (let j = i; j < list.length; j++) {
        if (isConnectorNode(list[j].nodeId)) {
          nextConnectorNodeIndex = j;
          break;
        }
      }

      let weight: number;
      if (prevConnectorNodeIndex != null && nextConnectorNodeIndex != null) {
        const distance = nextConnectorNodeIndex - prevConnectorNodeIndex;
        const totalWeight =
          list[nextConnectorNodeIndex].edgeLengthFromPreviousNodeInHallway ?? 1;
        weight = totalWeight / distance;
      } else {
        weight = 1;
      }

      if (isConnectorNode(list[i].nodeId)) {
        prevConnectorNodeIndex = i;
      }

      return {
        edgeLengthFromPreviousNodeInHallway: weight,
        nodeId: item.nodeId,
      };
    });

    return nodes;
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
    const fromRoom = this.partList[from] as Room<ForkName> | Stairs<StairName>;

    const toRoom = this.partList[to] as Room<ForkName> | Stairs<StairName>;

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
      ret += current.onPass(
        forwardOrBackward,
        prevRoom as Room<ForkName> | Stairs<StairName>
      );
    }

    ret += toRoom.onArrive(forwardOrBackward, isEndOfDirections);

    return ret;
  }
}
