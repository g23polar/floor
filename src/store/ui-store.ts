import { create } from 'zustand';

export type Tool =
  | 'select'
  | 'pan'
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'furniture'
  | 'measure';

export type Panel = 'properties' | 'furniture' | 'layers' | 'chat';

interface UIState {
  // Tool state
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Selection state
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;

  // Panel state
  openPanels: Panel[];
  togglePanel: (panel: Panel) => void;
  openPanel: (panel: Panel) => void;
  closePanel: (panel: Panel) => void;

  // Canvas state
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;

  // Grid state
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnap: () => void;

  // Dimensions display
  showDimensions: boolean;
  toggleDimensions: () => void;

  // Furniture placement
  selectedFurnitureType: string | null;
  setSelectedFurnitureType: (type: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Tool
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Selection
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  addToSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id],
    })),
  removeFromSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((i) => i !== id),
    })),
  clearSelection: () => set({ selectedIds: [] }),

  // Panels
  openPanels: ['properties'],
  togglePanel: (panel) =>
    set((state) => ({
      openPanels: state.openPanels.includes(panel)
        ? state.openPanels.filter((p) => p !== panel)
        : [...state.openPanels, panel],
    })),
  openPanel: (panel) =>
    set((state) => ({
      openPanels: state.openPanels.includes(panel)
        ? state.openPanels
        : [...state.openPanels, panel],
    })),
  closePanel: (panel) =>
    set((state) => ({
      openPanels: state.openPanels.filter((p) => p !== panel),
    })),

  // Canvas
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  panOffset: { x: 0, y: 0 },
  setPanOffset: (offset) => set({ panOffset: offset }),

  // Grid (defaults based on interior-architect recommendations)
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  snapToGrid: true,
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  // Dimensions
  showDimensions: true,
  toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),

  // Furniture
  selectedFurnitureType: null,
  setSelectedFurnitureType: (type) => set({ selectedFurnitureType: type }),
}));
