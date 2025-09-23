import axios from 'axios';
import { getAuthToken } from '../services/authService';
const API_BASE_URL = 'http://your-api-url.com/api';

export const saveTranscription = async (transcriptionData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transcriptions`, transcriptionData);
    return response.data;
  } catch (error) {
    console.error('Error saving transcription:', error);
    throw error;
  }
};

export const getTranscriptions = async (filters = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/transcriptions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transcriptions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    throw error;
  }
};
export const deleteTranscription = async (id: string) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/transcriptions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete transcription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting transcription:', error);
    throw error;
  }
};

export const updateTranscription = async (id: string, updates: any) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/transcriptions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update transcription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating transcription:', error);
    throw error;
  }
};
export interface TranscriptionData {
  title: string;
  content: string;
  format: string;
  petName?: string;
  clinicName?: string;
  ownerName?: string;
  visitType?: string;
  templateId?: string;
  duration?: number;
  recordingId?: string;
  date?: string;
}

export interface ApiResponse {
  id: string;
  // Add other response fields as needed
}