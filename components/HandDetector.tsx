import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Settings2, RefreshCcw, Eye, EyeOff, Activity, Clock, StopCircle, PlayCircle, Loader2 } from 'lucide-react';
import { detectHandNumber } from '../services/geminiService';
import { DetectionResult, Settings, AppState } from '../types';

const HandDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // App State
  const [settings, setSettings] = useState<Settings>({
    showBoundingBox: true,
    showConfidence: true,
    showHistory: true,
    autoProcess: false, // Default to off, user starts it
  });

  const [state, setState] = useState<AppState>({
    isProcessing: false,
    currentResult: null,
    history: [],
  });

  // Start Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 } 
          } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Unable to access camera. Please allow permissions.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process Frame Function
  const processFrame = useCallback(async () => {
    if (!videoRef.current || state.isProcessing) return;
    
    // Ensure video dimensions are available
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const video = videoRef.current;
      
      // OPTIMIZATION: Downscale image to 320px width.
      const targetWidth = 320;
      const scale = targetWidth / video.videoWidth;
      const targetHeight = video.videoHeight * scale;

      // Create temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not get context");

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Convert to base64 with lower quality (0.6) for speed
      const base64Data = tempCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      // Call API
      const result = await detectHandNumber(base64Data);

      setState(prev => {
        const newHistory = result.detected 
          ? [{ timestamp: Date.now(), result }, ...prev.history].slice(0, 10)
          : prev.history;

        return {
          ...prev,
          isProcessing: false, // Processing complete, ready for next frame
          currentResult: result,
          history: newHistory
        };
      });

    } catch (err) {
      console.error("Frame processing error:", err);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isProcessing]);

  // OPTIMIZED AUTO-PROCESS LOOP
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (settings.autoProcess && !state.isProcessing) {
      // Small 10ms buffer to allow React state updates and UI rendering to breathe
      timeoutId = setTimeout(() => {
        processFrame();
      }, 10);
    }
    
    return () => clearTimeout(timeoutId);
  }, [settings.autoProcess, state.isProcessing, processFrame]);

  // Draw Bounding Box Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !state.currentResult?.boundingBox || !settings.showBoundingBox) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const { ymin, xmin, ymax, xmax } = state.currentResult.boundingBox;
    
    const mirroredXMin = 1 - xmax;
    const mirroredXMax = 1 - xmin;
    
    // Calculate pixel coordinates
    const x = mirroredXMin * canvas.width;
    const y = ymin * canvas.height;
    const w = (mirroredXMax - mirroredXMin) * canvas.width;
    const h = (ymax - ymin) * canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Box
    // Use theme colors via computed styles or standard hex if canvas needed
    ctx.strokeStyle = '#00D1FF'; // Keep neon blue for overlay visibility against video
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([10, 5]); 
    ctx.strokeRect(x, y, w, h);

    // Draw Glow
    ctx.shadowColor = '#00D1FF';
    ctx.shadowBlur = 20;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0; // Reset

    // Draw Label Background
    if (state.currentResult.number !== null) {
        const label = `Number: ${state.currentResult.number}`;
        ctx.font = 'bold 24px DM Sans, sans-serif';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = 'rgba(0, 209, 255, 0.9)';
        ctx.fillRect(x, y - 40, textWidth + 20, 32);
        
        ctx.fillStyle = '#000';
        ctx.fillText(label, x + 10, y - 16);
    }

  }, [state.currentResult, settings.showBoundingBox]);

  // UI Handlers
  const toggleSetting = (key: keyof Settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Main Viewport */}
      <div className="relative flex-1 flex items-center justify-center bg-muted/20 overflow-hidden">
        {error ? (
          <div className="text-destructive text-center p-8 bg-destructive/10 rounded-xl border border-destructive/30">
            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            
            {/* Video Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border max-w-4xl w-full aspect-video bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]" 
                onLoadedMetadata={() => {}}
              />
              <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none" 
              />
              
              {/* Scanline Effect */}
              {settings.autoProcess && state.isProcessing && (
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/10 to-transparent h-[10%] w-full animate-scan opacity-30"></div>
              )}
              
              {/* Overlay Info (Top Left) */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                 <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-gray-300">
                    <div className={`w-2 h-2 rounded-full ${state.isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                    {state.isProcessing ? 'Processing...' : 'Live'}
                 </div>
                 {settings.showConfidence && state.currentResult?.detected && (
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-primary font-mono">
                      Conf: {(state.currentResult.confidence * 100).toFixed(1)}%
                    </div>
                 )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 bg-sidebar border-l border-sidebar-border flex flex-col z-20 shadow-2xl text-sidebar-foreground">
        
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <h2 className="text-xl font-bold flex items-center gap-2 text-sidebar-foreground">
            <Settings2 className="text-primary" size={20} />
            Control Panel
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Configure detection parameters</p>
        </div>

        {/* Big Result Display */}
        <div className="p-8 flex flex-col items-center justify-center border-b border-sidebar-border bg-sidebar-accent/5">
            <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold mb-2">Detected Number</span>
            <div className="relative">
                <div className={`text-8xl font-black ${state.currentResult?.detected ? 'text-primary' : 'text-muted'}`}>
                    {state.currentResult?.detected && state.currentResult.number !== null ? state.currentResult.number : '-'}
                </div>
                {state.currentResult?.detected && (
                    <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse-fast"></div>
                )}
            </div>
            {state.currentResult?.explanation && (
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
                "{state.currentResult.explanation}"
              </p>
            )}
        </div>

        {/* Toggles */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Auto Process Toggle (Main Action) */}
            <div className="bg-sidebar-accent/10 p-4 rounded-xl border border-sidebar-border">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-medium text-sidebar-foreground">Live Detection</span>
                 <button 
                   onClick={() => toggleSetting('autoProcess')}
                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoProcess ? 'bg-primary' : 'bg-muted'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition transition-transform ${settings.autoProcess ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>
               <p className="text-xs text-muted-foreground mb-3">Continuously analyze video frames for maximum speed.</p>
               {!settings.autoProcess && (
                  <button 
                    onClick={processFrame} 
                    disabled={state.isProcessing}
                    className="w-full py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {state.isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                     Capture Single Frame
                  </button>
               )}
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground mt-6 mb-2 uppercase tracking-wider">Visuals</h3>
            
            <ControlToggle 
               label="Bounding Box" 
               active={settings.showBoundingBox} 
               onClick={() => toggleSetting('showBoundingBox')}
               icon={settings.showBoundingBox ? <Eye size={16} /> : <EyeOff size={16} />}
            />
            
            <ControlToggle 
               label="Show Confidence" 
               active={settings.showConfidence} 
               onClick={() => toggleSetting('showConfidence')}
               icon={<Activity size={16} />}
            />

            <ControlToggle 
               label="History Log" 
               active={settings.showHistory} 
               onClick={() => toggleSetting('showHistory')}
               icon={<Clock size={16} />}
            />

          </div>

          {/* History List */}
          {settings.showHistory && (
             <div className="mt-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Recent Detections</h3>
                <div className="space-y-2">
                   {state.history.length === 0 && <p className="text-xs text-muted-foreground italic">No history yet.</p>}
                   {state.history.map((item, idx) => (
                      <div key={item.timestamp} className="flex items-center justify-between p-2 rounded bg-sidebar-accent/10 border border-sidebar-border text-sm">
                         <div className="flex items-center gap-3">
                            <span className="font-bold text-primary w-4">{item.result.number}</span>
                            <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleTimeString()}</span>
                         </div>
                         <div className="text-xs text-muted-foreground">{(item.result.confidence * 100).toFixed(0)}%</div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

const ControlToggle: React.FC<{ label: string; active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${active ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-sidebar-border text-muted-foreground hover:bg-sidebar-accent/10'}`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className={`w-3 h-3 rounded-full ${active ? 'bg-primary shadow-[0_0_10px_var(--primary)]' : 'bg-muted'}`} />
  </button>
);

export default HandDetector;