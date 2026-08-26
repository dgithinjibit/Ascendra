"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, 
  Eraser, 
  Undo, 
  Redo, 
  Trash2, 
  Check, 
  Palette,
  Download,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CanvasHandle {
  getImageData: () => string | null;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

export interface DrawingCanvasProps {
  width?: number;
  height?: number;
  prompt?: string;
  onSubmit?: (imageData: string) => void;
  onCancel?: () => void;
  backgroundColor?: string;
  showColorPalette?: boolean;
  showThicknessControl?: boolean;
  maxUndoSteps?: number;
  onCanvasReady?: (handle: CanvasHandle) => void;
}

interface DrawingState {
  imageData: ImageData;
  timestamp: number;
}

const DEFAULT_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#A52A2A', // Brown
];

export default function DrawingCanvas({
  width = 800,
  height = 600,
  prompt = '',
  onSubmit,
  onCancel,
  backgroundColor = '#FFFFFF',
  showColorPalette = true,
  showThicknessControl = true,
  maxUndoSteps = 20,
  onCanvasReady,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState([3]);
  const [undoStack, setUndoStack] = useState<DrawingState[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingState[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Expose canvas methods via callback
  useEffect(() => {
    if (onCanvasReady) {
      const handle: CanvasHandle = {
        getImageData: () => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          return canvas.toDataURL('image/png');
        },
        clear: clearCanvas,
        undo,
        redo,
      };
      onCanvasReady(handle);
    }
  }, [onCanvasReady]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height, backgroundColor]);

  // Save current state to undo stack
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const state: DrawingState = {
      imageData,
      timestamp: Date.now(),
    };

    setUndoStack(prev => {
      const newStack = [...prev, state];
      // Limit stack size
      if (newStack.length > maxUndoSteps) {
        newStack.shift();
      }
      return newStack;
    });

    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, [maxUndoSteps]);

  // Get coordinates relative to canvas
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    // Save state before starting to draw
    if (!hasDrawn) {
      saveState();
      setHasDrawn(true);
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness[0];
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.strokeStyle = backgroundColor;
      ctx.lineWidth = thickness[0] * 2; // Eraser is thicker
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    if (isDrawing) {
      saveState();
    }
    setIsDrawing(false);
  };

  // Undo
  const undo = () => {
    if (undoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state to redo stack
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoStack(prev => [...prev, { imageData: currentImageData, timestamp: Date.now() }]);

    // Restore previous state
    const previousState = undoStack[undoStack.length - 1];
    ctx.putImageData(previousState.imageData, 0, 0);

    // Remove from undo stack
    setUndoStack(prev => prev.slice(0, -1));
  };

  // Redo
  const redo = () => {
    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state to undo stack
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev, { imageData: currentImageData, timestamp: Date.now() }]);

    // Restore next state
    const nextState = redoStack[redoStack.length - 1];
    ctx.putImageData(nextState.imageData, 0, 0);

    // Remove from redo stack
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveState();
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit drawing
  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    onSubmit?.(imageData);
  };

  // Download drawing
  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      {prompt && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              {prompt}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Canvas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair touch-none"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Tool Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm">Tools:</Badge>
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('pen')}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Pen
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
              >
                <Eraser className="w-4 h-4 mr-2" />
                Eraser
              </Button>
            </div>

            {/* Color Palette */}
            {showColorPalette && tool === 'pen' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">Color:</Badge>
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color === c ? "border-black dark:border-white scale-110" : "border-gray-300"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            )}

            {/* Thickness Control */}
            {showThicknessControl && (
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm">Thickness:</Badge>
                <Slider
                  value={thickness}
                  onValueChange={setThickness}
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1 max-w-xs"
                />
                <span className="text-sm font-medium w-8">{thickness[0]}px</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={undoStack.length === 0}
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={redoStack.length === 0}
              >
                <Redo className="w-4 h-4 mr-2" />
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDrawing}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Submit/Cancel */}
            <div className="flex items-center gap-2 pt-4 border-t">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              {onSubmit && (
                <Button
                  onClick={handleSubmit}
                  disabled={!hasDrawn}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob
