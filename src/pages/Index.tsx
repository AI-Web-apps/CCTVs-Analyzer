
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Plus, Info, Settings } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { v4 as uuidv4 } from "uuid";

import Camera from "@/components/Camera";
import AnalysisPanel, { Analysis } from "@/components/AnalysisPanel";
import frameManager from "@/utils/frameManager";
import { analyzeFrames } from "@/services/analysisService";

interface CameraInfo {
  id: string;
  name: string;
}

const Index = () => {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [activeTab, setActiveTab] = useState<string>("live");
  const [captureInterval, setCaptureInterval] = useState<number>(10);
  const [batchSize, setBatchSize] = useState<number>(6);
  const [analysisInterval, setAnalysisInterval] = useState<number>(60);

  // Initialize settings from frameManager
  useEffect(() => {
    const settings = frameManager.getSettings();
    setCaptureInterval(settings.captureIntervalSeconds);
    setBatchSize(settings.framesPerBatch);
    setAnalysisInterval(captureInterval * batchSize);
  }, []);

  // Update frameManager settings when sliders change
  useEffect(() => {
    frameManager.updateSettings({
      captureIntervalSeconds: captureInterval,
      framesPerBatch: batchSize
    });
    setAnalysisInterval(captureInterval * batchSize);
  }, [captureInterval, batchSize]);

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
            const cameraInfo = cameras.find(cam => cam.id === cameraId);
            const cameraName = cameraInfo ? cameraInfo.name : `Camera ${cameraId}`;
            const analysis = await analyzeFrames(cameraId, frames, cameraName, batchSize);
            setAnalyses(prev => [analysis, ...prev]);
          } catch (error) {
            console.error(`Error analyzing frames from camera ${cameraId}:`, error);
          }
        }
      }
    };

    const interval = setInterval(processFrames, 5000);
    return () => clearInterval(interval);
  }, [cameras, batchSize]);

  // Add a new camera
  const addCamera = useCallback(() => {
    const canAddCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    if (!canAddCamera) {
      toast.error("Cannot access camera. Please ensure camera permissions are enabled.");
      return;
    }
    
    const newCameraId = uuidv4().slice(0, 5);
    const newCameraName = `Camera ${cameras.length + 1}`;
    setCameras(prev => [...prev, { id: newCameraId, name: newCameraName }]);
    toast.success("New camera added");
  }, [cameras.length]);

  // Remove a camera
  const removeCamera = useCallback((cameraId: string) => {
    setCameras(prev => prev.filter(cam => cam.id !== cameraId));
    frameManager.removeCamera(cameraId);
    toast.info("Camera removed");
  }, []);

  // Rename a camera
  const renameCamera = useCallback((cameraId: string, newName: string) => {
    setCameras(prev => 
      prev.map(cam => 
        cam.id === cameraId ? { ...cam, name: newName } : cam
      )
    );
    toast.success(`Camera renamed to ${newName}`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <header className="container mx-auto py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            CCTV Analysis
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
              <h2 className="text-lg font-semibold font-poppins text-slate-800">Camera Feeds</h2>
              <Button onClick={addCamera} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-1" /> Add Camera
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-4 bg-slate-100/70 backdrop-blur-sm border border-slate-200">
                <TabsTrigger value="live" className="flex-1 data-[state=active]:bg-white">Live View</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-white">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="live" className="mt-0">
                {cameras.length === 0 ? (
                  <div className="glass-morphism rounded-lg p-12 text-center space-y-4">
                    <div className="text-4xl mb-4">📹</div>
                    <h3 className="text-xl font-semibold font-poppins">No cameras added</h3>
                    <p className="text-muted-foreground">Click "Add Camera" to start monitoring</p>
                    <Button onClick={addCamera} className="bg-blue-600 hover:bg-blue-700 mt-4">
                      <Plus size={16} className="mr-1" /> Add Camera
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="camera-content-container">
                    <div className="camera-grid p-1">
                      {cameras.map(camera => (
                        <Camera
                          key={camera.id}
                          id={camera.id}
                          name={camera.name}
                          onFrameCapture={handleFrameCapture}
                          onRemove={removeCamera}
                          onRename={renameCamera}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="p-6 border rounded-lg bg-white/80 backdrop-blur-sm shadow-sm space-y-6">
                  <h3 className="text-lg font-medium mb-4 font-poppins flex items-center text-slate-800">
                    <Settings size={18} className="mr-2" />
                    Analysis Settings
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Frame Capture Interval</label>
                        <span className="text-sm text-muted-foreground">{captureInterval} seconds</span>
                      </div>
                      <Slider 
                        value={[captureInterval]} 
                        min={5} 
                        max={30} 
                        step={1} 
                        onValueChange={(value) => setCaptureInterval(value[0])}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        How often to capture frames from cameras
                      </p>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Frames Per Analysis</label>
                        <span className="text-sm text-muted-foreground">{batchSize} frames</span>
                      </div>
                      <Slider 
                        value={[batchSize]} 
                        min={2} 
                        max={12} 
                        step={1} 
                        onValueChange={(value) => setBatchSize(value[0])}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of frames to collect before analyzing
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-md p-4 mt-4 border-l-4 border-blue-500">
                      <h4 className="text-sm font-semibold text-blue-800">Analysis Report Timing</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        With current settings, analysis reports will be generated approximately every <span className="font-semibold">{analysisInterval} seconds</span>
                      </p>
                      <p className="text-xs text-blue-600/70 mt-2">
                        (Frame Capture Interval × Frames Per Analysis = Analysis Report Frequency)
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700">
                        Active cameras: <span className="text-blue-600 font-semibold">{cameras.length}</span>
                      </p>
                    </div>
                  </div>
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
