'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { useUIStore } from '@/store/ui-store';
import { DEFAULTS } from '@/types/floorplan';

interface UseFabricOptions {
  onSelectionChange?: (ids: string[]) => void;
  onObjectModified?: (id: string, updates: Record<string, unknown>) => void;
}

export function useFabric(options: UseFabricOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const { zoom, setZoom, panOffset, setPanOffset, showGrid, snapToGrid } = useUIStore();

  // Initialize canvas
  const initCanvas = useCallback(() => {
    if (!canvasRef.current || fabricRef.current) return;

    // Get container dimensions for initial sizing
    const container = canvasRef.current.parentElement;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      width,
      height,
    });

    fabricRef.current = canvas;

    // Handle selection changes
    canvas.on('selection:created', (e) => {
      const ids = e.selected?.map((obj) => obj.get('id') as string).filter(Boolean) || [];
      options.onSelectionChange?.(ids);
    });

    canvas.on('selection:updated', (e) => {
      const ids = e.selected?.map((obj) => obj.get('id') as string).filter(Boolean) || [];
      options.onSelectionChange?.(ids);
    });

    canvas.on('selection:cleared', () => {
      options.onSelectionChange?.([]);
    });

    // Handle object modifications
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
      const id = obj.get('id') as string;
      if (!id) return;

      options.onObjectModified?.(id, {
        left: obj.left,
        top: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        angle: obj.angle,
      });
    });

    // Zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (1 - delta / 500);
      newZoom = Math.max(0.1, Math.min(5, newZoom));

      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(point, newZoom);
      setZoom(newZoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return canvas;
  }, [options, setZoom]);

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Skip if dimensions are 0 (container not yet rendered)
    if (width === 0 || height === 0) return;

    if (canvas) {
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    }
  }, []);

  // Draw grid
  const drawGrid = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove existing grid
    const existingGrid = canvas.getObjects().filter((obj) => obj.get('isGrid'));
    existingGrid.forEach((obj) => canvas.remove(obj));

    if (!showGrid) {
      canvas.renderAll();
      return;
    }

    const gridSize = DEFAULTS.gridSize * DEFAULTS.scale; // 1 foot at current scale
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // Skip if canvas not sized yet
    if (width === 0 || height === 0) return;

    // Draw grid covering entire canvas plus buffer for panning
    const buffer = gridSize * 10; // Extra buffer for panning
    const startX = -buffer;
    const startY = -buffer;
    const endX = width + buffer;
    const endY = height + buffer;

    // Vertical lines
    for (let x = 0; x <= endX; x += gridSize) {
      const line = new fabric.Line([x, startY, x, endY], {
        stroke: '#d0d0d0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      line.set('isGrid', true);
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    // Horizontal lines
    for (let y = 0; y <= endY; y += gridSize) {
      const line = new fabric.Line([startX, y, endX, y], {
        stroke: '#d0d0d0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      line.set('isGrid', true);
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    canvas.renderAll();
  }, [showGrid]);

  // Snap point to grid
  const snapToGridPoint = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      if (!snapToGrid) return { x, y };

      const snapSize = DEFAULTS.snapIncrement * DEFAULTS.scale;
      return {
        x: Math.round(x / snapSize) * snapSize,
        y: Math.round(y / snapSize) * snapSize,
      };
    },
    [snapToGrid]
  );

  // Add wall to canvas
  const addWallToCanvas = useCallback(
    (
      id: string,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      thickness: number
    ) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const scaledThickness = thickness * DEFAULTS.scale;

      // Calculate wall as a rectangle rotated to match line angle
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const wall = new fabric.Rect({
        left: startX,
        top: startY - scaledThickness / 2,
        width: length,
        height: scaledThickness,
        fill: '#333333',
        stroke: '#000000',
        strokeWidth: 1,
        angle: angle,
        originX: 'left',
        originY: 'center',
      });

      wall.set('id', id);
      wall.set('objectType', 'wall');

      canvas.add(wall);
      canvas.renderAll();
    },
    []
  );

  // Add furniture to canvas
  const addFurnitureToCanvas = useCallback(
    (id: string, x: number, y: number, width: number, height: number, label?: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const scaledWidth = width * DEFAULTS.scale;
      const scaledHeight = height * DEFAULTS.scale;

      const furniture = new fabric.Rect({
        left: x,
        top: y,
        width: scaledWidth,
        height: scaledHeight,
        fill: '#f5f5f5',
        stroke: '#666666',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      });

      furniture.set('id', id);
      furniture.set('objectType', 'furniture');

      if (label) {
        const text = new fabric.Text(label, {
          fontSize: 12,
          fill: '#333333',
          originX: 'center',
          originY: 'center',
        });

        const group = new fabric.Group([furniture, text], {
          left: x,
          top: y,
        });
        group.set('id', id);
        group.set('objectType', 'furniture');

        canvas.add(group);
      } else {
        canvas.add(furniture);
      }

      canvas.renderAll();
    },
    []
  );

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const nonGridObjects = canvas.getObjects().filter((obj) => !obj.get('isGrid'));
    nonGridObjects.forEach((obj) => canvas.remove(obj));
    canvas.renderAll();
  }, []);

  // Get canvas instance
  const getCanvas = useCallback(() => fabricRef.current, []);

  // Cleanup
  useEffect(() => {
    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Update grid when showGrid changes
  useEffect(() => {
    drawGrid();
  }, [showGrid, drawGrid]);

  return {
    canvasRef,
    fabricRef,
    initCanvas,
    handleResize,
    drawGrid,
    snapToGridPoint,
    addWallToCanvas,
    addFurnitureToCanvas,
    clearCanvas,
    getCanvas,
    zoom,
    panOffset,
  };
}
