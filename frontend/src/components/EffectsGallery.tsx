import React from 'react';
import { useTimelineStore } from '../timeline/state/store';
import { EffectAsset, DropData } from '../timeline/models/types';

interface EffectsGalleryProps {
  className?: string;
}

interface EffectItemProps {
  effect: EffectAsset;
  onDragStart: (e: React.DragEvent, effect: EffectAsset) => void;
}

const EffectItem: React.FC<EffectItemProps> = ({ effect, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, effect)}
      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-move transition-colors border border-gray-700 hover:border-blue-500"
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 flex items-center justify-center bg-blue-600/20 rounded text-blue-400 text-lg">
          {effect.icon || '✨'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {effect.name}
          </h3>
          {effect.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {effect.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Drag indicator */}
      <div className="mt-2 flex items-center justify-center space-x-1 opacity-50">
        <div className="w-1 h-1 bg-gray-500 rounded-full" />
        <div className="w-1 h-1 bg-gray-500 rounded-full" />
        <div className="w-1 h-1 bg-gray-500 rounded-full" />
      </div>
    </div>
  );
};

export const EffectsGallery: React.FC<EffectsGalleryProps> = ({ className = '' }) => {
  const { effectAssets } = useTimelineStore();

  const handleDragStart = (e: React.DragEvent, effect: EffectAsset) => {
    const dragData: DropData = {
      type: 'effect',
      effectAssetId: effect.id,
      effectKind: effect.kind
    };

    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(5deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 25);
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  if (effectAssets.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-400 text-sm">No effects available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-2">Effects Gallery</h2>
        <p className="text-sm text-gray-400">
          Drag effects onto clips or tracks to apply them
        </p>
      </div>
      
      <div className="space-y-3">
        {effectAssets.map((effect) => (
          <EffectItem
            key={effect.id}
            effect={effect}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
      
      {/* Usage instructions */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
        <h3 className="text-sm font-medium text-blue-300 mb-2">How to use:</h3>
        <ul className="text-xs text-blue-200/80 space-y-1">
          <li>• Drop on a clip to apply as clip effect</li>
          <li>• Drop on track to create effect clip</li>
          <li>• Drop on preview header for global effect</li>
        </ul>
      </div>
    </div>
  );
};
