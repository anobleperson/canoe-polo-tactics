import { PITCH } from './pitch.js';

export const BOAT = { length: 3, width: 0.75 };
export const PLAYERS_PER_TEAM = 5;
export const TEAMS = ['a', 'b'];

// Board state is plain JSON-serialisable data, in pitch metres.
// Angles are degrees; 0 points the bow towards +x (the right-hand goal).
//
// {
//   court: 'full' | 'half',
//   pieces: [{ id, team, number, x, y, angle }],
//   ball: { x, y }
// }

export function startingState(court = 'full') {
  const { length: L, width: W } = PITCH;
  const inset = BOAT.length / 2 + 0.3;
  // Full court: teams on their own goal lines.
  // Half court: team A on the halfway line, team B on the goal line.
  const leftX = court === 'half' ? L / 2 + inset : inset;
  const rightX = L - inset;

  const pieces = [];
  for (const team of TEAMS) {
    for (let i = 0; i < PLAYERS_PER_TEAM; i++) {
      pieces.push({
        id: `${team}${i + 1}`,
        team,
        number: i + 1,
        x: team === 'a' ? leftX : rightX,
        y: (W * (i + 1)) / (PLAYERS_PER_TEAM + 1),
        angle: team === 'a' ? 0 : 180,
      });
    }
  }
  return { court, pieces, ball: { x: (leftX + rightX) / 2, y: W / 2 } };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function sameState(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
