import React, { useEffect, useRef, useState } from 'react';
import { Eye, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const EyeTrackerWidget = ({ videoRef, onGazeDeviation }) => {
  const [gazeStatus, setGazeStatus] = useState('CENTER'); // 'CENTER' | 'LOOKING_AWAY'
  const [offScreenCount, setOffScreenCount] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let awayCounter = 0;

    const detectGaze = () => {
      const video = videoRef?.current;
      const canvas = canvasRef?.current;

      if (video && canvas && video.readyState === 4) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 160;
        canvas.height = video.videoHeight || 120;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Perform luminance centroid estimation to detect face/eye brightness distribution
        let totalBrightness = 0;
        let leftBrightness = 0;
        let rightBrightness = 0;
        const width = canvas.width;
        const height = canvas.height;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;

          const pixelIdx = i / 4;
          const x = pixelIdx % width;

          if (x < width / 2) {
            leftBrightness += brightness;
          } else {
            rightBrightness += brightness;
          }
        }

        const diffRatio = Math.abs(leftBrightness - rightBrightness) / (totalBrightness || 1);

        // If significant horizontal luminance asymmetry is detected (head/eye turn)
        if (diffRatio > 0.35) {
          awayCounter++;
          if (awayCounter > 20) {
            setGazeStatus('LOOKING_AWAY');
            setOffScreenCount(prev => {
              const next = prev + 1;
              if (onGazeDeviation) onGazeDeviation(next);
              return next;
            });
            awayCounter = 0;
          }
        } else {
          awayCounter = Math.max(0, awayCounter - 1);
          if (awayCounter === 0) {
            setGazeStatus('CENTER');
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectGaze);
    };

    animationFrameId = requestAnimationFrame(detectGaze);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [videoRef, onGazeDeviation]);

  return (
    <div className="bg-[#fff8f7] border border-[#e2bfb9] rounded-md p-3 space-y-2">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#311213] flex items-center space-x-1.5">
          <Eye className="w-4 h-4 text-[#800000]" />
          <span>AI Eye & Gaze Tracker</span>
        </span>
        <span className="text-[10px] font-bold text-[#800000] bg-[#fff0f0] border border-[#e2bfb9] px-2 py-0.5 rounded">
          Proctored
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {gazeStatus === 'CENTER' ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Facing Screen</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-800" />
              <span>Gaze Alert: Looking Away</span>
            </span>
          )}
        </div>

        <span className="text-xs font-bold text-[#5a413d]">
          {offScreenCount} Alerts
        </span>
      </div>
    </div>
  );
};

export default EyeTrackerWidget;
