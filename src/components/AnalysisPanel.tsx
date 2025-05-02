
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';

export interface Analysis {
  id: string;
  cameraId: string;
  cameraName?: string;
  timestamp: Date;
  content: string;
}

interface AnalysisPanelProps {
  analyses: Analysis[];
  cameras: { id: string; name: string; }[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analyses, cameras }) => {
  const [activeTab, setActiveTab] = useState<string>("live");

  // Dynamically import ReportDownloader to avoid circular dependency issues
  const ReportDownloader = React.lazy(() => import('./ReportDownloader'));

  return (
    <Card className="h-full border-0 shadow-md bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b">
        <CardTitle className="text-lg flex items-center justify-between text-slate-800">
          <div className="flex items-center">
            <span className="mr-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            CCTV Analysis
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-blue-100/50">
              <TabsTrigger value="live" className="text-xs px-3 py-1">Live Analysis</TabsTrigger>
              <TabsTrigger value="download" className="text-xs px-3 py-1">Download Report</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="live" className="m-0">
            <ScrollArea className="h-[calc(70vh-10rem)] px-4">
              {analyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
                  <div className="mb-2 text-3xl">🔍</div>
                  <p>No analysis data yet.</p>
                  <p className="text-xs mt-1">Analysis will appear here once frames are processed.</p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="analysis-bubble font-poppins">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-blue-700">
                          {analysis.cameraName || `Camera ${analysis.cameraId}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {analysis.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm prose prose-blue max-w-none">
                        <ReactMarkdown>{analysis.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="download" className="m-0 p-4">
            <React.Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }>
              <ReportDownloader analyses={analyses} cameras={cameras} />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnalysisPanel;
