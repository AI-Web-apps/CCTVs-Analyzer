
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface CameraProps {
  id: string;
  name: string;
  onFrameCapture: (frameData: string, cameraId: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

const Camera: React.FC<CameraProps> = ({ id, name, onFrameCapture, onRemove, onRename }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(name);
  const nameRef = useRef<HTMLInputElement>(null);

  // Get available video devices
  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${devices.indexOf(device) + 1}`
        }));
      
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting video devices:", err);
      setError("Could not access camera list");
    }
  };

  // Setup devices enumeration when component mounts
  useEffect(() => {
    getVideoDevices();
  }, []);

  // Setup stream when selected device changes
  useEffect(() => {
    const setupCamera = async () => {
      if (!selectedDevice) return;

      try {
        setIsLoading(true);
        // Stop current stream if it exists
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
          video: {
            deviceId: { exact: selectedDevice },
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
  }, [selectedDevice]);

  // Handle device change
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

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

  // Refresh device list
  const refreshDevices = async () => {
    await getVideoDevices();
    toast.success("Camera list refreshed");
  };

  // Handle camera rename
  const handleNameClick = () => {
    setIsEditingName(true);
    setTimeout(() => {
      if (nameRef.current) {
        nameRef.current.focus();
        nameRef.current.select();
      }
    }, 10);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameBlur = () => {
    if (editedName.trim() === "") {
      setEditedName(name);
    } else if (editedName !== name) {
      onRename(id, editedName);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (editedName.trim() === "") {
        setEditedName(name);
      } else if (editedName !== name) {
        onRename(id, editedName);
      }
      setIsEditingName(false);
    } else if (e.key === "Escape") {
      setEditedName(name);
      setIsEditingName(false);
    }
  };

  return (
    <Card className="relative overflow-hidden shadow-lg border-0 bg-opacity-80 backdrop-blur-sm">
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
          className="w-full h-full object-cover camera-feed-mirror"
          autoPlay
          playsInline
          muted
        />
        
        <div className="absolute bottom-2 left-2 right-2 flex justify-between bg-black/50 px-2 py-1 rounded">
          <div className="flex items-center gap-2 w-full">
            {isEditingName ? (
              <input
                ref={nameRef}
                type="text"
                className="text-xs bg-transparent text-white border border-primary/40 rounded px-1 py-0.5 w-24"
                value={editedName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                maxLength={20}
              />
            ) : (
              <span 
                className="text-xs text-white cursor-pointer hover:text-primary transition-colors"
                onDoubleClick={handleNameClick}
                title="Double-click to rename"
              >
                {name}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <Select value={selectedDevice} onValueChange={handleDeviceChange}>
                <SelectTrigger className="h-7 text-xs bg-transparent text-white border-none w-full">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-white"
              onClick={refreshDevices}
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Camera;
