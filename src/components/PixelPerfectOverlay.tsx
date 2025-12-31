import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PixelPerfectOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PixelPerfectOverlay = ({ isOpen, onClose }: PixelPerfectOverlayProps) => {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [showControls, setShowControls] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.onerror = () => {
        console.error('Failed to read file');
        alert('Failed to load image. Please ensure the file is a valid image (PNG, JPG, GIF, SVG, etc.) and try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Reference Image Overlay */}
      <AnimatePresence>
        {referenceImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${referenceImage})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 pointer-events-auto bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg min-w-[280px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Pixel Perfect Mode
              </h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close (Ctrl+Shift+P)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-2">
                Reference Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload reference design image"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  {referenceImage ? 'Change Image' : 'Upload Image'}
                </button>
                {referenceImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="px-3 py-2 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Opacity Slider */}
            {referenceImage && (
              <div className="mb-4">
                <label className="block text-xs text-muted-foreground mb-2">
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  aria-label="Adjust overlay opacity"
                />
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Upload a reference design image</p>
              <p>• Adjust opacity to compare</p>
              <p>• Press Ctrl+Shift+P to toggle</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Controls Button */}
      {!showControls && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowControls(true)}
          className="absolute top-4 right-4 pointer-events-auto bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
          title="Show Controls"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.button>
      )}

      {/* Minimize Controls Button (when controls are shown) */}
      {showControls && (
        <button
          onClick={() => setShowControls(false)}
          className="absolute top-16 right-4 pointer-events-auto text-muted-foreground/60 hover:text-foreground transition-colors text-xs"
          title="Minimize Controls"
        >
          Hide Controls
        </button>
      )}
    </div>
  );
};
