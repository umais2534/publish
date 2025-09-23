import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CallOwnerProps {
  ownerName: string;
  ownerPhone?: string;
  petName?: string;
  onCallRecorded?: (audioBlob: Blob, duration: number) => void;
}

const CallOwner = ({
  ownerName = "Pet Owner",
  ownerPhone = "",
  petName = "Pet",
  onCallRecorded,
}: CallOwnerProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<
    "idle" | "connecting" | "active" | "completed" | "failed"
  >("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startCall = async () => {
    try {
      setCallStatus("connecting");

      // In a real app, this would connect to a calling service
      // For demo purposes, we'll simulate a connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsCallActive(true);
      setCallStatus("active");

      // Start the call duration timer
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus("failed");
    }
  };

  const endCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isRecording) {
      stopRecording();
    }

    setIsCallActive(false);
    setCallStatus("completed");
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .catch((error) => {
          alert(
            "Microphone access denied. Please allow microphone access in your browser settings.",
          );
          throw error;
        });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (onCallRecorded) {
          onCallRecorded(audioBlob, callDuration);
        }

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      // Set a timer to collect data every second
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="overflow-hidden border-purrscribe-blue/20 ">
      <CardContent className="p-4">
      <div className="flex flex-col space-y-4">
  {/* Header Section */}
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
    <div className="text-center sm:text-left">
      <h3 className="font-semibold text-lg sm:text-xl">
        Call {ownerName}
        {petName && (
          <span className="text-sm text-muted-foreground block sm:inline ml-1">
            ({petName}'s owner)
          </span>
        )}
      </h3>
      {ownerPhone && (
        <p className="text-sm text-muted-foreground">{ownerPhone}</p>
      )}
    </div>

    <div className="flex justify-center sm:justify-end">
      <Badge
        className={`
          text-sm px-3 py-1 rounded-md font-medium
           ${callStatus === "idle" ? "bg-gray-100 text-gray-800 hover:bg-[#242C3F] hover:text-white" : ""}
          ${callStatus === "connecting" ? "bg-amber-100 text-amber-800" : ""}
          ${callStatus === "active" ? "bg-green-100 text-green-800" : ""}
          ${callStatus === "completed" ? "bg-blue-100 text-blue-800" : ""}
          ${callStatus === "failed" ? "bg-red-100 text-red-800" : ""}
        `}
      >
        {callStatus === "idle" && "Ready to Call"}
        {callStatus === "connecting" && "Connecting..."}
        {callStatus === "active" && "Call Active"}
        {callStatus === "completed" && "Call Completed"}
        {callStatus === "failed" && "Call Failed"}
      </Badge>
    </div>
  </div>

  {/* Call Timer */}
  {isCallActive && (
    <div className="flex items-center justify-center bg-primary-50 py-3 rounded-md">
      <span className="text-xl font-mono">{formatTime(callDuration)}</span>
    </div>
  )}

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row justify-between gap-2">
    {!isCallActive ? (
      <Button
        onClick={startCall}
        className="w-full sm:flex-1 bg-purrscribe-blue hover:bg-primary-700"
      >
        <Phone className="mr-2 h-4 w-4" />
        Start Call
      </Button>
    ) : (
      <>
        <Button
          onClick={toggleRecording}
          variant={isRecording ? "destructive" : "outline"}
          className={`w-full sm:flex-1 ${
            isRecording ? "bg-red-600 hover:bg-red-700" : ""
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Record Call
            </>
          )}
        </Button>
        <Button
          onClick={endCall}
          variant="outline"
          className="w-full sm:flex-1 border-red-200 text-red-600 hover:bg-red-50"
        >
          <PhoneOff className="mr-2 h-4 w-4" />
          End Call
        </Button>
      </>
    )}
  </div>
</div>

      </CardContent>
    </Card>
  );
};

export default CallOwner;
