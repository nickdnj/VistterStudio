// VistterStudio Shared Types
// Common type definitions used across cloud-editor and broadcast-node

export interface TimelineSegment {
  version: string;
  metadata: {
    id: string;
    name: string;
    duration: number;
    created: string;
    updated: string;
  };
  tracks: Track[];
  assets: Asset[];
  apiConfigs: ApiConfig[];
}

export interface Track {
  id: string;
  type: 'video' | 'overlay' | 'audio' | 'ad';
  clips: Clip[];
}

export interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  asset: AssetReference;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AssetReference {
  type: 'static' | 'dynamic' | 'ad';
  path: string;
  apiConfig?: ApiConfig;
  placeholders?: Record<string, string>;
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'ad';
  path: string;
  metadata: Record<string, any>;
}

export interface ApiConfig {
  id: string;
  type: 'weather' | 'tide' | 'ad';
  endpoint: string;
  apiKey?: string;
  mapping: Record<string, string>;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  conditions: string;
  humidity: number;
}

export interface TideData {
  highTide: string;
  lowTide: string;
  waterLevel: number;
  moonPhase: string;
}

export interface AdData {
  creative: string;
  copy: string;
  link: string;
  duration: number;
}

export interface TimeScale {
  pixelsPerSecond: number;
  startTime: number;
  endTime: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}
