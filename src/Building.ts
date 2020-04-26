import { Hallway } from "./Hallway";
import { Room } from "./Room";
import { getShortestPath, isConnectedGraph, getGraph } from "./graph";
import { isLeftOrRight } from "./Direction";
import { ForkNode } from "./ForkNode";
import { StairNode } from "./StairNode";
import { nodeToString } from "./node";

/**
 * @ignore
 * @param str - A string of instructions separated by newlines
 * @param capitalize - Whether to capitalize the beginning of every line
 * @param periods - Whether to add a period at the end of every instruction
 * @returns A formatted version of str
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
 * This is the class that we use to define a building. See README.md for
 * a tutorial on how to create a Building.
 *
 * Note on TypeScript usage: It is recommended that you supply your own types
 * for the generic type parameters ForkName and StairName. See README.md
 * for an example.
 *
 * @typeParam ForkName - The type of string that a node ID for a [[Room]] or [[Fork]]
 * may use.
 * @typeParam StairName - The type of string that a node ID for [[Stairs]] may use.
 */
export class Building<
  ForkName extends string = string,
  StairName extends string = string
> {
  /**
   * The graph that is generated from the nodes in the [[hallways]] and the
   * connections between them
   */
  readonly graph: { [key: string]: { [key: string]: number } };
  /**
   * An array of all of the names and aliases for all of the rooms
   * @category Important
   */
  readonly roomsList: string[];

  /**
   *
   * @param hallways - All of the hallways in this building
   * @category Important
   */
  constructor(
    readonly hallways: Hallway<ForkName, StairName>[],
    readonly allowedConnections: (
      | ForkName
      | StairName
    )[] = hallways.flatMap(h => h.nodes.map(n => n.nodeId.name))
  ) {
    const hallwayNodes = this.hallways.map(h => {
      return h.nodes.filter(({ nodeId }) =>
        allowedConnections.includes(nodeId.name)
      );
    });
    this.graph = getGraph(hallwayNodes);
    this.roomsList = hallways
      .flatMap(h => h.partList)
      .filter((a): a is Room<ForkName> => "name" in a && a.name != null)
      .flatMap(r => r.aliases.concat(r.name!))
      .sort();
  }

  withAllowedConnectionTypes(
    allowedConnections: (ForkName | StairName)[] | ((name: string) => boolean)
  ) {
    return new Building(
      this.hallways,
      typeof allowedConnections === "function"
        ? this.allowedConnections.filter(allowedConnections)
        : allowedConnections
    );
  }

  /**
   * @param name - The name of the room
   * @returns An array, where the first element is the index of the hallway where
   * the room is located, and the second element is the index of the room in the
   * hallway. If the room doesn't exist, returns null.
   */
  public getHallwayIndexAndIndex(name: string): [number, number] | null {
    const inds = this.hallways.map(h => h.getRoomInd(name));
    const hallwayInd = inds.findIndex(a => a !== -1);
    return hallwayInd === -1 ? null : [hallwayInd, inds[hallwayInd]];
  }

  /**
   * @ignore
   * @param nodeId - The id of the node
   * @returns An array, where the first element is the index of the hallway where
   * the node is located, and the second element is the index of the node in the
   * hallway
   */
  private getHallwayIndexAndIndexFromNode(
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

  /**
   *
   * @ignore
   * TODO
   * @returns The instructions to go up/down that staircase the correct number
   * of floors
   */
  getStairConnectionInstruction(
    stairName: StairName,
    floor1: number,
    floor2: number
  ): string {
    if (stairName.includes("elevator")) {
      return `go to floor ${floor2}\n`;
    }
    const upOrDown = floor2 > floor1 ? "up" : "down";
    const numFlights = Math.abs(floor1 - floor2);
    const maybeS = numFlights > 1 ? "s" : "";
    return `go ${upOrDown} ${numFlights} floor${maybeS} of stairs\n`;
  }

  /**
   * This is the method that tells you how to get from one room
   * to another in a building.
   * @param from - The name of the starting room
   * @param to - The name of the destination room
   * @param capitalize - Whether to capitalize the beginning of every line
   * @param periods - Whether to add a period at the end of every instruction
   * @returns The directions to get from room `from` to room `to`
   * @category Important
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
  ): string | null {
    if (!this.isValidRoomName(from) || !this.isValidRoomName(to)) {
      return null;
    }

    // Find (1) the index of the hallway the starting room is located in
    // and (2) the index of the room within that that hallway
    const [fromHallwayInd, fromInd] = this.getHallwayIndexAndIndex(from)!;
    // Same for the destination room
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
    ].idOfClosestNodeToIndex(fromInd, this.allowedConnections);
    const closestNodeToInd = this.hallways[toHallwayInd].idOfClosestNodeToIndex(
      toInd,
      this.allowedConnections
    );

    // This is to keep track of whether we entered the next hallway through a
    // straight connection, or we turned left/right to get in.
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
      const nextId = shortest[i];
      const [nextHallwayInd, nextInd] = this.getHallwayIndexAndIndexFromNode(
        nextId
      );
      const prevId = shortest[i - 1];
      const [, prevInd] = this.getHallwayIndexAndIndexFromNode(prevId);
      if (
        prevId instanceof StairNode &&
        nextId instanceof StairNode &&
        prevId.name === nextId.name /* going up or down stairs */
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
        directions += this.getStairConnectionInstruction(
          prevId.name,
          prevId.floor,
          nextId.floor
        );
        [currentHallwayInd, currentInd] = this.getHallwayIndexAndIndexFromNode(
          nextId
        );
        entranceWasStraight = true;
      } else if (nextHallwayInd !== currentHallwayInd /* it's a fork */) {
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
        [currentHallwayInd, currentInd] = [nextHallwayInd, nextInd];
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
   * @returns true if there is a room with the name or alias
   * `name`, and false otherwise.
   * @cateogry Important
   */
  public isValidRoomName(name: string): boolean {
    return (
      typeof name === "string" && this.getHallwayIndexAndIndex(name) != null
    );
  }
}
