import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Play,
  Pause,
  Trash2,
  Download,
  Calendar,
  Clock,
  FileAudio,
  AlertCircle,
  Upload,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";

interface AudioFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  duration?: number;
  uploadDate: string;
  blobName?: string;
  streamUrl?: string;
}

const AudioFiles = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{[key: string]: number}>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<AudioFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const audioRefs = useRef<{[key: string]: HTMLAudioElement}>({});
  const { getToken } = useAuth();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const getAudioElement = (fileId: string): HTMLAudioElement => {
    if (!audioRefs.current[fileId]) {
      // Create a new audio element if it doesn't exist
      audioRefs.current[fileId] = new Audio();
    }
    return audioRefs.current[fileId];
  };

  useEffect(() => {
    fetchAudioFiles();
    return () => {
      // Clean up audio elements
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      const response = await fetch('http://localhost:5000/api/audio-files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio files: ${response.status}`);
      }
      
      const data = await response.json();
      setAudioFiles(data);
    } catch (err) {
      console.error('Error fetching audio files:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      showNotification('Failed to load audio files', 'error');
    } finally {
      setLoading(false);
    }
  };
const isFormatSupported = (fileName: string, fileType: string): boolean => {
  const audio = document.createElement('audio');
  const supportedTypes = [
    'audio/mpeg', // MP3
    'audio/wav', 
    'audio/ogg',
    'audio/webm'
  ];
  
  // Check if type is explicitly supported
  if (supportedTypes.includes(fileType)) {
    return true;
  }
  
  // Check common unsupported formats
  const unsupportedFormats = ['.m4a', '.aac', '.flac', '.wma'];
  return !unsupportedFormats.some(format => fileName.toLowerCase().endsWith(format));
};
const handlePlayPause = async (file: AudioFile) => {
  try {
    // If already playing this file, pause it
    if (currentlyPlaying === file.id) {
      const audioElement = getAudioElement(file.id);
      audioElement.pause();
      setCurrentlyPlaying(null);
      return;
    }

    // Stop any currently playing audio
    if (currentlyPlaying) {
      const currentAudio = getAudioElement(currentlyPlaying);
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const token = getToken();
    const audioUrl = `http://localhost:5000/api/audio-files/stream/${file.id}?token=${token}`;
    
    console.log('Playing audio:', file.name, 'URL:', audioUrl);

    const newAudio = new Audio();
    newAudio.preload = 'metadata';
    newAudio.src = audioUrl;

    // Add CORS credentials
    newAudio.crossOrigin = 'anonymous';

    newAudio.onerror = (e) => {
      console.error('Audio error:', newAudio.error, 'for file:', file.name);
      showNotification(`Cannot play ${file.name}: ${newAudio.error?.message || 'Format not supported'}`, 'error');
      setCurrentlyPlaying(null);
    };

    newAudio.ontimeupdate = () => {
      if (newAudio.duration && !isNaN(newAudio.duration)) {
        setAudioProgress(prev => ({
          ...prev,
          [file.id]: (newAudio.currentTime / newAudio.duration) * 100
        }));
      }
    };

    newAudio.onended = () => {
      setCurrentlyPlaying(null);
      setAudioProgress(prev => ({
        ...prev,
        [file.id]: 0
      }));
    };

    newAudio.onloadedmetadata = () => {
      console.log('Audio metadata loaded:', file.name, 'Duration:', newAudio.duration);
      
      // Update duration in database if not set
      if (!file.duration && newAudio.duration) {
        updateAudioDuration(file.id, Math.round(newAudio.duration));
      }
    };

    audioRefs.current[file.id] = newAudio;

    try {
      await newAudio.play();
      setCurrentlyPlaying(file.id);
    } catch (playError) {
      console.error('Play error:', playError);
      showNotification('Cannot play this audio file in browser', 'error');
    }

  } catch (error) {
    console.error('Error playing audio:', error);
    showNotification('Error playing audio file', 'error');
  }
};
const canPlayInBrowser = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop();
  const playableFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
  return playableFormats.includes(ext || '');
};
// Add this function to update duration
const updateAudioDuration = async (fileId: string, duration: number) => {
  try {
    const token = getToken();
    await fetch(`http://localhost:5000/api/audio-files/${fileId}/duration`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ duration })
    });
  } catch (err) {
    console.error('Error updating duration:', err);
  }
};
  const handleSeek = (fileId: string, value: number[]) => {
    const audioElement = getAudioElement(fileId);
    if (audioElement && audioElement.duration && !isNaN(audioElement.duration)) {
      audioElement.currentTime = (value[0] / 100) * audioElement.duration;
      setAudioProgress(prev => ({
        ...prev,
        [fileId]: value[0]
      }));
    }
  };

  const handleDownload = async (file: AudioFile) => {
    try {
      const token = getToken();
      const downloadUrl = `http://localhost:5000/api/audio-files/download/${file.id}?token=${token}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showNotification('Download started', 'success');
    } catch (err) {
      console.error('Error downloading file:', err);
      showNotification('Failed to download file', 'error');
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/audio-files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      setAudioFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      showNotification('File deleted successfully');
    } catch (err) {
      console.error('Error deleting file:', err);
      showNotification('Failed to delete file', 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith('audio/')) {
        showNotification('Please select an audio file', 'error');
        return;
      }

      setUploading(true);
      const token = getToken();
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('http://localhost:5000/api/audio-files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('File uploaded successfully!');
        fetchAudioFiles();
      } else {
        showNotification('Upload failed: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Upload failed', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      if (event.target) event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <span>✓</span>
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audio </h2>
      
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {audioFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileAudio className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">No audio files yet</p>
          <p className="text-sm">Upload audio files to see them here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {audioFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-primary" />
                  <span className="truncate">{file.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(file.uploadDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    {file.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(file.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                 <Button
  variant="outline"
  size="icon"
  onClick={() => handlePlayPause(file)}
  className="rounded-full h-10 w-10"
  disabled={uploading || !canPlayInBrowser(file.name)}
  title={canPlayInBrowser(file.name) ? "Play" : "Format not supported in browser"}
>
  {currentlyPlaying === file.id ? (
    <Pause className="h-4 w-4" />
  ) : (
    <Play className="h-4 w-4" />
  )}
</Button>

                    <div className="flex-1 space-y-1">
                      <Slider
                        value={[audioProgress[file.id] || 0]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleSeek(file.id, value)}
                        className="w-full"
                        disabled={!currentlyPlaying}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                
                      
                      <AlertDialog open={deleteDialogOpen && fileToDelete?.id === file.id} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFileToDelete(file)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Audio File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioFiles;