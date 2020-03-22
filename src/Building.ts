import { Hallway } from "./Hallway";
import { Room } from "./Room";
import { getShortestPath, isConnectedGraph, getGraph } from "./graph";
import { isLeftOrRight } from "./Direction";
import { ForkNode } from "./ForkNode";
import { StairNode } from "./StairNode";
import { nodeToString } from "./node";

function areConnectedStairs<StairName extends string>(
  id1: ForkNode<string> | StairNode<StairName>,
  id2: ForkNode<string> | StairNode<StairName>
): boolean {
  return (
    id1 instanceof StairNode &&
    id2 instanceof StairNode &&
    id1.name === id2.name
  );
}

/**
 * @ignore
 * @param str - A string of instructions separated by newlines
 * @param capitalize - Whether to capitalize the beginning of every line
 * @param periods - Whether to add a period at the end of every instruction
 * @return - A formatted version of str
 */
function format(str: string, { capitalize = true, periods = false }) {
  return str
    .trim()
    .replace(/\n,/g, ",")
    .split("\n")
    .filter(s => s !== "")
    .map(
      s =>
        (capitalize ? s[0].toUpperCase() + s.slice(1) : s) +
        (periods ? "." : "")
    )
    .join("\n");
}

/**
 * This is the class that we use to define a building. (See `src/walnut.ts` for
 * a large example.)
 *
 * Here's an example with a single hallway:
 * ```ts
 * const myBuilding = new Building([
 *   new Hallway([
 *     new Room("A", Direction.LEFT),
 *     new Room("B", Direction.RIGHT),
 *     new Turn(Direction.RIGHT),
 *     new Room("C", Direction.LEFT),
 *     new Room("D", Direction.LEFT),
 *     new Stairs(Direction.LEFT, "AFDS"),
 *   ]),
 * ]);
 *
 * console.log(myBuilding.getDirections("A", "C"));
 * ```
 *
 * This outputs:
 * ```plaintext
 * Turn left out of room A
 * Continue, then turn right (after passing room B on your right)
 * Continue, then turn left into room C
 * ```
 */
export class Building<
  ForkName extends string = string,
  StairName extends string = string
