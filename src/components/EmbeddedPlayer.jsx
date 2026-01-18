import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { APP_VERSION, BUILD_DATE } from '../version';

// Global default start offset in seconds
const DEFAULT_START_OFFSET_SECONDS = 15;
// Global default end offset in seconds (stop this many seconds before end)
const DEFAULT_END_OFFSET_SECONDS = 3;

function EmbeddedPlayer({ video, onBack, onNext, onPrevious, autoplay = false, onEnded }) {
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

  // Resolve end offset: use video.endOffset if present and valid, otherwise use default
  const resolveEndOffset = () => {
    if (video.endOffset !== undefined && video.endOffset !== null) {
      const offset = Number(video.endOffset);
      if (!isNaN(offset) && offset >= 0) {
        return offset;
      }
    }
    return DEFAULT_END_OFFSET_SECONDS;
  };

  // Resolve mute setting: use video.mute if explicitly set to true, otherwise default to false (unmuted)
  const shouldMute = () => {
    return video.mute === true;
  };

  const videoId = extractVideoId(video.url);
  const startOffset = useMemo(() => resolveStartOffset(), [video.startOffset]);
  const endOffset = useMemo(() => resolveEndOffset(), [video.endOffset]);
  const mute = shouldMute();
  const iframeRef = useRef(null);
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef(null);
  const touchHandledRef = useRef(false);
  
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

  // Early stop logic (stop 5 seconds before end) - always runs regardless of onEnded
  useEffect(() => {
    let ended = false;
    let videoDuration = null;
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

        // Get video duration from infoDelivery (response to getDuration command)
        if (data.event === "infoDelivery" && data.info) {
          if (data.info.duration !== undefined && data.info.duration > 0) {
            videoDuration = data.info.duration;
          }
          
          // Get current time from infoDelivery (response to getCurrentTime command)
          // and check if we should stop early
          if (data.info.currentTime !== undefined && videoDuration !== null && !ended) {
            const currentTime = data.info.currentTime;
            const stopTime = videoDuration - endOffset;
            
            // Stop video 5 seconds (or configured endOffset) before the end
            if (currentTime >= stopTime) {
              ended = true;
              // Stop the video
              try {
                iframe.contentWindow?.postMessage(
                  JSON.stringify({
                    event: "command",
                    func: "pauseVideo",
                    args: []
                  }),
                  "*"
                );
              } catch (e) {
                // Ignore errors
              }
              // Trigger onEnded callback if provided
              if (onEnded) {
                onEnded();
              }
            }
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

      // Start polling to get duration/currentTime for early stop
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
            // Request video duration if we don't have it yet
            if (videoDuration === null) {
              iframe.contentWindow.postMessage(
                JSON.stringify({
                  event: "command",
                  func: "getDuration",
                  args: []
                }),
                "*"
              );
            }
            
            // Request current time to check if we should stop early
            // Only check if we have duration and video hasn't ended
            if (videoDuration !== null && !ended) {
              iframe.contentWindow.postMessage(
                JSON.stringify({
                  event: "command",
                  func: "getCurrentTime",
                  args: []
                }),
                "*"
              );
            }
          } catch (e) {
            // Ignore polling errors
          }
        }, 500); // Poll every 500ms for more accurate time checking and early stopping
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

    return () => {
      window.removeEventListener("message", handleMessage);
      if (iframe) {
        iframe.removeEventListener("load", handleIframeLoad);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [videoId, endOffset, onEnded]);

  // FIX 2: Bulletproof auto-advance with dual trigger (ENDED + time-based fallback)
  // Only runs when onEnded is provided (for superset/circuit mode)
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

  // Auto-hide controls after 4 seconds
  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  // Handle side tap - only show buttons when hidden, don't navigate
  const handleLeftSideTap = useCallback((e) => {
    // Don't trigger if clicking on a button
    if (e.target.closest('button')) {
      return;
    }
    // Prevent default to avoid interfering with video
    if (e.type === 'touchstart' || e.type === 'touchend') {
      e.preventDefault();
      e.stopPropagation();
    }
    // Just show buttons, don't navigate
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleRightSideTap = useCallback((e) => {
    // Don't trigger if clicking on a button
    if (e.target.closest('button')) {
      return;
    }
    // Prevent default to avoid interfering with video
    if (e.type === 'touchstart' || e.type === 'touchend') {
      e.preventDefault();
      e.stopPropagation();
    }
    // Just show buttons, don't navigate
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  // Handle touch end separately to ensure mobile taps work
  const handleLeftSideTouchEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    touchHandledRef.current = true;
    handleLeftSideTap(e);
    // Reset after a short delay
    setTimeout(() => {
      touchHandledRef.current = false;
    }, 300);
  }, [handleLeftSideTap]);

  const handleRightSideTouchEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    touchHandledRef.current = true;
    handleRightSideTap(e);
    // Reset after a short delay
    setTimeout(() => {
      touchHandledRef.current = false;
    }, 300);
  }, [handleRightSideTap]);

  // Reset timer when buttons are interacted with
  const handleButtonInteraction = useCallback(() => {
    setShowControls(true);
    resetHideTimer();
  }, [resetHideTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Reset timer when controls visibility changes
  useEffect(() => {
    if (showControls) {
      resetHideTimer();
    } else {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    }
  }, [showControls, resetHideTimer]);

  // Reset controls visibility when video changes
  useEffect(() => {
    setShowControls(false);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  }, [videoId]);


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-blue-400 active:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-4 py-3 text-lg font-medium min-h-[44px] flex items-center"
          >
            ← Back to videos
          </button>
          <div className="text-xs text-gray-500 flex flex-col items-end">
            <span>v{APP_VERSION}</span>
            <span className="text-gray-600">{BUILD_DATE}</span>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4 px-2">{video.title}</h2>
        <div className="w-full flex flex-col items-center gap-6">
          <div 
            className="relative w-full max-w-md mx-auto" 
            style={{ aspectRatio: '9/16' }}
          >
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={video.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              style={{ border: 'none' }}
            />
            {/* Tap zones on left and right edges - doesn't block center video area */}
            {!showControls && (onPrevious || onNext) && (
              <>
                {/* Left edge tap zone (25% width) */}
                {onPrevious && (
                  <div
                    className="absolute left-0 top-0 bottom-0 cursor-pointer"
                    onClick={(e) => {
                      // Only handle click if touch wasn't already handled
                      if (!touchHandledRef.current) {
                        handleLeftSideTap(e);
                      }
                    }}
                    onTouchEnd={handleLeftSideTouchEnd}
                    style={{ 
                      width: '25%',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      zIndex: 10,
                      pointerEvents: 'auto'
                    }}
                    aria-hidden="true"
                  />
                )}
                {/* Right edge tap zone (25% width) */}
                {onNext && (
                  <div
                    className="absolute right-0 top-0 bottom-0 cursor-pointer"
                    onClick={(e) => {
                      // Only handle click if touch wasn't already handled
                      if (!touchHandledRef.current) {
                        handleRightSideTap(e);
                      }
                    }}
                    onTouchEnd={handleRightSideTouchEnd}
                    style={{ 
                      width: '25%',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      zIndex: 10,
                      pointerEvents: 'auto'
                    }}
                    aria-hidden="true"
                  />
                )}
              </>
            )}
            {/* Overlay navigation buttons - positioned absolutely like native mobile apps */}
            {(onPrevious || onNext) && (
              <>
                {/* Left side - Previous button */}
                {onPrevious && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleButtonInteraction();
                      onPrevious();
                    }}
                    onMouseEnter={handleButtonInteraction}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleButtonInteraction();
                    }}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 backdrop-blur-md text-white font-bold py-3 px-4 rounded-full shadow-xl border-2 border-white/40 min-h-[56px] min-w-[56px] flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 z-20 ${
                      showControls ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                    aria-label="Previous Exercise"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {/* Right side - Next button */}
                {onNext && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleButtonInteraction();
                      onNext();
                    }}
                    onMouseEnter={handleButtonInteraction}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleButtonInteraction();
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 backdrop-blur-md text-white font-bold py-3 px-4 rounded-full shadow-xl border-2 border-white/40 min-h-[56px] min-w-[56px] flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 z-20 ${
                      showControls ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                    aria-label="Next Exercise"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmbeddedPlayer;

