// Core data model for floorplan editor

export interface Point {
  x: number;
  y: number;
}

export type Units = 'imperial' | 'metric';

export type RoomType =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living'
  | 'dining'
  | 'office'
  | 'hallway'
  | 'closet'
  | 'laundry'
  | 'garage'
  | 'other';

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // Default: 6 inches (in current units)
}

export interface Door {
  id: string;
  wallId: string;
  position: number; // 0-1 along wall length
  width: number; // Default: 32 inches
  swingDirection: 'left' | 'right';
  swingInward: boolean;
}

export interface Window {
  id: string;
  wallId: string;
  position: number; // 0-1 along wall length
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  wallIds: string[]; // References to walls that form this room
  color?: string; // Fill color for room
}

export interface FurnitureItem {
  id: string;
  type: string; // 'sofa', 'bed-queen', 'dining-table-6', etc.
  position: Point;
  rotation: number; // Degrees
  width: number;
  height: number;
  label?: string;
}

export interface Floorplan {
  id: string;
  name: string;
  units: Units;
  scale: number; // pixels per foot (imperial) or meter (metric)
  gridSize: number; // Grid cell size in current units (default: 1 foot)
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  furniture: FurnitureItem[];
  backgroundImage?: string; // Data URL or path for trace layer
}

// Default values based on interior-architect agent guidance
export const DEFAULTS = {
  wallThickness: 6, // inches
  doorWidth: 32, // inches
  windowWidth: 36, // inches
  windowHeight: 48, // inches
  gridSize: 12, // inches (1 foot)
  snapIncrement: 6, // inches
  scale: 10, // pixels per inch at 100% zoom
} as const;

// Standard furniture dimensions (width x depth in inches)
export const FURNITURE_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  'bed-twin': { width: 39, height: 75, label: 'Twin Bed' },
  'bed-full': { width: 54, height: 75, label: 'Full Bed' },
  'bed-queen': { width: 60, height: 80, label: 'Queen Bed' },
  'bed-king': { width: 76, height: 80, label: 'King Bed' },
  'sofa-2': { width: 60, height: 36, label: '2-Seat Sofa' },
  'sofa-3': { width: 84, height: 36, label: '3-Seat Sofa' },
  'dining-table-4': { width: 48, height: 36, label: 'Dining Table (4)' },
  'dining-table-6': { width: 72, height: 36, label: 'Dining Table (6)' },
  'desk': { width: 60, height: 30, label: 'Desk' },
  'chair': { width: 20, height: 20, label: 'Chair' },
  'armchair': { width: 32, height: 34, label: 'Armchair' },
  'coffee-table': { width: 48, height: 24, label: 'Coffee Table' },
  'nightstand': { width: 24, height: 18, label: 'Nightstand' },
  'dresser': { width: 60, height: 18, label: 'Dresser' },
  'toilet': { width: 18, height: 28, label: 'Toilet' },
  'sink-bathroom': { width: 24, height: 20, label: 'Bathroom Sink' },
  'bathtub': { width: 60, height: 32, label: 'Bathtub' },
  'shower': { width: 36, height: 36, label: 'Shower' },
  'sink-kitchen': { width: 33, height: 22, label: 'Kitchen Sink' },
  'stove': { width: 30, height: 26, label: 'Stove' },
  'refrigerator': { width: 36, height: 30, label: 'Refrigerator' },
  'dishwasher': { width: 24, height: 24, label: 'Dishwasher' },
} as const;

// Room type colors for visualization
export const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: '#E3F2FD',
  bathroom: '#E8F5E9',
  kitchen: '#FFF3E0',
  living: '#FCE4EC',
  dining: '#F3E5F5',
  office: '#E0F7FA',
  hallway: '#ECEFF1',
  closet: '#FFF8E1',
  laundry: '#E1F5FE',
  garage: '#EFEBE9',
  other: '#F5F5F5',
} as const;
