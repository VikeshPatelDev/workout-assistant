import VideoCard from './VideoCard';

function VideoList({ videos }) {
  return (
    <div className="space-y-4 p-4">
      {videos.map((video, index) => (
        <VideoCard key={index} video={video} />
      ))}
    </div>
  );
}

export default VideoList;

