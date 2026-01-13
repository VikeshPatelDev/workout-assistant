import { useEffect, useRef } from 'react';
import RestTimer from './RestTimer';

// Global default start offset in seconds
const DEFAULT_START_OFFSET_SECONDS = 15;

function EmbeddedPlayer({ video, onBack, onNext, onPrevious, showRestTimer = true, autoplay = false, onEnded }) {
  // Extract video ID from various YouTube URL formats
  // Handles: watch URLs (?v=VIDEO_ID), Shorts URLs (/shorts/VIDEO_ID), embed URLs (/embed/VIDEO_ID)
  const extractVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Prefer query param 'v' when present (for watch URLs)
      const vParam = urlObj.searchParams.get('v');
      if (vParam) {
        return vParam;
      }
      
      // Check for Shorts URLs: /shorts/VIDEO_ID
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return shortsMatch[1];
      }
      
      // Check for embed URLs: /embed/VIDEO_ID
      const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) {
        return embedMatch[1];
      }
      
      // Fallback: extract from pathname (last non-empty segment)
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const videoId = pathParts[pathParts.length - 1];
        // Basic validation: YouTube video IDs are typically 11 characters
        if (videoId && videoId.length >= 10) {
          return videoId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  };

  // Resolve start offset: use video.startOffset if present and valid, otherwise use default
  const resolveStartOffset = () => {
    if (video.startOffset !== undefined && video.startOffset !== null) {
      const offset = Number(video.startOffset);
      if (!isNaN(offset) && offset >= 0) {
        return offset;
      }
    }
    return DEFAULT_START_OFFSET_SECONDS;
  };

  // Resolve mute setting: use video.mute if explicitly set to true, otherwise default to false (unmuted)
  const shouldMute = () => {
    return video.mute === true;
  };

  const videoId = extractVideoId(video.url);
  const startOffset = resolveStartOffset();
  const mute = shouldMute();
  const iframeRef = useRef(null);
  
  if (!videoId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <button
          onClick={onBack}
          className="mb-6 text-blue-400 active:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          ← Back to videos
        </button>
        <p className="text-red-400">Error: Could not extract video ID from URL</p>
      </div>
    );
  }

  // Build embed URL with conditional autoplay, start offset, and optional mute
  // Note: We use iframe API for autoplay (playVideo command) which doesn't require mute
  const embedUrlParams = new URLSearchParams();
  embedUrlParams.append('enablejsapi', '1');
  // Don't add autoplay=1 to URL - we use iframe API instead for unmuted autoplay
  embedUrlParams.append('start', startOffset.toString());
  // Add mute param only if explicitly requested (not for autoplay)
  if (mute) {
    embedUrlParams.append('mute', '1');
  }
  const embedUrl = `https://www.youtube.com/embed/${videoId}?${embedUrlParams.toString()}`;

  // FIX 1: Deterministic autoplay using iframe API
  useEffect(() => {
    if (!autoplay || !iframeRef.current) return;

    const iframe = iframeRef.current;

    const play = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "*"
      );
    };

    const timer = setTimeout(play, 800); // allow iframe to fully initialize
    return () => clearTimeout(timer);
  }, [autoplay, videoId]);

  // FIX 2: Bulletproof auto-advance with dual trigger (ENDED + time-based fallback)
  useEffect(() => {
    if (!onEnded) return;

    let ended = false;
    const iframe = iframeRef.current;

    const handleMessage = (event) => {
      // Check for YouTube origin
      const isYouTubeOrigin = 
        event.origin === "https://www.youtube.com" ||
        event.origin === "https://www.youtube-nocookie.com" ||
        event.origin.includes('youtube.com');
      
      if (!isYouTubeOrigin) return;

      try {
        let data;
        if (typeof event.data === 'string') {
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
        } else {
          data = event.data;
        }
        
        // Handle onStateChange events
        if (data.event === "onStateChange") {
          const state = typeof data.info === 'number' ? data.info : data.data;
          // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          if (state === 0 && !ended) {
            // 0 = ENDED
            ended = true;
            onEnded();
          }
        }
        
        // Also check for infoDelivery events (alternative format)
        if (data.event === "infoDelivery" && data.info && data.info.playerState !== undefined) {
          const state = data.info.playerState;
          if (state === 0 && !ended) {
            ended = true;
            onEnded();
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener("message", handleMessage);

    // Register for YouTube events and set up polling
    let pollInterval = null;
    
    const registerForEvents = () => {
      if (!iframe?.contentWindow) return;
      
      // Send listening message - required to receive events
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: "listening",
            id: window.location.href,
            channel: "widget"
          }),
          "*"
        );
      } catch (e) {
        // Ignore registration errors
      }

      // Start polling as backup method
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          if (!iframe?.contentWindow || ended) {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            return;
          }

          try {
            // Request current player state
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "getPlayerState",
                args: []
              }),
              "*"
            );
          } catch (e) {
            // Ignore polling errors
          }
        }, 2000); // Poll every 2 seconds
      }
    };

    // Wait for iframe to load
    const handleIframeLoad = () => {
      // Wait for YouTube API to initialize
      setTimeout(registerForEvents, 1500);
    };

    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad);
      // If already loaded, trigger after delay
      setTimeout(() => {
        if (iframe.contentWindow) {
          handleIframeLoad();
        }
      }, 1500);
    }

    // ⏱️ Shorts fallback — auto-advance after 65s if no END signal
    const fallbackTimer = setTimeout(() => {
      if (!ended) {
        ended = true;
        onEnded();
      }
    }, 65000);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (iframe) {
        iframe.removeEventListener("load", handleIframeLoad);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      clearTimeout(fallbackTimer);
    };
  }, [onEnded, videoId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <button
          onClick={onBack}
          className="mb-4 text-blue-400 active:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-4 py-3 text-lg font-medium min-h-[44px] flex items-center"
        >
          ← Back to videos
        </button>
        <h2 className="text-xl font-bold mb-4 px-2">{video.title}</h2>
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-md mx-auto" style={{ aspectRatio: '9/16' }}>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={video.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        </div>
      </div>
      {showRestTimer && <RestTimer />}
      {(onPrevious || onNext) && (
        <div className="fixed bottom-6 left-4 z-50 flex gap-3">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-6 rounded-2xl shadow-2xl border-2 border-blue-500 min-h-[48px] flex items-center gap-2 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-400"
              aria-label="Previous Exercise"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span className="text-lg">Previous Exercise</span>
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 px-6 rounded-2xl shadow-2xl border-2 border-green-500 min-h-[48px] flex items-center gap-2 transition-colors focus:outline-none focus:ring-4 focus:ring-green-400"
              aria-label="Next Exercise"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-lg">Next Exercise</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmbeddedPlayer;

