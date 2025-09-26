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
import { VisitTypeTemplate, Pet, Clinic, TemplateField } from '../../types/index';

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

  // NEW: State for dynamic templates from database
  const [availableTemplates, setAvailableTemplates] = useState<VisitTypeTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // NEW: AI Model State for Field Detection
  const [fieldDetectionHistory, setFieldDetectionHistory] = useState<{field: string, value: string}[]>([]);
  const [currentFieldContext, setCurrentFieldContext] = useState<{field: string | null, startIndex: number}>({
    field: null,
    startIndex: 0
  });

  // Refs
  const timerRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

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

  // NEW: AI Model for Field Detection
  class FieldDetectionAI {
    private fieldPatterns: Map<string, string[]>;
    private contextBuffer: string[];
    private currentField: string | null;
    private valueBuffer: string[];
    
    constructor() {
      this.fieldPatterns = new Map();
      this.contextBuffer = [];
      this.currentField = null;
      this.valueBuffer = [];
      this.initializePatterns();
    }

    private initializePatterns() {
      // Common field patterns with variations
      this.fieldPatterns.set('name', ['name', 'patient name', 'pet name', 'animal name', 'name of patient', 'name of pet']);
      this.fieldPatterns.set('age', ['age', 'years old', 'old', 'age of']);
      this.fieldPatterns.set('species', ['species', 'type', 'animal type', 'kind', 'species of']);
      this.fieldPatterns.set('breed', ['breed', 'breed type', 'animal breed', 'type of breed']);
      this.fieldPatterns.set('weight', ['weight', 'kg', 'pounds', 'lbs', 'weight is']);
      this.fieldPatterns.set('temperature', ['temperature', 'temp', 'fever', 'degree', 'temperature is']);
      this.fieldPatterns.set('symptoms', ['symptoms', 'symptom', 'complaints', 'problem', 'issues']);
      this.fieldPatterns.set('diagnosis', ['diagnosis', 'diagnose', 'condition', 'disease']);
      this.fieldPatterns.set('treatment', ['treatment', 'medicine', 'medication', 'therapy', 'prescription']);
      this.fieldPatterns.set('notes', ['notes', 'note', 'comments', 'remarks', 'observation']);
    }

    // NEW: Advanced field detection with context awareness
    detectField(text: string): { field: string | null, value: string | null } {
      const words = text.toLowerCase().split(/\s+/);
      this.contextBuffer.push(...words);
      
      // Keep only last 20 words for context
      if (this.contextBuffer.length > 20) {
        this.contextBuffer = this.contextBuffer.slice(-20);
      }

      // Check if we're currently in a field context
      if (this.currentField) {
        const value = this.extractFieldValue(text);
        if (value) {
          return { field: this.currentField, value };
        }
      }

      // Detect new field mentions
      for (const [field, patterns] of this.fieldPatterns) {
        for (const pattern of patterns) {
          const regex = new RegExp(`\\b${pattern}\\b`, 'i');
          if (regex.test(text)) {
            this.currentField = field;
            this.valueBuffer = [];
            console.log(`🎯 AI detected field: ${field}`);
            return { field, value: null };
          }
        }
      }

      return { field: null, value: null };
    }

    private extractFieldValue(text: string): string | null {
      const fieldKeywords = this.getFieldKeywords(this.currentField!);
      const words = text.toLowerCase().split(/\s+/);
      
      // Remove field mention from text
      let cleanText = text.toLowerCase();
      const patterns = this.fieldPatterns.get(this.currentField!) || [];
      patterns.forEach(pattern => {
        cleanText = cleanText.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), '');
      });

      cleanText = cleanText.trim();
      
      if (!cleanText) return null;

      // Extract value based on field type
      let value = this.cleanExtractedValue(cleanText);
      
      // Validate value
      if (value && this.isValidValue(value, this.currentField!)) {
        this.currentField = null; // Reset field context after value extraction
        return value;
      }

      return null;
    }

    private getFieldKeywords(field: string): string[] {
      const keywordMap: { [key: string]: string[] } = {
        'name': ['is', 'called', 'named'],
        'age': ['is', 'years', 'old'],
        'species': ['is', 'type'],
        'breed': ['is', 'breed'],
        'weight': ['is', 'kg', 'pounds'],
        'temperature': ['is', 'degrees', 'fahrenheit', 'celsius']
      };
      return keywordMap[field] || ['is'];
    }

    private cleanExtractedValue(value: string): string {
      return value
        .replace(/^[:\-\s]+/, '')
        .replace(/[.,;:!?]\s*$/, '')
        .trim();
    }

    private isValidValue(value: string, field: string): boolean {
      if (!value || value.length < 1 || value.length > 50) return false;

      // Field-specific validation
      switch (field) {
        case 'age':
          return /^(\d+\s*(years?|yrs?)?\s*(old)?)$/i.test(value);
        case 'weight':
          return /^(\d+\s*(kg|kilos?|pounds?|lbs?))$/i.test(value);
        case 'temperature':
          return /^(\d+\.?\d*\s*(degrees?|°)?\s*(F|C|Fahrenheit|Celsius)?)$/i.test(value);
        default:
          return value.split(/\s+/).length <= 5; // Limit to 5 words for other fields
      }
    }

    reset() {
      this.currentField = null;
      this.contextBuffer = [];
      this.valueBuffer = [];
    }
  }

  // Initialize AI Model
  const fieldAI = useRef(new FieldDetectionAI());

  // NEW: Template generation without NOTES section
  const generateFilledTemplate = (template: string, fieldValues: Map<string, string>): string => {
    let filledTemplate = template;
    
    // Replace field placeholders
    fieldValues.forEach((value, field) => {
      const placeholder = `{${field}}`;
      filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Replace predefined variables
    const pet = mockPets.find((p) => p.id === selectedPet);
    const clinic = mockClinics.find((c) => c.id === selectedClinic);
    
    return filledTemplate
      .replace(/\{PET_NAME\}/g, pet?.name || "")
      .replace(/\{OWNER_NAME\}/g, pet?.owner || "")
      .replace(/\{CLINIC_NAME\}/g, clinic?.name || "")
      .replace(/\{VISIT_TYPE\}/g, visitType || "")
      .replace(/\{DATE\}/g, new Date().toLocaleDateString());
  };

  // NEW: Real-time AI Field Detection
  const processTranscriptWithAI = (currentTranscript: string) => {
    if (!selectedTemplate || !isRecording) return;

    const detectionResult = fieldAI.current.detectField(currentTranscript);
    
    if (detectionResult.field && detectionResult.value) {
      // Add to detection history
      setFieldDetectionHistory(prev => [...prev, {
        field: detectionResult.field!,
        value: detectionResult.value
      }]);

      // Update template with detected value
      updateTemplateWithFieldValue(detectionResult.field, detectionResult.value);
    }
  };

  // NEW: Update template with detected field value
  const updateTemplateWithFieldValue = (field: string, value: string) => {
    if (!selectedTemplate) return;

    // Create a map of current field values from history
    const fieldValues = new Map<string, string>();
    fieldDetectionHistory.forEach(({field: f, value: v}) => {
      fieldValues.set(f, v);
    });
    fieldValues.set(field, value);

    const newTemplateText = generateFilledTemplate(selectedTemplate.template, fieldValues);
    setTemplateText(newTemplateText);
    setEditableText(newTemplateText);
    setTranscriptionText(newTemplateText);
  };

  // Fetch templates from database
  const fetchTemplates = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingTemplates(true);
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const templatesData = await response.json();
        const convertedTemplates: VisitTypeTemplate[] = templatesData.map((template: any) => ({
          id: template.id.toString(),
          name: template.name,
          description: template.description,
          template: template.template,
          fields: extractFieldsFromTemplate(template.template),
          created_at: template.created_at,
          updated_at: template.updated_at
        }));
        setAvailableTemplates(convertedTemplates);
      } else {
        console.error('Failed to fetch templates');
        setAvailableTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setAvailableTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Helper function to extract fields from template content
  const extractFieldsFromTemplate = (template: string): TemplateField[] => {
    const fieldRegex = /{([^}]+)}/g;
    const matches = template.match(fieldRegex);
    
    if (!matches) return [];

    const fields: TemplateField[] = [];
    matches.forEach(match => {
      const fieldName = match.replace(/[{}]/g, '');
      const predefinedFields = ['PET_NAME', 'OWNER_NAME', 'CLINIC_NAME', 'VISIT_TYPE', 'DATE'];
      if (!predefinedFields.includes(fieldName)) {
        fields.push({
          name: fieldName,
          label: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          pattern: /./,
          value: ""
        });
      }
    });

    return fields;
  };

  useEffect(() => {
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    setRecordingUUID(generateUUID());
  }, []);

  // Load templates when component mounts or authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

  // NEW: AI-powered transcript processing
  useEffect(() => {
    if (isRecording && selectedTemplate && transcript) {
      processTranscriptWithAI(transcript);
    }
  }, [transcript, isRecording, selectedTemplate]);

  // Update editable text based on template and transcript
  useEffect(() => {
    if (selectedTemplate) {
      const fieldValues = new Map<string, string>();
      fieldDetectionHistory.forEach(({field, value}) => {
        fieldValues.set(field, value);
      });
      
      const newTemplateText = generateFilledTemplate(selectedTemplate.template, fieldValues);
      setTemplateText(newTemplateText);
      setEditableText(newTemplateText);
    } else {
      setTemplateText("");
      setEditableText(transcript || transcriptionResult || "");
    }
  }, [selectedTemplate, selectedPet, selectedClinic, visitType, fieldDetectionHistory, transcript, transcriptionResult]);

  useEffect(() => {
    setHasContent(!!transcript || !!editableText || !!transcriptionResult);
  }, [transcript, editableText, transcriptionResult]);

  const resetFieldValues = () => {
    setFieldDetectionHistory([]);
    fieldAI.current.reset();
    
    if (selectedTemplate) {
      const initialTemplate = generateFilledTemplate(selectedTemplate.template, new Map());
      setTemplateText(initialTemplate);
      setEditableText(initialTemplate);
    }
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

    if (selectedTemplate) {
      const fieldValues = new Map<string, string>();
      fieldDetectionHistory.forEach(({field, value}) => {
        fieldValues.set(field, value);
      });
      
      const finalTemplateText = generateFilledTemplate(selectedTemplate.template, fieldValues);
      setTranscriptionText(finalTemplateText);
      setTemplateText(finalTemplateText);
      setEditableText(finalTemplateText);
    } else {
      setTranscriptionText(transcript);
      setEditableText(transcript);
    }
    
    setTranscriptionResult(transcript);
    setHasContent(true);
  };

  // Audio transcription function
  const transcribeAudioFile = async () => {
    if (!audioFile) return;
    
    setIsTranscribingUpload(true);
    setUploadProgress(0);
    setTranscriptionResult("");
    
    try {
      setUploadProgress(30);
      const uploadedAudioUrl = await uploadAudioFile(audioFile);
      
      if (!uploadedAudioUrl) {
        throw new Error('Audio file upload failed');
      }
      
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

      let finalText = transcriptionText;
      
      if (selectedTemplate) {
        // Process uploaded audio transcription with AI
        const lines = transcriptionText.split('\n');
        const detectedFields = new Map<string, string>();
        
        lines.forEach(line => {
          const detectionResult = fieldAI.current.detectField(line);
          if (detectionResult.field && detectionResult.value) {
            detectedFields.set(detectionResult.field, detectionResult.value);
          }
        });

        const filledTemplate = generateFilledTemplate(selectedTemplate.template, detectedFields);
        setTemplateText(filledTemplate);
        finalText = filledTemplate;
      }
      
      setEditableText(finalText);
      setTranscriptionResult(transcriptionText);
      setTranscriptionText(finalText);
      setUploadProgress(100);
      setHasContent(true);
      
      await saveTranscriptionAsCallRecording(finalText, transcriptionText, uploadedAudioUrl);
      
    } catch (err: any) {
      setTranscriptionResult(`❌ Transcription failed: ${err.message}`);
    } finally {
      setIsTranscribingUpload(false);
    }
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
      // Reset AI for new upload
      setFieldDetectionHistory([]);
      fieldAI.current.reset();
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
    setFieldDetectionHistory([]);
    fieldAI.current.reset();
    setIsTemplateDialogOpen(false);
    
    if (template.name.toLowerCase().includes("soap")) {
      setFormat("soap");
    } else if (template.name.toLowerCase().includes("medical")) {
      setFormat("medical");
    } else {
      setFormat("raw");
    }
    
    const initialTemplate = generateFilledTemplate(template.template, new Map());
    setTemplateText(initialTemplate);
    setEditableText(initialTemplate);
    setHasContent(true);
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setTemplateText("");
    setFormat("raw");
    setFieldDetectionHistory([]);
    fieldAI.current.reset();
    
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
      // Reset AI for new recording
      setFieldDetectionHistory([]);
      fieldAI.current.reset();
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

  const saveTranscription = async () => {
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
        ? `${selectedTemplate.name} - ${pet?.name || ''}`
        : `${pet?.name || 'Untitled'} - ${visitType || 'Raw Text Note'}`,
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
      
      resetAllStates();
      alert("Transcription saved successfully to database!");
    } catch (error: any) {
      console.error("Error saving transcription:", error);
      alert(`Failed to save transcription: ${error.message}`);
    }
  };

  const resetAllStates = () => {
    setRecordingTime(0);
    setTranscriptionText("");
    setEditableText("");
    setTemplateText("");
    setSelectedPet(undefined);
    setSelectedClinic(undefined);
    setVisitType("");
    setSelectedTemplate(null);
    setAudioFile(null);
    setAudioUrl(null);
    setIsSaveDialogOpen(false);
    setIsEditMode(false);
    setHasContent(false);
    setTranscriptionResult("");
    setFieldDetectionHistory([]);
    fieldAI.current.reset();
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

  // Get current detected fields for display
  const getCurrentDetectedFields = () => {
    return fieldDetectionHistory.slice(-6); // Show last 6 detected fields
  };

  // Updated Template Selection Component
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
        
        {isLoadingTemplates ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading templates...</span>
          </div>
        ) : availableTemplates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No templates found.</p>
            <Button 
              variant="link" 
              onClick={() => window.open('/templates', '_blank')}
              className="mt-2"
            >
              Create your first template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {availableTemplates.map((template) => (
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
                    <p className="font-medium mb-1">AI-Detectable Fields:</p>
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
                {template.created_at && (
                  <CardFooter className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => window.open('/templates', '_blank')}
          >
            Manage Templates
          </Button>
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
                      Reset AI Fields
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

                {/* AI Field Detection Status */}
                {selectedTemplate && (isRecording || transcriptionResult) && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-sm mb-2">
                      {isRecording ? "🤖 AI Field Detection (Live):" : "AI Detected Fields:"}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getCurrentDetectedFields().map((detection, index) => (
                        <div key={index} className="p-2 rounded text-xs bg-green-100 text-green-800">
                          <span className="font-medium">{detection.field}:</span>
                          {` ${detection.value}`}
                        </div>
                      ))}
                      {fieldDetectionHistory.length === 0 && (
                        <div className="p-2 rounded text-xs bg-gray-100 text-gray-600 col-span-full text-center">
                          No fields detected yet. Speak field names like "name of patient Dolly"
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      <p>
                        {isRecording 
                          ? "Speak naturally: 'name of patient Dolly age 5 years species dog'" 
                          : 'Fields detected from audio'}
                      </p>
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