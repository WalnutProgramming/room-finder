# room-finder

## Installation

### With `npm` or `yarn`

You can use `npm` or `yarn` to install `room-finder` for use on either the frontend or on the backend with Node.

```bash
yarn add room-finder
# OR
npm install room-finder
```

#### Importing with Node or CommonJS

```js
const { Building, Hallway, Room, Turn, Direction } = require("room-finder");

console.log(
  new Building([
    new Hallway([
      new Room("A", Direction.LEFT),
      new Room("B", Direction.RIGHT),
      new Turn(Direction.RIGHT),
      new Room("C", Direction.LEFT),
    ]),
  ]).getDirections("A", "C")
);
```

#### ES6 Imports (Recommended)

```js
import { Building, Hallway, Room, Turn, Direction } from "room-finder";

console.log(
  new Building([
    new Hallway([
      new Room("A", Direction.LEFT),
      new Room("B", Direction.RIGHT),
      new Turn(Direction.RIGHT),
      new Room("C", Direction.LEFT),
    ]),
  ]).getDirections("A", "C")
);
```

#### TypeScript

You can use the same same ES6 import syntax as above when using TypeScript. `room-finder` is written with TypeScript and ships with type definition files.

#### RequireJS (AMD)

```js
requirejs(["room-finder"], function(RoomFinder) {
  console.log(
    new RoomFinder.Building([
      new RoomFinder.Hallway([
        new RoomFinder.Room("A", RoomFinder.Direction.LEFT),
        new RoomFinder.Room("B", RoomFinder.Direction.RIGHT),
        new RoomFinder.Turn(RoomFinder.Direction.RIGHT),
        new RoomFinder.Room("C", RoomFinder.Direction.LEFT),
      ]),
    ]).getDirections("A", "C")
  );
});
```

### With `<script>` tag from CDN

You can also directly include `room-finder` with a `<script>` tag by either [downloading index.min.js](https://unpkg.com/room-finder) or using a CDN like [unpkg](https://unpkg.com/room-finder) or [jsDelivr](https://cdn.jsdelivr.net/npm/room-finder/dist/).

`RoomFinder` will be included as a global variable.

```html
<script src="https://unpkg.com/room-finder@0.0.3"></script>
<!-- OR with jsDelivr: -->
<!-- <script src="https://cdn.jsdelivr.net/npm/room-finder@0.0.3/dist/index.min.js"></script> -->
<script>
  console.log(
    new RoomFinder.Building([
      new RoomFinder.Hallway([
        new RoomFinder.Room("A", RoomFinder.Direction.LEFT),
        new RoomFinder.Room("B", RoomFinder.Direction.RIGHT),
        new RoomFinder.Turn(RoomFinder.Direction.RIGHT),
        new RoomFinder.Room("C", RoomFinder.Direction.LEFT),
      ]),
    ]).getDirections("A", "C")
  );
</script>
```

The version number in the URL isn't required, but it's recommended so that breaking changes in the package don't break your app.
