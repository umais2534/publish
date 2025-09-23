// apiService.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Get all transcriptions with optional filters
export const getTranscriptionsAPI = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/transcriptions?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
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

// Save a new transcription
export const saveTranscriptionAPI = async (transcriptionData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transcriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(transcriptionData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save transcription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving transcription:', error);
    throw error;
  }
};

// Get a single transcription
export const getTranscriptionAPI = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transcriptions/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transcription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transcription:', error);
    throw error;
  }
};

// Update a transcription
export const updateTranscriptionAPI = async (id: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transcriptions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
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

// Delete a transcription
export const deleteTranscriptionAPI = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transcriptions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
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