
interface FrameData {
  frameUrl: string;
  timestamp: Date;
}

interface CameraFrameStore {
  [cameraId: string]: FrameData[];
}

class FrameManager {
  private frames: CameraFrameStore = {};
  private framesPerBatch = 6; // 6 frames per minute (1 frame every 10 seconds)
  
  constructor() {
    this.frames = {};
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
    return this.frames[cameraId]?.length >= this.framesPerBatch;
  }
  
  getBatch(cameraId: string): FrameData[] | null {
    if (!this.hasBatchReady(cameraId)) return null;
    
    const batch = this.frames[cameraId].slice(0, this.framesPerBatch);
    this.frames[cameraId] = this.frames[cameraId].slice(this.framesPerBatch);
    
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
