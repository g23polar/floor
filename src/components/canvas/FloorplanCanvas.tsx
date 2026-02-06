'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useFabric } from '@/hooks/useFabric';
import { useFloorplanStore } from '@/store/floorplan-store';
import { useUIStore } from '@/store/ui-store';
import { DEFAULTS } from '@/types/floorplan';
import type { Point } from '@/types/floorplan';

export function FloorplanCanvas() {
  const {
    canvasRef,
    fabricRef,
    initCanvas,
    handleResize,
    drawGrid,
    snapToGridPoint,
  } = useFabric({
    onSelectionChange: (ids) => {
      setSelectedIds(ids);
    },
    onObjectModified: (id, updates) => {
      // Sync modifications back to store
      // This will be expanded for each object type
      console.log('Object modified:', id, updates);
    },
  });

  const { present: floorplan, addWall } = useFloorplanStore();
  const {
    activeTool,
    setSelectedIds,
    showGrid,
    snapToGrid,
    zoom,
  } = useUIStore();

  // Drawing state for wall tool
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<Point | null>(null);
  const previewLineRef = useRef<fabric.Line | null>(null);

  // Initialize canvas on mount
  useEffect(() => {
    // Wait for next frame to ensure container has dimensions
    const timeoutId = setTimeout(() => {
      const canvas = initCanvas();
      if (!canvas) return;

      handleResize();
      drawGrid();
    }, 0);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
      drawGrid();
    });

    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [initCanvas, handleResize, drawGrid, canvasRef]);

  // Redraw grid when visibility or zoom changes
  useEffect(() => {
    drawGrid();
  }, [showGrid, zoom, drawGrid]);

  // Sync floorplan state to canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Clear non-grid objects
    const nonGridObjects = canvas.getObjects().filter((obj) => !obj.get('isGrid'));
    nonGridObjects.forEach((obj) => canvas.remove(obj));

    // Render walls using Line with strokeWidth for consistent thickness
    floorplan.walls.forEach((wall) => {
      const startX = wall.start.x * DEFAULTS.scale;
      const startY = wall.start.y * DEFAULTS.scale;
      const endX = wall.end.x * DEFAULTS.scale;
      const endY = wall.end.y * DEFAULTS.scale;
      const scaledThickness = wall.thickness * DEFAULTS.scale;

      const line = new fabric.Line([startX, startY, endX, endY], {
        stroke: '#4a4a4a',
        strokeWidth: scaledThickness,
        strokeLineCap: 'square',
        selectable: true,
        hasControls: true,
        hasBorders: true,
      });

      line.set('id', wall.id);
      line.set('objectType', 'wall');
      canvas.add(line);
    });

    // Render furniture
    floorplan.furniture.forEach((item) => {
      const x = item.position.x * DEFAULTS.scale;
      const y = item.position.y * DEFAULTS.scale;
      const width = item.width * DEFAULTS.scale;
      const height = item.height * DEFAULTS.scale;

      const rect = new fabric.Rect({
        left: x,
        top: y,
        width: width,
        height: height,
        fill: '#e8e8e8',
        stroke: '#888888',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        angle: item.rotation,
      });

      rect.set('id', item.id);
      rect.set('objectType', 'furniture');
      canvas.add(rect);
    });

    canvas.renderAll();
  }, [floorplan, fabricRef]);

  // Handle wall drawing
  const handleMouseDown = useCallback(
    (e: fabric.TPointerEventInfo) => {
      if (activeTool !== 'wall') return;
      const canvas = fabricRef.current;
      if (!canvas) return;

      const pointer = canvas.getViewportPoint(e.e as MouseEvent);
      const snapped = snapToGrid
        ? snapToGridPoint(pointer.x, pointer.y)
        : { x: pointer.x, y: pointer.y };

      drawStartRef.current = snapped;
      setIsDrawing(true);

      // Create preview line
      const line = new fabric.Line([snapped.x, snapped.y, snapped.x, snapped.y], {
        stroke: '#666666',
        strokeWidth: DEFAULTS.wallThickness * DEFAULTS.scale,
        strokeLineCap: 'square',
        selectable: false,
        evented: false,
      });
      line.set('isPreview', true);
      previewLineRef.current = line;
      canvas.add(line);
    },
    [activeTool, snapToGrid, snapToGridPoint, fabricRef]
  );

  const handleMouseMove = useCallback(
    (e: fabric.TPointerEventInfo) => {
      if (!isDrawing || activeTool !== 'wall') return;
      const canvas = fabricRef.current;
      if (!canvas || !previewLineRef.current || !drawStartRef.current) return;

      const pointer = canvas.getViewportPoint(e.e as MouseEvent);
      const snapped = snapToGrid
        ? snapToGridPoint(pointer.x, pointer.y)
        : { x: pointer.x, y: pointer.y };

      previewLineRef.current.set({
        x2: snapped.x,
        y2: snapped.y,
      });
      canvas.renderAll();
    },
    [isDrawing, activeTool, snapToGrid, snapToGridPoint, fabricRef]
  );

  const handleMouseUp = useCallback(
    (e: fabric.TPointerEventInfo) => {
      if (!isDrawing || activeTool !== 'wall') return;
      const canvas = fabricRef.current;
      if (!canvas || !drawStartRef.current) return;

      const pointer = canvas.getViewportPoint(e.e as MouseEvent);
      const snapped = snapToGrid
        ? snapToGridPoint(pointer.x, pointer.y)
        : { x: pointer.x, y: pointer.y };

      // Remove preview line
      if (previewLineRef.current) {
        canvas.remove(previewLineRef.current);
        previewLineRef.current = null;
      }

      // Only add wall if there's actual length
      const dx = snapped.x - drawStartRef.current.x;
      const dy = snapped.y - drawStartRef.current.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        // Minimum length threshold
        addWall(
          {
            x: drawStartRef.current.x / DEFAULTS.scale,
            y: drawStartRef.current.y / DEFAULTS.scale,
          },
          {
            x: snapped.x / DEFAULTS.scale,
            y: snapped.y / DEFAULTS.scale,
          }
        );
      }

      setIsDrawing(false);
      drawStartRef.current = null;
    },
    [isDrawing, activeTool, snapToGrid, snapToGridPoint, addWall, fabricRef]
  );

  // Attach mouse handlers
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, fabricRef]);

  // Update cursor based on tool
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    switch (activeTool) {
      case 'select':
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.selection = true;
        break;
      case 'pan':
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        canvas.selection = false;
        break;
      case 'wall':
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        canvas.selection = false;
        break;
      default:
        canvas.defaultCursor = 'default';
        canvas.selection = true;
    }
  }, [activeTool, fabricRef]);

  return (
    <div className="relative overflow-hidden bg-gray-100" style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 rounded bg-white/80 px-2 py-1 text-sm text-gray-600 shadow">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
