import { StairNode } from "./StairNode";
import { ForkNode } from "./ForkNode";

/** @ignore */
export function nodeToString<ForkName extends string, StairName extends string>(
  node: StairNode<StairName> | ForkNode<ForkName>
): string {
  if (node instanceof ForkNode) {
    return `ForkNode-$-${node.name}-$-${JSON.stringify(node.reversed)}`;
  } else {
    return `StairNode-$-${node.name}-$-${JSON.stringify(node.floor)}`;
  }
}

/** @ignore */
export function nodeFromString<
  ForkName extends string,
  StairName extends string
>(str: string): StairNode<StairName> | ForkNode<ForkName> {
  const split = str.split("-$-");
  if (split[0] === "ForkNode") {
    return new ForkNode(split[1] as ForkName, JSON.parse(split[2]) as boolean);
  } else {
    return new StairNode(split[1] as StairName, JSON.parse(split[2]) as number);
  }
}
