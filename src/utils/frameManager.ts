
interface FrameData {
  frameUrl: string;
  timestamp: Date;
}

interface CameraFrameStore {
  [cameraId: string]: FrameData[];
}

interface FrameManagerSettings {
  framesPerBatch: number;
  captureIntervalSeconds: number;
}

class FrameManager {
  private frames: CameraFrameStore = {};
  private settings: FrameManagerSettings;
  
  constructor() {
    this.frames = {};
    this.settings = {
      framesPerBatch: 6, // 6 frames per batch by default
      captureIntervalSeconds: 10 // 10 seconds interval by default
    };
  }
  
  updateSettings(newSettings: Partial<FrameManagerSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
  
  getSettings(): FrameManagerSettings {
    return { ...this.settings };
  }
  
  addFrame(cameraId: string, frameUrl: string): void {
    if (!this.frames[cameraId]) {
      this.frames[cameraId] = [];
    }
    
    this.frames[cameraId].push({
      frameUrl,
      timestamp: new Date()
    });
  }
  
  hasBatchReady(cameraId: string): boolean {
    return this.frames[cameraId]?.length >= this.settings.framesPerBatch;
  }
  
  getBatch(cameraId: string): FrameData[] | null {
    if (!this.hasBatchReady(cameraId)) return null;
    
    const batch = this.frames[cameraId].slice(0, this.settings.framesPerBatch);
    this.frames[cameraId] = this.frames[cameraId].slice(this.settings.framesPerBatch);
    
    return batch;
  }
  
  getAllCamerasWithBatchesReady(): string[] {
    return Object.keys(this.frames).filter(cameraId => 
      this.hasBatchReady(cameraId)
    );
  }
  
  clearFrames(cameraId: string): void {
    if (this.frames[cameraId]) {
      this.frames[cameraId] = [];
    }
  }
  
  removeCamera(cameraId: string): void {
    if (this.frames[cameraId]) {
      delete this.frames[cameraId];
    }
  }
}

export default new FrameManager();
