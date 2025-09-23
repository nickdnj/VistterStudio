import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Video,
  Layers,
  HardDrive,
  Radio,
  SlidersHorizontal,
  MonitorPlay,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Save,
  RefreshCw,
  Eye,
  Lock,
  Trash2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const MIN_CLIP_DURATION = 0.5;
const BASE_SEGMENT_DURATION = 30;

const DRAWERS = [
  { key: 'cameras', label: 'Cameras', icon: Video },
  { key: 'assets', label: 'Assets', icon: Layers },
  { key: 'saved', label: 'Saved Segments', icon: HardDrive },
  { key: 'broadcast', label: 'Broadcast', icon: Radio },
  { key: 'properties', label: 'Properties', icon: SlidersHorizontal },
];

const TRACK_COLORS = {
  video: 'bg-blue-500/90 border-blue-300/40',
  overlay: 'bg-emerald-500/90 border-emerald-300/40',
  audio: 'bg-amber-500/90 border-amber-300/40',
};

const TYPE_ACCENT = {
  video: 'text-blue-300',
  overlay: 'text-emerald-300',
  audio: 'text-amber-300',
};

const TRACK_TYPES = [
  { key: 'video', label: 'Video', color: 'text-blue-300' },
  { key: 'overlay', label: 'Overlay', color: 'text-emerald-300' },
  { key: 'audio', label: 'Audio', color: 'text-amber-300' },
];

const RATE_OPTIONS = [0.5, 1, 2];
const ZOOM_PRESETS = ['30s', '1m', '2m', '5m', '10m'];

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const friendlyTrackName = (type, tracks) => {
  const base = type.charAt(0).toUpperCase() + type.slice(1);
  const count = tracks.filter((track) => track.type === type).length + 1;
  return `${base} ${count}`;
};

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const buildReolinkRtmpUrl = (camera) => {
  const streamType = camera.stream === 0 ? 'main' : 'sub';
  return `rtmp://${camera.ipAddress}:${camera.rtmpPort}/bcs/channel${camera.channel}_${streamType}.bcs?channel=${camera.channel}&stream=${camera.stream}&user=${camera.username}&password=${camera.password}`;
};

const buildReolinkSnapshotUrl = (camera) => {
  return `http://${camera.ipAddress}:${camera.httpPort}/cgi-bin/api.cgi?cmd=Snap&channel=${camera.channel}&rs=vistter&user=${camera.username}&password=${camera.password}`;
};

const computeMaxEnd = (tracks) => {
  let max = 0;
  tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      const start = clip.startTime ?? clip.startMs ?? 0;
      const end = clip.endTime ?? start + (clip.duration ?? 0);
      max = Math.max(max, end);
    });
  });
  return max;
};

const defaultSegment = () => ({
  id: '',
  name: '',
  duration: 60,
  tracks: [
    {
      id: generateId('track'),
      name: 'Main Track',
      type: 'video',
      clips: [
        {
          id: generateId('clip'),
          startTime: 0,
          endTime: 60,
          asset: { type: 'static', path: 'rtmp://test.example.com/live/stream' },
          opacity: 100,
          position: { x: 0, y: 0, width: 1920, height: 1080 },
        },
      ],
    },
    { id: generateId('track'), name: 'Overlay 1', type: 'overlay', clips: [] },
    { id: generateId('track'), name: 'Audio', type: 'audio', clips: [] },
  ],
  assets: [],
  apiConfigs: [],
});

