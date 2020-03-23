/**
 * A StairNode represents the node ID of Stairs.
 */
export class StairNode<StairName extends string> {
  readonly _type = "StairNode";
  constructor(readonly name: StairName, readonly floor: number) {}
}

/**
 * @param name The name of the staircase
 * @param floor The floor that this node is on
 * @returns A StairNode with the given name on the given floor
 */
export function onFloor<StairName extends string>(
  name: StairName,
  floor: number
): StairNode<StairName> {
  return new StairNode(name, floor);
}
