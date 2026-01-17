import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import VideoThumbnailCard from '../components/VideoThumbnailCard';
import EmbeddedPlayer from '../components/EmbeddedPlayer';
import SubCategoryGrid from '../components/SubCategoryGrid';
import workoutData from '../data/categorised_workout_v2.json';

function Category() {
  const { id } = useParams();
  const category = workoutData.categories.find((cat) => cat.id === id);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState("single"); // "single" | "superset" | "circuit"
  const [activePlaylist, setActivePlaylist] = useState([]); // Store the playlist for superset/circuit mode
  const [isSelectionMode, setIsSelectionMode] = useState(false); // Toggle for selection mode

  // Helper to check if two videos are the same
  const isSameVideo = (v1, v2) => {
    return v1 && v2 && v1.url === v2.url && v1.title === v2.title;
  };

  // Toggle video selection
  const handleToggleVideo = (video) => {
    setSelectedVideos((prev) => {
      const isSelected = prev.some((v) => isSameVideo(v, video));
      if (isSelected) {
        return prev.filter((v) => !isSameVideo(v, video));
      } else {
        return [...prev, video];
      }
    });
  };

  // Start Superset mode
  const handleStartSuperset = () => {
    if (selectedVideos.length === 2) {
      setMode("superset");
      setCurrentIndex(0);
      setActivePlaylist([...selectedVideos]); // Store the playlist
      setSelectedVideo(selectedVideos[0]);
      setSelectedVideos([]); // Clear selection UI after starting
      setIsSelectionMode(false); // Exit selection mode
    }
  };

  // Start Circuit mode
  const handleStartCircuit = () => {
    if (selectedVideos.length >= 3) {
      setMode("circuit");
      setCurrentIndex(0);
      setActivePlaylist([...selectedVideos]); // Store the playlist
      setSelectedVideo(selectedVideos[0]);
      setSelectedVideos([]); // Clear selection UI after starting
      setIsSelectionMode(false); // Exit selection mode
    }
  };

  // Cancel selection mode
  const handleCancelSelection = () => {
    setSelectedVideos([]);
    setIsSelectionMode(false);
  };

  // Breadcrumb navigation handler
  const handleBreadcrumbClick = (level) => {
    if (level === 'home') {
      setSelectedSubCategory(null);
      setSelectedVideo(null);
      setMode("single");
      setCurrentIndex(0);
      setSelectedVideos([]);
      setActivePlaylist([]);
      setIsSelectionMode(false);
    } else if (level === 'category') {
      setSelectedSubCategory(null);
      setSelectedVideo(null);
      setMode("single");
      setCurrentIndex(0);
      setSelectedVideos([]);
      setActivePlaylist([]);
      setIsSelectionMode(false);
    } else if (level === 'subcategory') {
      setSelectedVideo(null);
      setMode("single");
      setCurrentIndex(0);
      setSelectedVideos([]);
      setActivePlaylist([]);
      setIsSelectionMode(false);
    }
  };

  // Breadcrumb component
  const Breadcrumb = () => {
    const breadcrumbItems = [
      { label: 'Home', level: 'home', clickable: true },
    ];

    if (category) {
      breadcrumbItems.push({ label: category.label, level: 'category', clickable: selectedSubCategory !== null || selectedVideo !== null });
    }

    if (selectedSubCategory) {
      breadcrumbItems.push({ label: selectedSubCategory.label, level: 'subcategory', clickable: selectedVideo !== null });
    }

    if (selectedVideo) {
      breadcrumbItems.push({ label: selectedVideo.title, level: 'video', clickable: false });
    }

    return (
      <nav className="mb-4 px-2" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-500" aria-hidden="true">
                  →
                </span>
              )}
              {item.clickable ? (
                <button
                  onClick={() => handleBreadcrumbClick(item.level)}
                  className="text-blue-400 active:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 min-h-[44px] flex items-center transition-colors"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-300 px-2 py-1 min-h-[44px] flex items-center">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <Link to="/" className="text-blue-400 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Determine which videos to show based on category type
  const isHierarchical = category.type === 'hierarchical';
  const isFlat = category.type === 'flat';
  
  let videosToShow = [];
  let currentTitle = category.label;

  if (isHierarchical) {
    if (selectedSubCategory) {
      // Show videos for selected sub-category
      videosToShow = selectedSubCategory.videos || [];
      currentTitle = selectedSubCategory.label;
    } else {
      // Show sub-category grid
      return (
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-6">
            <Breadcrumb />
            <h1 className="text-3xl font-bold mb-6">{category.label}</h1>
            <SubCategoryGrid
              subCategories={category.subCategories || []}
              onSelectSubCategory={setSelectedSubCategory}
            />
          </div>
        </div>
      );
    }
  } else if (isFlat) {
    // Show videos directly for flat categories
    videosToShow = category.videos || [];
  }

  // If a video is selected, show the embedded player
  if (selectedVideo !== null) {
    // Determine if we're in superset/circuit mode
    const isSupersetOrCircuit = mode === "superset" || mode === "circuit";
    
    // Navigation logic
    let hasNext = false;
    let handleNext = undefined;
    let hasPrevious = false;
    let handlePrevious = undefined;
    let isLastExercise = false;
    let exerciseCount = 0;
    let shouldAutoplay = false;
    let handleVideoEnded = undefined;
    
    if (isSupersetOrCircuit) {
      // In superset/circuit mode, use activePlaylist
      exerciseCount = activePlaylist.length;
      hasNext = currentIndex < activePlaylist.length - 1;
      hasPrevious = currentIndex > 0;
      isLastExercise = currentIndex === activePlaylist.length - 1;
      
      handleNext = () => {
        if (hasNext) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setSelectedVideo(activePlaylist[nextIndex]);
        }
      };

      handlePrevious = () => {
        if (hasPrevious) {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setSelectedVideo(activePlaylist[prevIndex]);
        }
      };

      // Superset and Circuit mode: autoplay first exercise, auto-advance on end for all (except last)
      if (mode === "superset" || mode === "circuit") {
        shouldAutoplay = currentIndex === 0; // Only first exercise autoplays
        // Auto-advance to next exercise when video ends (for all videos except last)
        if (hasNext) {
          handleVideoEnded = () => {
            handleNext();
          };
        }
      }
    } else {
      // Single mode navigation
      const currentIndexInList = videosToShow.findIndex(
        (v) => isSameVideo(v, selectedVideo)
      );
      hasNext = currentIndexInList >= 0 && currentIndexInList < videosToShow.length - 1;
      hasPrevious = currentIndexInList > 0;
      
      handleNext = () => {
        if (hasNext) {
          const nextVideo = videosToShow[currentIndexInList + 1];
          setSelectedVideo(nextVideo);
        }
      };

      handlePrevious = () => {
        if (hasPrevious) {
          const prevVideo = videosToShow[currentIndexInList - 1];
          setSelectedVideo(prevVideo);
        }
      };
      // Single mode: no autoplay (unchanged)
      shouldAutoplay = false;
    }

    // Show "Next Exercise" button when there's a next video (in all modes)
    const shouldShowNextButton = hasNext;
    // Show "Previous Exercise" button when there's a previous video (in all modes)
    const shouldShowPreviousButton = hasPrevious;

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Breadcrumb />
          {isSupersetOrCircuit && (
            <div className="mb-4 px-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-semibold text-blue-400">
                  {mode === "superset" ? "Superset" : "Circuit"} Mode
                </span>
                <span className="text-sm text-gray-400">
                  Exercise {currentIndex + 1} of {exerciseCount}
                </span>
              </div>
            </div>
          )}
        </div>
        <EmbeddedPlayer
          video={selectedVideo}
          autoplay={shouldAutoplay}
          onEnded={handleVideoEnded}
          onBack={() => {
            setSelectedVideo(null);
            setMode("single");
            setCurrentIndex(0);
            setActivePlaylist([]);
            setIsSelectionMode(false);
          }}
          onNext={shouldShowNextButton ? handleNext : undefined}
          onPrevious={shouldShowPreviousButton ? handlePrevious : undefined}
        />
      </div>
    );
  }

  // Check selection state
  const canStartSuperset = selectedVideos.length === 2;
  const canStartCircuit = selectedVideos.length >= 3;

  // Show video thumbnail grid
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{currentTitle}</h1>
          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`px-4 py-2 font-semibold rounded-lg min-h-[44px] transition-colors focus:outline-none focus:ring-2 ${
              isSelectionMode
                ? 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white focus:ring-gray-500'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500'
            }`}
          >
            {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videosToShow.map((video, index) => {
            const isSelected = selectedVideos.some((v) => isSameVideo(v, video));
            return (
              <VideoThumbnailCard
                key={index}
                video={video}
                onSelect={isSelectionMode ? undefined : setSelectedVideo}
                isSelected={isSelected}
                onToggleSelect={isSelectionMode ? handleToggleVideo : undefined}
                selectionMode={isSelectionMode}
              />
            );
          })}
        </div>
      </div>
      
      {/* Floating Action Bar */}
      {isSelectionMode && selectedVideos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-700 p-4 min-w-[280px] max-w-[90vw]">
          <div className="flex flex-col gap-3">
            <div className="text-center text-sm text-gray-300 mb-1">
              {selectedVideos.length} {selectedVideos.length === 1 ? 'exercise' : 'exercises'} selected
            </div>
            <div className="flex gap-2">
              {canStartSuperset && (
                <button
                  onClick={handleStartSuperset}
                  className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3 px-4 rounded-xl min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Start Superset
                </button>
              )}
              {canStartCircuit && (
                <button
                  onClick={handleStartCircuit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-3 px-4 rounded-xl min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Start Circuit
                </button>
              )}
              <button
                onClick={handleCancelSelection}
                className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel selection"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;

