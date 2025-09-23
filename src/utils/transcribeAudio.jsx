// src/utils/transcribeAudio.jsx
/**
 * Uploads an audio file to your backend /api/transcribe endpoint
 * Returns transcribed text (string)
 */
export async function transcribeAudio(audioFile, serverUrl = '/api/transcribe') {
  if (!audioFile) throw new Error('No audio file provided');

  const formData = new FormData();
  formData.append('audio', audioFile);

  const res = await fetch(serverUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Transcription failed: ${res.status} ${res.statusText} ${text}`);
  }

  const data = await res.json();
  return data.text || '';
}
