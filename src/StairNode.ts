export class StairNode<StairName extends string> {
  readonly _type = "StairNode";
  constructor(readonly name: StairName, readonly floor: number) {}
}

export function onFloor<StairName extends string>(
  name: StairName,
  floor: number
): StairNode<StairName> {
  return new StairNode(name, floor);
}
