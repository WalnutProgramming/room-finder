import { isConnectedGraph } from "./graph";

describe("isConnectedGraph", () => {
  test("an empty graph is connected", () => {
    expect(isConnectedGraph({})).toEqual({
      connected: true,
      connectedSections: [],
    });
  });

  test("connected graphs are connected", () => {
    expect(
      isConnectedGraph({
        a: { b: 1 },
        b: { a: 1 },
      })
    ).toEqual({
      connected: true,
      connectedSections: [["a", "b"]],
    });

    expect(
      isConnectedGraph({
        a: { b: 1 },
        b: { a: 1, c: 0 },
        c: { b: 1 },
      })
    ).toEqual({
      connected: true,
      connectedSections: [["a", "b", "c"]],
    });

    expect(
      isConnectedGraph({
        a: { b: 1, c: 1 },
        b: { a: 1 },
        c: { a: 1 },
      })
    ).toEqual({
      connected: true,
      connectedSections: [["a", "b", "c"]],
    });
  });

  test("disconnected graphs are not connected", () => {
    expect(
      isConnectedGraph({
        a: { b: 1 },
        b: { a: 1 },
        c: {},
      })
    ).toEqual({
      connected: false,
      connectedSections: [["c"], ["a", "b"]],
    });

    expect(
      isConnectedGraph({
        a: {},
        b: { c: 1 },
        c: { b: 37 },
      })
    ).toEqual({
      connected: false,
      connectedSections: [["b", "c"], ["a"]],
    });

    expect(
      isConnectedGraph({
        a: { b: 1 },
        b: { a: 13 },
        c: { d: 7.3 },
        d: { c: 1 },
      })
    ).toEqual({
      connected: false,
      connectedSections: [
        ["c", "d"],
        ["a", "b"],
      ],
    });

    expect(
      isConnectedGraph({
        a: { b: 1 },
        b: { a: 13 },
        c: { d: 7.3, e: 3 },
        d: { c: 1 },
        e: { c: 0 },
      })
    ).toEqual({
      connected: false,
      connectedSections: [
        ["c", "d", "e"],
        ["a", "b"],
      ],
    });
  });
});

// TODO: test directed graphs
