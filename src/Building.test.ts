import { Building, Hallway, Room, Fork, Direction, Stairs, Turn } from ".";

const { RIGHT, LEFT } = Direction;

describe("Building.validity", () => {
  test("valid buildings", () => {
    expect(
      new Building([new Hallway([new Room("a"), new Room("b")])]).validity.valid
    ).toBe(true);

    expect(
      new Building([
        new Hallway([
          new Room("a"),
          new Room("b"),
          new Turn(RIGHT),
          new Fork(LEFT, "a", ""),
        ]),
      ]).validity.valid
    ).toBe(true);

    expect(
      new Building(
        [
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([new Room("z"), new Fork(RIGHT, "b", "")]),
        ],
        [["a", "b"]]
      ).validity.valid
    ).toBe(true);

    expect(
      new Building(
        [
          new Hallway([new Room("a"), new Room("b"), new Stairs(LEFT, "a")]),
          new Hallway([new Room("z"), new Stairs(RIGHT, "b")]),
        ],
        [],
        [["b", "a"]]
      ).validity.valid
    ).toBe(true);
  });

  test("buildings with duplicated names are invalid", () => {
    expect(
      new Building([new Hallway([new Room("a"), new Room("a")])]).validity
    ).toEqual({
      valid: false,
      reason: "There's more than one room with the name 'a'",
      connectedSections: [],
    });

    expect(
      new Building(
        [
          new Hallway([new Room("a"), new Room("b"), new Stairs(LEFT, "c")]),
          new Hallway([new Room("a"), new Stairs(RIGHT, "b")]),
        ],
        [],
        [["c", "b"]]
      ).validity
    ).toEqual({
      valid: false,
      reason: "There's more than one room with the name 'a'",
      connectedSections: [["c", "b"]],
    });
  });

  test("buildings with negative weights are invalid", () => {
    expect(
      new Building(
        [
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([
            new Fork(RIGHT, "f", ""),
            new Room("z"),
            new Fork(RIGHT, "b", "", -2),
          ]),
        ],
        [["a", "b"]]
      ).validity
    ).toEqual({
      valid: false,
      reason: `The edge from node 'f' to node 'b' has a negative weight`,
      connectedSections: [["a", "b", "f"]],
    });
  });

  test("buildings with no nodes in a Hallway are invalid", () => {
    expect(
      new Building(
        [
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([new Room("z"), new Fork(RIGHT, "b", "")]),
          new Hallway([new Room("c"), new Room("d")]),
        ],
        [["a", "b"]]
      ).validity
    ).toEqual({
      valid: false,
      reason: "The hallway at index 2 has no nodes (Forks or Stairs)",
      connectedSections: [["a", "b"]],
    });
  });

  test("buildings with disconnected graphs are invalid", () => {
    expect(
      new Building(
        [
          new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
          new Hallway([new Room("z"), new Fork(RIGHT, "b", "")]),
          new Hallway([new Room("c"), new Fork(RIGHT, "8", "")]),
        ],
        [["a", "b"]]
      ).validity
    ).toEqual({
      valid: false,
      reason:
        "Not all nodes are connected; see building.validity.connectedSections to find which node groups are separated",
      connectedSections: [["8"], ["a", "b"]],
    });
  });
});

describe("basic directions functionality", () => {
  it("follows basic example in docs", () => {
    // A Hallway has an array of Rooms. Each Room has a name and a side.
    const hallway = new Hallway([
      new Room("102", Direction.RIGHT),
      new Room("103", Direction.LEFT),
      new Room("104", Direction.RIGHT),
      new Room("105", Direction.LEFT),
      new Room("106", Direction.RIGHT),
      // If you don't specify a side, the default is Direction.LEFT
      new Room("107"),
      new Room("108", Direction.RIGHT),
      new Room("109", Direction.LEFT),
    ]);

    // A Building has an array of Hallways.
    // In this case, there's only one Hallway in the Building.
    const building = new Building([hallway]);

    expect(building.getDirections("102", "109")).toMatchInlineSnapshot(`
      "Turn right out of room 102
      Continue, then turn left into room 109"
    `);

    expect(building.getDirections("107", "103")).toMatchInlineSnapshot(`
      "Turn right out of room 107
      Continue, then turn right into room 103"
    `);
  });

  it("follows Turns correctly", () => {
    const hallway = new Hallway([
      new Room("102", Direction.RIGHT),
      new Room("103", Direction.LEFT),
      new Room("104", Direction.RIGHT),
      new Room("105", Direction.LEFT),
      new Turn(Direction.RIGHT),
      new Room("106", Direction.RIGHT),
      new Room("107"),
      new Room("108", Direction.RIGHT),
      new Room("109", Direction.LEFT),
    ]);

    const building = new Building([hallway]);

    expect(building.getDirections("102", "109")).toMatchInlineSnapshot(`
      "Turn right out of room 102
      Continue, then turn right (after passing room 105 on your left)
      Continue, then turn left into room 109"
    `);

    expect(building.getDirections("107", "103")).toMatchInlineSnapshot(`
      "Turn right out of room 107
      Continue, then turn left (after passing room 106 on your left)
      Continue, then turn right into room 103"
    `);
  });
});
