import {
  Building,
  Hallway,
  Room,
  Fork,
  Direction,
  Stairs,
  Turn,
  reverseConnection,
  onFloor,
} from ".";
import { assertValidBuilding, isValidBuilding } from "./buildingValidity";

const { RIGHT, LEFT, FRONT } = Direction;

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

  it("returns null when a room doesn't exist", () => {
    const building = new Building([
      new Hallway([
        new Room("102", Direction.RIGHT),
        new Room("103", Direction.LEFT),
        new Room("104", Direction.RIGHT),
        new Room("105", Direction.LEFT),
        new Room("106", Direction.RIGHT),
        // If you don't specify a side, the default is Direction.LEFT
        new Room("107"),
        new Room("108", Direction.RIGHT),
        new Room("109", Direction.LEFT),
      ]),
    ]);

    expect(building.getDirections("a", "b")).toBeNull();
    expect(building.getDirections("a", "103")).toBeNull();
    expect(building.getDirections("103", "b")).toBeNull();
  });

  test("aliases and prefixes work", () => {
    const building = new Building([
      new Hallway([
        new Room("102", Direction.RIGHT, { aliases: ["a"] }),
        new Room("103", Direction.LEFT),
        new Room("104", Direction.RIGHT),
        new Room("105", Direction.LEFT),
        new Room("106", Direction.RIGHT, { aliases: ["b", "c"] }),
        // If you don't specify a side, the default is Direction.LEFT
        new Room("107"),
        new Room("108", Direction.RIGHT, { prefix: "prefixed" }),
        new Room("109", Direction.LEFT),
      ]),
    ]);

    expect(building.getDirections("a", "c")).toEqual(
      building.getDirections("102", "106")
    );

    expect(building.getDirections("102", "108")).toMatchInlineSnapshot(`
      "Turn right out of room 102
      Continue, then turn right into prefixed 108"
    `);
  });

  it("does the '(after passing)' message for Stairs", () => {
    const building = new Building([
      new Hallway([
        new Room("102", Direction.RIGHT),
        new Room("103", Direction.LEFT),
        new Room("104", Direction.RIGHT),
        new Room("105", Direction.LEFT),
        new Stairs(LEFT, onFloor("a", 1)),
        new Turn(Direction.RIGHT),
        new Room("106", Direction.RIGHT),
        new Room("107"),
        new Room("108", Direction.RIGHT),
        new Room("109", Direction.LEFT),
      ]),

      new Hallway([new Stairs(LEFT, onFloor("a", 2)), new Room("201")]),
    ]);

    expect(building.getDirections("102", "109")).toMatchInlineSnapshot(`
      "Turn right out of room 102
      Continue, then turn right (after passing the stairs on your left)
      Continue, then turn left into room 109"
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
        new Fork(FRONT, reverseConnection("fork1"), "the first hallway"),
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

  test("adding a Fork or Stairs doesn't affect the directions within a single hallway", () => {
    const b1 = new Building([
      // hallway 1
      new Hallway([
        new Room("11", RIGHT),
        new Room("12"),
        new Room("13"),
        new Room("14"),
      ]),
    ]);

    const b2 = new Building([
      // hallway 1
      new Hallway([
        new Room("11", RIGHT),
        new Room("12"),
        new Room("13"),
        new Room("14"),
        new Fork(LEFT, "fork1", "the second hallway"),
      ]),

      // hallway 2
      new Hallway([
        new Fork(FRONT, reverseConnection("fork1"), "the first hallway"),
        new Room("21"),
        new Room("22"),
      ]),
    ]);

    const b3 = new Building([
      // hallway 1
      new Hallway([
        new Stairs(RIGHT, onFloor("a", 1)),
        new Room("11", RIGHT),
        new Room("12"),
        new Room("13"),
        new Room("14"),
        new Stairs(LEFT, onFloor("b", 1)),
      ]),

      // hallway 2
      new Hallway([
        new Stairs(RIGHT, onFloor("a", 2)),
        new Room("21"),
        new Room("22"),
        new Stairs(LEFT, onFloor("b", 2)),
      ]),
    ]);

    expect(b1.getDirections("11", "13")).toEqual(b2.getDirections("11", "13"));
    expect(b1.getDirections("11", "13")).toEqual(b3.getDirections("11", "13"));
    expect(b1.getDirections("14", "11")).toEqual(b2.getDirections("14", "11"));
    expect(b1.getDirections("14", "11")).toEqual(b3.getDirections("14", "11"));
  });

  it("works with 2 forks", () => {
    type MyConnections = "hallway1_to_hallway2" | "hallway1_to_hallway3";

    const building = new Building<MyConnections>([
      // hallway 1
      new Hallway([
        new Fork(FRONT, "hallway1_to_hallway3", "the third hallway"),
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
      new Fork(FRONT, "fork1", "the 21s"),
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

  //TODO: finish
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

describe("accessibility", () => {
  test("example with elevators", () => {
    type MyForks = "fork1";
    type MyStairs = "stair-a" | "stair-b" | "elevator-a";

    const building = new Building<MyForks, MyStairs>([
      // hallway 11 (on 1st floor)
      new Hallway([
        new Stairs(LEFT, onFloor("stair-a", 1)),
        new Room("111"),
        new Room("112"),
        new Stairs(LEFT, onFloor("elevator-a", 1), "the elevator"),
      ]),

      // hallway 21 (on 2nd floor)
      new Hallway([
        new Stairs(LEFT, onFloor("stair-a", 2)),
        new Room("211"),
        new Room("212"),
        new Fork(RIGHT, reverseConnection("fork1"), "the 22s"),
        new Stairs(LEFT, onFloor("elevator-a", 2), "the elevator"),
      ]),

      // hallway 22 (on 2nd floor)
      new Hallway([
        new Room("221"),
        new Room("222"),
        new Stairs(LEFT, onFloor("stair-b", 2)),
        new Fork(FRONT, "fork1", "the 21s"),
      ]),

      // hallway 31 (on 3rd floor)
      new Hallway([
        new Room("311", RIGHT),
        new Stairs(LEFT, onFloor("stair-a", 3)),
        new Room("312"),
        new Stairs(LEFT, onFloor("elevator-a", 3), "the elevator"),
      ]),

      // hallway 32 (on 3rd floor)
      new Hallway([
        new Room("321"),
        new Stairs(LEFT, onFloor("stair-b", 3)),
        new Room("322"),
      ]),
    ]);

    const buildingNonAccessible = building.withAllowedConnectionTypes(
      s => !s.includes("elevator")
    );

    const buildingAccessible = building.withAllowedConnectionTypes(
      s => !s.includes("stair")
    );

    expect(buildingNonAccessible.getDirections("111", "312"))
      .toMatchInlineSnapshot(`
        "Turn right out of room 111
        Continue, then turn right into the stairs
        Go up 2 floors of stairs
        Turn left out of the stairs
        Continue, then turn left into room 312"
      `);

    expect(buildingAccessible.getDirections("111", "312"))
      .toMatchInlineSnapshot(`
        "Turn left out of room 111
        Continue, then turn left into the elevator
        Go to floor 3
        Turn right out of the elevator
        Continue, then turn right into room 312"
      `);

    expect(isValidBuilding(buildingNonAccessible)).toEqual(
      expect.objectContaining({ valid: true })
    );

    expect(isValidBuilding(buildingAccessible)).toEqual(
      expect.objectContaining({
        valid: false,
        reason:
          "The hallway at index 4 has no connector nodes (Forks or Stairs) to connect it to the rest of the building.",
      })
    );
  });
});

/*
describe("one-way hallways", () => {
  const hallway10 = [
    new Stairs(RIGHT, onFloor("b", 1)),
    new Room("101"),
    new Room("102"),
    new Room("103"),
    new Fork(RIGHT, "a", "the 11s"),
  ];
  const hallway11 = [
    new Fork(FRONT, reverseConnection("a"), "the 10s"),
    new Room("111"),
    new Room("112"),
    new Room("113"),
    new Stairs(RIGHT, onFloor("c", 1)),
  ];

  const hallway20 = [
    new Stairs(RIGHT, onFloor("b", 2)),
    new Room("201"),
    new Room("202"),
    new Room("203"),
    new Fork(RIGHT, "e", "the 11s"),
  ];
  const hallway21 = [
    new Fork(FRONT, reverseConnection("e"), "the 11s"),
    new Room("211"),
    new Room("212"),
    new Room("213"),
    new Stairs(RIGHT, onFloor("c", 2)),
  ];

  let controlAnswer: string | null;

  test("control case", () => {
    const building = new Building([
      new Hallway(hallway10),
      new Hallway(hallway11),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    assertValidBuilding(building);

    controlAnswer = building.getDirections("103", "111");

    expect(controlAnswer).toMatchInlineSnapshot(`
      "Turn left out of room 103
      Continue, then turn right into the 11s
      Continue, then turn left into room 111"
    `);
  });

  test("one-way hallway with same directions", () => {
    const building = new Building([
      new Hallway(hallway10, { oneWay: "forward" }),
      new Hallway(hallway11, { oneWay: "forward" }),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    assertValidBuilding(building);

    expect(building.getDirections("103", "111")).toBe(controlAnswer);
  });

  test("one-way hallway 1", () => {
    const building = new Building([
      new Hallway(hallway10, { oneWay: "backward" }),
      new Hallway(hallway11, { oneWay: "backward" }),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    assertValidBuilding(building);

    expect(building.getDirections("103", "111")).not.toBe(controlAnswer);

    expect(building.getDirections("103", "111")).toMatchInlineSnapshot(`
      "Turn right out of room 103
      Continue, then turn left into the stairs
      Go up 1 floor of stairs
      Turn right out of the stairs
      Continue, then turn right into the 11s
      Continue, then turn right into the stairs
      Go down 1 floor of stairs
      Turn left out of the stairs
      Continue, then turn right into room 111"
    `);
  });

  test("one-way hallway 2", () => {
    const building = new Building([
      new Hallway(hallway10, { oneWay: "backward" }),
      new Hallway(hallway11),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    assertValidBuilding(building);

    expect(building.getDirections("103", "111")).not.toBe(controlAnswer);

    expect(building.getDirections("103", "111")).toMatchInlineSnapshot(`
      "Turn right out of room 103
      Continue, then turn left into the stairs
      Go up 1 floor of stairs
      Turn right out of the stairs
      Continue, then turn right into the 11s
      Continue, then turn right into the stairs
      Go down 1 floor of stairs
      Turn left out of the stairs
      Continue, then turn right into room 111"
    `);
  });

  test("one-way hallway 3", () => {
    const building = new Building([
      new Hallway(hallway10, { oneWay: "backward" }),
      new Hallway(hallway11),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    assertValidBuilding(building);

    expect(building.getDirections("101", "103")).toMatchInlineSnapshot(`
      "Turn left out of room 101
      Continue, then turn left into room 103"
    `);

    fail("snapshot above is wrong");
  });

  test("unconnected one-way building 1", () => {
    const building = new Building([
      new Hallway(hallway10, { oneWay: "backward" }),
      new Hallway(hallway11, { oneWay: "forward" }),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    expect(isValidBuilding(building).valid).toBe(false);
  });
  test("unconnected one-way building 2", () => {
    const building = new Building([
      new Hallway(hallway10, { oneWay: "forward" }),
      new Hallway(hallway11, { oneWay: "backward" }),
      new Hallway(hallway20),
      new Hallway(hallway21),
    ]);
    expect(isValidBuilding(building).valid).toBe(false);
  });
});

describe("one-way connections", () => {});
*/

// TODO: add tests with SimpleHallway and rooms that are nodes
