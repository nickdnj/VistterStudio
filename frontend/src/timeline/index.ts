// Timeline module exports
export { Timeline } from './components/Timeline';
export { HeaderRuler } from './components/HeaderRuler';
export { Playhead } from './components/Playhead';
export { TracksSurface } from './components/TracksSurface';
export { ClipView } from './components/ClipView';
export { TimelineTransport } from './components/TimelineTransport';
export { useTimelinePreview } from './components/TimelinePreview';
export { PropertiesDock } from './components/PropertiesDock';

export { useTimelineStore } from './state/store';

export { TimeScale, TickGenerator, TimeFormatter } from './models/TimeScale';
export type { Track, Clip, TimelineViewport, DragState, DropData, PlaybackRate, ZoomPreset } from './models/types';