const initialCameras = [
  {
    id: 'camera-1',
    name: 'Reolink Camera',
    type: 'reolink', // Add camera type
    ipAddress: '192.168.86.250',
    rtmpPort: 1935,
    httpPort: 80,
    username: 'Wharfside',
    password: 'Wharfside2025!!',
    channel: 0,
    stream: 0, // 0 for main, 1 for sub
    status: 'Idle',
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const DrawerCard = ({ children }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-2xl shadow-black/20 backdrop-blur-sm">
    {children}
  </div>
);

const TimelineEditor = () => {
  const [segments, setSegments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState('cameras');
  const [cameras, setCameras] = useState(initialCameras);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [selectedClipRef, setSelectedClipRef] = useState(null);
  const [currentSegment, setCurrentSegment] = useState(() => {
    const saved = localStorage.getItem('vistterStudio_currentSegment');
    try {
      return saved ? JSON.parse(saved) : defaultSegment();
    } catch (e) {
      console.error("Error reading from localStorage", e);
      return defaultSegment();
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [zoomPreset, setZoomPreset] = useState('1m');
  const [trackMenuOpen, setTrackMenuOpen] = useState(false);
  const [dragState, setDragState] = useState(null);
  const timelineRef = useRef(null);
  const [timelineWidth, setTimelineWidth] = useState(0);


  const segmentDuration = useMemo(() => {
    const maxEnd = computeMaxEnd(currentSegment.tracks);
    return Math.max(currentSegment.duration || BASE_SEGMENT_DURATION, maxEnd, BASE_SEGMENT_DURATION);
  }, [currentSegment]);

  const totalDuration = useMemo(() => {
    const preset = zoomPreset;
    const unit = preset.slice(-1);
    const value = parseInt(preset.slice(0, -1), 10);
    if (unit === 's') {
      return value;
    }
    if (unit === 'm') {
      return value * 60;
    }
    return 60; // default to 1m
  }, [zoomPreset]);

  useEffect(() => {
    localStorage.setItem('vistterStudio_currentSegment', JSON.stringify(currentSegment));
  }, [currentSegment]);

  useEffect(() => {
    loadSegments();
  }, []);

  useEffect(() => {
    if (!timelineRef.current) return undefined;
    const measure = () => setTimelineWidth(timelineRef.current.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(timelineRef.current);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [timelineRef]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const delta = ((now - last) / 1000) * playbackRate;
      last = now;
      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= segmentDuration) {
          setIsPlaying(false);
          return segmentDuration;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, playbackRate, segmentDuration]);

  useEffect(() => {
    setCurrentTime((prev) => Math.min(prev, segmentDuration));
  }, [segmentDuration]);

  useEffect(() => {
    if (!trackMenuOpen) return undefined;
    const handleClick = () => setTrackMenuOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackMenuOpen]);

  useEffect(() => {
    if (!dragState || timelineWidth === 0) return undefined;

    const handleMove = (event) => {
      event.preventDefault();

      if (dragState.mode === 'scrub') {
        handleScrub(event);
        return;
      }

      const clip = getClip(dragState.trackId, dragState.clipId);
      if (!clip || totalDuration === 0) return;
      const deltaSeconds = ((event.clientX - dragState.startClientX) / timelineWidth) * totalDuration;

      if (dragState.mode === 'move') {
        const clipDuration = dragState.originalEnd - dragState.originalStart;
        const newStart = clamp(dragState.originalStart + deltaSeconds, 0, segmentDuration - clipDuration);
        const newEnd = newStart + clipDuration;
        updateClip(dragState.trackId, dragState.clipId, (current) => ({
          ...current,
          startTime: newStart,
          endTime: newEnd,
        }));
      } else if (dragState.mode === 'resize-start') {
        const newStart = clamp(dragState.originalStart + deltaSeconds, 0, dragState.originalEnd - MIN_CLIP_DURATION);
        updateClip(dragState.trackId, dragState.clipId, (current) => ({
          ...current,
          startTime: newStart,
        }));
      } else if (dragState.mode === 'resize-end') {
        const newEnd = clamp(dragState.originalEnd + deltaSeconds, dragState.originalStart + MIN_CLIP_DURATION, segmentDuration);
        updateClip(dragState.trackId, dragState.clipId, (current) => ({
          ...current,
          endTime: newEnd,
        }));
      }
    };

    const handleUp = () => setDragState(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragState, timelineWidth, totalDuration, segmentDuration]);

  const loadSegments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/segments`);
      setSegments(response.data);
    } catch (error) {
      console.error('Error loading segments:', error);
    }
  };

  const saveSegment = async () => {
    try {
      setIsSaving(true);
      const payload = {
        ...currentSegment,
        id: currentSegment.id?.trim() ? currentSegment.id.trim() : undefined,
      };
      await axios.post(`${API_URL}/api/segments`, payload);
      await loadSegments();
      alert('Segment saved successfully!');
    } catch (error) {
      console.error('Error saving segment:', error);
      alert(error?.response?.data?.error || 'Error saving segment');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSegment = () => {
    setCurrentSegment(defaultSegment());
    setSelectedCameraId(null);
    setSelectedClipRef(null);
    setCurrentTime(0);
  };

  const editSegment = (segment) => {
    setSelectedCameraId(null);
    setSelectedClipRef(null);
    setCurrentSegment({
      id: segment.id,
      name: segment.name || '',
      duration: segment.duration || BASE_SEGMENT_DURATION,
      tracks: segment.tracks || [],
      assets: segment.assets || [],
      apiConfigs: segment.apiConfigs || [],
    });
    setCurrentTime(0);
  };

  const updateSegment = (field, value) => {
    setCurrentSegment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateClip = (trackId, clipId, updater) => {
    setCurrentSegment((prev) => {
      const tracks = prev.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              clips: track.clips.map((clip) => (clip.id === clipId ? updater(clip) : clip)),
            }
          : track
      );
      const maxEnd = Math.max(computeMaxEnd(tracks), BASE_SEGMENT_DURATION);
      return {
        ...prev,
        tracks,
        duration: Math.max(prev.duration, maxEnd),
      };
    });
  };

  const getClip = (trackId, clipId) => {
    const track = currentSegment.tracks.find((t) => t.id === trackId);
    if (!track) return null;
    return track.clips.find((clip) => clip.id === clipId) || null;
  };

  const addTrack = (type = 'video') => {
    setCurrentSegment((prev) => {
      const newTrack = {
        id: generateId('track'),
        name: friendlyTrackName(type, prev.tracks),
        type,
        clips: [],
      };
      return {
        ...prev,
        tracks: [...prev.tracks, newTrack],
      };
    });
  };

  const addClipToTrack = (trackId, clipData) => {
    setCurrentSegment((prev) => {
      const tracks = prev.tracks.map((track) => {
        if (track.id !== trackId) return track;

        let newClip;
        if (clipData) {
          newClip = clipData;
        } else {
          const lastClip = track.clips[track.clips.length - 1];
          const lastEnd = lastClip ? lastClip.endTime ?? lastClip.startTime + (lastClip.duration ?? 0) : 0;
          newClip = {
            id: generateId('clip'),
            startTime: lastEnd,
            endTime: lastEnd + 10,
            asset: { type: 'static', path: 'rtmp://example.com/stream' },
            opacity: 100,
            position: { x: 0, y: 0, width: 1920, height: 1080 },
          };
        }

        return {
          ...track,
          clips: [...track.clips, newClip],
        };
      });
      const maxEnd = Math.max(computeMaxEnd(tracks), BASE_SEGMENT_DURATION);
      return {
        ...prev,
        tracks,
        duration: Math.max(prev.duration, maxEnd),
      };
    });
  };

  const removeClip = (trackId, clipId) => {
    setCurrentSegment((prev) => {
      const tracks = prev.tracks.map((track) =>
        track.id === trackId
          ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
          : track
      );
      const maxEnd = Math.max(computeMaxEnd(tracks), BASE_SEGMENT_DURATION);
      return {
        ...prev,
        tracks,
        duration: Math.max(maxEnd, BASE_SEGMENT_DURATION),
      };
    });
    setSelectedClipRef((prevRef) =>
      prevRef && prevRef.trackId === trackId && prevRef.clipId === clipId ? null : prevRef
    );
  };

  const handleCameraFieldChange = (id, field, value) => {
    setCameras((prev) =>
      prev.map((camera) => (camera.id === id ? { ...camera, [field]: value } : camera))
    );
  };

  const addCamera = () => {
    const newId = generateId('camera');
    const newCamera = {
      id: newId,
      name: `New Camera ${cameras.length + 1}`,
      type: 'reolink',
      ipAddress: '192.168.0.100',
      rtmpPort: 1935,
      httpPort: 80,
      username: 'admin',
      password: '',
      channel: 0,
      stream: 0,
      status: 'Idle',
    };
    setCameras((prev) => [...prev, newCamera]);
  };

  const removeCamera = (id) => {
    setCameras((prev) => prev.filter((camera) => camera.id !== id));
  };

  const handleCameraDragStart = (event, camera) => {
    event.dataTransfer.effectAllowed = 'copy';
    setDragState({
      type: 'camera',
      camera: camera,
    });
  };

  const handleTrackDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleTrackDrop = (event, trackId) => {
    event.preventDefault();
    if (!dragState || dragState.type !== 'camera') return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const dropX = event.clientX - timelineRect.left;
    const dropTime = (dropX / timelineRect.width) * totalDuration;

    const newClip = {
      id: generateId('clip'),
      startTime: dropTime,
      endTime: dropTime + 10, // 10-second default duration
      asset: {
        type: 'camera',
        liveUrl: buildReolinkRtmpUrl(dragState.camera),
        snapshotUrl: buildReolinkSnapshotUrl(dragState.camera),
        camera: dragState.camera, // Store camera details
      },
      opacity: 100,
      position: { x: 0, y: 0, width: 1920, height: 1080 },
    };

    addClipToTrack(trackId, newClip);
    setDragState(null);
  };

  const handleClipStartChange = (rawValue) => {
    if (!selectedClipRef) return;
    const clip = getClip(selectedClipRef.trackId, selectedClipRef.clipId);
    if (!clip) return;
    const end = clip.endTime ?? clip.startTime + (clip.duration ?? 0);
    const value = clamp(rawValue, 0, end - MIN_CLIP_DURATION);
    updateClip(selectedClipRef.trackId, selectedClipRef.clipId, (current) => ({
      ...current,
      startTime: value,
    }));
    setCurrentTime(value);
  };

  const handleClipEndChange = (rawValue) => {
    if (!selectedClipRef) return;
    const clip = getClip(selectedClipRef.trackId, selectedClipRef.clipId);
    if (!clip) return;
    const start = clip.startTime ?? 0;
    const value = clamp(rawValue, start + MIN_CLIP_DURATION, Math.max(start + MIN_CLIP_DURATION, rawValue));
    updateClip(selectedClipRef.trackId, selectedClipRef.clipId, (current) => ({
      ...current,
      endTime: value,
    }));
    setCurrentTime(value);
  };

  const handleClipOpacityChange = (value) => {
    if (!selectedClipRef) return;
    updateClip(selectedClipRef.trackId, selectedClipRef.clipId, (current) => ({
      ...current,
      opacity: value,
    }));
  };

  const handleClipSourceChange = (value) => {
    if (!selectedClipRef) return;
    updateClip(selectedClipRef.trackId, selectedClipRef.clipId, (current) => {
      const newAsset = { ...current.asset };
      if (newAsset.type === 'camera') {
        newAsset.liveUrl = value;
      } else {
        newAsset.path = value;
      }
      return { ...current, asset: newAsset };
    });
  };

  const clearSelection = () => {
    setSelectedCameraId(null);
    setSelectedClipRef(null);
  };

  const totalClips = useMemo(
    () => currentSegment.tracks.reduce((sum, track) => sum + track.clips.length, 0),
    [currentSegment.tracks]
  );

  const timelineMarkers = useMemo(() => {
    const markers = [];
    const divisions = 5;
    for (let i = 0; i <= divisions; i += 1) {
      const ratio = i / divisions;
      markers.push({ ratio, label: formatTime(totalDuration * ratio) });
    }
    return markers;
  }, [totalDuration]);

  const playheadPosition = totalDuration ? clamp((currentTime / totalDuration) * 100, 0, 100) : 0;

  const beginDrag = (event, trackId, clipId, mode) => {
    event.preventDefault();
    event.stopPropagation();
    const clip = getClip(trackId, clipId);
    if (!clip || timelineWidth === 0) return;
    const start = clip.startTime ?? 0;
    const end = clip.endTime ?? start + (clip.duration ?? 0);
    setDragState({
      trackId,
      clipId,
      mode,
      startClientX: event.clientX,
      originalStart: start,
      originalEnd: end,
    });
    setSelectedClipRef({ trackId, clipId });
    setSelectedCameraId(null);
    setActiveDrawer('properties');
  };

  const handleSkip = (delta) => {
    setCurrentTime((prev) => clamp(prev + delta, 0, segmentDuration));
  };

  const selectedCamera = useMemo(
    () => cameras.find((camera) => camera.id === selectedCameraId) || null,
    [cameras, selectedCameraId]
  );

  const selectedClip = useMemo(() => {
    if (!selectedClipRef) return null;
    return getClip(selectedClipRef.trackId, selectedClipRef.clipId);
  }, [selectedClipRef, currentSegment.tracks]);

  const activeClips = useMemo(() => {
    const active = [];
    currentSegment.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (currentTime >= clip.startTime && currentTime < clip.endTime) {
          active.push({ ...clip, trackType: track.type });
        }
      });
    });
    return active;
  }, [currentTime, currentSegment.tracks]);

  const handleScrub = useCallback((event) => {
    if (!timelineRef.current) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    if (timelineRect.width === 0) return;
    const newTime = clamp(
      ((event.clientX - timelineRect.left) / timelineRect.width) * totalDuration,
      0,
      segmentDuration
    );
    setCurrentTime(newTime);
  }, [totalDuration, segmentDuration]);



  const activeDrawerMeta = DRAWERS.find((drawer) => drawer.key === activeDrawer) || DRAWERS[0];
  const ActiveDrawerIcon = activeDrawerMeta.icon;

  const renderDrawerContent = () => {
    if (activeDrawer === 'cameras') {
      return (
        <div className="space-y-3">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              draggable="true"
              onDragStart={(e) => handleCameraDragStart(e, camera)}
              className={`rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-xs shadow-inner shadow-black/30 transition hover:border-blue-500/40 cursor-grab ${
                selectedCameraId === camera.id ? 'border-blue-500/50 bg-blue-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-semibold">{camera.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      camera.status === 'Active' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {camera.status}
                  </span>
                  <button onClick={() => removeCamera(camera.id)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-400">{camera.ipAddress}</p>
              <button
                onClick={() => {
                  setSelectedCameraId(camera.id);
                  setSelectedClipRef(null);
                  setActiveDrawer('properties');
                }}
                className="mt-3 w-full rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-blue-200 hover:bg-blue-500/25"
              >
                Edit
              </button>
            </div>
          ))}
          <button
            onClick={addCamera}
            className="mt-3 w-full rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs font-semibold text-slate-400 hover:border-slate-400 hover:text-slate-200"
          >
            + Add Camera
          </button>
        </div>
      );
    }

    if (activeDrawer === 'saved') {
      return (
        <div className="space-y-3 text-xs">
          {segments.length === 0 ? (
            <p className="text-slate-500">No segments saved yet.</p>
          ) : (
            segments.map((segment) => (
              <div
                key={segment.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-slate-300 transition hover:border-blue-500/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{segment.name || segment.id}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{segment.id}</p>
                  </div>
                  <button
                    onClick={() => editSegment(segment)}
                    className="rounded-lg bg-blue-500/20 px-3 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-500/30"
                  >
                    Load
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{segment.duration}s</span>
                  <span>{new Date(segment.created).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeDrawer === 'properties') {
      if (selectedCamera) {
        const streamTypes = [{ label: 'Main (High Quality)', value: 0 }, { label: 'Sub (Low Quality)', value: 1 }];
        return (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-200">Editing Camera</p>
              <button onClick={clearSelection} className="text-[10px] text-slate-400 hover:text-slate-200">
                clear
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Camera Name</label>
              <input
                type="text"
                value={selectedCamera.name}
                onChange={(e) => handleCameraFieldChange(selectedCamera.id, 'name', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">IP Address</label>
              <input
                type="text"
                value={selectedCamera.ipAddress}
                onChange={(e) => handleCameraFieldChange(selectedCamera.id, 'ipAddress', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Username</label>
                <input
                  type="text"
                  value={selectedCamera.username}
                  onChange={(e) => handleCameraFieldChange(selectedCamera.id, 'username', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Password</label>
                <input
                  type="password"
                  value={selectedCamera.password}
                  onChange={(e) => handleCameraFieldChange(selectedCamera.id, 'password', e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Channel</label>
                <input
                  type="number"
                  value={selectedCamera.channel}
                  onChange={(e) => handleCameraFieldChange(selectedCamera.id, 'channel', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Stream</label>
                <select
                  value={selectedCamera.stream}
                  onChange={(e) => handleCameraFieldChange(selectedCamera.id, 'stream', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-2 text-slate-100"
                >
                  {streamTypes.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      }

      if (selectedClip) {
        return (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-200">Clip Properties</p>
              <button onClick={clearSelection} className="text-[10px] text-slate-400 hover:text-slate-200">
                clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Start (s)</label>
                <input
                  type="number"
                  value={selectedClip.startTime ?? 0}
                  onChange={(e) => handleClipStartChange(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">End (s)</label>
                <input
                  type="number"
                  value={selectedClip.endTime ?? (selectedClip.startTime ?? 0) + (selectedClip.duration ?? 0)}
                  onChange={(e) => handleClipEndChange(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-2 text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Opacity</label>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedClip.opacity ?? 100}
                onChange={(e) => handleClipOpacityChange(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <p className="mt-1 text-[10px] text-slate-400">{selectedClip.opacity ?? 100}%</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Stream URL</label>
              <input
                type="text"
                value={selectedClip.asset?.type === 'camera' ? selectedClip.asset.liveUrl : selectedClip.asset?.path || ''}
                onChange={(e) => handleClipSourceChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
              />
            </div>
            <button
              onClick={() => removeClip(selectedClipRef.trackId, selectedClipRef.clipId)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-rose-200 hover:bg-rose-500/20"
            >
              <Trash2 className="h-4 w-4" /> Remove Clip
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Segment Metadata</p>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Segment ID</label>
          <input
            type="text"
            value={currentSegment.id || ''}
            onChange={(e) => updateSegment('id', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
            placeholder="auto-generated if blank"
          />
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Segment Name</label>
          <input
            type="text"
            value={currentSegment.name}
            onChange={(e) => updateSegment('name', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
          />
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Duration (seconds)</label>
          <input
            type="number"
            value={currentSegment.duration}
            onChange={(e) => updateSegment('duration', parseInt(e.target.value, 10) || currentSegment.duration)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
          />
          <div className="flex gap-2 pt-2">
            <button
              onClick={saveSegment}
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save Segment'}
            </button>
            <button
              onClick={resetSegment}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      );
    }

    if (activeDrawer === 'assets') {
      return <p className="text-xs text-slate-500">Asset management coming soon.</p>;
    }

    if (activeDrawer === 'broadcast') {
      return <p className="text-xs text-slate-500">Broadcast scheduling coming soon.</p>;
    }

    return null;
  };

  return (
    <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-8 py-8">
      <aside className="flex flex-col gap-4 pl-4">
        <DrawerCard>
          <div className="space-y-1 px-2 py-4">
            {DRAWERS.map((drawer) => {
              const Icon = drawer.icon;
              return (
                <button
                  key={drawer.key}
                  onClick={() => setActiveDrawer(drawer.key)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    activeDrawer === drawer.key
                      ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-900/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                  <span className="text-xs uppercase tracking-[0.35em]">{drawer.label}</span>
                </button>
              );
            })}
          </div>
        </DrawerCard>
        <DrawerCard>
          <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
            <ActiveDrawerIcon className="h-4 w-4 text-blue-300" />
            <span>{activeDrawerMeta.label}</span>
          </div>
          <div className="px-4 py-4">{renderDrawerContent()}</div>
        </DrawerCard>
      </aside>

      <main className="space-y-6 pr-4">
        <header className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.35em] text-blue-200">
              VistterStudio
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-white">Timeline Editor</h1>
            <p className="mt-2 text-sm text-slate-400">
              Drag cameras into the timeline, tweak properties, and preview the segment before you sync it to your broadcast node.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2">⏱ {formatTime(totalDuration)} visible</span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" /> API Online
            </span>
          </div>
        </header>

        <section className="min-h-[300px] resize-y overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 text-xs uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2 text-blue-200">
              <MonitorPlay className="h-4 w-4" />
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Playing
              </span>
            </span>
            <span className="flex items-center gap-4 text-slate-500">
              <span>{cameras.length} cameras</span>
              <span>{cameras.filter((c) => c.status === 'Active').length} enabled</span>
            </span>
          </div>
          <div className="relative h-[calc(100%-92px)] min-h-[220px] bg-black">
            {activeClips.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <div className="text-2xl font-semibold text-slate-200">Timeline Preview</div>
                <p className="mt-2 text-sm text-slate-500">Drop cameras from the left to populate this preview.</p>
              </div>
            ) : (
              activeClips.map(clip => {
                if (clip.asset.type === 'camera') {
                  return (
                    <img
                      key={clip.id}
                      src={clip.asset.snapshotUrl}
                      alt="Camera Snapshot"
                      className="absolute h-full w-full object-cover"
                      style={{ opacity: (clip.opacity ?? 100) / 100 }}
                    />
                  );
                }
                // Handle other asset types later
                return null;
              })
            )}
          </div>
        </section>

        <section className="min-h-[300px] resize-y overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-blue-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <div className="flex items-center gap-2">
              <button onClick={() => handleSkip(-5)} className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700">
                <SkipBack className="h-4 w-4" />
              </button>
              <button onClick={() => setIsPlaying((prev) => !prev)} className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={() => handleSkip(5)} className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700">
                <SkipForward className="h-4 w-4" />
              </button>
              <div className="ml-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px]">
                <span>Rate:</span>
                {RATE_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`rounded px-2 py-1 ${
                      playbackRate === rate ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-300">
              <span className="font-mono text-sm text-white">{formatTime(currentTime)}</span>
              <span>/ {formatTime(segmentDuration)}</span>
              <button className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-slate-100">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px]">
                <span>Zoom:</span>
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setZoomPreset(preset)}
                    className={`rounded px-2 py-1 ${
                      zoomPreset === preset ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400">
                {currentSegment.tracks.length} tracks · {totalClips} clips
              </div>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setTrackMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 hover:bg-blue-400"
                >
                  + Add Track
                </button>
                {trackMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-xs text-slate-200 shadow-lg">
                    {TRACK_TYPES.map((track) => (
                      <button
                        key={track.key}
                        onClick={() => {
                          addTrack(track.key);
                          setTrackMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1 hover:bg-slate-800"
                      >
                        <span>{track.label}</span>
                        <span className={track.color}>●</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[160px_1fr] gap-x-4">
            {/* LABELS */}
            <div className="space-y-3 pt-12">
              {currentSegment.tracks.map((track) => {
                const accent = TYPE_ACCENT[track.type] || 'text-slate-400';
                return (
                  <div key={track.id} className="flex h-12 flex-col items-end justify-center gap-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg leading-none ${accent}`}>●</span>
                      <div className="text-right">
                        <p className="font-semibold uppercase tracking-wide text-slate-200">{track.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">{track.type}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Eye className="h-3 w-3" />
                        <Lock className="h-3 w-3" />
                      </div>
                    </div>
                    <button
                      onClick={() => addClipToTrack(track.id)}
                      className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-200 hover:bg-slate-700"
                    >
                      + Clip
                    </button>
                  </div>
                );
              })}
            </div>

            {/* TIMELINE */}
            <div className="relative w-full" ref={timelineRef}>
              {/* Ruler */}
              <div
                onMouseDown={(e) => {
                  setDragState({ mode: 'scrub' });
                  handleScrub(e);
                }}
                className="relative h-8 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer"
              >
                {timelineMarkers.map((marker) => (
                  <div
                    key={marker.ratio}
                    className="absolute top-0 h-full border-l border-slate-800 text-[10px] text-slate-500"
                    style={{ left: `${marker.ratio * 100}%` }}
                  >
                    <span className="absolute -top-4 -translate-x-1/2 text-[11px] text-slate-400">
                      {marker.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Playhead */}
              <div
                className="pointer-events-none absolute top-8 bottom-0 z-20 w-0.5 bg-rose-500"
                style={{ left: `${playheadPosition}%` }}
              >
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragState({ mode: 'scrub' });
                  }}
                  className="pointer-events-auto absolute -top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900 cursor-ew-resize"
                />
              </div>

              {/* Tracks */}
              <div className="relative mt-4 space-y-3">
                {currentSegment.tracks.map((track) => {
                  const clipColor = TRACK_COLORS[track.type] || 'bg-slate-500/80 border-slate-400/40';
                  return (
                    <div
                      key={track.id}
                      onDragOver={handleTrackDragOver}
                      onDrop={(e) => handleTrackDrop(e, track.id)}
                      className="relative h-12 rounded-lg border border-slate-800 bg-slate-900/60"
                    >
                      {track.clips.map((clip) => {
                        const start = clip.startTime ?? clip.startMs ?? 0;
                        const end = clip.endTime ?? start + (clip.duration ?? 0);
                        const duration = Math.max(end - start, MIN_CLIP_DURATION);
                        const widthPercent = totalDuration ? clamp((duration / totalDuration) * 100, 2, 100) : 100;
                        const leftPercent = totalDuration ? clamp((start / totalDuration) * 100, 0, 100) : 0;
                        const opacity = (clip.opacity ?? 100) / 100;
                        return (
                          <div
                            key={clip.id}
                            className={`absolute top-1 bottom-1 flex items-center justify-between rounded-md border px-3 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur transition ${clipColor}`}
                            style={{ width: `${widthPercent}%`, left: `${leftPercent}%`, opacity }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClipRef({ trackId: track.id, clipId: clip.id });
                              setSelectedCameraId(null);
                              setActiveDrawer('properties');
                            }}
                          >
                            <div
                              className="absolute left-0 top-0 h-full w-1 cursor-col-resize"
                              onMouseDown={(e) => beginDrag(e, track.id, clip.id, 'resize-start')}
                            />
                            <div
                              className="flex flex-1 items-center justify-between gap-3 cursor-grab"
                              onMouseDown={(e) => beginDrag(e, track.id, clip.id, 'move')}
                            >
                              <span className="pointer-events-none">
                                {clip.asset?.type === 'static' ? 'Static Feed' : clip.asset?.type || 'Clip'}
                              </span>
                              <span className="pointer-events-none">{formatTime(duration)}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeClip(track.id, clip.id);
                              }}
                              className="absolute right-1 top-1 rounded bg-slate-900/50 p-1 text-slate-100 hover:bg-rose-500/70"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <div
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                              onMouseDown={(e) => beginDrag(e, track.id, clip.id, 'resize-end')}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TimelineEditor;
