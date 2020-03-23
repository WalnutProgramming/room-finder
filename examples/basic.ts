import {
  Building,
  Hallway,
  Room,
  Direction,
  assertValidBuilding,
} from "room-finder";

/* 1. MODEL THE BUILDING */
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

// A Building has an array of Hallways. In this case, there's only one Hallway in the Building.
const building = new Building([hallway]);

/* 2. CHECK BUILDING VALIDITY */
// The assertValidBuilding function throws an error
// if there is a problem with the generated Building.
assertValidBuilding(building);

/* 3. GENERATE DIRECTIONS BETWEEN ROOMS */
console.log(building.getDirections("102", "109"));
// output:
//   Turn right out of room 102
//   Continue, then turn left into room 109

console.log(building.getDirections("107", "103"));
// output:
//   Turn right out of room 107
//   Continue, then turn right into room 103
