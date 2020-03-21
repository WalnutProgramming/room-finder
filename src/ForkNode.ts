export class ForkNode<ForkName extends string> {
  readonly _type = "ForkNode";
  constructor(readonly name: ForkName, readonly reversed: boolean) {}
}

export function reverseConnection<ForkName extends string>(
  node: ForkName | ForkNode<ForkName>
): ForkNode<ForkName> {
  return typeof node === "string"
    ? new ForkNode(node, true)
    : new ForkNode(node.name, !node.reversed);
}

export function getConnection<ForkName extends string>(
  thing: ForkName | ForkNode<ForkName>
): ForkNode<ForkName> {
  if (thing instanceof ForkNode) {
    return thing;
  } else {
    return new ForkNode(thing, false);
  }
}
