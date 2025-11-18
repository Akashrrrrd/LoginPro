'use client';

import { useRef, useState, useEffect } from 'react';
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
  const [cameraStarted, setCameraStarted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  const startCamera = async () => {
    setDebugInfo('Starting camera...');
    console.log('Starting camera...');
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    
    setError(null);
    setCameraStarted(true);
    
    try {
      // Check HTTPS requirement
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
      
      setDebugInfo(`Protocol: ${window.location.protocol}, Secure: ${isSecure}`);
      
      if (!isSecure) {
        const msg = '⚠️ Camera requires HTTPS! Current: ' + window.location.protocol;
        console.error(msg);
        setError(msg);
        setDebugInfo(msg);
        return;
      }
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = 'Camera API not supported in this browser';
        console.error(msg);
        setError(msg);
        setDebugInfo(msg);
        return;
      }

      setDebugInfo('Requesting camera permissions...');
      console.log('Requesting camera access...');
      
      // Try with basic constraints first for better compatibility
      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment'
          }
        });
        setDebugInfo('Camera stream obtained!');
        console.log('Camera stream obtained:', stream);
        console.log('Video tracks:', stream.getVideoTracks());
      } catch (e: any) {
        console.error('Camera access failed:', e);
        setDebugInfo(`Camera failed: ${e.name}`);
        throw e;
      }
      
      if (videoRef.current && stream) {
        setDebugInfo('Connecting stream to video element...');
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = async () => {
          setDebugInfo('Video metadata loaded, starting playback...');
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          
          try {
            await videoRef.current?.play();
            setIsStreaming(true);
            setDebugInfo('✓ Camera active!');
            console.log('✓ Camera started successfully');
          } catch (playError) {
            console.error('Play error:', playError);
            setDebugInfo(`Play failed: ${playError}`);
            setError('Failed to start video playback');
          }
        };
        
        // Fallback: try to play immediately
        try {
          await videoRef.current.play();
          setIsStreaming(true);
          setDebugInfo('✓ Camera active (immediate)!');
        } catch (e) {
          console.log('Immediate play failed, waiting for metadata...');
        }
      } else {
        setDebugInfo('ERROR: No video element or stream');
        setError('Failed to initialize video element');
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
    // Restart camera instead of stopping
    startCamera();
  };

  // Auto-start camera on component mount
  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      if (!cameraStarted && !capturedImage) {
        console.log('Auto-starting camera...');
        startCamera();
      }
    }, 500);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

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
            muted
            style={{ transform: 'scaleX(-1)' }}
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('Video metadata loaded')}
            onPlay={() => console.log('Video playing')}
            onError={(e) => console.error('Video error:', e)}
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 rounded-lg backdrop-blur">
            <p className="text-emerald-400 font-mono text-xs text-center font-bold">
              📸 Position puzzle in frame & tap SCAN
            </p>
          </div>
          
          {/* Large scan button */}
          <button
            onClick={captureFrame}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-bold rounded-xl transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-emerald-500/50 text-lg"
          >
            <Camera className="w-6 h-6" />
            SCAN PUZZLE
          </button>
        </div>
      </div>
    );
  }

  // Loading/Error state
  return (
    <div className="space-y-4">
      <div className="border border-emerald-500/30 bg-gray-900/50 backdrop-blur rounded-lg overflow-hidden">
        <div className="relative aspect-square bg-black">
          {/* Hidden video element for camera initialization */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
            {!error ? (
              <>
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-emerald-400 font-mono text-sm text-center font-bold">
                  Starting Camera...
                </p>
                <p className="text-emerald-300/60 font-mono text-xs text-center">
                  Please allow camera permissions when prompted
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400 font-mono text-sm text-center font-bold">
                  Camera Failed
                </p>
                <p className="text-red-300/80 font-mono text-xs text-center max-w-xs">
                  {error}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all active:scale-95"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/30 border border-emerald-500/20 rounded-lg p-4">
        <p className="text-emerald-300/70 font-mono text-xs text-center">
          📱 Camera will start automatically
        </p>
        <p className="text-emerald-300/50 font-mono text-xs text-center mt-2">
          ⚠️ Requires HTTPS connection for camera access
        </p>
        <p className="text-yellow-400/70 font-mono text-xs text-center mt-3 border-t border-emerald-500/10 pt-3">
          Debug: {debugInfo}
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
