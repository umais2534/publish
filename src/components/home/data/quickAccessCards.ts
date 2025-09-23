import {
  Mic,
  History,
  PawPrint,
  Phone,
  FileText,
  Building2,
  NotebookPen,
  User,
} from "lucide-react";

// Just define static config — no JSX or navigate here
export const quickAccessCardData = [
  {
    title: "New Transcription",
    description: "Record and transcribe a new audio note",
    icon: Mic,
    path: "/transcribe",
    color: "bg-primary-50",
  },
  {
    title: "Transcription History",
    description: "View and manage your past transcriptions",
    icon: History,
    path: "/history",
    color: "bg-accent-purple-50",
  },
  {
    title: "Manage Pets",
    description: "Add, edit, or view pet profiles",
    icon: PawPrint,
    path: "/pets",
    color: "bg-accent-teal-50",
  },
  {
    title: "Owner Calls",
    description: "Call pet owners and record conversations",
    icon: Phone,
    path: "/calls",
    color: "bg-primary-50",
  },
  {
    title: "File Management",
    description: "Upload, view, and share documents",
    icon: FileText,
    path: "/files",
   
  },
  {
    title: "Manage Clinics",
    description: "Organize your veterinary clinics",
    icon: Building2,
    path: "/clinics",
   
  },
  {
    title: "Manage Templates",
    description: "Organize your transcription templates",
    icon: NotebookPen,
    path: "/templates",
    color: "bg-accent-teal-50",
  },
  {
    title: "Profile Settings",
    description: "Update your profile and preferences",
    icon: User,
    path: "/profile",
    color: "bg-accent-purple-50",
  },
];
