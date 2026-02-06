import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Floorplan,
  Wall,
  Door,
  Window,
  Room,
  FurnitureItem,
  Point,
} from '@/types/floorplan';
import { DEFAULTS } from '@/types/floorplan';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create empty floorplan
function createEmptyFloorplan(): Floorplan {
  return {
    id: generateId(),
    name: 'Untitled Floorplan',
    units: 'imperial',
    scale: DEFAULTS.scale,
    gridSize: DEFAULTS.gridSize,
    walls: [],
    doors: [],
    windows: [],
    rooms: [],
    furniture: [],
  };
}

interface HistoryState {
  past: Floorplan[];
  present: Floorplan;
  future: Floorplan[];
}

interface FloorplanState extends HistoryState {
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Floorplan actions
  setFloorplan: (floorplan: Floorplan) => void;
  resetFloorplan: () => void;
  setName: (name: string) => void;
  setUnits: (units: 'imperial' | 'metric') => void;
  setBackgroundImage: (imageData: string | undefined) => void;

  // Wall actions
  addWall: (start: Point, end: Point, thickness?: number) => string;
  updateWall: (id: string, updates: Partial<Omit<Wall, 'id'>>) => void;
  removeWall: (id: string) => void;

  // Door actions
  addDoor: (wallId: string, position: number, width?: number) => string;
  updateDoor: (id: string, updates: Partial<Omit<Door, 'id'>>) => void;
  removeDoor: (id: string) => void;

  // Window actions
  addWindow: (wallId: string, position: number, width?: number, height?: number) => string;
  updateWindow: (id: string, updates: Partial<Omit<Window, 'id'>>) => void;
  removeWindow: (id: string) => void;

  // Room actions
  addRoom: (name: string, type: Room['type'], wallIds: string[]) => string;
  updateRoom: (id: string, updates: Partial<Omit<Room, 'id'>>) => void;
  removeRoom: (id: string) => void;

  // Furniture actions
  addFurniture: (type: string, position: Point, width: number, height: number) => string;
  updateFurniture: (id: string, updates: Partial<Omit<FurnitureItem, 'id'>>) => void;
  removeFurniture: (id: string) => void;

  // Bulk operations
  removeSelected: (ids: string[]) => void;
}

const MAX_HISTORY = 50;

// Helper to push state to history
function pushToHistory(state: HistoryState): HistoryState {
  const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
  return {
    past: newPast,
    present: state.present,
    future: [],
  };
}

export const useFloorplanStore = create<FloorplanState>()(
  immer((set, get) => ({
    past: [],
    present: createEmptyFloorplan(),
    future: [],

    // History
    undo: () => {
      set((state) => {
        if (state.past.length === 0) return;
        const previous = state.past[state.past.length - 1];
        state.past = state.past.slice(0, -1);
        state.future = [state.present, ...state.future];
        state.present = previous;
      });
    },

    redo: () => {
      set((state) => {
        if (state.future.length === 0) return;
        const next = state.future[0];
        state.past = [...state.past, state.present];
        state.future = state.future.slice(1);
        state.present = next;
      });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    // Floorplan
    setFloorplan: (floorplan) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present = floorplan;
      });
    },

    resetFloorplan: () => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present = createEmptyFloorplan();
      });
    },

    setName: (name) => {
      set((state) => {
        state.present.name = name;
      });
    },

    setUnits: (units) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.units = units;
      });
    },

    setBackgroundImage: (imageData) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.backgroundImage = imageData;
      });
    },

    // Walls
    addWall: (start, end, thickness = DEFAULTS.wallThickness) => {
      const id = generateId();
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.walls.push({ id, start, end, thickness });
      });
      return id;
    },

    updateWall: (id, updates) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        const wall = state.present.walls.find((w) => w.id === id);
        if (wall) Object.assign(wall, updates);
      });
    },

    removeWall: (id) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.walls = state.present.walls.filter((w) => w.id !== id);
        // Also remove doors and windows on this wall
        state.present.doors = state.present.doors.filter((d) => d.wallId !== id);
        state.present.windows = state.present.windows.filter((w) => w.wallId !== id);
      });
    },

    // Doors
    addDoor: (wallId, position, width = DEFAULTS.doorWidth) => {
      const id = generateId();
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.doors.push({
          id,
          wallId,
          position,
          width,
          swingDirection: 'left',
          swingInward: true,
        });
      });
      return id;
    },

    updateDoor: (id, updates) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        const door = state.present.doors.find((d) => d.id === id);
        if (door) Object.assign(door, updates);
      });
    },

    removeDoor: (id) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.doors = state.present.doors.filter((d) => d.id !== id);
      });
    },

    // Windows
    addWindow: (wallId, position, width = DEFAULTS.windowWidth, height = DEFAULTS.windowHeight) => {
      const id = generateId();
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.windows.push({ id, wallId, position, width, height });
      });
      return id;
    },

    updateWindow: (id, updates) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        const window = state.present.windows.find((w) => w.id === id);
        if (window) Object.assign(window, updates);
      });
    },

    removeWindow: (id) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.windows = state.present.windows.filter((w) => w.id !== id);
      });
    },

    // Rooms
    addRoom: (name, type, wallIds) => {
      const id = generateId();
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.rooms.push({ id, name, type, wallIds });
      });
      return id;
    },

    updateRoom: (id, updates) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        const room = state.present.rooms.find((r) => r.id === id);
        if (room) Object.assign(room, updates);
      });
    },

    removeRoom: (id) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.rooms = state.present.rooms.filter((r) => r.id !== id);
      });
    },

    // Furniture
    addFurniture: (type, position, width, height) => {
      const id = generateId();
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.furniture.push({ id, type, position, width, height, rotation: 0 });
      });
      return id;
    },

    updateFurniture: (id, updates) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        const item = state.present.furniture.find((f) => f.id === id);
        if (item) Object.assign(item, updates);
      });
    },

    removeFurniture: (id) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.furniture = state.present.furniture.filter((f) => f.id !== id);
      });
    },

    // Bulk
    removeSelected: (ids) => {
      set((state) => {
        Object.assign(state, pushToHistory(state));
        state.present.walls = state.present.walls.filter((w) => !ids.includes(w.id));
        state.present.doors = state.present.doors.filter((d) => !ids.includes(d.id));
        state.present.windows = state.present.windows.filter((w) => !ids.includes(w.id));
        state.present.furniture = state.present.furniture.filter((f) => !ids.includes(f.id));
        state.present.rooms = state.present.rooms.filter((r) => !ids.includes(r.id));
      });
    },
  }))
);