> {
  /**
   * The graph that is generated from the nodes in the [[hallways]] and the
   * [[hallwayConnections]] and [[stairConnections]] between them
   */
  readonly graph: { [key: string]: { [key: string]: number } };
  /**
   * An array of all of the names and aliases for all of the rooms
   */
  readonly roomsList: string[];

  /**
   *
   * @param hallways - All of the hallways in this building
   * @param hallwayConnections - All of the "fork" connections between
   * nodes in the building. Each connection is an array that contains the 2
   * connected node IDs.
   * @param stairConnections - All of the "stair" connections between nodes
   * in the building. Each connection is an array of node IDs that starts at the
   * bottom floor and goes to the top floor.
   */
  constructor(readonly hallways: Hallway<ForkName, StairName>[]) {
    const hallwayNodes = this.hallways.map(h => {
      return h.nodes;
    });
    this.graph = getGraph(hallwayNodes);
    this.roomsList = hallways
      .flatMap(h => h.partList)
      .filter((a): a is Room<ForkName> => "name" in a && a.name != null)
      .flatMap(r => r.aliases.concat(r.name!))
      .sort();
  }

  /**
   * @param name - The name of the room
   * @return An array, where the first element
   * is the index of the hallway where the room is located, and
   * the second element is the index of the room in the hallway. If
   * the room doesn't exist, `null` is returned.
   */
  public getHallwayIndexAndIndex(name: string): [number, number] | null {
    const inds = this.hallways.map(h => h.getRoomInd(name));
    const hallwayInd = inds.findIndex(a => a !== -1);
    return hallwayInd === -1 ? null : [hallwayInd, inds[hallwayInd]];
  }

  /**
   * @param nodeId - The id of the node
   * @return An array, where the first element
   * is the index of the hallway where the node is located, and
   * the second element is the index of the node in the hallway
   */
  protected getHallwayIndexAndIndexFromNode(
    nodeId: ForkNode<ForkName> | StairNode<StairName>
  ): [number, number] {
    const inds = this.hallways.map(h =>
      h.partList.findIndex(
        r =>
          "nodeId" in r &&
          r.nodeId != null &&
          nodeToString(r.nodeId) === nodeToString(nodeId)
      )
    );
    const hallwayInd = inds.findIndex(a => a !== -1);
    return [hallwayInd, inds[hallwayInd]];
  }

  protected getStairConnectionInstruction(
    id1: StairNode<StairName>,
    id2: StairNode<StairName>,
    numFlights: number
  ): string {
    const goingUp = id2.floor > id1.floor;
    const maybeS = numFlights > 1 ? "s" : "";
    return `go ${
      goingUp ? "up" : "down"
    } ${numFlights} floor${maybeS} of stairs\n`;
  }

  /**
   * This is the method that tells you how to get from one room
   * to another in a building.
   * @param {string} from - The name of the starting room
   * @param {string} to - The name of the destination room
   * @param capitalize - Whether to capitalize the beginning of every line
   * @param periods - Whether to add a period at the end of every instruction
   * @return {string} The directions to get from room `from` to room `to`
   */
  public getDirections(
    from: string,
    to: string,
    {
      capitalize = true,
      periods = false,
    }: { capitalize?: boolean; periods?: boolean } = {
      capitalize: true,
      periods: false,
    }
  ): string {
    // Find the indices of the hallways of the rooms
    // and the indices of the rooms in the hallways
    const [fromHallwayInd, fromInd] = this.getHallwayIndexAndIndex(from)!;
    const [toHallwayInd, toInd] = this.getHallwayIndexAndIndex(to)!;

    // If there's only one hallway, we don't need to worry about nodes
    if (this.hallways.length === 1) {
      return format(
        this.hallways[0].getDirectionsFromIndices(fromInd, toInd, {
          isBeginningOfDirections: true,
          isEndOfDirections: true,
          entranceWasStraight: false,
        }),
        { capitalize, periods }
      );
    }

    // Find IDs of the nodes (stairs or hallways) closest to these rooms
    const closestNodeFromInd = this.hallways[
      fromHallwayInd
    ].idOfClosestNodeToIndex(fromInd);
    const closestNodeToInd = this.hallways[toHallwayInd].idOfClosestNodeToIndex(
      toInd
    );

    let entranceWasStraight = false;

    // Get the shortest path between the 2 nodes closest to the rooms
    const shortest = getShortestPath(
      this.graph,
      closestNodeFromInd,
      closestNodeToInd
    );
    let directions = "";
    let [currentHallwayInd, currentInd] = [fromHallwayInd, fromInd];
    // Loop through the shortest path to convert them to directions
    for (let i = 1; i < shortest.length; i++) {
      const id = shortest[i];
      const [hallwayInd, ind] = this.getHallwayIndexAndIndexFromNode(id);
      const [, prevInd] = this.getHallwayIndexAndIndexFromNode(shortest[i - 1]);
      if (
        areConnectedStairs(
          shortest[i - 1],
          shortest[i]
        ) /* going up or down stairs */
      ) {
        directions += this.hallways[currentHallwayInd].getDirectionsFromIndices(
          currentInd,
          prevInd,
          {
            isBeginningOfDirections: directions === "",
            isEndOfDirections: false,
            entranceWasStraight,
          }
        );
        const numStairFlights = Math.abs(
          (shortest[i - 1] as StairNode<StairName>).floor -
            (shortest[i] as StairNode<StairName>).floor
        );
        directions += this.getStairConnectionInstruction(
          shortest[i - 1] as StairNode<StairName>,
          shortest[i] as StairNode<StairName>,
          numStairFlights
        );
        [currentHallwayInd, currentInd] = this.getHallwayIndexAndIndexFromNode(
          shortest[i]
        );
        entranceWasStraight = true;
      } else if (hallwayInd !== currentHallwayInd /* it's a fork */) {
        directions += this.hallways[currentHallwayInd].getDirectionsFromIndices(
          currentInd,
          prevInd,
          {
            isBeginningOfDirections: directions === "",
            isEndOfDirections: false,
            entranceWasStraight,
          }
        );
        entranceWasStraight = !isLeftOrRight(
          (this.hallways[currentHallwayInd].partList[prevInd] as Room<ForkName>)
            .side
        );
        [currentHallwayInd, currentInd] = [hallwayInd, ind];
      }
    }
    directions += this.hallways[currentHallwayInd].getDirectionsFromIndices(
      currentInd,
      toInd,
      {
        isBeginningOfDirections: directions === "",
        isEndOfDirections: true,
        entranceWasStraight,
      }
    );
    // Capitalize first letter of each line
    return format(directions, { capitalize, periods });
  }

  /**
   *
   * @param name - A possible name for a room in this building
   * @returns `true` if there is a room with the name or alias
   * `name`, and `false` otherwise.
   */
  public isValidRoomName(name: string): boolean {
    return (
      typeof name === "string" && this.getHallwayIndexAndIndex(name) != null
    );
  }
}
