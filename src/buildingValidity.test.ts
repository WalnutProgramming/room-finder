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

const { LEFT, RIGHT, FRONT } = Direction;

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
            new Room("c"),
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

    expect(isValidBuilding(b)).toEqual(
      expect.objectContaining({
        valid: false,
        reason: "There's more than one room with the name 'a'",
      })
    );
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
          new Hallway([new Room("a"), new Stairs(RIGHT, onFloor("c", 1))]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: "There's more than one room with the name 'a'",
      })
    );
  });

  it("marks buildings with duplicated nodes as invalid", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([new Room("z"), new Fork(RIGHT, "a", "")]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There's more than one Fork with the nodeId 'a'. One of them should probably be a reverseConnection.",
      })
    );

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Fork(LEFT, reverseConnection("a"), ""),
          ]),
          new Hallway([
            new Room("z"),
            new Fork(RIGHT, reverseConnection("a"), ""),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There's more than one Fork with the nodeId reverseConnection('a'). One of them should probably not be a reverseConnection.",
      })
    );

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Stairs(LEFT, onFloor("a", 1)),
          ]),
          new Hallway([new Room("z"), new Stairs(LEFT, onFloor("a", 1))]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There's more than one Stairs node with the name onFloor('a', 1). " +
          "One of the Stairs in the staircase should probably be on a different floor.",
      })
    );
  });

  it("doesn't allow unmatched Forks with no reverseConnection", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There's a Fork with the nodeId 'a' that doesn't have a corresponding reverseConnection. " +
          "You need to either add a Fork somewhere else with the nodeId reverseConnection('a') to connect it to this node, or remove this node.",
      })
    );

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Fork(LEFT, reverseConnection("a"), ""),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There's a Fork with the nodeId reverseConnection('a') that doesn't have a corresponding regular connection. " +
          "You need to either add a Fork somewhere else with the nodeId 'a' to connect it to this node, or remove this node.",
      })
    );
  });

  it("doesn't allow lone Stairs with no other floors in the staircase", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Stairs(LEFT, onFloor("a", 3)),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There are Stairs with the nodeId onFloor('a', 3) with no corresponding Stairs on a different floor. " +
          "You need to either add Stairs somewhere else with the same name and a different floor, or remove this node.",
      })
    );
  });

  it("checks that rooms marked FRONT are at the beginning or end of a hallway", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a", FRONT),
            new Room("b"),
            new Turn(RIGHT),
            new Room("c"),
          ]),
        ])
      )
    ).toEqual(expect.objectContaining({ valid: true }));

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b", FRONT),
            new Turn(RIGHT),
            new Room("c"),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "The element at position 1 of the Hallway at position 0 has the side FRONT, but it is not the first or last element of the hallway",
      })
    );

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b"),
            new Turn(RIGHT),
            new Room("c", FRONT),
          ]),
        ])
      )
    ).toEqual(expect.objectContaining({ valid: true }));

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a"),
            new Room("b", FRONT),
            new Turn(RIGHT),
            new Room("c"),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "The element at position 1 of the Hallway at position 0 has the side FRONT, but it is not the first or last element of the hallway",
      })
    );
  });

  it("respects the allowFrontConnectionsInMiddle property in Hallway", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway(
            [
              new Room("a", FRONT),
              new Room("b"),
              new Turn(RIGHT),
              new Room("c"),
            ],
            { allowFrontConnectionsInMiddle: true }
          ),
        ])
      )
    ).toEqual(expect.objectContaining({ valid: true }));

    expect(
      isValidBuilding(
        new Building([
          new Hallway(
            [
              new Room("a"),
              new Room("b"),
              new Turn(RIGHT),
              new Room("c", FRONT),
            ],
            { allowFrontConnectionsInMiddle: true }
          ),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: true,
      })
    );

    expect(
      isValidBuilding(
        new Building([
          new Hallway(
            [
              new Room("a", FRONT),
              new Room("b"),
              new Turn(RIGHT),
              new Room("c"),
            ],
            { allowFrontConnectionsInMiddle: true }
          ),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: true,
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
        reason: `The edge from node 'f' to node room 'z' has a negative weight`,
      })
    );
  });

  it("marks buildings with no nodes in a Hallway as invalid", () => {
    // @ts-ignore
    window.a = true;
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
        reason:
          "The hallway at index 2 has no connector nodes (Forks or Stairs) to connect it to the rest of the building.",
      })
    );
    // @ts-ignore
    window.a = false;
  });

  it("marks buildings with disconnected graphs as invalid", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([
            new Room("z"),
            new Fork(RIGHT, reverseConnection("a"), ""),
          ]),
          new Hallway([new Room("c"), new Fork(RIGHT, "8", "")]),
          new Hallway([
            new Room("f"),
            new Fork(FRONT, reverseConnection("8"), ""),
          ]),
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

  it("doesn't allow a Turn at the back or front of a Hallway", () => {
    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Room("a", FRONT),
            new Room("b"),
            new Turn(RIGHT),
            new Room("c"),
            new Turn(LEFT),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There last element of the Hallway at position 0 is a Turn. There is no reason to include a Turn here because it will never be passed.",
      })
    );

    expect(
      isValidBuilding(
        new Building([
          new Hallway([
            new Turn(LEFT),
            new Room("a"),
            new Room("b"),
            new Turn(RIGHT),
            new Room("c"),
          ]),
        ])
      )
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "There first element of the Hallway at position 0 is a Turn. There is no reason to include a Turn here because it will never be passed.",
      })
    );
  });

  // TODO: maybe add back, not sure if needed
  // it("doesn't allow multiple nodes with the same identity", () => {
  //   expect(
  //     isValidBuilding(
  //       new Building([
  //         new Hallway([new Room(), new Room("b"), new Fork(LEFT, "a", "")]),
  //         new Hallway([
  //           new Room(),
  //           new Fork(RIGHT, reverseConnection("a"), ""),
  //         ]),
  //       ])
  //     )
  //   ).toEqual(
  //     expect.objectContaining({
  //       valid: true,
  //     })
  //   );

  //   const room = new Room();
  //   expect(
  //     isValidBuilding(
  //       new Building([
  //         new Hallway([room, new Room("b"), new Fork(LEFT, "a", "")]),
  //         new Hallway([room, new Fork(RIGHT, reverseConnection("a"), "")]),
  //       ])
  //     )
  //   ).toEqual(
  //     expect.objectContaining({
  //       valid: false,
  //     })
  //   );
  // });
});
