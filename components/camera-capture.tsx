'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (imageData: string) => void;
}

export default function CameraCapture({ onImageCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access denied. Please use image upload instead.');
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        onImageCapture(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        onImageCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCapture = () => {
    setCapturedImage(null);
    stopCamera();
  };

  if (capturedImage) {
    return (
      <div className="border border-emerald-500/30 bg-gray-900/50 backdrop-blur rounded-lg overflow-hidden">
        <div className="relative">
          <img src={capturedImage || "/placeholder.svg"} alt="Captured puzzle" className="w-full" />
          <button
            onClick={clearCapture}
            className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (isStreaming) {
    return (
      <div className="border border-emerald-500/30 bg-gray-900/50 backdrop-blur rounded-lg overflow-hidden">
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 border-4 border-emerald-400/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/5 via-transparent to-transparent pointer-events-none" />
          
          <button
            onClick={captureFrame}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            CAPTURE
          </button>
          
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={startCamera}
        className="w-full py-6 border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-all flex items-center justify-center gap-3 text-emerald-400 font-mono text-sm"
      >
        <Camera className="w-6 h-6" />
        START CAMERA
      </button>

      <label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 border border-emerald-500/30 hover:border-emerald-500 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 transition-all flex items-center justify-center gap-3 text-emerald-300 font-mono text-sm"
        >
          <Upload className="w-5 h-5" />
          UPLOAD IMAGE
        </button>
      </label>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
