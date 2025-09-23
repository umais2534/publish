// Mock service for handling call recordings and transcriptions
// In a real application, this would interact with a backend API

export interface CallRecording {
  id: string;
  petId?: string;
  petName?: string;
  ownerId?: string;
  ownerName?: string;
  clinicId?: string;
  clinicName?: string;
  visitType?: string;
  duration: number;
  date: Date;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  status?: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: Date;
}

// In-memory storage for demo purposes
let callRecordings: CallRecording[] = [];

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Save a call recording
export const saveCallRecording = async (
  audioBlob: Blob,
  metadata: {
    petId?: string;
    petName?: string;
    ownerId?: string;
    ownerName?: string;
    clinicId?: string;
    clinicName?: string;
    visitType?: string;
    duration: number;
  },
): Promise<CallRecording> => {
  // In a real app, this would upload the audio to a storage service
  // and then call a backend API to save the metadata

  // Create an object URL for the audio blob (for demo purposes)
  const audioUrl = URL.createObjectURL(audioBlob);

  const newRecording: CallRecording = {
    id: generateId(),
    petId: metadata.petId,
    petName: metadata.petName,
    ownerId: metadata.ownerId,
    ownerName: metadata.ownerName,
    clinicId: metadata.clinicId,
    clinicName: metadata.clinicName,
    visitType: metadata.visitType,
    duration: metadata.duration,
    date: new Date(),
    audioUrl,
    status: "pending",
  };

  // In a real app, this would be an API call
  callRecordings.push(newRecording);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return newRecording;
};

// Get all call recordings
export const getCallRecordings = async (): Promise<CallRecording[]> => {
  // In a real app, this would be an API call
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [...callRecordings];
};

// Get call recordings for a specific pet
export const getPetCallRecordings = async (
  petId: string,
): Promise<CallRecording[]> => {
  // In a real app, this would be an API call
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return callRecordings.filter((recording) => recording.petId === petId);
};

// Approve a transcription
export const approveTranscription = async (
  recordingId: string,
  doctorName: string = "Dr. Smith",
): Promise<CallRecording> => {
  // In a real app, this would call an API to update the transcription status
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const recordingIndex = callRecordings.findIndex((r) => r.id === recordingId);

  if (recordingIndex === -1) {
    throw new Error(`Recording with ID ${recordingId} not found`);
  }

  // Update the recording with the approved status
  const updatedRecording = {
    ...callRecordings[recordingIndex],
    status: "approved" as const,
    approvedBy: doctorName,
    approvedDate: new Date(),
  };

  callRecordings[recordingIndex] = updatedRecording;

  return updatedRecording;
};

// Reject a transcription
export const rejectTranscription = async (
  recordingId: string,
): Promise<CallRecording> => {
  // In a real app, this would call an API to update the transcription status
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const recordingIndex = callRecordings.findIndex((r) => r.id === recordingId);

  if (recordingIndex === -1) {
    throw new Error(`Recording with ID ${recordingId} not found`);
  }

  // Update the recording with the rejected status
  const updatedRecording = {
    ...callRecordings[recordingIndex],
    status: "rejected" as const,
  };

  callRecordings[recordingIndex] = updatedRecording;

  return updatedRecording;
};

