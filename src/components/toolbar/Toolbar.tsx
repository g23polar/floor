'use client';

import { useFloorplanStore } from '@/store/floorplan-store';
import { useUIStore, type Tool } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  tool: Tool;
  icon: string;
  label: string;
}

function ToolButton({ tool, icon, label }: ToolButtonProps) {
  const { activeTool, setActiveTool } = useUIStore();
  const isActive = activeTool === tool;

  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setActiveTool(tool)}
      className={cn('flex flex-col gap-1 h-auto py-2 px-3', isActive && 'bg-primary text-primary-foreground')}
      title={label}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs">{label}</span>
    </Button>
  );
}

export function Toolbar() {
  const { undo, redo, canUndo, canRedo } = useFloorplanStore();
  const { showGrid, toggleGrid, snapToGrid, toggleSnap, showDimensions, toggleDimensions, setZoom, zoom } =
    useUIStore();

  return (
    <div className="flex h-full flex-col border-r bg-white">
      {/* Tools Section */}
      <div className="flex flex-col gap-1 border-b p-2">
        <span className="mb-1 text-xs font-medium text-gray-500">Tools</span>
        <ToolButton tool="select" icon="↖" label="Select" />
        <ToolButton tool="pan" icon="✋" label="Pan" />
        <ToolButton tool="wall" icon="▬" label="Wall" />
        <ToolButton tool="door" icon="🚪" label="Door" />
        <ToolButton tool="window" icon="▢" label="Window" />
        <ToolButton tool="furniture" icon="🪑" label="Furniture" />
        <ToolButton tool="measure" icon="📏" label="Measure" />
      </div>

      {/* History Section */}
      <div className="flex flex-col gap-1 border-b p-2">
        <span className="mb-1 text-xs font-medium text-gray-500">History</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => undo()}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => redo()}
            disabled={!canRedo()}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </Button>
        </div>
      </div>

      {/* View Section */}
      <div className="flex flex-col gap-1 border-b p-2">
        <span className="mb-1 text-xs font-medium text-gray-500">View</span>
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleGrid}
          className="justify-start"
        >
          {showGrid ? '☑' : '☐'} Grid
        </Button>
        <Button
          variant={snapToGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleSnap}
          className="justify-start"
        >
          {snapToGrid ? '☑' : '☐'} Snap
        </Button>
        <Button
          variant={showDimensions ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleDimensions}
          className="justify-start"
        >
          {showDimensions ? '☑' : '☐'} Dimensions
        </Button>
      </div>

      {/* Zoom Section */}
      <div className="flex flex-col gap-1 p-2">
        <span className="mb-1 text-xs font-medium text-gray-500">Zoom</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoom(zoom - 0.1)}>
            −
          </Button>
          <span className="w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(zoom + 0.1)}>
            +
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="text-xs">
          Reset
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard Shortcuts Hint */}
      <div className="border-t p-2 text-xs text-gray-400">
        <div>V - Select</div>
        <div>H - Pan</div>
        <div>W - Wall</div>
        <div>Ctrl+Z - Undo</div>
      </div>
    </div>
  );
}
