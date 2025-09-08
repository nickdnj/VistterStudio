import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';

const VideoPlayer = forwardRef(({ 
  src, 
  poster, 
  className = "", 
  autoPlay = true, 
  muted = true,
  onLoadStart = null,
  onError = null,
  onCanPlay = null
}, ref) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Expose video element to parent component
  useImperativeHandle(ref, () => videoRef.current, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      // Use HLS.js for HLS streams
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.1,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(console.warn);
        }
        if (onLoadStart) {
          onLoadStart(video);
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        if (onCanPlay) {
          onCanPlay(video);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, destroying HLS instance:', data);
              hls.destroy();
              if (onError) {
                onError(data);
              }
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      if (autoPlay) {
        video.play().catch(console.warn);
      }
      if (onLoadStart) {
        onLoadStart(video);
      }
    } else {
      console.warn('HLS not supported on this browser');
      if (onError) {
        onError(new Error('HLS not supported'));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      muted={muted}
      autoPlay={autoPlay}
      playsInline
      controls
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
