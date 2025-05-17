import React, { useEffect, useState, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';

const VideoPreview = ({ videoRef, isPlaying, currentTime, duration, tracks, onTimeUpdate }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);

  // Find the video clip at the current time position
  useEffect(() => {
    const videoTrack = tracks.find(track => track.type === 'video');
    if (!videoTrack || !videoTrack.clips.length) {
      setActiveVideo(null);
      return;
    }

    // Find clips that overlap with the current time
    const activeClips = videoTrack.clips.filter(clip => {
      const start = clip.start;
      const end = clip.start + clip.duration;
      return currentTime >= start && currentTime < end;
    });

    // Use the first found clip (in a real editor, this would be more complex with compositing)
    setActiveVideo(activeClips[0] || null);
  }, [currentTime, tracks]);

  // Update time when playing
  useEffect(() => {
    if (!isPlaying || !videoRef.current || !isReady) return;
    
    const timer = setInterval(() => {
      if (videoRef.current) {
        const newTime = videoRef.current.getCurrentTime();
        onTimeUpdate(newTime);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [isPlaying, isReady, onTimeUpdate, videoRef]);

  // Handle video progress for loading indicator
  const handleProgress = ({ loaded, loadedSeconds, played, playedSeconds }) => {
    setLoadingProgress(loaded);
  };

  // Handle when video is ready to play
  const handleReady = () => {
    setIsReady(true);
    setLoadingProgress(1);
    setPlaybackError(false);
  };
  
  // Handle playback errors
  const handleError = (e) => {
    console.error("Video playback error:", e);
    setPlaybackError(true);
    setLoadingProgress(0);
  };

  // Seek to the specific time
  useEffect(() => {
    if (videoRef.current && isReady) {
      videoRef.current.seekTo(currentTime, 'seconds');
    }
  }, [currentTime, isReady, videoRef]);

  // If there's a video clip, render it in the player
  const renderPlayer = () => {
    if (activeVideo) {
      // Check if we have the original file (for uploaded videos)
      const videoSource = activeVideo.file ? 
        URL.createObjectURL(activeVideo.file) : // Create a fresh URL from the file
        activeVideo.src; // Use the existing src for sample videos or already processed videos
      
      return (
        <ReactPlayer
          ref={videoRef}
          url={videoSource}
          playing={isPlaying}
          controls={false}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onReady={handleReady}
          onError={handleError}
          progressInterval={100}
          playsinline
          pip={false}
          stopOnUnmount={true}
          config={{
            file: {
              forceVideo: true,
              attributes: {
                crossOrigin: "anonymous",
                controlsList: "nodownload",
                className: 'video-player',
                disablePictureInPicture: true,
                disableRemotePlayback: true
              },
              // Include more file format support
              forceDASH: false,
              forceHLS: false,
              forceVideo: true
            }
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* Video player container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Loading indicator */}
        {loadingProgress < 1 && activeVideo && !playbackError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {/* Error indicator */}
        {playbackError && activeVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 text-white">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto mb-2 text-red-500">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              <p>Error playing video</p>
              <button 
                className="mt-2 text-sm bg-editor-primary px-3 py-1 rounded"
                onClick={() => {
                  setPlaybackError(false);
                  if (videoRef.current) {
                    videoRef.current.seekTo(currentTime, 'seconds');
                  }
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Video player */}
        <div className="w-full h-full">
          {renderPlayer()}
        </div>
        
        {/* Empty state when no video is active */}
        {!activeVideo && (
          <div className="w-full h-full flex flex-col items-center justify-center text-editor-text-muted">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center p-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-20">
                <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-medium mb-2">No Video Selected</h3>
              <p className="text-sm opacity-70">Add media from the library panel to get started</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;