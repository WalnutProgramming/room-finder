import { Building } from "./Building";
import { isConnectedGraph } from "./graph";

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

  // More than one room can't have the same name
  let ret = null;
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
          reason: `The edge from node '${id1}' to node '${id2}' has a negative weight`,
          connectedSections,
        };
      }
    }
  }

  // If there's more than 1 hallway, each hallway should have a node to
  // connect it to the rest of the hallways
  const indexOfHallwayWithNoNodes = b.hallways.findIndex(
    h => h.nodes.length === 0
  );
  if (b.hallways.length > 1 && indexOfHallwayWithNoNodes !== -1) {
    return {
      valid: false,
      reason: `The hallway at index ${indexOfHallwayWithNoNodes} has no nodes (Forks or Stairs)`,
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
