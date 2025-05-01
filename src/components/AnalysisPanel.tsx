
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface Analysis {
  id: string;
  cameraId: string;
  timestamp: Date;
  content: string;
}

interface AnalysisPanelProps {
  analyses: Analysis[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analyses }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <span className="mr-2 inline-block w-2 h-2 rounded-full bg-green-500"></span>
          Real-time Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-10rem)] px-4">
          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
              <div className="mb-2 text-3xl">🔍</div>
              <p>No analysis data yet.</p>
              <p className="text-xs mt-1">Analysis will appear here once frames are processed.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="analysis-bubble">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600">Camera {analysis.cameraId}</span>
                    <span className="text-xs text-gray-500">
                      {analysis.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm">{analysis.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AnalysisPanel;
