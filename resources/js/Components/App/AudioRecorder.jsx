import { MicrophoneIcon, StopCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const AudioRecorder = ({ fileReady }) => {
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);

    const onMicrophoneClick = async () => {
        if (recording) {
            setRecording(false);
            if (mediaRecorder) {
                mediaRecorder.stop();
                setMediaRecorder(null);
            }
            return;
        }
        setRecording(true);
        try {
            const supportedTypes = [
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus',
                'audio/webm',
                'audio/ogg',
            ];
            const mimeType = supportedTypes.find((type) =>
                MediaRecorder.isTypeSupported(type),
            );
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const newMediaRecorder = new MediaRecorder(stream, {
                mimeType,
            });
            const chunks = [];

            newMediaRecorder.addEventListener('dataavailable', (e) => {
                if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                }
            });

            newMediaRecorder.addEventListener('stop', () => {
                stream.getTracks().forEach((track) => track.stop());

                if (!chunks.length) {
                    return;
                }

                const blobType = mimeType || 'audio/webm;codecs=opus';
                let audioBlob = new Blob(chunks, {
                    type: blobType,
                });

                const ext = blobType.includes('ogg') ? 'ogg' : 'webm';

                let audioFile = new File([audioBlob], `recording.${ext}`, {
                    type: blobType,
                });
                const url = URL.createObjectURL(audioFile);

                if (typeof fileReady === 'function') {
                    fileReady(audioFile, url);
                }
            });

            newMediaRecorder.start();
            setMediaRecorder(newMediaRecorder);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setRecording(false);
        }
    };

    return (
        <button
            onClick={onMicrophoneClick}
            className="hover-text-gray-300 p-1 text-gray-400"
        >
            {recording && <StopCircleIcon className="w-6 text-red-600" />}
            {!recording && <MicrophoneIcon className="w-6" />}
        </button>
    );
};

export default AudioRecorder;
