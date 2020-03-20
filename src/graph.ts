/// <reference path="../external-types/dijkstra.d.ts" />
import dijkstra from "dijkstrajs";
import { ForkNode, reverseConnection, ReversedConnection } from "./ForkNode";
import { StairNode, onFloor } from "./StairNode";

function nodeToString<ForkName extends string, StairName extends string>(
  nodeId: ForkNode<ForkName> | StairNode<StairName>
): string {
  if (typeof nodeId === "string") {
    return nodeId;
  } else if (isConnectionStairs(nodeId)) {
    return `StairNode-----${nodeId.name}-----${nodeId.floor}`;
  } else {
    return `ReversedConnection-----${nodeId.name}`;
  }
}

function stringToNode<ForkName extends string, StairName extends string>(
  s: string
): ForkNode<ForkName> | StairNode<StairName> {
  const split = s.split("-----");
  if (split.length < 2) {
    return s as ForkName;
  } else if (split[0] === "StairNode") {
    return onFloor(split[1] as StairName, parseInt(split[2]));
  } else {
    return reverseConnection(split[1] as ForkName);
  }
}

function getHallwayConnections<
  ForkName extends string,
  StairName extends string
>(
  hallConnections: {
    nodeId: ForkNode<ForkName> | StairNode<StairName>;
    edgeLengthFromPreviousNodeInHallway: number;
  }[][]
): [string, string][] {
  return hallConnections
    .flat()
    .map(thing => thing.nodeId)
    .filter(
      (connection): connection is ForkName => typeof connection === "string"
    )
    .map(forkName => [
      nodeToString(forkName),
      nodeToString(reverseConnection(forkName)),
    ]);
}

/**
 * @param id1
 * @param id2
 * @return Is the connection between these two nodes
 * a Stairs connection? (as opposed to a Fork)
 */
export function isConnectionStairs<
  ForkName extends string,
  StairName extends string
>(
  node: ForkNode<ForkName> | StairNode<StairName>
): node is StairNode<StairName> {
  return typeof node === "object" && node._type === "StairNode";
}

export function isReverseConnection<
  ForkName extends string,
  StairName extends string
>(
  nodeId2: ForkNode<ForkName> | StairNode<StairName>
): nodeId2 is ReversedConnection<ForkName> {
  return typeof nodeId2 !== "string" && !isConnectionStairs(nodeId2);
}

function getStairConnections<ForkName extends string, StairName extends string>(
  hallConnections: {
    nodeId: ForkNode<ForkName> | StairNode<StairName>;
    edgeLengthFromPreviousNodeInHallway: number;
  }[][]
): string[][] {
  const stairNodes = hallConnections
    .flat()
    .map(thing => thing.nodeId)
    .filter(isConnectionStairs);
  const staircases = [...new Set(stairNodes.map(node => node.name))];
  return staircases.map(name =>
    stairNodes
      .filter(node => node.name === name)
      .sort((a, b) => b.floor - a.floor)
      .map(nodeToString)
  );
}

/**
 * @ignore
 * @param hallConnectors - an array of each hallway's array of nodes
 * @param stairConnections - an array of stairs, where each stair has
 * a list of nodes going from the top to the bottom
 * @param hallwayConnections - an array of the pairs of connected hallway nodes
 * @returns The graph to be used by getShortestPath
 */
export function getGraph<ForkName extends string, StairName extends string>(
  hallConnectorsStructures: {
    nodeId: ForkNode<ForkName> | StairNode<StairName>;
    edgeLengthFromPreviousNodeInHallway: number;
  }[][]
) {
  const hallConnectors = hallConnectorsStructures.map(hall =>
    hall.map(({ nodeId, edgeLengthFromPreviousNodeInHallway }) => ({
      nodeId: nodeToString(nodeId),
      edgeLengthFromPreviousNodeInHallway,
    }))
  );
  const stairConnections = getStairConnections(hallConnectorsStructures);
  const hallwayConnections = getHallwayConnections(hallConnectorsStructures);

  const graph: dijkstra.Graph = {};
  hallConnectors.forEach(hall => {
    return hall.forEach((node, ind) => {
      const id = node.nodeId;
      const edgesTo: { [key: string]: number } = {};
      if (ind != 0) {
        edgesTo[hall[ind - 1].nodeId] =
          hall[ind].edgeLengthFromPreviousNodeInHallway;
      }
      if (ind != hall.length - 1) {
        edgesTo[hall[ind + 1].nodeId] =
          hall[ind + 1].edgeLengthFromPreviousNodeInHallway;
      }
      stairConnections.forEach(stairList => {
        const myFloorNum = stairList.indexOf(id);
        if (myFloorNum != -1) {
          stairList.forEach((otherId, otherFloorNum) => {
            if (otherId != id) {
              const diff = Math.abs(myFloorNum - otherFloorNum);
              // We set the weight to slightly less than the number
              // of staircases we're going up because it's easier to go
              // up multiple stairs at once than to go up one flight, then
              // go to another set of stairs
              edgesTo[otherId] = diff * (1 - 0.001 * diff);
            }
          });
        }
      });
      hallwayConnections.forEach(([bottom, top]) => {
        if (bottom === id) {
          edgesTo[top] = 1;
        } else if (top === id) {
          edgesTo[bottom] = 1;
        }
      });
      graph[id] = edgesTo;
    });
  });
  return graph;
}

/**
 * @ignore
 * @param graph - A graph generated by getGraph
 * @param idFrom - The id of the node to start at
 * @param idTo - The id of the destination node
 * @returns An array of node IDs that represents the path from `idFrom` to
 * `idTo`.
 */
export function getShortestPath<
  ForkName extends string,
  StairName extends string
>(
  graph: dijkstra.Graph,
  idFrom: ForkNode<ForkName> | StairNode<StairName>,
  idTo: ForkNode<ForkName> | StairNode<StairName>
): (ForkNode<ForkName> | StairNode<StairName>)[] {
  return dijkstra
    .find_path(graph, nodeToString(idFrom), nodeToString(idTo))
    .map(nodeStr => stringToNode(nodeStr));
}

/**
 * @ignore
 * @param graph - a graph
 * @return - Is this a connected graph?
 */
export function isConnectedGraph(
  graph: dijkstra.Graph
): { connected: boolean; connectedSections: string[][] } {
  const nodeIds: string[] = Object.keys(graph);

  if (nodeIds.length === 0) {
    return { connected: true, connectedSections: [] };
  }

  let traveled: string[] = [];
  const travelOut = (nodeId: string) => {
    if (!traveled.includes(nodeId)) {
      traveled.push(nodeId);
      if (Object.keys(graph).includes(nodeId)) {
        for (const newNode of Object.keys(graph[nodeId])) {
          travelOut(newNode);
        }
      }
    }
  };

  const connectedSections: string[][] = [];
  while (connectedSections.flat().length < nodeIds.length) {
    const nextUntraveledNodeId = nodeIds.find(
      s => !connectedSections.flat().includes(s)
    )!;
    traveled = [];
    travelOut(nextUntraveledNodeId);
    connectedSections.push(traveled);
  }

  return { connected: connectedSections.length === 1, connectedSections };
}
