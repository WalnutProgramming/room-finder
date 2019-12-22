declare module "dijkstrajs" {
  type Graph = { [key: string]: { [key: string]: number } };

  function find_path(graph: Graph, s: string, d: string): string[];
}
