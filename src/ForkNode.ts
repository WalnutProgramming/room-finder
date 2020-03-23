/**
 * A ForkNode represents the node ID of a [[Fork]] (or [[Room]]). It can be
 * either a regular node or a reversed node.
 *
 * Note: when you need to provide a node ID for a Fork or Room, you can either
 * provide a string, which represents a **forward  node**, or use the
 * [[reverseConnection]] function to create a **reverse node**.
 */
export class ForkNode<ForkName extends string> {
  readonly _type = "ForkNode";
  constructor(readonly name: ForkName, readonly reversed: boolean) {}
}

/**
 * @param node Either a string or a ForkNode
 * @returns a reversed version of the provided ForkNode
 */
export function reverseConnection<ForkName extends string>(
  node: ForkName | ForkNode<ForkName>
): ForkNode<ForkName> {
  return typeof node === "string"
    ? new ForkNode(node, true)
    : new ForkNode(node.name, !node.reversed);
}

/**
 * @ignore
 */
export function getConnection<ForkName extends string>(
  thing: ForkName | ForkNode<ForkName>
): ForkNode<ForkName> {
  if (thing instanceof ForkNode) {
    return thing;
  } else {
    return new ForkNode(thing, false);
  }
}
