import React, { useState, useRef, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useAuth } from '../../context/AuthContext';
import {
  Mic,
  Pause,
  StopCircle,
  Play,
  Save,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
  FileText,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Define TemplateField and VisitTypeTemplate interfaces
interface TemplateField {
  name: string;
  label: string;
  pattern: RegExp;
  value: string;
}

interface VisitTypeTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  fields: TemplateField[];
}

// Sample templates with field definitions
const VisitTypeTemplates: VisitTypeTemplate[] = [
  {
    id: "soap",
    name: "SOAP Notes Template",
    description: "Subjective, Objective, Assessment, Plan format",
    template: `SOAP NOTES

PATIENT INFORMATION:
Name of Pet: {petName}
Age: {age}
Species: {species}
Breed: {breed}
Owner: {owner}
Visit Type: {visitType}
Date: {date}

SUBJECTIVE:
{subject}

OBJECTIVE:
{object}

ASSESSMENT:
{assessment}

PLAN:
{plan}`,
    fields: [
      { name: "petName", label: "Name of Pet", pattern: /./, value: "" },
      { name: "age", label: "Age", pattern: /./, value: "" },
      { name: "species", label: "Species", pattern: /./, value: "" },
      { name: "breed", label: "Breed", pattern: /./, value: "" },
      { name: "owner", label: "Owner", pattern: /./, value: "" },
      { name: "visitType", label: "Visit Type", pattern: /./, value: "" },
      { name: "subject", label: "Subjective", pattern: /./, value: "" },
      { name: "object", label: "Objective", pattern: /./, value: "" },
      { name: "assessment", label: "Assessment", pattern: /./, value: "" },
      { name: "plan", label: "Plan", pattern: /./, value: "" }
    ]
  },
  {
    id: "medical",
    name: "Medical Examination Template",
    description: "Comprehensive medical examination notes",
    template: `MEDICAL EXAMINATION REPORT

Patient: {petName}
Age: {age}
Species: {species}
Breed: {breed}
Owner: {owner}
Date: {date}

VITAL SIGNS:
Temperature: {temperature}
Heart Rate: {heartRate}
Respiratory Rate: {respiratoryRate}

PHYSICAL EXAM:
Eyes: {eyes}
Ears: {ears}
Nose: {nose}
Mouth: {mouth}
Skin: {skin}
Cardiac: {cardiac}
Respiratory: {respiratory}
Abdominal: {abdominal}
Musculoskeletal: {musculoskeletal}
Neurological: {neurological}

ASSESSMENT:
{assessment}

TREATMENT PLAN:
{treatmentPlan}`,
    fields: [
      { name: "petName", label: "Patient", pattern: /./, value: "" },
      { name: "age", label: "Age", pattern: /./, value: "" },
      { name: "species", label: "Species", pattern: /./, value: "" },
      { name: "breed", label: "Breed", pattern: /./, value: "" },
      { name: "owner", label: "Owner", pattern: /./, value: "" },
      { name: "temperature", label: "Temperature", pattern: /./, value: "" },
      { name: "heartRate", label: "Heart Rate", pattern: /./, value: "" },
      { name: "respiratoryRate", label: "Respiratory Rate", pattern: /./, value: "" },
      { name: "eyes", label: "Eyes", pattern: /./, value: "" },
      { name: "ears", label: "Ears", pattern: /./, value: "" },
      { name: "nose", label: "Nose", pattern: /./, value: "" },
      { name: "mouth", label: "Mouth", pattern: /./, value: "" },
      { name: "skin", label: "Skin", pattern: /./, value: "" },
      { name: "cardiac", label: "Cardiac", pattern: /./, value: "" },
      { name: "respiratory", label: "Respiratory", pattern: /./, value: "" },
      { name: "abdominal", label: "Abdominal", pattern: /./, value: "" },
      { name: "musculoskeletal", label: "Musculoskeletal", pattern: /./, value: "" },
      { name: "neurological", label: "Neurological", pattern: /./, value: "" },
      { name: "assessment", label: "Assessment", pattern: /./, value: "" },
      { name: "treatmentPlan", label: "Treatment Plan", pattern: /./, value: "" }
    ]
  }
];

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age?: string;
  owner: string;
}

