import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SignaturePad({ 
  onSignatureChange, 
  placeholder = "Sign here",
  className = ""
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set drawing styles
    ctx.strokeStyle = "#1976D2";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    setIsEmpty(false);
    canvas.classList.add("signing");

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault(); // Prevent scrolling on touch

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.classList.remove("signing");

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();

    // Convert canvas to data URL and notify parent
    const dataURL = canvas.toDataURL();
    onSignatureChange(dataURL);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove("signing");
    setIsEmpty(true);
    onSignatureChange("");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="signature-pad w-full h-32 rounded-lg border-2 border-dashed border-gray-300 bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">{placeholder}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          className="text-gray-600 hover:text-gray-800"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <span className="text-xs text-gray-500">
          {isEmpty ? "Signature required" : "Signature captured"}
        </span>
      </div>
    </div>
  );
}
