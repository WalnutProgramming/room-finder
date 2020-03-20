import {
  Building,
  Hallway,
  Room,
  Turn,
  Fork,
  Stairs,
  Direction,
  isValidBuilding,
  assertValidBuilding,
  reverseConnection,
  onFloor,
} from ".";

const { LEFT, RIGHT } = Direction;

describe("Building.validity", () => {
  it("marks valid buildings correctly", () => {
    const valid = expect.objectContaining({ valid: true });

    const b = new Building([new Hallway([new Room("a"), new Room("b")])]);
    expect(isValidBuilding(b)).toEqual(valid);
    assertValidBuilding(b);

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Turn(RIGHT),
            new Fork(LEFT, "a", ""),
          ]),
        ])
      )
    ).toEqual(valid);

    expect(
      isValidBuilding(
        new Building([
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([
            new Room("z"),
            new Fork(RIGHT, reverseConnection("a"), ""),
          ]),
        ])
      )
    ).toEqual(valid);

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Stairs(LEFT, onFloor("a", 2)),
          ]),
          new Hallway([new Room("z"), new Stairs(RIGHT, onFloor("a", 1))]),
        ])
      )
    ).toEqual(valid);
  });

  it("marks buildings with duplicated names as invalid", () => {
    const b = new Building([new Hallway([new Room("a"), new Room("a")])]);

    expect(isValidBuilding(b)).toEqual({
      valid: false,
      reason: "There's more than one room with the name 'a'",
      connectedSections: [],
    });
    expect(() => {
      assertValidBuilding(b);
    }).toThrow("There's more than one room with the name 'a'");

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Stairs(LEFT, onFloor("c", 4)),
          ]),
          new Hallway([new Room("a"), new Stairs(RIGHT, onFloor("b", 1))]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: "There's more than one room with the name 'a'",
      })
    );
  });

  it("marks buildings with negative weights as invalid", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([
            new Fork(RIGHT, "f", ""),
            new Room("z"),
            new Fork(RIGHT, reverseConnection("a"), "", -2),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: `The edge from node 'f' to node 'ReversedConnection-----a' has a negative weight`,
      })
    );
  });

  it("marks buildings with no nodes in a Hallway as invalid", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Fork(LEFT, reverseConnection("b"), ""),
          ]),
          new Hallway([new Room("z"), new Fork(RIGHT, "b", "")]),
          new Hallway([new Room("c"), new Room("d")]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: "The hallway at index 2 has no nodes (Forks or Stairs)",
      })
    );
  });

  it("marks buildings with disconnected graphs as invalid", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([
            new Room("z"),
            new Fork(RIGHT, reverseConnection("b"), ""),
          ]),
          new Hallway([new Room("c"), new Fork(RIGHT, "8", "")]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "Not all nodes are connected; see isValidBuilding(building).connectedSections to find which node groups are separated.",
      })
    );
  });
});
