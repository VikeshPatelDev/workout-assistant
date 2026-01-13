import { useState, useEffect, useRef } from 'react';

function RestTimer() {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  const startTimer = (seconds) => {
    setTimeRemaining(seconds);
    setIsActive(true);
    setIsCompleted(false);
  };

  const stopTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(0);
    setIsCompleted(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if timer is not active, no time remaining, and not completed
  if (!isActive && timeRemaining === 0 && !isCompleted) {
    return (
      <div className="fixed bottom-6 right-4 z-50">
        <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-gray-700">
          <div className="flex flex-col gap-3">
            <div className="text-white text-xs font-medium mb-1 text-center">Rest Timer</div>
            <div className="flex gap-2">
              <button
                onClick={() => startTimer(30)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl min-w-[60px] min-h-[48px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Start 30 second timer"
              >
                30s
              </button>
              <button
                onClick={() => startTimer(60)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl min-w-[60px] min-h-[48px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Start 60 second timer"
              >
                60s
              </button>
              <button
                onClick={() => startTimer(90)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl min-w-[60px] min-h-[48px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Start 90 second timer"
              >
                90s
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-4 z-50">
      <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border border-gray-700 min-w-[200px]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-white text-xs font-medium">Rest Timer</div>
          <div className="text-4xl font-bold text-white tabular-nums">
            {formatTime(timeRemaining)}
          </div>
          <div className="flex gap-2 w-full">
            {isActive ? (
              <button
                onClick={stopTimer}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-xl min-h-[48px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Stop timer"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={() => setIsActive(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-4 rounded-xl min-h-[48px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Resume timer"
              >
                Resume
              </button>
            )}
            <button
              onClick={resetTimer}
              className="flex-1 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl min-h-[48px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Reset timer"
            >
              Reset
            </button>
          </div>
          {isCompleted && (
            <div className="text-green-400 text-sm font-medium animate-pulse">
              Time's up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestTimer;

