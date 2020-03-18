export interface StairNode<StairName extends string> {
  readonly _type: "StairNode";
  readonly name: StairName;
  readonly floor: number;
}

export function onFloor<StairName extends string>(
  name: StairName,
  floor: number
): StairNode<StairName> {
  return { _type: "StairNode", name, floor };
}
