import { PauseCircleIcon, PlayCircleIcon } from '@heroicons/react/24/solid';
import { useRef, useState } from 'react';

const CustomAudioPlayer = ({ file, showVolume = true }) => {
    if (!file?.url) {
        return null;
    }

    const audioRef = useRef();
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }
        if (isPlaying) {
            audio.pause();
        } else {
            if (Number.isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
            audio.play().catch(() => {
                setIsPlaying(false);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChante = (e) => {
        const volume = e.target.value;
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        setVolume(volume);
    };

    const handleTimeUpdate = (e) => {
        const audio = audioRef.current;
        if (audio && Number.isFinite(audio.duration)) {
            setDuration(audio.duration);
        }
        setCurrentTime(e.target.currentTime || 0);
    };

    const handleLoadedMetadata = (e) => {
        const newDuration = e.target.duration;
        if (Number.isFinite(newDuration)) {
            setDuration(newDuration);
        }
    };

    const handleSeekChange = (e) => {
        const time = Number(e.target.value) || 0;
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
        setCurrentTime(time);
    };

    return (
        <div className="flex w-full items-center gap-2 rounded-md bg-slate-800 px-3 py-2">
            <audio
                ref={audioRef}
                src={file.url}
                controls
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="hidden"
            />
            <button onClick={togglePlayPause}>
                {isPlaying && <PauseCircleIcon className="w-6 text-gray-400" />}
                {!isPlaying && <PlayCircleIcon className="w-6 text-gray-400" />}
            </button>
            {showVolume && (
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChante}
                />
            )}
            <input
                type="range"
                className="flex-1"
                min="0"
                max={Number.isFinite(duration) ? duration : 0}
                step="0.01"
                value={Number.isFinite(currentTime) ? currentTime : 0}
                onChange={handleSeekChange}
            />
        </div>
    );
};

export default CustomAudioPlayer;
