import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const TranscriptionCard = ({ transcription, navigate }) => (
  <Card
    className="hover:shadow-md transition-all cursor-pointer"
    onClick={() => navigate(`/history/${transcription.id}`)}
  >
    <CardHeader className="p-4 pb-2">
      <CardTitle className="text-lg">{transcription.title}</CardTitle>
      <CardDescription>{transcription.date} • {transcription.format}</CardDescription>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <p className="text-sm text-muted-foreground line-clamp-2">{transcription.preview}</p>
    </CardContent>
  </Card>
);

export default TranscriptionCard;
