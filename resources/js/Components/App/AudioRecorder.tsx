import { formatDuration } from '@/utils';
import { MicrophoneIcon, StopCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

type Props = {
    onFileReady?: (file: File) => void;
};

const AudioRecorder = ({ onFileReady }: Props) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingSecondsRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopStream = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

    const clearTimer = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = null;
    };

    useEffect(() => {
        return () => {
            mediaRecorderRef.current?.stop();
            mediaRecorderRef.current = null;
            clearTimer();
            stopStream();
        };
    }, []);

    useEffect(() => {
        if (!isRecording) {
            clearTimer();
            return;
        }

        recordingSecondsRef.current = 0;
        setRecordingSeconds(0);

        intervalRef.current = setInterval(() => {
            recordingSecondsRef.current += 1;
            setRecordingSeconds(recordingSecondsRef.current);
        }, 1000);

        return clearTimer;
    }, [isRecording]);

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        clearTimer();
        setIsRecording(false);
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            console.error('Media devices API not available');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const durationSeconds = recordingSecondsRef.current;
                const timestamp = new Date()
                    .toISOString()
                    .replace(/[:.]/g, '-');
                const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';
                const blob = new Blob(chunks, { type: mimeType });
                const filename = `audio-${timestamp}-${durationSeconds}s.${mimeType.split('/')[1]}`;

                onFileReady?.(
                    new File([blob], filename, {
                        type: blob.type,
                    }),
                );
                clearTimer();
                stopStream();
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            setIsRecording(false);
            console.error('Error accessing microphone:', err);
        }
    };

    const handleMicrophoneClick = () => {
        isRecording ? stopRecording() : startRecording();
    };

    return (
        <div className="flex items-center gap-1">
            <button
                className="btn btn-circle btn-ghost relative inline-flex h-[42px] min-h-[42px] w-[42px] items-center justify-center p-0 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-600"
                type="button"
                onClick={handleMicrophoneClick}
                aria-pressed={isRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                title={isRecording ? 'Stop recording' : 'Start recording'}
            >
                {!isRecording ? (
                    <MicrophoneIcon className="h-5 w-5" />
                ) : (
                    <StopCircleIcon className="h-5 w-5 text-red-500" />
                )}
            </button>

            {isRecording && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    {formatDuration(recordingSeconds)}
                </span>
            )}
        </div>
    );
};

export default AudioRecorder;
