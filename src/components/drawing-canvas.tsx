"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, RectangleHorizontal, Square, Expand, Trash2, Send } from 'lucide-react';
import { toast } from "sonner";
import Hls from "hls.js";

type DrawingMode = 'line' | 'rectangle' | 'square' | 'none';
type Point = { x: number; y: number };
type Shape = {
  type: DrawingMode;
  start: Point;
  end: Point;
};

const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);

  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
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

  const handleSubmit = () => {
    if (shapes.length === 0) {
      toast.warning("Canvas is empty. Draw something to submit!");
      return;
    }
    console.log('Submitted Shapes:', shapes);
    toast.success(`Successfully submitted ${shapes.length} shape(s).`);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          video.srcObject = stream;
          video.play();
        })
        .catch(err => {
          console.error("Error accessing webcam: ", err);
          toast.error("Error accessing webcam. Please ensure you have a webcam connected and have granted permission.");
          setIsWebcamAvailable(false);
        });
    } else {
      setIsWebcamAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (!isWebcamAvailable) {
      const video = videoRef.current;
      if (!video) return;

      const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play();
        });
      }
    }
  }, [isWebcamAvailable]);

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
        <Button onClick={handleSubmit}>
          <Send className="mr-2 h-4 w-4" /> Submit
        </Button>
      </div>
      <div className="relative w-full max-w-[1065px]">
        <video
          ref={videoRef}
          width="1065"
          height="599"
          className="rounded-md w-full h-auto"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width="1065"
          height="599"
          className="absolute top-0 left-0 w-full h-full bg-transparent border border-gray-400 rounded-md max-w-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default DrawingCanvas;