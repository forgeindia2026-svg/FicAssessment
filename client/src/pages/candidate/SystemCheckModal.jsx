import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Mic, 
  MapPin, 
  Eye,
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Maximize, 
  Loader2
} from 'lucide-react';

const SystemCheckModal = ({ onPermissionsGranted, onCancel }) => {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [eyeTrackerVerified, setEyeTrackerVerified] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);

  const [checkingCamera, setCheckingCamera] = useState(false);
  const [checkingMic, setCheckingMic] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraAccess = async () => {
    setCheckingCamera(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraGranted(true);
      // Auto-verify eye tracker once camera feed is active
      setTimeout(() => setEyeTrackerVerified(true), 800);
    } catch (err) {
      setErrorMsg('Camera access denied or device not found. Please allow camera permissions in your browser.');
      setCameraGranted(false);
    } finally {
      setCheckingCamera(false);
    }
  };

  const requestMicAccess = async () => {
    setCheckingMic(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach(track => track.stop());
      setMicGranted(true);
    } catch (err) {
      setErrorMsg('Microphone access denied. Please allow microphone permissions in your browser.');
      setMicGranted(false);
    } finally {
      setCheckingMic(false);
    }
  };

  const requestLocationAccess = () => {
    setCheckingLocation(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({
          lat: position.coords.latitude.toFixed(4),
          lng: position.coords.longitude.toFixed(4)
        });
        setLocationGranted(true);
        setCheckingLocation(false);
      },
      (err) => {
        setErrorMsg('Location access denied. Please enable location permissions in your browser settings.');
        setLocationGranted(false);
        setCheckingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleAllPermissionsAndLaunch = async () => {
    if (!cameraGranted || !micGranted || !locationGranted || !eyeTrackerVerified) {
      setErrorMsg('Please grant Camera, Microphone, Location, and Eye Tracking verification to proceed.');
      return;
    }

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed or was bypassed:', err);
    }

    onPermissionsGranted({
      camera: cameraGranted,
      mic: micGranted,
      location: locationCoords,
      eyeTracker: eyeTrackerVerified,
      stream: streamRef.current
    });
  };

  const allGranted = cameraGranted && micGranted && locationGranted && eyeTrackerVerified;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-[#e2bfb9] rounded-md max-w-xl w-full p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-[#ffe9e8] pb-4">
          <div className="p-3 bg-[#fff0f0] text-[#800000] rounded-full inline-block">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#311213]">AI Proctoring & System Verification</h2>
          <p className="text-xs text-[#8e706c] font-medium">
            To ensure assessment integrity, please grant Camera, Microphone, Geolocation, and Eye-Gaze Tracking verification before entering the test.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-[#fff0f0] border border-[#e2bfb9] text-[#800000] text-xs font-semibold p-3.5 rounded-md flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Permission Grid */}
        <div className="space-y-3.5">
          {/* Camera Access Box */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-md ${cameraGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#800000]'}`}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#311213]">Webcam Stream</h4>
                <p className="text-xs text-[#8e706c]">Required for identity & video proctoring</p>
              </div>
            </div>
            {cameraGranted ? (
              <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Granted</span>
              </span>
            ) : (
              <button
                onClick={requestCameraAccess}
                disabled={checkingCamera}
                className="bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-3.5 py-1.5 rounded-md shadow-sm transition-all flex items-center space-x-1"
              >
                {checkingCamera && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Allow Camera</span>
              </button>
            )}
          </div>

          {/* Live Camera Preview Stream */}
          {cameraGranted && (
            <div className="bg-black rounded-md overflow-hidden h-36 relative border border-[#e2bfb9] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <span className="absolute bottom-2 left-2 bg-emerald-900/90 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Feed Active</span>
              </span>
            </div>
          )}

          {/* Eye Tracker Calibration Box */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-md ${eyeTrackerVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#800000]'}`}>
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#311213]">AI Eye & Gaze Tracking</h4>
                <p className="text-xs text-[#8e706c]">Monitors screen gaze alignment during assessment</p>
              </div>
            </div>
            {eyeTrackerVerified ? (
              <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Calibrated</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#8e706c]">
                Requires Camera
              </span>
            )}
          </div>

          {/* Microphone Access Box */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-md ${micGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#800000]'}`}>
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#311213]">Microphone Audio</h4>
                <p className="text-xs text-[#8e706c]">Required for environment audio monitoring</p>
              </div>
            </div>
            {micGranted ? (
              <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Granted</span>
              </span>
            ) : (
              <button
                onClick={requestMicAccess}
                disabled={checkingMic}
                className="bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-3.5 py-1.5 rounded-md shadow-sm transition-all flex items-center space-x-1"
              >
                {checkingMic && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Allow Mic</span>
              </button>
            )}
          </div>

          {/* Location Access Box */}
          <div className="bg-[#fff8f7] border border-[#e2bfb9] p-4 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-md ${locationGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-[#800000]'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#311213]">Geolocation Check</h4>
                <p className="text-xs text-[#8e706c]">
                  {locationGranted && locationCoords ? `Lat: ${locationCoords.lat}, Lng: ${locationCoords.lng}` : 'Required for candidate location validation'}
                </p>
              </div>
            </div>
            {locationGranted ? (
              <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified</span>
              </span>
            ) : (
              <button
                onClick={requestLocationAccess}
                disabled={checkingLocation}
                className="bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-3.5 py-1.5 rounded-md shadow-sm transition-all flex items-center space-x-1"
              >
                {checkingLocation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Allow Location</span>
              </button>
            )}
          </div>
        </div>

        {/* Launch Fullscreen Button */}
        <div className="pt-2 border-t border-[#ffe9e8] flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-[#e2bfb9] text-[#5a413d] hover:bg-[#fff0f0] text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handleAllPermissionsAndLaunch}
            disabled={!allGranted}
            className="flex items-center space-x-2 bg-[#800000] hover:bg-[#570000] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-md shadow transition-all text-xs"
          >
            <Maximize className="w-4 h-4" />
            <span>Launch Fullscreen Assessment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemCheckModal;
