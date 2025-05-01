
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/sonner";

interface AnalysisResult {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  content: string;
}

interface FrameData {
  frameUrl: string;
  timestamp: Date;
}

const API_KEY = "AIzaSyCsw06QWBk44pfvzpxy21gpRm8cV-tPvD8";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function analyzeFrames(
  cameraId: string, 
  frames: FrameData[], 
  cameraName: string = `Camera ${cameraId}`,
  batchSize: number = 6
): Promise<AnalysisResult> {
  try {
    // Extract base64 data from data URLs and include timestamps
    const frameDataWithTimestamps = frames.map((frame) => {
      // Remove the "data:image/jpeg;base64," prefix
      const base64Data = frame.frameUrl.split(',')[1];
      const timestamp = frame.timestamp.toLocaleTimeString();
      
      return {
        base64Data,
        timestamp
      };
    });
    
    const prompt = `
      Analyze these ${batchSize} video frames from a security camera (${cameraName}) taken ${frames.length > 1 ? 'at regular intervals' : ''}.
      Describe any notable activities, people, or changes you observe.
      Be concise but informative. Focus on unusual or suspicious activities if present.
      If nothing notable is happening, say so briefly.
    `;
    
    // Build the API request
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          ...frameDataWithTimestamps.map((frame) => ({
            inline_data: {
              mime_type: "image/jpeg",
              data: frame.base64Data
            }
          }))
        ]
      }],
      generation_config: {
        temperature: 0.2,
        max_output_tokens: 250
      }
    };

    // Make the API request
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const responseData = await response.json();
    const analysisText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 
                          "No analysis available. Please try again.";
    
    return {
      id: uuidv4(),
      cameraId,
      cameraName,
      timestamp: new Date(),
      content: analysisText
    };
  } catch (error) {
    console.error("Error analyzing frames:", error);
    toast.error("Failed to analyze frames. Please try again.");
    
    return {
      id: uuidv4(),
      cameraId,
      cameraName,
      timestamp: new Date(),
      content: "Analysis failed. Please check your connection and try again."
    };
  }
}
