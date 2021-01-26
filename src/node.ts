import { StairNode } from "./StairNode";
import { ForkNode } from "./ForkNode";
import { BasicRoomNode } from "./BasicRoomNode";

export type Node<ForkName extends string, StairName extends string> =
  | StairNode<StairName>
  | ForkNode<ForkName>
  | BasicRoomNode;

export type ConnectorNode<ForkName extends string, StairName extends string> =
  | StairNode<StairName>
  | ForkNode<ForkName>;

export function isConnectorNode<
  ForkName extends string,
  StairName extends string
>(
  node: Node<ForkName, StairName> | undefined
): node is ConnectorNode<ForkName, StairName> {
  return node != null && !(node instanceof BasicRoomNode);
}

/** @ignore */
export function serializeNode<
  ForkName extends string,
  StairName extends string
>(node: Node<ForkName, StairName>): string {
  if (node instanceof ForkNode) {
    return `ForkNode-$-${node.name}-$-${JSON.stringify(node.reversed)}`;
  } else if (node instanceof StairNode) {
    return `StairNode-$-${node.name}-$-${JSON.stringify(node.floor)}`;
  } else {
    return `BasicRoomNode-$-${node.name}`;
  }
}

/** @ignore */
export function nodeFromString<
  ForkName extends string,
  StairName extends string
>(str: string): Node<ForkName, StairName> {
  const split = str.split("-$-");
  if (split[0] === "ForkNode") {
    return new ForkNode(split[1] as ForkName, JSON.parse(split[2]) as boolean);
  } else if (split[0] === "StairNode") {
    return new StairNode(split[1] as StairName, JSON.parse(split[2]) as number);
  } else {
    return new BasicRoomNode(split[1]);
  }
}
