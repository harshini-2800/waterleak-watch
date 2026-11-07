import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../lib/imageCompressor.js';
import toast from 'react-hot-toast';

export default function PhotoUploader({ files = [], onFilesChange, maxFiles = 4 }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`You can upload a maximum of ${maxFiles} photos.`);
      return;
    }

    setIsProcessing(true);
    const newFiles = [...files];

    for (const file of Array.from(selectedFiles)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        continue;
      }

      try {
        const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
        // Create local preview URL
        const previewUrl = URL.createObjectURL(compressed);
        newFiles.push({ file: compressed, previewUrl });
      } catch (err) {
        newFiles.push({ file, previewUrl: URL.createObjectURL(file) });
      }
    }

    onFilesChange(newFiles);
    setIsProcessing(false);
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Drop area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer border-2 border-dashed border-primary-aqua/30 hover:border-primary-aqua/70 rounded-2xl p-6 text-center glass-panel transition-all hover:bg-primary-aqua/5 group"
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary-aqua/10 group-hover:scale-110 text-primary-aqua flex items-center justify-center transition-transform">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div className="text-sm font-semibold text-white">
            <span>Drop photos here or </span>
            <span className="text-primary-aqua underline">browse files</span>
          </div>
          <p className="text-xs text-slate-400">
            JPG, PNG, or WebP up to 5MB each (Up to {maxFiles} photos)
          </p>
        </div>
      </div>

      {/* Mobile Direct Camera Capture Button */}
      <div className="flex justify-center sm:hidden">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
        >
          <Camera className="w-4 h-4 text-primary-aqua" />
          <span>Snap Photo with Camera</span>
        </button>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {files.map((item, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden glass-panel aspect-square border border-white/10 group">
              <img
                src={item.previewUrl}
                alt={`Upload preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background-deep/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors shadow"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-slate-200">
                Photo {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