// Transcribe a call recording
export const transcribeCallRecording = async (
  recordingId: string,
): Promise<CallRecording> => {
  // In a real app, this would call a transcription service API
  // Simulate API delay and processing time
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const recordingIndex = callRecordings.findIndex((r) => r.id === recordingId);

  if (recordingIndex === -1) {
    throw new Error(`Recording with ID ${recordingId} not found`);
  }

  // Check if already transcribed
  if (callRecordings[recordingIndex].transcription) {
    return callRecordings[recordingIndex];
  }

  // Generate a mock transcription based on pet name for consistency
  const petName = callRecordings[recordingIndex].petName;
  let transcription = "";

  // Pet-specific mock transcriptions for consistency
  const mockTranscriptions: Record<string, string> = {
    Max: "Veterinarian: Hello, this is Dr. Smith from PurrScribe Veterinary Clinic. How is Max doing today?\nOwner: Hi doctor, Max has been eating well but I've noticed he's drinking more water than usual.\nVeterinarian: I see. Has there been any change in his urination habits?\nOwner: Yes, he seems to be using the litter box more frequently.\nVeterinarian: We should schedule an appointment to check his blood sugar and kidney function.",
    Bella:
      "Veterinarian: Good morning, I'm calling about Bella's recent vaccination appointment.\nOwner: Yes, how is she doing?\nVeterinarian: She's recovering well. I wanted to remind you that she'll need a follow-up booster in three weeks.\nOwner: Great, I'll make sure to schedule that.",
    Charlie:
      "Veterinarian: I'm calling regarding Charlie's skin condition. The lab results from the skin scraping came back.\nOwner: What did they show?\nVeterinarian: We found evidence of Demodex mites. I'd like to start him on a treatment plan with Bravecto and a medicated shampoo.\nOwner: How soon can we begin treatment?\nVeterinarian: You can pick up the prescription today.",
    Luna: "Veterinarian: Hello, I'm calling about Luna's recent visit. How is she doing after the medication change?\nOwner: She seems to be doing better. Her appetite has improved.\nVeterinarian: That's great to hear. Has there been any vomiting or diarrhea?\nOwner: No, those symptoms have stopped.\nVeterinarian: Excellent. Let's continue with the current medication for another week.",
    Oliver:
      "Veterinarian: Hi, I'm calling to check on Oliver after his dental cleaning.\nOwner: He's doing well, eating soft food as recommended.\nVeterinarian: Perfect. Has there been any bleeding from the extraction sites?\nOwner: No, everything looks clean.\nVeterinarian: Great. You can start transitioning back to his regular food in a few days.",
    Buddy:
      "Veterinarian: Hello, I'm following up on Buddy's allergy testing results.\nOwner: Yes, I've been waiting for those.\nVeterinarian: We found he's allergic to certain grains and chicken. I'd recommend switching to a specialized diet.\nOwner: Do you have specific brands you recommend?\nVeterinarian: Yes, I'll email you a list of hypoallergenic options that would work well for him.",
  };

  // Get the transcription for the specific pet or use a generic one
  transcription =
    mockTranscriptions[petName] ||
    "Veterinarian: Hello, this is Dr. Smith from PurrScribe Veterinary Clinic. I'm calling about your pet's recent visit.\nOwner: Yes, how are they doing?\nVeterinarian: They're doing well. I just wanted to follow up on the treatment plan we discussed.\nOwner: Thank you for checking in.\nVeterinarian: Please let us know if you notice any changes in their condition.";

  // Update the recording with the transcription
  const updatedRecording = {
    ...callRecordings[recordingIndex],
    transcription,
  };

  callRecordings[recordingIndex] = updatedRecording;

  return updatedRecording;
};

// Summarize a transcription
export const summarizeTranscription = async (
  recordingId: string,
): Promise<CallRecording> => {
  // In a real app, this would call an AI service API for summarization
  // Simulate API delay and processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const recordingIndex = callRecordings.findIndex((r) => r.id === recordingId);

  if (recordingIndex === -1) {
    throw new Error(`Recording with ID ${recordingId} not found`);
  }

  // Check if already summarized
  if (callRecordings[recordingIndex].summary) {
    return callRecordings[recordingIndex];
  }

  // Ensure the recording has a transcription first
  if (!callRecordings[recordingIndex].transcription) {
    // If no transcription exists, create one first
    await transcribeCallRecording(recordingId);
  }

  // Generate a mock summary based on the pet name
  const mockSummaries: Record<string, string> = {
    Max: "Owner reports increased water consumption and urination. Recommended blood panel to check for diabetes or kidney issues. Follow-up appointment scheduled in 2 weeks.",
    Bella:
      "Reminder call about upcoming booster vaccination in three weeks. Pet is recovering well from initial vaccination.",
    Charlie:
      "Lab results showed Demodex mites. Treatment plan includes Bravecto and medicated shampoo. Owner will pick up prescription today.",
    Luna: "Pet is responding well to medication change. Appetite has improved and digestive symptoms have resolved. Continue current medication for one more week.",
    Oliver:
      "Post-dental cleaning follow-up. Pet is eating soft food with no complications. No bleeding from extraction sites. Can transition back to regular food in a few days.",
    Buddy:
      "Allergy testing results show sensitivity to grains and chicken. Recommended switching to specialized hypoallergenic diet. Veterinarian will email list of suitable food options.",
  };

  // Update the recording with a summary
  const petName = callRecordings[recordingIndex].petName;
  const summary =
    mockSummaries[petName] ||
    "Call discussed pet's health status and treatment options. Follow-up appointment recommended.";

  const updatedRecording = {
    ...callRecordings[recordingIndex],
    summary,
  };

  callRecordings[recordingIndex] = updatedRecording;

  return updatedRecording;
};

// Delete a call recording
export const deleteCallRecording = async (
  recordingId: string,
): Promise<void> => {
  // In a real app, this would be an API call
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const recordingIndex = callRecordings.findIndex((r) => r.id === recordingId);

  if (recordingIndex !== -1) {
    // If there's an object URL, revoke it to prevent memory leaks
    if (callRecordings[recordingIndex].audioUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(callRecordings[recordingIndex].audioUrl!);
    }

    callRecordings.splice(recordingIndex, 1);
  }
};
