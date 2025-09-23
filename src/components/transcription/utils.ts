// components/TranscriptionHistory/utils.ts

export const getFormatBadgeColor = (format: string) => {
  switch (format) {
    case "SOAP":
      return "bg-blue-100 text-blue-800";
    case "Medical Notes":
      return "bg-green-100 text-green-800";
    case "Raw Text":
      return "bg-purple-100 text-purple-800";
    case "Call Recording":
      return "bg-purrscribe-blue/20 text-purrscribe-blue";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
