export interface ReversedConnection<ForkName extends string> {
  readonly _type: "ReversedConnection";
  readonly name: ForkName;
}

export function reverseConnection<ForkName extends string>(
  name: ForkName
): ForkNode<ForkName> {
  return { _type: "ReversedConnection", name };
}

export type ForkNode<ForkName extends string> =
  | ReversedConnection<ForkName>
  | ForkName;
