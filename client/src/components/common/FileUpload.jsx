import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowUpTrayIcon,
  MicrophoneIcon,
  StopIcon,
  DocumentIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function FileUpload({
  folder = 'uploads',
  accept = 'image/*',
  value = '',
  onChange,
  onUpload,
  label = 'Upload File',
  enableVoice = false,
  className = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      setProgress(50);
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProgress(100);
      const url = res.data.data.url;
      toast.success('Upload successful!');
      if (onUpload) onUpload(url, res.data.data);
      if (onChange) onChange(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Voice recording support
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast('Recording audio note...', { icon: '🎙️' });
    } catch (err) {
      toast.error('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <ArrowUpTrayIcon className="w-4 h-4 text-primary-400" />
          {uploading ? `Uploading (${progress}%)...` : label}
        </button>

        {enableVoice && (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploading}
            className={`text-xs py-2 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              isRecording
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-dark-700 hover:bg-dark-600 border-dark-600 text-dark-100/70'
            }`}
          >
            {isRecording ? (
              <>
                <StopIcon className="w-4 h-4" /> Stop & Send
              </>
            ) : (
              <>
                <MicrophoneIcon className="w-4 h-4 text-secondary-400" /> Voice Note
              </>
            )}
          </button>
        )}

        {value && (
          <div className="flex items-center gap-2 text-xs text-dark-100/60 overflow-hidden">
            {accept.includes('image') ? (
              <img src={value} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-dark-600 flex-shrink-0" />
            ) : (
              <DocumentIcon className="w-5 h-5 text-primary-400 flex-shrink-0" />
            )}
            <span className="truncate max-w-[200px]">{value}</span>
          </div>
        )}
      </div>

      {uploading && (
        <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
