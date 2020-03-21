import { Building } from "./Building";
import { isConnectedGraph } from "./graph";
import { Turn } from "./Turn";
import { Direction } from "./Direction";
import { StairNode } from "./StairNode";
import { ForkNode, reverseConnection } from "./ForkNode";
import { nodeFromString } from "./node";

function nodeToHumanString<ForkName extends string, StairName extends string>(
  node: ForkNode<ForkName> | StairNode<StairName>
): string {
  if (node instanceof StairNode) {
    return `onFloor('${node.name}', ${node.floor})`;
  } else if (node.reversed) {
    return `reverseConnection('${node.name}')`;
  } else {
    return `'${node.name}'`;
  }
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
export function isValidBuilding<
  ForkName extends string,
  StairName extends string
>(
  b: Building<ForkName, StairName>
):
  | { valid: true; connectedSections: string[][] }
  | { valid: false; reason: string; connectedSections: string[][] } {
  const connectedSections = isConnectedGraph(b.graph).connectedSections;

  // TODO: add test that node IDs don't contain "-$-"

  // More than one room can't have the same name
  let ret: {
    valid: false;
    reason: string;
    connectedSections: string[][];
  } | null = null;
  b.roomsList.forEach((name, index) => {
    if (b.roomsList.indexOf(name) !== index) {
      ret = {
        valid: false,
        reason: `There's more than one room with the name '${name}'`,
        connectedSections,
      };
    }
  });
  if (ret != null) return ret;

  // Edges can't have negative weights
  for (const [id1, obj] of Object.entries(b.graph)) {
    for (const [id2, edgeLen] of Object.entries(obj)) {
      if (edgeLen < 0) {
        return {
          valid: false,
          reason: `The edge from node ${nodeToHumanString(
            nodeFromString(id1)
          )} to node ${nodeToHumanString(
            nodeFromString(id2)
          )} has a negative weight`,
          connectedSections,
        };
      }
    }
  }

  // shouldn't have duplicated or unmatched nodes
  const allNodes = b.hallways.flatMap(h => h.nodes).map(({ nodeId }) => nodeId);
  for (const nodeId of allNodes) {
    if (nodeId instanceof StairNode) {
      const sameStaircase = allNodes
        .filter((id): id is StairNode<StairName> => id instanceof StairNode)
        .filter(nodeId2 => nodeId2.name === nodeId.name);
      const same = sameStaircase.filter(
        nodeId2 => nodeId2.floor === nodeId.floor
      );
      if (same.length > 1) {
        return {
          valid: false,
          reason: `There's more than one Stairs node with the name onFloor('${nodeId.name}', ${nodeId.floor}). One of the Stairs in the staircase should probably be on a different floor.`,
          connectedSections,
        };
      }
      if (sameStaircase.length === 1) {
        return {
          valid: false,
          reason:
            `There are Stairs with the nodeId onFloor('${nodeId.name}', ${nodeId.floor}) with no corresponding Stairs on a different floor. ` +
            "You need to either add Stairs somewhere else with the same name and a different floor, or remove this node.",
          connectedSections,
        };
      }
    } else {
      const same = allNodes.filter(
        nodeId2 =>
          nodeId2 instanceof ForkNode &&
          nodeId2.name === nodeId.name &&
          nodeId2.reversed === nodeId.reversed
      );
      if (same.length > 1) {
        return {
          valid: false,
          reason: `There's more than one Fork with the nodeId ${nodeToHumanString(
            nodeId
          )}. One of them should probably ${
            nodeId.reversed ? "not " : ""
          }be a reverseConnection.`,
          connectedSections,
        };
      }
      const reversed = allNodes
        .filter(
          other =>
            other instanceof ForkNode && other.reversed !== nodeId.reversed
        )
        .filter(({ name }) => name === nodeId.name);
      if (reversed.length === 0) {
        return {
          valid: false,
          reason: `There's a Fork with the nodeId ${nodeToHumanString(
            nodeId
          )} that doesn't have a corresponding ${
            nodeId.reversed ? "regular connection" : "reverseConnection"
          }. You need to either add a Fork somewhere else with the nodeId ${nodeToHumanString(
            reverseConnection(nodeId)
          )} to connect it to this node, or remove this node.`,
          connectedSections,
        };
      }
    }
  }

  // rooms marked BACK are in the back and rooms marked FRONT are in the front
  b.hallways.forEach((hallway, hallwayIndex) => {
    hallway.partList.forEach((part, partIndex) => {
      if (!(part instanceof Turn) && ret == null) {
        if (partIndex !== 0 && part.side === Direction.BACK) {
          ret = {
            valid: false,
            reason: `The element at position ${partIndex} of the Hallway at position ${hallwayIndex} has the side BACK, but it is not the first element of the hallway`,
            connectedSections,
          };
        } else if (
          partIndex !== hallway.partList.length - 1 &&
          part.side === Direction.FRONT
        ) {
          ret = {
            valid: false,
            reason: `The element at position ${partIndex} of the Hallway at position ${hallwayIndex} has the side FRONT, but it is not the last element of the hallway`,
            connectedSections,
          };
        }
      }
    });
  });
  if (ret != null) return ret;

  // If there's more than 1 hallway, each hallway should have a node to
  // connect it to the rest of the hallways
  const indexOfHallwayWithNoNodes = b.hallways.findIndex(
    h => h.nodes.length === 0
  );
  if (b.hallways.length > 1 && indexOfHallwayWithNoNodes !== -1) {
    return {
      valid: false,
      reason: `The hallway at index ${indexOfHallwayWithNoNodes} has no nodes (Forks or Stairs) to connect it to the rest of the building.`,
      connectedSections,
    };
  }

  // Graph should be connected
  if (!isConnectedGraph(b.graph).connected) {
    return {
      valid: false,
      reason:
        "Not all nodes are connected; see isValidBuilding(building).connectedSections to find which node groups are separated.",
      connectedSections: isConnectedGraph(b.graph).connectedSections,
    };
  }

  // no Turns at the front or back of Hallways
  b.hallways.forEach(({ partList }, hallwayIndex) => {
    if (ret == null) {
      if (partList[0] instanceof Turn) {
        ret = {
          valid: false,
          reason: `There first element of the Hallway at position ${hallwayIndex} is a Turn. There is no reason to include a Turn here because it will never be passed.`,
          connectedSections,
        };
      } else if (partList[partList.length - 1] instanceof Turn) {
        ret = {
          valid: false,
          reason: `There last element of the Hallway at position ${hallwayIndex} is a Turn. There is no reason to include a Turn here because it will never be passed.`,
          connectedSections,
        };
      }
    }
  });
  if (ret != null) return ret;

  return { valid: true, connectedSections };
}

export function assertValidBuilding<
  ForkName extends string,
  StairName extends string
>(b: Building<ForkName, StairName>): void {
  const validity = isValidBuilding(b);
  if (!validity.valid) {
    throw `asserValidBuilding: This building is invalid. ${validity.reason}`;
  }
}
