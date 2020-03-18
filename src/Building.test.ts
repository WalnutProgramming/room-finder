import {
  Building,
  Hallway,
  Room,
  ForkableRoom,
  Fork,
  Direction,
  Stairs,
  Turn,
  reverseConnection,
  onFloor,
} from ".";

const { RIGHT, LEFT, BACK, FRONT } = Direction;

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

  it("follows formatting options", () => {
    const hallway = new Hallway([
      new Room("102", Direction.RIGHT),
      new Room("103", Direction.LEFT),
      new Room("104", Direction.RIGHT),
      new Room("105", Direction.LEFT),
      new Room("106", Direction.RIGHT),
      new Room("107"),
      new Room("108", Direction.RIGHT),
      new Room("109", Direction.LEFT),
    ]);

    // A Building has an array of Hallways.
    // In this case, there's only one Hallway in the Building.
    const building = new Building([hallway]);

    expect(building.getDirections("102", "109", { periods: true }))
      .toMatchInlineSnapshot(`
      "Turn right out of room 102.
      Continue, then turn left into room 109."
    `);

    expect(building.getDirections("102", "109", { capitalize: false }))
      .toMatchInlineSnapshot(`
      "turn right out of room 102
      continue, then turn left into room 109"
    `);

    expect(
      building.getDirections("102", "109", { periods: true, capitalize: false })
    ).toMatchInlineSnapshot(`
      "turn right out of room 102.
      continue, then turn left into room 109."
    `);
  });
});

describe("hallways with forks", () => {
  it("works with one fork", () => {
    const building = new Building([
      // hallway 1
      new Hallway([
        new Room("11", RIGHT),
        new Room("12"),
        new Fork(LEFT, "fork1", "the second hallway"),
      ]),

      // hallway 2
      new Hallway([
        new Fork(BACK, reverseConnection("fork1"), "the first hallway"),
        new Room("21"),
        new Room("22"),
      ]),
    ]);

    expect(building.getDirections("21", "11")).toMatchInlineSnapshot(`
      "Turn right out of room 21
      Continue, then after entering the first hallway, turn right
      Continue, then turn left into room 11"
    `);
  });

  it("works with 2 forks", () => {
    type MyConnections = "hallway1_to_hallway2" | "hallway1_to_hallway3";

    const building = new Building<MyConnections>([
      // hallway 1
      new Hallway([
        new Fork(BACK, "hallway1_to_hallway3", "the third hallway"),
        new Room("11", LEFT),
        new Fork(RIGHT, "hallway1_to_hallway2", "the second hallway"),
      ]),

      // hallway 2
      new Hallway([
        new Room("21"),
        new Fork(
          FRONT,
          reverseConnection("hallway1_to_hallway2"),
          "the first hallway"
        ),
      ]),

      // hallway 3
      new Hallway([
        new Fork(
          LEFT,
          reverseConnection("hallway1_to_hallway3"),
          "the first hallway"
        ),
        new Room("31"),
      ]),
    ]);

    expect(building.getDirections("21", "31")).toMatchInlineSnapshot(`
      "Turn left out of room 21
      Continue, then after entering the first hallway, turn left
      Continue, then after entering the third hallway, turn left
      Continue, then turn left into room 31"
    `);
  });
});

describe("hallways with stairs", () => {
  it("works with 1 set of stairs with 2 floors", () => {
    const building = new Building<string, "stair-a">([
      // hallway 11 (on 1st floor)
      new Hallway([
        new Stairs(LEFT, onFloor("stair-a", 1)),
        new Room("111"),
        new Room("112"),
      ]),

      // hallway 21 (on 2nd floor)
      new Hallway([
        new Stairs(LEFT, onFloor("stair-a", 2)),
        new Room("211"),
        new Room("212"),
      ]),
    ]);

    expect(building.getDirections("112", "211")).toMatchInlineSnapshot(`
      "Turn right out of room 112
      Continue, then turn right into the stairs
      Go up 1 floor of stairs
      Turn left out of the stairs
      Continue, then turn left into room 211"
    `);
  });

  it("works with 1 set of stairs with 3 floors", () => {
    const building = new Building([
      // hallway 11 (on 1st floor)
      new Hallway([
        new Stairs(LEFT, onFloor("stair-a", 1)),
        new Room("111"),
        new Room("112"),
      ]),

      // hallway 21 (on 2nd floor)
      new Hallway([
        new Stairs(LEFT, onFloor("stair-a", 2)),
        new Room("211"),
        new Room("212"),
      ]),

      // hallway 31 (on 3rd floor)
      new Hallway([
        new Room("311", RIGHT),
        new Stairs(LEFT, onFloor("stair-a", 3)),
        new Room("312"),
      ]),
    ]);

    expect(building.getDirections("112", "211")).toMatchInlineSnapshot(`
      "Turn right out of room 112
      Continue, then turn right into the stairs
      Go up 1 floor of stairs
      Turn left out of the stairs
      Continue, then turn left into room 211"
    `);

    // bad!!!
    expect(building.getDirections("112", "311")).toMatchInlineSnapshot(`
      "Turn right out of room 112
      Continue, then turn right into the stairs
      Go up 2 floors of stairs
      Turn right out of the stairs
      Continue, then turn left into room 311"
    `);

    expect(building.getDirections("312", "212")).toMatchInlineSnapshot(`
      "Turn right out of room 312
      Continue, then turn right into the stairs
      Go down 1 floor of stairs
      Turn left out of the stairs
      Continue, then turn left into room 212"
    `);
  });
});

