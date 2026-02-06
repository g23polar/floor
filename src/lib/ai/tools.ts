import { z } from 'zod';

// Tool definitions for the AI to manipulate the floorplan
export const floorplanTools = {
  addWall: {
    description: 'Add a wall to the floorplan. Coordinates are in inches from the top-left origin.',
    parameters: z.object({
      startX: z.number().describe('X coordinate of wall start point in inches'),
      startY: z.number().describe('Y coordinate of wall start point in inches'),
      endX: z.number().describe('X coordinate of wall end point in inches'),
      endY: z.number().describe('Y coordinate of wall end point in inches'),
      thickness: z.number().optional().describe('Wall thickness in inches (default: 6)'),
    }),
  },

  removeWall: {
    description: 'Remove a wall by its ID',
    parameters: z.object({
      wallId: z.string().describe('The ID of the wall to remove'),
    }),
  },

  addDoor: {
    description: 'Add a door to an existing wall',
    parameters: z.object({
      wallId: z.string().describe('The ID of the wall to add the door to'),
      position: z.number().min(0).max(1).describe('Position along the wall (0-1, where 0.5 is center)'),
      width: z.number().optional().describe('Door width in inches (default: 32)'),
      swingDirection: z.enum(['left', 'right']).optional().describe('Direction the door swings'),
    }),
  },

  addWindow: {
    description: 'Add a window to an existing wall',
    parameters: z.object({
      wallId: z.string().describe('The ID of the wall to add the window to'),
      position: z.number().min(0).max(1).describe('Position along the wall (0-1)'),
      width: z.number().optional().describe('Window width in inches (default: 36)'),
      height: z.number().optional().describe('Window height in inches (default: 48)'),
    }),
  },

  addFurniture: {
    description: 'Add furniture to the floorplan',
    parameters: z.object({
      type: z.enum([
        'bed-twin', 'bed-full', 'bed-queen', 'bed-king',
        'sofa-2', 'sofa-3',
        'dining-table-4', 'dining-table-6',
        'desk', 'chair', 'armchair',
        'coffee-table', 'nightstand', 'dresser',
        'toilet', 'sink-bathroom', 'bathtub', 'shower',
        'sink-kitchen', 'stove', 'refrigerator', 'dishwasher',
      ]).describe('Type of furniture to add'),
      x: z.number().describe('X position in inches from left'),
      y: z.number().describe('Y position in inches from top'),
      rotation: z.number().optional().describe('Rotation in degrees (default: 0)'),
    }),
  },

  moveFurniture: {
    description: 'Move existing furniture to a new position',
    parameters: z.object({
      furnitureId: z.string().describe('The ID of the furniture to move'),
      x: z.number().describe('New X position in inches'),
      y: z.number().describe('New Y position in inches'),
    }),
  },

  rotateFurniture: {
    description: 'Rotate existing furniture',
    parameters: z.object({
      furnitureId: z.string().describe('The ID of the furniture to rotate'),
      rotation: z.number().describe('New rotation in degrees'),
    }),
  },

  removeFurniture: {
    description: 'Remove furniture by its ID',
    parameters: z.object({
      furnitureId: z.string().describe('The ID of the furniture to remove'),
    }),
  },

  addRoom: {
    description: 'Label a set of walls as a room',
    parameters: z.object({
      name: z.string().describe('Name of the room (e.g., "Master Bedroom")'),
      type: z.enum([
        'bedroom', 'bathroom', 'kitchen', 'living', 'dining',
        'office', 'hallway', 'closet', 'laundry', 'garage', 'other'
      ]).describe('Type of room'),
      wallIds: z.array(z.string()).describe('IDs of walls that form this room'),
    }),
  },

  clearAll: {
    description: 'Clear the entire floorplan (use with caution)',
    parameters: z.object({
      confirm: z.boolean().describe('Must be true to confirm clearing'),
    }),
  },
};

// Type for tool call results returned to client
export interface ToolCall {
  tool: keyof typeof floorplanTools;
  args: Record<string, unknown>;
}

// Generate floorplan context for the system prompt
export function generateFloorplanContext(floorplan: {
  walls: Array<{ id: string; start: { x: number; y: number }; end: { x: number; y: number }; thickness: number }>;
  doors: Array<{ id: string; wallId: string; position: number; width: number }>;
  windows: Array<{ id: string; wallId: string; position: number; width: number }>;
  furniture: Array<{ id: string; type: string; position: { x: number; y: number }; rotation: number; width: number; height: number }>;
  rooms: Array<{ id: string; name: string; type: string; wallIds: string[] }>;
}): string {
  const lines: string[] = ['Current floorplan state:'];

  if (floorplan.walls.length === 0) {
    lines.push('- No walls (empty floorplan)');
  } else {
    lines.push(`\nWalls (${floorplan.walls.length}):`);
    floorplan.walls.forEach((wall, i) => {
      const length = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
      );
      lines.push(`  ${i + 1}. ID: ${wall.id}, from (${wall.start.x}", ${wall.start.y}") to (${wall.end.x}", ${wall.end.y}"), length: ${Math.round(length)}", thickness: ${wall.thickness}"`);
    });
  }

  if (floorplan.doors.length > 0) {
    lines.push(`\nDoors (${floorplan.doors.length}):`);
    floorplan.doors.forEach((door, i) => {
      lines.push(`  ${i + 1}. ID: ${door.id}, on wall ${door.wallId}, position: ${(door.position * 100).toFixed(0)}%, width: ${door.width}"`);
    });
  }

  if (floorplan.windows.length > 0) {
    lines.push(`\nWindows (${floorplan.windows.length}):`);
    floorplan.windows.forEach((window, i) => {
      lines.push(`  ${i + 1}. ID: ${window.id}, on wall ${window.wallId}, position: ${(window.position * 100).toFixed(0)}%, width: ${window.width}"`);
    });
  }

  if (floorplan.furniture.length > 0) {
    lines.push(`\nFurniture (${floorplan.furniture.length}):`);
    floorplan.furniture.forEach((item, i) => {
      lines.push(`  ${i + 1}. ID: ${item.id}, type: ${item.type}, at (${item.position.x}", ${item.position.y}"), ${item.width}"x${item.height}", rotation: ${item.rotation}°`);
    });
  }

  if (floorplan.rooms.length > 0) {
    lines.push(`\nRooms (${floorplan.rooms.length}):`);
    floorplan.rooms.forEach((room, i) => {
      lines.push(`  ${i + 1}. "${room.name}" (${room.type}), walls: [${room.wallIds.join(', ')}]`);
    });
  }

  return lines.join('\n');
}
