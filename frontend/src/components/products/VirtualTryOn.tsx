'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, StopCircle, Maximize, Loader2, Link2, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface VirtualTryOnProps {
  productImage: string;
  onClose: () => void;
}

export function VirtualTryOn({ productImage, onClose }: VirtualTryOnProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(true);
  const [placementType, setPlacementType] = useState<'necklace' | 'earring'>('necklace');
  const [trackedPosition, setTrackedPosition] = useState<{ x: number, y: number, scale?: number, leftEar?: {x:number, y:number}, rightEar?: {x:number, y:number} } | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Disable AI Background removal to fix extreme loading times
  useEffect(() => {
    setProcessedImage(productImage);
    setIsProcessingAI(false);
  }, [productImage]);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    async function initMediaPipe() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
      } catch (err) {
        console.error("Failed to load FaceLandmarker", err);
      }
    }
    initMediaPipe();
  }, []);

  // Tracking loop
  useEffect(() => {
    if (mode !== 'camera' || !faceLandmarker || !videoRef.current || !containerRef.current) return;

    let lastVideoTime = -1;
    const renderLoop = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const startTimeMs = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const results = faceLandmarker.detectForVideo(video, startTimeMs);
          
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const containerBox = containerRef.current!.getBoundingClientRect();
            
            // Calculate actual rendered video dimensions to fix alignment
            const videoRatio = video.videoWidth / video.videoHeight;
            const containerRatio = containerBox.width / containerBox.height;
            let renderedWidth = containerBox.width;
            let renderedHeight = containerBox.height;
            let offsetX = 0;
            let offsetY = 0;

            if (videoRatio > containerRatio) {
              renderedHeight = containerBox.width / videoRatio;
              offsetY = (containerBox.height - renderedHeight) / 2;
            } else {
              renderedWidth = containerBox.height * videoRatio;
              offsetX = (containerBox.width - renderedWidth) / 2;
            }

            // Map normalized coordinates, factoring in letterboxing and mirroring
            const mapX = (x: number) => offsetX + (1 - x) * renderedWidth;
            const mapY = (y: number) => offsetY + y * renderedHeight;

            if (placementType === 'necklace') {
              // Bottom of chin is landmark 152
              const chin = landmarks[152];
              // Top of forehead is landmark 10 to calculate scale/distance
              const forehead = landmarks[10];
              const faceHeight = Math.abs(chin.y - forehead.y) * containerBox.height;
              
              setTrackedPosition({
                x: mapX(chin.x) - 96, // Center the 192px (w-48) image
                y: mapY(chin.y) + (faceHeight * 0.1), // Drop down slightly from chin for neck
                scale: Math.max(0.5, Math.min(2, faceHeight / 250)) // Scale based on face size
              });
            } else if (placementType === 'earring') {
              // Left earlobe is ~132, Right earlobe is ~361 (from user perspective, so flipped in code)
              const leftEar = landmarks[132];
              const rightEar = landmarks[361];
              
              const faceWidth = Math.abs(leftEar.x - rightEar.x) * containerBox.width;
              const scale = Math.max(0.4, Math.min(1.5, faceWidth / 300));
              
              setTrackedPosition({
                x: 0, y: 0, scale, // base scale
                leftEar: { x: mapX(leftEar.x) - 48, y: mapY(leftEar.y) }, // Offset for 96px image
                rightEar: { x: mapX(rightEar.x) - 48, y: mapY(rightEar.y) }
              });
            }
          } else {
            // No face found, you might want to hide or fallback to drag mode
            // setTrackedPosition(null); 
          }
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [mode, faceLandmarker, placementType]);

  // Stop camera when component unmounts or mode changes
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Camera access denied or unavailable.');
      setMode('select');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setMode('upload');
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-gray-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
            <Maximize className="w-5 h-5 text-fuchsia-400" />
            Virtual Try-On
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div ref={containerRef} className="relative flex-1 bg-black min-h-[500px] flex items-center justify-center overflow-hidden">
          
          {mode === 'select' && (
            <div className="flex flex-col sm:flex-row gap-6 p-8">
              <button 
                onClick={startCamera}
                className="flex flex-col items-center justify-center gap-4 w-48 h-48 rounded-2xl border-2 border-dashed border-fuchsia-500/50 hover:border-fuchsia-400 hover:bg-fuchsia-500/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-fuchsia-400" />
                </div>
                <span className="text-white font-medium">Use Live Camera</span>
              </button>

              <label className="flex flex-col items-center justify-center gap-4 w-48 h-48 rounded-2xl border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all group cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <span className="text-white font-medium">Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {mode === 'camera' && (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-contain pointer-events-none"
              style={{ transform: 'scaleX(-1)' }} // Mirror the camera for natural feel
            />
          )}

          {mode === 'upload' && uploadedImage && (
            <img 
              src={uploadedImage} 
              alt="User Upload" 
              className="w-full h-full object-contain pointer-events-none"
            />
          )}

          {/* Draggable Product Overlay */}
          {(mode === 'camera' || mode === 'upload') && (
            <>
              {/* Type Selector */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-20">
                <button
                  onClick={() => { setPlacementType('necklace'); setTrackedPosition(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${placementType === 'necklace' ? 'bg-fuchsia-500 text-white' : 'text-white/60 hover:text-white'}`}
                >
                  <Droplet size={16} /> Necklace
                </button>
                <button
                  onClick={() => { setPlacementType('earring'); setTrackedPosition(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${placementType === 'earring' ? 'bg-cyan-500 text-white' : 'text-white/60 hover:text-white'}`}
                >
                  <Link2 size={16} /> Earring
                </button>
              </div>

              {/* Render Necklaces */}
              {placementType === 'necklace' && (
                <motion.div 
                  drag={!trackedPosition} // Only allow drag if not tracking
                  dragMomentum={false}
                  className="absolute cursor-grab active:cursor-grabbing z-10"
                  initial={{ x: 0, y: 0 }}
                  style={{ 
                    top: trackedPosition ? 0 : '30%', 
                    left: trackedPosition ? 0 : '40%',
                    transform: trackedPosition ? `translate(${trackedPosition.x}px, ${trackedPosition.y}px) scale(${trackedPosition.scale})` : undefined,
                    transition: trackedPosition ? 'transform 0.05s linear' : 'none'
                  }}
                >
                  <div className="relative group">
                    {!trackedPosition && <div className="absolute -inset-4 border-2 border-dashed border-white/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
                    
                    {isProcessingAI ? (
                      <div className="w-48 h-48 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white/80 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
                        <span className="text-xs font-accent tracking-widest uppercase">Loading...</span>
                      </div>
                    ) : (
                      <img 
                        src={processedImage || productImage} 
                        alt="Product Overlay" 
                        className="w-48 h-48 object-contain drop-shadow-2xl"
                        style={{ mixBlendMode: 'multiply' }}
                        draggable={false}
                      />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Render Earrings */}
              {placementType === 'earring' && (
                <>
                  {!trackedPosition && (
                     <div className="absolute top-[30%] left-[40%] text-white bg-black/50 p-2 rounded">Waiting for face detection...</div>
                  )}
                  {trackedPosition && trackedPosition.leftEar && trackedPosition.rightEar && (
                    <>
                      {/* Left Earring */}
                      <div
                        className="absolute z-10 pointer-events-none"
                        style={{
                          transform: `translate(${trackedPosition.leftEar.x}px, ${trackedPosition.leftEar.y}px) scale(${trackedPosition.scale})`,
                          transition: 'transform 0.05s linear'
                        }}
                      >
                         <img 
                            src={processedImage || productImage} 
                            alt="Left Earring" 
                            className="w-24 h-24 object-contain drop-shadow-2xl"
                            draggable={false}
                          />
                      </div>
                      
                      {/* Right Earring */}
                      <div
                        className="absolute z-10 pointer-events-none"
                        style={{
                          transform: `translate(${trackedPosition.rightEar.x}px, ${trackedPosition.rightEar.y}px) scale(${trackedPosition.scale})`,
                          transition: 'transform 0.05s linear'
                        }}
                      >
                         <img 
                            src={processedImage || productImage} 
                            alt="Right Earring" 
                            className="w-24 h-24 object-contain drop-shadow-2xl"
                            style={{ transform: 'scaleX(-1)' }} // mirror for opposite ear if needed
                            draggable={false}
                          />
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <AnimatePresence>
          {(mode === 'camera' || mode === 'upload') && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-gray-900 border-t border-white/10 flex items-center justify-between"
            >
              <p className="text-sm text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Drag the product to position it perfectly.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { stopCamera(); setMode('select'); }}
                  className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Change Mode
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
