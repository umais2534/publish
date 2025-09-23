import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, Check } from "lucide-react";
import { FileItem } from "./FileManager";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onUpload: (files: FileItem[]) => void;
  token: string;
}

export const FileUploader = ({ onUpload, token }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const uploadedFile = await response.json();
          onUpload([{
            id: uploadedFile.file.id.toString(),
            name: uploadedFile.file.name,
            type: uploadedFile.file.type,
            size: uploadedFile.file.size,
            uploadDate: new Date(uploadedFile.file.uploadDate),
            url: uploadedFile.file.url
          }]);
        } else {
          console.error('Failed to upload file:', file.name);
        }

        // Update progress for each file
        setUploadProgress((prev) => {
          const newProgress = prev + (100 / selectedFiles.length);
          return newProgress > 100 ? 100 : newProgress;
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      setSelectedFiles([]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload size={40} className="text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium">Drag and drop files here</h3>
            <p className="text-sm text-muted-foreground">
              or{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={triggerFileInput}
              >
                browse
              </button>{" "}
              to upload
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selected Files</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center p-3 border rounded-md bg-background"
              >
                <File size={20} className="mr-2 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>

          {uploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : (
            <Button onClick={handleUpload} className="w-full">
              <Upload size={16} className="mr-2" />
              Upload {selectedFiles.length}{" "}
              {selectedFiles.length === 1 ? "file" : "files"}
            </Button>
          )}
        </div>
      )}

      {uploadProgress === 100 && !uploading && (
        <div className="flex items-center justify-center p-3 text-sm text-green-600 bg-green-50 rounded-md">
          <Check size={16} className="mr-2" />
          Files uploaded successfully!
        </div>
      )}
    </div>
  );
};