it("works with multiple forks and stairs", () => {
  type MyForks = "fork1";
  type MyStairs = "stair-a" | "stair-b";

  const building = new Building<MyForks, MyStairs>([
    // hallway 11 (on 1st floor)
    new Hallway([
      new Stairs(LEFT, onFloor("stair-a", 1)),
      new Room("111"),
      new Room("112"),
    ]),

    // hallway 21 (on 2nd floor)
    new Hallway([
      new Stairs(LEFT, onFloor("stair-a", 2)),
      new Room("211"),
      new Room("212"),
      new Fork(RIGHT, reverseConnection("fork1"), "the 22s"),
    ]),

    // hallway 22 (on 2nd floor)
    new Hallway([
      new Room("221"),
      new Room("222"),
      new Stairs(LEFT, onFloor("stair-b", 2)),
      new Fork(FRONT, reverseConnection("fork1"), "the 21s"),
    ]),

    // hallway 31 (on 3rd floor)
    new Hallway([
      new Room("311", RIGHT),
      new Stairs(LEFT, onFloor("stair-a", 2)),
      new Room("312"),
    ]),

    // hallway 32 (on 3rd floor)
    new Hallway([
      new Room("321"),
      new Stairs(LEFT, onFloor("stair-b", 3)),
      new Room("322"),
    ]),
  ]);
});

describe("Building.validity", () => {
  it("marks valid buildings correctly", () => {
    const valid = expect.objectContaining({ valid: true });

    expect(
      new Building([new Hallway([new Room("a"), new Room("b")])]).validity
    ).toEqual(valid);

    expect(
      new Building([
        new Hallway([
          new Room("a"),
          new Room("b"),
          new Turn(RIGHT),
          new Fork(LEFT, "a", ""),
        ]),
      ]).validity
    ).toEqual(valid);

    expect(
      new Building([
        new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
        new Hallway([
          new Room("z"),
          new Fork(RIGHT, reverseConnection("a"), ""),
        ]),
      ]).validity
    ).toEqual(valid);

    expect(
      new Building([
        new Hallway([
          new Room("a"),
          new Room("b"),
          new Stairs(LEFT, onFloor("a", 2)),
        ]),
        new Hallway([new Room("z"), new Stairs(RIGHT, onFloor("a", 1))]),
      ]).validity
    ).toEqual(valid);
  });

  it("marks buildings with duplicated names as invalid", () => {
    expect(
      new Building([new Hallway([new Room("a"), new Room("a")])]).validity
    ).toEqual({
      valid: false,
      reason: "There's more than one room with the name 'a'",
      connectedSections: [],
    });

    expect(
      new Building([
        new Hallway([
          new Room("a"),
          new Room("b"),
          new Stairs(LEFT, onFloor("c", 4)),
        ]),
        new Hallway([new Room("a"), new Stairs(RIGHT, onFloor("b", 1))]),
      ]).validity
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: "There's more than one room with the name 'a'",
      })
    );
  });

  it("marks buildings with negative weights as invalid", () => {
    expect(
      new Building([
        new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
        new Hallway([
          new Fork(RIGHT, "f", ""),
          new Room("z"),
          new Fork(RIGHT, reverseConnection("a"), "", -2),
        ]),
      ]).validity
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: `The edge from node 'f' to node 'ReversedConnection-----a' has a negative weight`,
      })
    );
  });

  it("marks buildings with no nodes in a Hallway as invalid", () => {
    expect(
      new Building([
        new Hallway([
          new Room("a"),
          new Room("b"),
          new Fork(LEFT, reverseConnection("b"), ""),
        ]),
        new Hallway([new Room("z"), new Fork(RIGHT, "b", "")]),
        new Hallway([new Room("c"), new Room("d")]),
      ]).validity
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason: "The hallway at index 2 has no nodes (Forks or Stairs)",
      })
    );
  });

  it("marks buildings with disconnected graphs as invalid", () => {
    expect(
      new Building([
        new Hallway([new Room("a"), new Room("b"), new Fork(LEFT, "a", "")]),
        new Hallway([
          new Room("z"),
          new Fork(RIGHT, reverseConnection("b"), ""),
        ]),
        new Hallway([new Room("c"), new Fork(RIGHT, "8", "")]),
      ]).validity
    ).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "Not all nodes are connected; see building.validity.connectedSections to find which node groups are separated",
      })
    );
  });
});

describe("correct transition phrasing", () => {
  test("for parallel hallways", () => {
    const building = new Building([
      // hallway #1
      new Hallway([
        new Room("A", RIGHT),
        new Room("B"),
        new Fork(LEFT, "node1", "hallway #2"),
      ]),
      // hallway #2
      new Hallway([
        new Room("C", RIGHT),
        new Fork(RIGHT, reverseConnection("node1"), "hallway #1"),
        new Room("D"),
        new Room("E"),
        new Fork(LEFT, reverseConnection("node4"), "hallway #3"),
      ]),
      // hallway #3
      new Hallway([new Room("F"), new Fork(RIGHT, "node4", "hallway #2")]),
    ]);
    expect(building.getDirections("A", "F")).toMatchInlineSnapshot(`
      "Turn right out of room A
      Continue, then turn left into hallway #2, and then turn right
      Continue, then turn left into hallway #3, and then turn left
      Continue, then turn right into room F"
    `);
  });
});
