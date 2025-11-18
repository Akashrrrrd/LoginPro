'use client';

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (imageData: string) => void;
}

export default function CameraCapture({ onImageCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = 'Camera not supported. Please use HTTPS or a modern browser.';
        setError(msg);
        alert(msg);
        return;
      }

      // Try with high quality first, fallback to basic if fails
      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
      } catch (e) {
        // Fallback to basic constraints for mobile
        console.log('High quality failed, trying basic constraints...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment'
          }
        });
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsStreaming(true);
          }).catch((playError) => {
            console.error('Play error:', playError);
            setError('Failed to start video playback');
          });
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Camera access failed. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permissions in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another app.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the requested settings.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported. Please use HTTPS.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.95);
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
          {/* Grid overlay for alignment */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-4 border-emerald-400/30" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-emerald-400/10" />
              ))}
            </div>
          </div>
          
          {/* Scan instruction */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-lg">
            <p className="text-emerald-400 font-mono text-xs text-center">
              Align puzzle grid within frame
            </p>
          </div>
          
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
    <div className="space-y-4">
      <button
        onClick={startCamera}
        className="w-full py-8 border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 active:border-emerald-400 rounded-lg bg-gray-900/50 hover:bg-gray-900 active:bg-gray-800 transition-all flex flex-col items-center justify-center gap-4 text-emerald-400 font-mono touch-manipulation"
      >
        <Camera className="w-12 h-12" />
        <div className="text-center">
          <p className="text-lg font-bold">SCAN PUZZLE</p>
          <p className="text-xs text-emerald-300/60 mt-1">Camera-only mode for system-generated matrices</p>
        </div>
      </button>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300 font-mono text-xs text-center">
            ⚠️ {error}
          </p>
        </div>
      )}

      <div className="bg-gray-900/30 border border-emerald-500/20 rounded-lg p-4">
        <p className="text-emerald-300/70 font-mono text-xs text-center">
          📱 Position your device camera over a printed or digital puzzle matrix (3x3, 4x4, or 5x5)
        </p>
        <p className="text-emerald-300/50 font-mono text-xs text-center mt-2">
          ⚠️ Requires HTTPS connection for camera access
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
