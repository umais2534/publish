import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SUPPORTED_IMAGE_FORMATS, MAX_UPLOAD_SIZE } from "@/config/apiConfig";
import { useAuth } from "@/context/AuthContext";

interface ImageUploaderProps {
  imageUrl?: string;
  onImageChange: (url: string) => void;
  onFileUpload: (fileData: {imageData: string, imageType: string}) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ImageUploader({
  imageUrl = "",
  onImageChange,
  onFileUpload,
  className,
  label = "Image",
  placeholder = "Enter image URL or upload an image",
  disabled = false,
}: ImageUploaderProps) {
  const [url, setUrl] = useState<string>(imageUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<string>(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken, logout } = useAuth();

  // Sync with parent imageUrl changes
  useEffect(() => {
    setUrl(imageUrl);
    setPreview(imageUrl);
  }, [imageUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setPreview(newUrl);
    onImageChange(newUrl);
    setError("");
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

 const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    setError(`Unsupported file format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
    return;
  }

  // Validate file size (reduce to 2MB)
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    setError(`File too large. Maximum size: 2MB`);
    return;
  }

  try {
    setIsUploading(true);
    setError("");

    // Compress image if it's too large
    let processedFile = file;
    if (file.size > 500 * 1024) { // Compress if > 500KB
      processedFile = await compressImage(file);
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const base64Content = base64Data.split(',')[1]; // Remove the data:image/... prefix
      
      // Set preview
      setPreview(base64Data);
      
      // Send file data to parent component
      onFileUpload({
        imageData: base64Content,
        imageType: processedFile.type
      });
    };
    reader.readAsDataURL(processedFile);
    
  } catch (err) {
    console.error("File conversion failed:", err);
    setError(err instanceof Error ? err.message : "Failed to process image");
  } finally {
    setIsUploading(false);
  }
};

// Add this compression function
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions (max 800px width/height)
      let width = img.width;
      let height = img.height;
      
      const MAX_DIMENSION = 800;
      if (width > height && width > MAX_DIMENSION) {
        height = (height * MAX_DIMENSION) / width;
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = (width * MAX_DIMENSION) / height;
        height = MAX_DIMENSION;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Convert to JPEG for better compression
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        'image/jpeg',
        0.7 // Quality (0.7 = 70%)
      );
    };
    
    img.onerror = () => reject(new Error('Image loading failed'));
  });
};
  const handleClear = () => {
    setUrl("");
    setPreview("");
    onImageChange("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="image-url">{label}</Label>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="image-url"
              type="text"
              placeholder={placeholder}
              value={url}
              onChange={handleUrlChange}
              disabled={disabled || isUploading}
              className="pr-8"
            />
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={disabled || isUploading}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleFileSelect}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_IMAGE_FORMATS.join(",")}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="relative mt-2 rounded-md border border-border overflow-hidden">
          <div className="aspect-video relative bg-muted flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  console.error("Image failed to load:", preview);
                  setError("Failed to load image preview");
                  setPreview("");
                }}
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}