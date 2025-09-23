// hooks/useTranscriptions.ts
import { useState, useEffect } from "react";

export interface Transcription {
  type: string;
  text: string;
  id: string;
  title: string;
  createdAt: Date;
  status: "completed" | "in-progress" | "failed";
  content: string;
}

const mockData: Transcription[] = [
  {
      id: "1",
      title: "Client Call - July",
      createdAt: new Date(),
      status: "completed",
      content: "Client call transcription content...",
      type: "",
      text: ""
  },
  {
      id: "2",
      title: "Team Meeting",
      createdAt: new Date(),
      status: "in-progress",
      content: "Team meeting transcription content...",
      type: "",
      text: ""
  },
];

const useTranscriptions = () => {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    // simulate fetching from API
    setTranscriptions(mockData);
  }, []);

  const filteredTranscriptions = transcriptions
    .filter((t) => selectedTab === "all" || t.status === selectedTab)
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime()
    );

  const deleteTranscription = (id: string) => {
    setTranscriptions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTranscription = (updated: Transcription) => {
    setTranscriptions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  return {
    filteredTranscriptions,
    selectedTranscription,
    setSelectedTranscription,
    sortOrder,
    setSortOrder,
    selectedTab,
    setSelectedTab,
    deleteTranscription,
    updateTranscription,
  };
};

export default useTranscriptions;
