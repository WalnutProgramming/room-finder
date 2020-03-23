/**
 * A direction can be `LEFT` or `RIGHT`, or if you're
 * at the end of a hallway, it can be `FRONT`.
 *
 * You can refer to these directions as `Direction.LEFT` or
 * `Direction.RIGHT`, for example, but it may be easier to do
 * this if you're using them a lot:
 * ```ts
 * const { LEFT, RIGHT, FRONT } = Direction;
 * console.log(LEFT);
 * console.log(RIGHT);
 * ```
 */

enum Direction {
  LEFT = -1,
  RIGHT = 1,
  FRONT = 2,
}

/**
 * @param dir - A direction (LEFT,RIGHT,FRONT)
 * @returns "left", "right", "front", or "back"
 */
function dirToString(dir: Direction): string {
  if (dir === Direction.LEFT) return "left";
  else if (dir === Direction.RIGHT) return "right";
  else return "front";
}

/**
 * @param dir - A direction (LEFT,RIGHT,FRONT)
 * @param lowercase - Should the result start with a lowercase letter?
 * @returns "Go straight", "Turn left", or "Turn right"
 */
function dirToTurnString(dir: Direction): string {
  if (isLeftOrRight(dir)) {
    return "turn " + dirToString(dir);
  } else {
    return "go straight";
  }
}

function isLeftOrRight(dir: Direction): boolean {
  return dir === Direction.LEFT || dir === Direction.RIGHT;
}

export { Direction, dirToString, dirToTurnString, isLeftOrRight };
