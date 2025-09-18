"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, RectangleHorizontal, Square, Expand, Trash2 } from 'lucide-react';

type DrawingMode = 'line' | 'rectangle' | 'square' | 'none';
type Point = { x: number; y: number };
type Shape = {
  type: DrawingMode;
  start: Point;
  end: Point;
};

const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);

  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'none') return;
    setIsDrawing(true);
    const point = getCanvasCoordinates(event);
    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const point = getCanvasCoordinates(event);
    setCurrentPoint(point);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) return;
    
    let newShape: Shape = { type: drawingMode, start: startPoint, end: currentPoint };

    if (drawingMode === 'square') {
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;
        const side = Math.max(Math.abs(width), Math.abs(height));
        newShape.end = {
            x: startPoint.x + (width > 0 ? side : -side),
            y: startPoint.y + (height > 0 ? side : -side)
        };
    }

    setShapes([...shapes, newShape]);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };
  
  const selectWholeArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wholeAreaShape: Shape = {
        type: 'rectangle',
        start: { x: 0, y: 0 },
        end: { x: canvas.width, y: canvas.height }
    };
    setShapes([...shapes, wholeAreaShape]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';

    shapes.forEach(shape => {
      drawShape(ctx, shape);
    });

    if (isDrawing && startPoint && currentPoint) {
      let previewShape: Shape = { type: drawingMode, start: startPoint, end: currentPoint };
      if (drawingMode === 'square') {
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;
        const side = Math.max(Math.abs(width), Math.abs(height));
        previewShape.end = {
            x: startPoint.x + (width > 0 ? side : -side),
            y: startPoint.y + (height > 0 ? side : -side)
        };
      }
      drawShape(ctx, previewShape);
    }
  }, [shapes, isDrawing, startPoint, currentPoint, drawingMode]);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.beginPath();
    const { type, start, end } = shape;
    switch (type) {
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case 'rectangle':
      case 'square':
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
        ctx.fillRect(start.x, start.y, width, height);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant={drawingMode === 'line' ? 'secondary' : 'outline'} onClick={() => setDrawingMode('line')}>
          <Minus className="mr-2 h-4 w-4" /> Line
        </Button>
        <Button variant={drawingMode === 'rectangle' ? 'secondary' : 'outline'} onClick={() => setDrawingMode('rectangle')}>
          <RectangleHorizontal className="mr-2 h-4 w-4" /> Rectangle
        </Button>
        <Button variant={drawingMode === 'square' ? 'secondary' : 'outline'} onClick={() => setDrawingMode('square')}>
          <Square className="mr-2 h-4 w-4" /> Square
        </Button>
        <Button variant="outline" onClick={selectWholeArea}>
          <Expand className="mr-2 h-4 w-4" /> Whole Area
        </Button>
        <Button variant="destructive" onClick={() => setShapes([])}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width="1065"
        height="599"
        className="border border-gray-400 rounded-md max-w-full h-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default DrawingCanvas;