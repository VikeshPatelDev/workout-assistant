function VideoCard({ video }) {
  const handleClick = () => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-4 text-left transition-colors active:bg-gray-600"
    >
      <h3 className="text-lg font-semibold mb-2">
        {video.title}
      </h3>
      <p className="text-sm text-gray-300">
        Tap to watch ▶️
      </p>
    </button>
  );
}

export default VideoCard;

