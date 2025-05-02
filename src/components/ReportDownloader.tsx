
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import jsPDF from 'jspdf';

interface CameraInfo {
  id: string;
  name: string;
}

interface Analysis {
  id: string;
  cameraId: string;
  cameraName?: string;
  timestamp: Date;
  content: string;
}

interface ReportDownloaderProps {
  analyses: Analysis[];
  cameras: CameraInfo[];
}

const ReportDownloader: React.FC<ReportDownloaderProps> = ({ analyses, cameras }) => {
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedCameras, setSelectedCameras] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadAll, setDownloadAll] = useState<boolean>(true);

  // Initialize selected cameras when cameras prop changes
  useEffect(() => {
    const initialSelectedCameras: { [key: string]: boolean } = {};
    cameras.forEach((camera) => {
      initialSelectedCameras[camera.id] = true;
    });
    setSelectedCameras(initialSelectedCameras);
  }, [cameras]);

  // Set default time range to last 24 hours
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setEndTime(formatDateTimeForInput(now));
    setStartTime(formatDateTimeForInput(yesterday));
  }, []);

  const formatDateTimeForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  const handleCameraSelection = (cameraId: string, checked: boolean) => {
    setSelectedCameras(prev => ({
      ...prev,
      [cameraId]: checked
    }));
  };

  const filterAnalysesByTimeRange = (analyses: Analysis[]): Analysis[] => {
    if (downloadAll) return analyses;

    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    return analyses.filter(analysis => {
      const timestamp = new Date(analysis.timestamp);
      const isAfterStart = start ? timestamp >= start : true;
      const isBeforeEnd = end ? timestamp <= end : true;
      const isSelectedCamera = selectedCameras[analysis.cameraId] === true;
      
      return isAfterStart && isBeforeEnd && isSelectedCamera;
    });
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      const filteredAnalyses = filterAnalysesByTimeRange(analyses);
      
      if (filteredAnalyses.length === 0) {
        toast.error("No analyses found for the selected criteria.");
        setLoading(false);
        return;
      }

      // Create new PDF document
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(18);
      pdf.text("CCTV Analysis Report", 20, 20);
      
      // Add report generation info
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
      
      // Add time range if not downloading all
      if (!downloadAll) {
        pdf.text(`Time Range: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`, 20, 38);
      }
      
      // Configure font
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      
      let yPosition = 50;
      const pageWidth = pdf.internal.pageSize.width;
      
      // Add each analysis to PDF
      filteredAnalyses.forEach((analysis, index) => {
        // Check if we need to add a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Add camera name and timestamp
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Camera: ${analysis.cameraName || `Camera ${analysis.cameraId}`}`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.text(`Time: ${new Date(analysis.timestamp).toLocaleString()}`, 20, yPosition);
        yPosition += 12;
        
        // Add analysis content with wrapping
        pdf.setFont("helvetica", "normal");
        const contentLines = pdf.splitTextToSize(analysis.content, pageWidth - 40);
        pdf.text(contentLines, 20, yPosition);
        
        yPosition += contentLines.length * 7 + 15;
        
        // Add a divider line except for last item
        if (index < filteredAnalyses.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, yPosition - 8, pageWidth - 20, yPosition - 8);
        }
      });
      
      // Save the PDF
      pdf.save(`cctv-analysis-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Report downloaded successfully!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b">
        <CardTitle className="text-md flex items-center text-slate-800">
          <Download size={16} className="mr-2" />
          Analysis Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="download-all"
              checked={downloadAll}
              onCheckedChange={(checked: boolean) => setDownloadAll(checked)}
            />
            <label
              htmlFor="download-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Download all available analysis data
            </label>
          </div>
          
          {!downloadAll && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">From</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">To</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              
              {cameras.length > 1 && (
                <div className="space-y-2">
                  <Label>Select Cameras</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {cameras.map((camera) => (
                      <div key={camera.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`camera-${camera.id}`}
                          checked={selectedCameras[camera.id] || false}
                          onCheckedChange={(checked: boolean) => 
                            handleCameraSelection(camera.id, checked)
                          }
                        />
                        <label
                          htmlFor={`camera-${camera.id}`}
                          className="text-sm font-medium leading-none"
                        >
                          {camera.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          <Button 
            onClick={generatePDF}
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center">
                <Download size={16} className="mr-2" />
                Download Report
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportDownloader;
