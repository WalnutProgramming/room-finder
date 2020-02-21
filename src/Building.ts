import { Hallway } from "./Hallway";
import { Room } from "./Room";
import { getGraph, getShortestPath, isConnectedGraph } from "./graph";
import { isLeftOrRight } from "./Direction";

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
export class Building {
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
  constructor(
    readonly hallways: Hallway[],
    readonly hallwayConnections: [string, string][] = [],
    readonly stairConnections: string[][] = []
  ) {
    const hallwayNodes = this.hallways.map(h => {
      return h.nodes;
    });
    this.graph = getGraph(hallwayNodes, stairConnections, hallwayConnections);
    this.roomsList = hallways
      .flatMap(h => h.partList)
      .filter((a): a is Room => "name" in a && a.name != null)
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
  protected getHallwayIndexAndIndexFromNode(nodeId: string): [number, number] {
    const inds = this.hallways.map(h =>
      h.partList.findIndex(r => "nodeId" in r && r.nodeId === nodeId)
    );
    const hallwayInd = inds.findIndex(a => a !== -1);
    return [hallwayInd, inds[hallwayInd]];
  }

  /**
   * @param id1
   * @param id2
   * @return Is the connection between these two nodes
   * a Stairs connection? (as opposed to a Fork)
   */
  protected isConnectionStairs(id1: string, id2: string): boolean {
    return (
      this.stairConnections.findIndex(
        arr => arr.includes(id1) && arr.includes(id2)
      ) != -1
    );
  }

  protected getStairConnectionInstruction(
    id1: string,
    id2: string,
    numFlights: number
  ): string {
    const goingUp = this.stairConnections.find(
      arr =>
        arr.includes(id1) &&
        arr.includes(id2) &&
        arr.indexOf(id2) > arr.indexOf(id1)
    );
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
      const [prevHallwayInd, prevInd] = this.getHallwayIndexAndIndexFromNode(
        shortest[i - 1]
      );
      if (
        this.isConnectionStairs(
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
        const numStairFlights = Math.ceil(
          this.graph[shortest[i - 1]][shortest[i]]
        );
        directions += this.getStairConnectionInstruction(
          shortest[i - 1],
          shortest[i],
          numStairFlights
        );
        [currentHallwayInd, currentInd] = this.getHallwayIndexAndIndexFromNode(
          shortest[i]
        );
        entranceWasStraight = true; // TODO
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
          (<Room>this.hallways[currentHallwayInd].partList[prevInd]).side
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

  /**
   * `building.validity.valid` is true if the building passes a few validity
   * tests. This is useful for testing.
   *
   * There are several reasons that it could be false:
   * 1. There's more than one room with the same name.
   * 2. There's at least one hallway that doesn't have any nodes (Forks or
   * Stairs) to connect it to the rest of the building.
   * 3. The graph isn't connected (`connectedSections > 1`). That means there's
   * a group of at least one node that isn't connected to the rest of the graph.
   * 4. There are negative edge weights in the graph.
   *
   * If `building.validity.valid` is false, `building.validity.reason` gives
   * the reason why it's invalid.
   *
   * `connectedSections` is a string[][], where each string[] is a list of nodes
   * that are all connected. (Each string[] forms a connected graph.) This is
   * useful for debugging to figure out which nodes aren't connected to the rest
   * of the graph.
   */
  get validity():
    | { valid: true; connectedSections: string[][] }
    | { valid: false; reason: string; connectedSections: string[][] } {
    const connectedSections = isConnectedGraph(this.graph).connectedSections;

    // More than one room can't have the same name
    let ret = null;
    this.roomsList.forEach((name, index) => {
      if (this.roomsList.indexOf(name) !== index) {
        ret = {
          valid: false,
          reason: `There's more than one room with the name '${name}'`,
          connectedSections,
        };
      }
    });
    if (ret != null) return ret;

    // Edges can't have negative weights
    for (const [id1, obj] of Object.entries(this.graph)) {
      for (const [id2, edgeLen] of Object.entries(obj)) {
        if (edgeLen < 0) {
          return {
            valid: false,
            reason: `The edge from node '${id1}' to node '${id2}' has a negative weight`,
            connectedSections,
          };
        }
      }
    }

    // If there's more than 1 hallway, each hallway should have a node to
    // connect it to the rest of the hallways
    const indexOfHallwayWithNoNodes = this.hallways.findIndex(
      h => h.nodes.length === 0
    );
    if (this.hallways.length > 1 && indexOfHallwayWithNoNodes !== -1) {
      return {
        valid: false,
        reason: `The hallway at index ${indexOfHallwayWithNoNodes} has no nodes (Forks or Stairs)`,
        connectedSections,
      };
    }

    // Graph should be connected
    if (!isConnectedGraph(this.graph).connected) {
      return {
        valid: false,
        reason:
          "Not all nodes are connected; see building.validity.connectedSections to find which node groups are separated",
        connectedSections: isConnectedGraph(this.graph).connectedSections,
      };
    }

    return { valid: true, connectedSections };
  }
}
