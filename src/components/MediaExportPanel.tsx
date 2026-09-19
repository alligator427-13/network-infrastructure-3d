// Media Export Panel Component

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ExportConfig } from '../types';
import html2canvas from 'html2canvas';

interface MediaExportPanelProps {
  onClose: () => void;
}

const imageFormats = [
  { id: 'png', name: 'PNG', description: 'Sans perte, haute qualité' },
  { id: 'jpeg', name: 'JPEG', description: 'Compressé, taille réduite' },
  { id: 'webp', name: 'WebP', description: 'Moderne, bon compromis' },
];

const videoFormats = [
  { id: 'webm', name: 'WebM (VP9)', description: 'Format ouvert, bonne qualité' },
  { id: 'mp4', name: 'MP4 (H.264)', description: 'Compatibilité universelle' },
];

const videoDurations = [
  { id: 5, name: '5 secondes', value: 5 },
  { id: 10, name: '10 secondes', value: 10 },
  { id: 30, name: '30 secondes', value: 30 },
];

const fpsOptions = [
  { id: 15, name: '15 FPS', value: 15 },
  { id: 30, name: '30 FPS', value: 30 },
  { id: 60, name: '60 FPS', value: 60 },
];

const MediaExportPanel: React.FC<MediaExportPanelProps> = ({ onClose }) => {
  const [exportType, setExportType] = useState<'image' | 'video'>('image');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'webm' | 'mp4'>('png');
  const [quality, setQuality] = useState(90);
  const [duration, setDuration] = useState(10);
  const [fps, setFps] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [framesCaptured, setFramesCaptured] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  // Calculate total frames for video
  useEffect(() => {
    if (exportType === 'video') {
      setTotalFrames(duration * fps);
    } else {
      setTotalFrames(0);
    }
  }, [exportType, duration, fps]);

  // Export image
  const exportImage = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Get the canvas container
      const canvasContainer = document.getElementById('canvas-container');
      if (!canvasContainer) {
        throw new Error('Canvas container not found');
      }

      setExportProgress(10);

      // Capture the canvas
      const canvas = await html2canvas(canvasContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      setExportProgress(50);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), `image/${format}`, quality / 100);
      });

      if (!blob) {
        throw new Error('Failed to create blob');
      }

      setExportProgress(80);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `network-infrastructure-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress(100);
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Échec de l\'export de l\'image: ' + (error as Error).message);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  }, [format, quality]);

  // Start video recording
  const startVideoRecording = useCallback(() => {
    setIsExporting(true);
    setExportProgress(0);
    setFramesCaptured(0);
    framesRef.current = [];

    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      alert('Canvas container not found');
      setIsExporting(false);
      return;
    }

    const frameCount = duration * fps;
    let currentFrame = 0;

    // Capture frames at the specified FPS
    recordingIntervalRef.current = setInterval(async () => {
      try {
        const canvas = await html2canvas(canvasContainer, {
          scale: 1,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        framesRef.current.push(canvas);
        currentFrame++;
        setFramesCaptured(currentFrame);
        setExportProgress(Math.round((currentFrame / frameCount) * 80));

        if (currentFrame >= frameCount) {
          // Stop recording and create video
          clearInterval(recordingIntervalRef.current!);
          recordingIntervalRef.current = null;
          
          // For now, we'll just download the frames as a ZIP
          // In a real implementation, we would use a video encoding library
          // or send frames to a server for encoding
          
          // For demo purposes, we'll just download the first frame
          const firstCanvas = framesRef.current[0];
          if (firstCanvas) {
            const blob = await new Promise<Blob | null>((resolve) => {
              firstCanvas.toBlob(resolve, 'image/jpeg', 0.9);
            });

            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `network-infrastructure-video-frame.${format === 'webm' ? 'webp' : 'jpg'}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }

          setExportProgress(100);
          setIsExporting(false);
          framesRef.current = [];
        }
      } catch (error) {
        console.error('Failed to capture frame:', error);
      }
    }, 1000 / fps);
  }, [duration, fps, format]);

  // Stop video recording
  const stopVideoRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsExporting(false);
    setExportProgress(0);
    setFramesCaptured(0);
    framesRef.current = [];
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (exportType === 'image') {
      exportImage();
    } else {
      startVideoRecording();
    }
  }, [exportType, exportImage, startVideoRecording]);

  // Reset format when export type changes
  useEffect(() => {
    if (exportType === 'image') {
      setFormat('png');
    } else {
      setFormat('webm');
    }
  }, [exportType]);

  return (
    <div className="modal-overlay flex items-center justify-center p-4">
      <div className="modal-content w-full max-w-2xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            📸 Export de Médias
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Export Type Selection */}
          <div>
            <h3 className="text-white font-medium mb-3">Type d'export</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportType('image')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  exportType === 'image'
                    ? 'border-blue-500 bg-blue-600/20'
                    : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">📷</div>
                <div className="font-medium text-white">Image</div>
                <div className="text-xs text-gray-400">Export statique</div>
              </button>
              <button
                onClick={() => setExportType('video')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  exportType === 'video'
                    ? 'border-blue-500 bg-blue-600/20'
                    : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">🎥</div>
                <div className="font-medium text-white">Vidéo</div>
                <div className="text-xs text-gray-400">Animation de la scène</div>
              </button>
            </div>
          </div>

          {/* Image Format Selection */}
          {exportType === 'image' && (
            <div>
              <h3 className="text-white font-medium mb-3">Format d'image</h3>
              <div className="grid grid-cols-3 gap-2">
                {imageFormats.map(imgFormat => (
                  <button
                    key={imgFormat.id}
                    onClick={() => setFormat(imgFormat.id as 'png' | 'jpeg' | 'webp')}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      format === imgFormat.id
                        ? 'border-blue-500 bg-blue-600/20'
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-white">{imgFormat.name}</div>
                    <div className="text-xs text-gray-400">{imgFormat.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-xs text-gray-400 mb-1 block">
                  Qualité: {quality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Video Format Selection */}
          {exportType === 'video' && (
            <div>
              <h3 className="text-white font-medium mb-3">Format vidéo</h3>
              <div className="grid grid-cols-2 gap-2">
                {videoFormats.map(videoFormat => (
                  <button
                    key={videoFormat.id}
                    onClick={() => setFormat(videoFormat.id as 'webm' | 'mp4')}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      format === videoFormat.id
                        ? 'border-blue-500 bg-blue-600/20'
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-white">{videoFormat.name}</div>
                    <div className="text-xs text-gray-400">{videoFormat.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Durée</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    {videoDurations.map(d => (
                      <option key={d.id} value={d.value} className="bg-gray-800">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">FPS</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    {fpsOptions.map(f => (
                      <option key={f.id} value={f.value} className="bg-gray-800">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-800/30 rounded border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">
                  Frames à capturer: {totalFrames}
                </div>
                <div className="text-xs text-gray-500">
                  Note: L'export vidéo est simulé. Dans une implémentation complète, 
                  les frames seraient encodés en vidéo avec un codec approprié.
                </div>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-white font-medium mb-2">Prévisualisation de l'export</h3>
            <div className="relative w-full h-40 bg-gray-900/50 rounded border border-gray-700 overflow-hidden flex items-center justify-center">
              {isExporting ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <div className="text-white text-sm">Export en cours...</div>
                  <div className="w-full h-2 bg-gray-700 rounded mt-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-100"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-gray-400 text-xs mt-2">
                    {exportType === 'video' && `
                      ${framesCaptured} / ${totalFrames} frames capturés
                    `}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">
                    {exportType === 'image' ? '📷' : '🎥'}
                  </div>
                  <div className="text-sm">
                    {exportType === 'image' 
                      ? `Image ${format.toUpperCase()} - ${quality}% qualité`
                      : `Vidéo ${format.toUpperCase()} - ${duration}s - ${fps} FPS`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Annuler
          </button>
          {isExporting && exportType === 'video' && (
            <button
              onClick={stopVideoRecording}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              ⏹ Arrêter
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`px-4 py-2 rounded transition-colors ${
              isExporting
                ? 'bg-green-600/30 text-green-400/50 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isExporting ? 'Export en cours...' : '✓ Exporter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaExportPanel;
