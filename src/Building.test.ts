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
