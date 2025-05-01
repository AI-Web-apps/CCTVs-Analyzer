
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface CameraProps {
  id: string;
  onFrameCapture: (frameData: string, cameraId: string) => void;
  onRemove: (id: string) => void;
}

const Camera: React.FC<CameraProps> = ({ id, onFrameCapture, onRemove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup stream when component mounts
  useEffect(() => {
    const setupCamera = async () => {
      try {
        setIsLoading(true);
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: 16/9
          }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Failed to access camera");
      } finally {
        setIsLoading(false);
      }
    };

    setupCamera();

    // Cleanup function to stop the stream when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [id]);

  // Setup interval for frame capture
  useEffect(() => {
    if (!videoRef.current || isLoading || error) return;
    
    const captureInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.8);
          onFrameCapture(frameData, id);
        }
      }
    }, 10000); // Capture a frame every 10 seconds
    
    return () => clearInterval(captureInterval);
  }, [id, isLoading, error, onFrameCapture]);

  return (
    <Card className="relative overflow-hidden shadow-lg">
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="destructive" 
          size="sm" 
          className="rounded-full w-8 h-8 p-0"
          onClick={() => onRemove(id)}
        >
          <X size={16} />
        </Button>
      </div>
      
      <div className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <span className="animate-pulse">Connecting...</span>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            <span>{error}</span>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
          Camera {id}
        </div>
      </div>
    </Card>
  );
};

export default Camera;