interface Clinic {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface RecordingInterfaceProps {
  onSave?: (transcription: {
    text: string;
    format: string;
    petId?: string;
    clinicId?: string;
    visitType?: string;
    templateId?: string;
  }) => void;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  onSave = () => {},
}) => {
  const { isAuthenticated, getToken } = useAuth();
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // State for recording
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [format, setFormat] = useState("raw");
  const [transcriptionText, setTranscriptionText] = useState("");
  const [editableText, setEditableText] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Audio file upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState("");
  const [isTranscribingUpload, setIsTranscribingUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pet and clinic selection
  const [selectedPet, setSelectedPet] = useState<string | undefined>();
  const [selectedClinic, setSelectedClinic] = useState<string | undefined>();
  const [visitType, setVisitType] = useState<string>("");
  const [isAddPetDialogOpen, setIsAddPetDialogOpen] = useState(false);
  const [isAddClinicDialogOpen, setIsAddClinicDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<VisitTypeTemplate | null>(null);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [newPet, setNewPet] = useState<Partial<Pet>>({
    name: "",
    species: "",
    breed: "",
    owner: "",
  });
  const [newClinic, setNewClinic] = useState<Partial<Clinic>>({
    name: "",
  });
  const [recordingUUID, setRecordingUUID] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Waveform data
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(5));

  // Mock data
  const mockPets = [
    { id: "1", name: "Max", species: "Dog", breed: "Golden Retriever", age: "5 years", owner: "John Smith" },
    { id: "2", name: "Bella", species: "Cat", breed: "Siamese", age: "3 years", owner: "Sarah Johnson" },
    { id: "3", name: "Charlie", species: "Dog", breed: "Beagle", age: "2 years", owner: "Michael Brown" },
  ];

  const mockClinics = [
    { id: "1", name: "Main Street Veterinary Clinic", address: "123 Main St", city: "Springfield", state: "IL" },
    { id: "2", name: "Animal Care Center", address: "456 Oak Ave", city: "Riverdale", state: "IL" },
    { id: "3", name: "Pet Health Hospital", address: "789 Pine Rd", city: "Lakeside", state: "IL" },
  ];

  const visitTypes = [
    "Annual Checkup", "Vaccination", "Illness", "Injury", 
    "Surgery Follow-up", "Dental Cleaning", "Emergency", "Other"
  ];

  const API_URL = "http://localhost:5000/api/transcribe";

  useEffect(() => {
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    setRecordingUUID(generateUUID());
  }, []);

  // FIXED: Dynamic field detection that works with any template
  const parseTemplateFields = (transcript: string, fields: TemplateField[]): TemplateField[] => {
    // Create a copy of the fields array with current values preserved
    const updatedFields = fields.map(field => ({...field}));
    
    // Create a lowercase transcript for easier matching
    const lowerTranscript = transcript.toLowerCase();
    
    // Process each field in order
    updatedFields.forEach(field => {
      // Skip if field already has a value
      if (field.value) return;
      
      // Create a pattern to find this specific field
      const fieldLabel = field.label.toLowerCase();
      const fieldIndex = lowerTranscript.indexOf(fieldLabel);
      
      if (fieldIndex !== -1) {
        // Find the text after this field label
        const textAfterField = transcript.substring(fieldIndex + fieldLabel.length);
        
        // Look for the next field label or end of string
        let nextFieldIndex = Infinity;
        
        // Check all other fields to see which comes next
        updatedFields.forEach(otherField => {
          if (otherField.name !== field.name && !otherField.value) {
            const otherFieldLabel = otherField.label.toLowerCase();
            const otherFieldPos = lowerTranscript.indexOf(otherFieldLabel, fieldIndex);
            if (otherFieldPos !== -1 && otherFieldPos < nextFieldIndex) {
              nextFieldIndex = otherFieldPos;
            }
          }
        });
        
        // Extract the value between this field and the next one
        let value = '';
        if (nextFieldIndex !== Infinity) {
          // Extract text from after current field to before next field
          const textBeforeNextField = transcript.substring(
            fieldIndex + fieldLabel.length, 
            nextFieldIndex
          );
          value = textBeforeNextField.trim();
        } else {
          // No next field found, take everything after this field
          value = textAfterField.trim();
        }
        
        // Clean up the value - remove colons and other punctuation at start
        value = value.replace(/^[:-\s]+/, '').trim();
        
        // Remove any trailing punctuation
        value = value.replace(/[.,;:!?]$/, '').trim();
        
        // For short fields (name, age, etc.), take only the first few words
        if (field.name === 'petName' || field.name === 'age' || field.name === 'species' || 
            field.name === 'breed' || field.name === 'owner' || field.name === 'visitType') {
          const words = value.split(/\s+/);
          value = words.slice(0, 3).join(' '); // Take max 3 words for short fields
        }
        
        // Update the field value if we found something meaningful
        if (value) {
          const fieldIndex = updatedFields.findIndex(f => f.name === field.name);
          if (fieldIndex !== -1) {
            updatedFields[fieldIndex].value = value;
          }
        }
      }
    });
    
    return updatedFields;
  };

  // Add this function to reset all field values
  const resetFieldValues = () => {
    if (selectedTemplate) {
      setTemplateFields(selectedTemplate.fields.map(field => ({...field, value: ""})));
    }
  };

  // Helper function to generate filled template
  const generateFilledTemplate = (template: string, fields: TemplateField[]): string => {
    let filledTemplate = template;
    
    fields.forEach(field => {
      const placeholder = `{${field.name}}`;
      filledTemplate = filledTemplate.replace(placeholder, field.value || "");
    });
    
    // Also replace the predefined variables
    const pet = mockPets.find((p) => p.id === selectedPet);
    const clinic = mockClinics.find((c) => c.id === selectedClinic);
    
    return filledTemplate
      .replace(/\{PET_NAME\}/g, pet?.name || "")
      .replace(/\{OWNER_NAME\}/g, pet?.owner || "")
      .replace(/\{CLINIC_NAME\}/g, clinic?.name || "")
      .replace(/\{VISIT_TYPE\}/g, visitType || "")
      .replace(/\{DATE\}/g, new Date().toLocaleDateString());
  };

  // Update template text when details change
  useEffect(() => {
    if (selectedTemplate) {
      const newTemplateText = generateFilledTemplate(selectedTemplate.template, templateFields);
      setTemplateText(newTemplateText);
      
      // For live recording, don't show NOTES section
      if (isRecording) {
        setEditableText(`${newTemplateText}\n\n--- LIVE DICTATION ---\n${speechText}`);
      } 
      // For uploaded audio, show NOTES section
      else if (transcriptionResult) {
        setEditableText(`${newTemplateText}\n\n--- NOTES ---\n${transcriptionResult}`);
      } 
      // For initial state
      else {
        setEditableText(newTemplateText);
      }
    } else {
      setTemplateText("");
      // For live recording, don't show NOTES section
      if (isRecording) {
        setEditableText(speechText);
      } 
      // For uploaded audio, show NOTES section
      else if (transcriptionResult) {
        setEditableText(transcriptionResult);
      } 
      // For initial state
      else {
        setEditableText("");
      }
    }
  }, [selectedTemplate, selectedPet, selectedClinic, visitType, templateFields]);

  // Update speech text during recording
  useEffect(() => {
    if (isRecording && selectedTemplate) {
      setSpeechText(transcript);
      
      // Parse the transcript for template fields
      const updatedFields = parseTemplateFields(transcript, selectedTemplate.fields);
      setTemplateFields(updatedFields);
      
      // Generate the filled template
      const filledTemplate = generateFilledTemplate(selectedTemplate.template, updatedFields);
      
      // For live recording, don't show NOTES section
      setEditableText(`${filledTemplate}\n\n--- LIVE DICTATION ---\n${transcript}`);
    } else if (isRecording) {
      setSpeechText(transcript);
      // For live recording, don't show NOTES section
      setEditableText(transcript);
    }
    
    // Update hasContent state
    setHasContent(!!transcript || !!editableText || !!transcriptionResult);
  }, [transcript, isRecording, editableText, transcriptionResult]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioStreamRef.current && audioContextRef.current) {
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const source = audioContextRef.current.createMediaStreamSource(audioStreamRef.current);
        source.connect(analyser);
        analyserRef.current = analyser;
        updateWaveform();
      }
    }
    return () => {
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    };
  }, [isRecording, isPaused]);

  const updateWaveform = () => {
    if (!isRecording || isPaused || !analyserRef.current) return;
    
    // Create a new Uint8Array each time instead of using the ref
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // This should work without type errors
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const newWaveformData = Array(50).fill(0);
    const step = Math.floor(dataArray.length / 50);
    
    for (let i = 0; i < 50; i++) {
      const index = i * step;
      if (index < dataArray.length) {
        newWaveformData[i] = (dataArray[index] / 255) * 80;
      }
    }
    
    setWaveformData(newWaveformData);
    requestAnimationFrame(updateWaveform);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      resetTranscript();
      setTranscriptionResult("");
      setHasContent(true);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const uploadAudioFile = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/audio-files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Audio upload failed');
      }
      
      const result = await response.json();
      return result.audioFile?.url || null; 
    } catch (error) {
      console.error('Audio upload error:', error);
      return null;
    }
  };

  const transcribeAudioFile = async () => {
    if (!audioFile) return;
    
    setIsTranscribingUpload(true);
    setUploadProgress(0);
    setTranscriptionResult("");
    
    try {
      // Step 1: Upload audio file to server
      setUploadProgress(30);
      const uploadedAudioUrl = await uploadAudioFile(audioFile);
      
      if (!uploadedAudioUrl) {
        throw new Error('Audio file upload failed');
      }
      
      // Step 2: Transcribe the audio
      setUploadProgress(60);
      const formData = new FormData();
      formData.append('audio', audioFile);

      const transcriptionText = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(60 + Math.round((e.loaded / e.total) * 30));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const json = JSON.parse(xhr.responseText);
              resolve(json.text || '');
            } catch (err) {
              reject(new Error('Invalid JSON response from server'));
            }
          } else {
            reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      // Step 3: Parse template fields from the transcription
      let finalText = transcriptionText;
      let detectedFields: TemplateField[] = [];
      
      if (selectedTemplate) {
        // Parse fields from the uploaded audio transcription
        detectedFields = parseTemplateFields(transcriptionText, selectedTemplate.fields);
        setTemplateFields(detectedFields);
        
        // Generate the filled template with detected fields
        const filledTemplate = generateFilledTemplate(selectedTemplate.template, detectedFields);
        
        // For uploaded audio, show NOTES section
        finalText = `${filledTemplate}\n\n--- NOTES ---\n${transcriptionText}`;
      } else {
        // For uploaded audio without template, show NOTES section
        finalText = `--- NOTES ---\n${transcriptionText}`;
      }
      
      setEditableText(finalText);
      setTranscriptionResult(transcriptionText);
      setTranscriptionText(finalText);
      setUploadProgress(100);
      setHasContent(true);
      
      // Step 4: Automatically save as call recording with audio URL
      await saveTranscriptionAsCallRecording(finalText, transcriptionText, uploadedAudioUrl);
      
    } catch (err: any) {
      setTranscriptionResult(`❌ Transcription failed: ${err.message}`);
    } finally {
      setIsTranscribingUpload(false);
    }
  };

  const saveTranscriptionAsCallRecording = async (fullText: string, rawTranscription: string, audioUrl: string) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping auto-save');
      return;
    }

    const token = getToken();
    if (!token) {
      console.log('No authentication token found');
      return;
    }

    const pet = selectedPet ? mockPets.find(p => p.id === selectedPet) : null;
    const clinic = selectedClinic ? mockClinics.find(c => c.id === selectedClinic) : null;

    const transcriptionData = {
      title: selectedTemplate 
        ? `${selectedTemplate.name} - ${pet?.name || ''}`
        : `${pet?.name || 'Audio Recording'} - ${visitType || 'Call'}`,
      content: fullText,
      category: 'Call Recording',
      petName: pet?.name,
      clinicName: clinic?.name,
      visitType: visitType,
      templateName: selectedTemplate?.name,
      recordingDuration: Math.floor(audioRef.current?.duration || 0),
      audioUrl: audioUrl,
      isCallRecording: true
    };

    try {
      const response = await fetch('http://localhost:5000/api/transcriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transcriptionData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const result = await response.json();
      console.log('Audio transcription saved with audio URL:', result);
    
      
    } catch (error: any) {
      console.error('Failed to save transcription with audio:', error);
      alert(`Failed to save transcription: ${error.message}`);
    }
  };

  const handleTemplateSelect = (template: VisitTypeTemplate) => {
    setSelectedTemplate(template);
    // Reset all field values when selecting a new template
    setTemplateFields(template.fields.map(field => ({...field, value: ""})));
    setIsTemplateDialogOpen(false);
    
    if (template.name.toLowerCase().includes("soap")) {
      setFormat("soap");
    } else if (template.name.toLowerCase().includes("medical")) {
      setFormat("medical");
    } else {
      setFormat("raw");
    }
    
    // Generate initial template with pet/clinic info
    const initialTemplate = generateFilledTemplate(template.template, template.fields);
    setTemplateText(initialTemplate);
    
    // For uploaded audio, show NOTES section
    if (transcriptionResult) {
      setEditableText(`${initialTemplate}\n\n--- NOTES ---\n${transcriptionResult}`);
    } else {
      setEditableText(initialTemplate);
    }
    
    setHasContent(true);
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setTemplateFields([]);
    setTemplateText("");
    setFormat("raw"); 
    
    // For uploaded audio, show NOTES section
    if (transcriptionResult) {
      setEditableText(transcriptionResult);
    } else {
      setEditableText("");
    }
    
    setHasContent(!!transcriptionResult);
  };

  const startRecording = async () => {
    try {
      if (!browserSupportsSpeechRecognition) {
        alert("Your browser doesn't support speech recognition!");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      await SpeechRecognition.startListening({ continuous: true });
      setIsRecording(true);
      setIsPaused(false);
      setPermissionDenied(false);
      setAudioFile(null);
      setAudioUrl(null);
      setHasContent(true);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setPermissionDenied(true);
    }
  };

  const pauseRecording = () => {
    SpeechRecognition.stopListening();
    setIsPaused(true);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resumeRecording = () => {
    SpeechRecognition.startListening({ continuous: true });
    setIsPaused(false);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
      setHasContent(true);
    }, 1000);
  };

  const stopRecording = () => {
    SpeechRecognition.stopListening();
    setIsRecording(false);
    setIsPaused(false);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // For live recording, don't show NOTES section
    const finalText = selectedTemplate
      ? `${templateText}\n\n--- LIVE DICTATION ---\n${transcript}`
      : transcript;

    setTranscriptionText(finalText);
    setEditableText(finalText);
    setTranscriptionResult(transcript);
    setHasContent(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value);
    setTranscriptionText(e.target.value);
    setHasContent(!!e.target.value);
  };

  const debugStateBeforeSave = () => {
    console.log("=== DEBUG STATE BEFORE SAVE ===");
    console.log("transcriptionText:", transcriptionText);
    console.log("editableText:", editableText);
    console.log("speechText:", speechText);
    console.log("templateText:", templateText);
    console.log("isRecording:", isRecording);
    console.log("isPaused:", isPaused);
    console.log("transcript (from speech recognition):", transcript);
    console.log("=================================");
  };

  const saveTranscription = async () => {
    debugStateBeforeSave();
    
    if (!isAuthenticated) {
      alert('Please login to save transcriptions');
      return;
    }

    const token = getToken();
    if (!token) {
      alert('Authentication token not found. Please login again.');
      return;
    }
    const formatToCategoryMap: Record<string, string> = {
      'soap': 'SOAP',
      'medical': 'Medical Notes', 
      'raw': 'Raw Text',
      'SOAP': 'SOAP',
      'Medical Notes': 'Medical Notes',
      'Raw Text': 'Raw Text',
      'Annual Checkup': 'Annual Checkup',
      'Call Recording': 'Call Recording',
      'Others': 'Others'
    };
    let category = "Raw Text";
    if (selectedTemplate) {
      if (selectedTemplate.name.toLowerCase().includes("soap")) {
        category = "SOAP";
      } else if (selectedTemplate.name.toLowerCase().includes("medical")) {
        category = "Medical Notes";
      } else if (selectedTemplate.name.toLowerCase().includes("annual")) {
        category = "Annual Checkup";
      } else {
        category = formatToCategoryMap[format] || "Others";
      }
    } else {
      category = formatToCategoryMap[format] || "Raw Text";
    }
    const pet = selectedPet ? mockPets.find(p => p.id === selectedPet) : null;
    const clinic = selectedClinic ? mockClinics.find(c => c.id === selectedClinic) : null;
    
    if (!transcriptionText || transcriptionText.trim() === '') {
      alert('Transcription content is required');
      return;
    }

    const transcriptionData = {
      title: selectedTemplate 
        ? `${selectedTemplate.name}  ${pet?.name || ''}`
        : `${pet?.name || 'Untitled'}  ${visitType || 'Raw Text Note'}`,
      content: transcriptionText,
      category: category,
      petName: pet?.name,
      clinicName: clinic?.name,
      visitType: visitType,
      templateName: selectedTemplate?.name,
      recordingDuration: recordingTime,
      audioUrl: audioUrl, 
      isCallRecording: !!audioUrl 
    };

    try {
      const response = await fetch('http://localhost:5000/api/transcriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transcriptionData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to save transcription';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      const existingTranscriptions = JSON.parse(localStorage.getItem('transcriptions') || '[]');
      const newTranscription = {
        id: result.transcription?.id || Date.now().toString(),
        title: transcriptionData.title,
        content: transcriptionData.content,
        format: category,
        date: new Date(),
        petName: pet?.name,
        clinicName: clinic?.name,
        ownerName: pet?.owner,
        visitType: visitType,
        recordingDuration: recordingTime
      };
      
      localStorage.setItem('transcriptions', JSON.stringify([
        ...existingTranscriptions,
        newTranscription
      ]));
      
      // Reset all states after successful save
      resetAllStates();
      
      alert("Transcription saved successfully to database!");
    } catch (error: any) {
      console.error("Error saving transcription:", error);
      alert(`Failed to save transcription: ${error.message}`);
    }
  };

  // Function to reset all states
  const resetAllStates = () => {
    setRecordingTime(0);
    setTranscriptionText("");
    setEditableText("");
    setTemplateText("");
    setSpeechText("");
    setSelectedPet(undefined);
    setSelectedClinic(undefined);
    setVisitType("");
    setSelectedTemplate(null);
    setTemplateFields([]);
    setAudioFile(null);
    setAudioUrl(null);
    setIsSaveDialogOpen(false);
    setIsEditMode(false);
    setHasContent(false);
    setTranscriptionResult("");
    resetTranscript();
  };

  const discardTranscription = () => {
    resetAllStates();
    setIsDiscardDialogOpen(false);
  };

  const handleAddPet = () => {
    if (!newPet.name || !newPet.species || !newPet.breed || !newPet.owner) {
      alert("Please fill in all required pet fields");
      return;
    }
    setIsAddPetDialogOpen(false);
    setNewPet({ name: "", species: "", breed: "", owner: "" });
  };

  const handleAddClinic = () => {
    if (!newClinic.name) {
      alert("Please enter a clinic name");
      return;
    }
    setIsAddClinicDialogOpen(false);
    setNewClinic({ name: "" });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Template selection component
  const TemplateSelection = () => (
    <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={isRecording}
          className="flex items-center gap-2 max-w-full sm:max-w-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={16} />
          {selectedTemplate ? "Change Template" : "Select Template"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>
            Choose a template to use for your transcription
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {VisitTypeTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Detectable Fields:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {template.fields.slice(0, 6).map((field, index) => (
                      <span key={index} className="truncate">{field.label}</span>
                    ))}
                    {template.fields.length > 6 && (
                      <span className="text-primary">+{template.fields.length - 6} more</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="bg-gradient-to-br from-[#f0f4ff] via-[#e8faff] to-[#fef6e4] p-6 rounded-xl shadow-md mt-10 mr-5">
      <div className="space-y-8">
        <motion.div variants={fadeInUp} initial="hidden" animate="show">
          <Card className="bg-white/80 backdrop-blur-lg shadow-xl border border-gray-200 rounded-2xl transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pet Selection */}
                <div className="space-y-2">
                  <Label htmlFor="pet-select">Pet (Optional)</Label>
                  <div className="flex gap-2 items-start">
                    <Select value={selectedPet} onValueChange={setSelectedPet} disabled={isRecording}>
                      <SelectTrigger id="pet-select" className="w-full">
                        <SelectValue placeholder="Select pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name} ({pet.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddPetDialogOpen} onOpenChange={setIsAddPetDialogOpen}>
                      <DialogTrigger asChild className="bg-[#E6EFFF] text-gray-900 hover:bg-[#c9defc] hover:text-[#1e293b]">
                        <Button variant="outline" size="icon" disabled={isRecording}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="transition-all duration-300 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100">
                        <DialogHeader>
                          <DialogTitle>Add New Pet</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="pet-name">Pet Name</Label>
                              <Input
                                id="pet-name"
                                value={newPet.name}
                                onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                                placeholder="Max"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="species">Species</Label>
                              <Select
                                value={newPet.species}
                                onValueChange={(value) => setNewPet({ ...newPet, species: value })}
                              >
                                <SelectTrigger id="species">
                                  <SelectValue placeholder="Select species" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Dog">Dog</SelectItem>
                                  <SelectItem value="Cat">Cat</SelectItem>
                                  <SelectItem value="Bird">Bird</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="breed">Breed</Label>
                              <Input
                                id="breed"
                                value={newPet.breed}
                                onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                                placeholder="Golden Retriever"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="owner">Owner</Label>
                              <Input
                                id="owner"
                                value={newPet.owner}
                                onChange={(e) => setNewPet({ ...newPet, owner: e.target.value })}
                                placeholder="John Smith"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsAddPetDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddPet}>Add Pet</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {selectedPet && (
                    <p className="text-sm text-gray-500 mt-1">
                      {mockPets.find((p) => p.id === selectedPet)?.breed}, Owner:{" "}
                      {mockPets.find((p) => p.id === selectedPet)?.owner}
                    </p>
                  )}
                </div>

                {/* Clinic Selection */}
                <div className="space-y-2">
                  <Label htmlFor="clinic-select">Clinic (Optional)</Label>
                  <div className="flex gap-2 items-start">
                    <Select value={selectedClinic} onValueChange={setSelectedClinic} disabled={isRecording}>
                      <SelectTrigger id="clinic-select" className="w-full">
                        <SelectValue placeholder="Select clinic" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddClinicDialogOpen} onOpenChange={setIsAddClinicDialogOpen}>
                      <DialogTrigger asChild className="bg-[#E6EFFF] text-gray-900 hover:bg-[#c9defc] hover:text-[#1e293b]">
                        <Button variant="outline" size="icon" disabled={isRecording}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Clinic</DialogTitle>
                        </DialogHeader>
                        <div className="py-2 space-y-4">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="clinic-name">Clinic Name</Label>
                            <Input
                              id="clinic-name"
                              value={newClinic.name}
                              onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                              placeholder="Main Street Veterinary Clinic"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsAddClinicDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddClinic}>Add Clinic</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {selectedClinic && (
                    <p className="text-sm text-gray-500 mt-1">
                      {mockClinics.find((c) => c.id === selectedClinic)?.address},{" "}
                      {mockClinics.find((c) => c.id === selectedClinic)?.city}
                    </p>
                  )}
                </div>

                {/* Visit Type */}
                <div className="space-y-2">
                  <Label htmlFor="visit-type">Visit Type (Optional)</Label>
                  <Select value={visitType} onValueChange={setVisitType} disabled={isRecording}>
                    <SelectTrigger id="visit-type">
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {visitTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recording Card */}
        <motion.div variants={fadeInUp} initial="hidden" animate="show">
          <Card className="bg-white/80 backdrop-blur-lg shadow-xl border border-gray-200 rounded-2xl transition-all">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Audio Recording</span>
                <div className="text-sm font-normal bg-[#E6EFFF] px-3 py-1 rounded-full">
                  {formatTime(recordingTime)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <TemplateSelection />
                  {selectedTemplate && (
                    <Button variant="outline" size="sm" onClick={resetFieldValues} className="ml-2">
                      Reset Fields
                    </Button>
                  )}
                </div>

                {selectedTemplate && (
                  <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                    <div>
                      <span className="text-sm font-medium">Selected Template: </span>
                      <span className="text-sm">{selectedTemplate.name}</span>
                      {selectedTemplate.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedTemplate.description}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearTemplate}>
                      Clear
                    </Button>
                  </div>
                )}

                {/* Field Detection Status */}
                {selectedTemplate && templateFields.length > 0 && (isRecording || transcriptionResult) && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-sm mb-2">Detected Fields:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {templateFields.slice(0, 6).map((field, index) => (
                        <div key={index} className={`p-2 rounded text-xs ${
                          field.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="font-medium">{field.label}:</span>
                          {field.value ? ` ${field.value}` : ' Not detected'}
                        </div>
                      ))}
                      {templateFields.length > 6 && (
                        <div className="p-2 rounded text-xs bg-blue-100 text-blue-800">
                          +{templateFields.length - 6} more fields
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      <p>Detected from {isRecording ? 'live recording' : 'uploaded audio'}</p>
                    </div>
                  </div>
                )}

                {audioUrl && (
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsAudioPlaying(false)}
                        hidden
                      />
                      <Button
                        variant="outline"
                        onClick={toggleAudioPlayback}
                        className="flex items-center gap-2"
                      >
                        {isAudioPlaying ? <Pause size={16} /> : <Play size={16} />}
                        {isAudioPlaying ? "Pause" : "Play"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {audioFile?.name}
                      </span>
                    </div>

                    {isTranscribingUpload && (
                      <div className="space-y-2">
                        <div className="text-sm text-center">
                          {uploadProgress < 100 ? "Uploading and transcribing..." : "Processing..."}
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {transcriptionResult && !isTranscribingUpload && (
                      <div className="p-2 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">Transcription complete!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} disabled={isTranscribingUpload || !!audioFile}>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                      className="mr-2"
                    >
                      <Mic className="h-4 w-4" />
                    </motion.div>
                    Start Recording
                  </Button>
                ) : isPaused ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resumeRecording}>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                    <Button variant="destructive" onClick={stopRecording}>
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={pauseRecording}>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                    <Button onClick={stopRecording} variant="destructive">
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                )}
              </div>

              {/* Upload section */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isRecording}
                  />
                  <Button variant="outline" asChild disabled={isRecording}>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Audio File
                    </div>
                  </Button>
                </label>
                {audioFile && (
                  <Button 
                    onClick={transcribeAudioFile} 
                    disabled={isTranscribingUpload || isRecording}
                    className="transition-transform duration-300 transform hover:scale-105"
                  >
                    {isTranscribingUpload ? "Transcribing..." : "Transcribe Audio"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Transcription Card - Only show when there's content */}
        {hasContent && (
          <div className="mt-8 space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>
                    {format === "soap"
                      ? "SOAP Notes"
                      : format === "medical"
                        ? "Medical Notes"
                        : "Raw Text"}
                  </span>
                  <div className="text-sm font-normal bg-primary/10 px-3 py-1 rounded-full">
                    {formatTime(recordingTime)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditMode && (
                  <div className="mb-4 space-y-4 p-4 border rounded-md bg-muted/20">
                    <h3 className="text-sm font-medium">Edit Recording Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-pet-select">Pet</Label>
                        <Select value={selectedPet} onValueChange={setSelectedPet}>
                          <SelectTrigger id="edit-pet-select" className="w-full">
                            <SelectValue placeholder="Select pet" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockPets.map((pet) => (
                              <SelectItem key={pet.id} value={pet.id}>
                                {pet.name} ({pet.species})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-clinic-select">Clinic</Label>
                        <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                          <SelectTrigger id="edit-clinic-select" className="w-full">
                            <SelectValue placeholder="Select clinic" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockClinics.map((clinic) => (
                              <SelectItem key={clinic.id} value={clinic.id}>
                                {clinic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-visit-type">Visit Type</Label>
                        <Select value={visitType} onValueChange={setVisitType}>
                          <SelectTrigger id="edit-visit-type">
                            <SelectValue placeholder="Select visit type" />
                          </SelectTrigger>
                          <SelectContent>
                            {visitTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                <Textarea
                  value={editableText}
                  onChange={handleTextChange}
                  className="min-h-[200px] font-mono"
                  disabled={isRecording}
                />
              </CardContent>
              <CardFooter className="flex justify-between max-[550px]:flex-col max-[550px]:items-stretch max-[550px]:space-y-2">
                <AlertDialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="max-[550px]:w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Discard
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Discard Transcription</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to discard this transcription? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={discardTranscription}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Discard
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex space-x-2 max-[550px]:flex-col max-[550px]:space-x-0 max-[550px]:space-y-2 max-[550px]:w-full">
                  <Button
                    className="transition-transform duration-300 transform hover:scale-105 max-[550px]:w-full"
                    variant="outline"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditMode ? "Done Editing" : "Edit"}
                  </Button>

                  <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button className="transition-transform duration-300 transform hover:scale-105 max-[550px]:w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Save Transcription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to save this transcription?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={saveTranscription}>Save</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingInterface;