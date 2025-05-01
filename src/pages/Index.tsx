
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Info } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";

import Camera from "@/components/Camera";
import AnalysisPanel, { Analysis } from "@/components/AnalysisPanel";
import frameManager from "@/utils/frameManager";
import { analyzeFrames } from "@/services/analysisService";

const Index = () => {
  const [cameras, setCameras] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [activeTab, setActiveTab] = useState<string>("live");

  // Frame capture handling
  const handleFrameCapture = useCallback((frameData: string, cameraId: string) => {
    frameManager.addFrame(cameraId, frameData);
  }, []);

  // Process frames when we have enough
  useEffect(() => {
    const processFrames = async () => {
      const camerasWithBatches = frameManager.getAllCamerasWithBatchesReady();
      
      for (const cameraId of camerasWithBatches) {
        const frames = frameManager.getBatch(cameraId);
        if (frames) {
          try {
            const analysis = await analyzeFrames(cameraId, frames);
            setAnalyses(prev => [analysis, ...prev]);
          } catch (error) {
            console.error(`Error analyzing frames from camera ${cameraId}:`, error);
          }
        }
      }
    };

    const interval = setInterval(processFrames, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add a new camera
  const addCamera = useCallback(() => {
    const canAddCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    if (!canAddCamera) {
      toast.error("Cannot access camera. Please ensure camera permissions are enabled.");
      return;
    }
    
    const newCameraId = uuidv4().slice(0, 5);
    setCameras(prev => [...prev, newCameraId]);
    toast.success("New camera added");
  }, []);

  // Remove a camera
  const removeCamera = useCallback((cameraId: string) => {
    setCameras(prev => prev.filter(id => id !== cameraId));
    frameManager.removeCamera(cameraId);
    toast.info("Camera removed");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="container mx-auto py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            Vision Whisper Analysis
          </h1>
          <Button variant="ghost" size="sm">
            <Info size={16} className="mr-1" /> Help
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Cameras section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Camera Feeds</h2>
              <Button onClick={addCamera}>
                <Plus size={16} className="mr-1" /> Add Camera
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="live" className="flex-1">Live View</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="mt-0">
                {cameras.length === 0 ? (
                  <div className="glass-morphism rounded-lg p-12 text-center space-y-4">
                    <div className="text-4xl mb-4">📹</div>
                    <h3 className="text-xl font-semibold">No cameras added</h3>
                    <p className="text-muted-foreground">Click "Add Camera" to start monitoring</p>
                    <Button onClick={addCamera}>
                      <Plus size={16} className="mr-1" /> Add Camera
                    </Button>
                  </div>
                ) : (
                  <div className="camera-grid">
                    {cameras.map(cameraId => (
                      <Camera
                        key={cameraId}
                        id={cameraId}
                        onFrameCapture={handleFrameCapture}
                        onRemove={removeCamera}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="text-lg font-medium mb-4">Camera Settings</h3>
                  <p className="text-muted-foreground mb-2">
                    Frames are captured every 10 seconds and analyzed in batches of 6 frames.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Active cameras: {cameras.length}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right side: Analysis section */}
          <div className="h-[calc(100vh-12rem)]">
            <AnalysisPanel analyses={analyses} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
