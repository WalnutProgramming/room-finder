import {
  Building,
  Hallway,
  Room,
  Direction,
  Turn,
  assertValidBuilding,
} from "room-finder";

const building = new Building([
  new Hallway([
    new Room("102", Direction.RIGHT),
    new Room("103", Direction.LEFT),
    new Room("104", Direction.RIGHT),
    new Room("105", Direction.LEFT),
    // All we have to do is add a Turn in the middle of the Hallway.
    new Turn(Direction.RIGHT),
    new Room("106", Direction.RIGHT),
    new Room("107"),
    new Room("108", Direction.RIGHT),
    new Room("109", Direction.LEFT),
  ]),
]);

assertValidBuilding(building);

console.log(building.getDirections("102", "109"));
// Turn right out of room 102
// Continue, then turn right (after passing room 105 on your left)
// Continue, then turn left into room 109

console.log(building.getDirections("107", "103"));
// Turn right out of room 107
// Continue, then turn left (after passing room 106 on your left)
// Continue, then turn right into room 103
