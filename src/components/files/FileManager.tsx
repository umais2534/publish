import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "./FileUploader";
import { FileList } from "./FileList";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Download, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

const FileManager = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewFile, setViewFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const { user, getToken } = useAuth();

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (viewFile) {
      loadFileContent(viewFile);
    }
  }, [viewFile]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const filesWithDates = data.map((file: any) => {
          const uploadDate = new Date(file.uploadDate);
          return {
            ...file,
            uploadDate: isNaN(uploadDate.getTime()) ? new Date() : uploadDate
          };
        });
        setFiles(filesWithDates);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (file: FileItem) => {
    try {
      // For text-based files, fetch the content
      if (file.type.includes('text') || 
          file.name.match(/\.(txt|json|xml|html|css|js|md)$/i) ||
          file.type.includes('pdf')) {
        
        const response = await fetch(file.url, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        
        if (response.ok) {
          if (file.type.includes('pdf')) {
            // For PDFs, we'll use the URL directly in the iframe
            setFileContent(null);
          } else {
            const text = await response.text();
            setFileContent(text);
          }
        } else {
          setFileContent('Unable to load file content');
        }
      } else {
        setFileContent(null);
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      setFileContent('Error loading file content');
    }
  };

  const handleFileUpload = async (newFiles: FileItem[]) => {
    setFiles((prevFiles) => [...newFiles, ...prevFiles]);
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      // Use the download API endpoint instead of direct file access
      const response = await fetch(`/api/files/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        console.error('Failed to download file');
        alert('Failed to download file. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

const handleView = async (file: FileItem) => {
  try {
    // For certain file types, we need to fetch the content
    if (file.type.includes('text') || 
        file.name.match(/\.(txt|json|xml|html|css|js|md)$/i)) {
      
      const response = await fetch(`/api/files/content/${file.id}?token=${encodeURIComponent(getToken())}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        setViewFile(file);
        setFileContent(content);
      } else {
        console.error('Failed to fetch file content');
        setViewFile(file);
        setFileContent('Unable to load file content');
      }
    } else {
      // For other file types (PDF, images), just set the file
      setViewFile(file);
      setFileContent(null);
    }
  } catch (error) {
    console.error('Error loading file:', error);
    setViewFile(file);
    setFileContent('Error loading file');
  }
};

  if (loading) {
    return <div className="container mx-auto py-6">Loading files...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">File Management</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2 gap-2 mb-12">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="manage">Manage Files</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="p-4 border rounded-lg bg-card">
          <FileUploader onUpload={handleFileUpload} token={getToken()} />
        </TabsContent>

        <TabsContent value="manage" className="p-4 border rounded-lg bg-card">
          <FileList 
            files={files} 
            onDelete={handleFileDelete} 
            onDownload={handleDownload}
            onView={handleView}
            token={getToken()} 
          />
        </TabsContent>
      </Tabs>
{viewFile && (
  <FileViewerDialog 
    file={viewFile} 
    content={fileContent}
    onClose={() => setViewFile(null)} 
    onDownload={handleDownload} 
    token={getToken()} // Pass the token here
  />
)}
    </div>
  );
};

// File Viewer Dialog Component
// Update the FileViewerDialog component to include authentication
const FileViewerDialog = ({ file, content, onClose, onDownload, token }) => {
  const [iframeKey, setIframeKey] = useState(0);
  
  // Function to get authenticated file URL
  const getAuthenticatedUrl = (fileId) => {
    return `/api/files/view/${fileId}?token=${encodeURIComponent(token)}`;
  };

  const renderFileContent = () => {
    // PDF Preview - use authenticated URL
    if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            key={iframeKey}
            src={getAuthenticatedUrl(file.id)}
            title={file.name}
            className="w-full h-full rounded-md"
            frameBorder="0"
            onError={(e) => {
              console.error('PDF loading error:', e);
              // Refresh iframe on error
              setIframeKey(prev => prev + 1);
            }}
          />
        </div>
      );
    }

    // Image Preview - use authenticated URL
    else if (
      file.type.includes("image") || 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
    ) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={getAuthenticatedUrl(file.id)}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded-md"
            onError={(e) => {
              console.error('Image loading error:', e);
              // Fallback to download
              onDownload(file);
            }}
          />
        </div>
      );
    }

    // Text files - use the content we already fetched
    else if (
      file.type.includes("text") || 
      file.name.match(/\.(txt|json|xml|html|css|js|md)$/i)
    ) {
      return (
        <div className="p-4 h-[70vh] overflow-auto">
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
            {content || "Loading content..."}
          </pre>
        </div>
      );
    }

    // Other file types - show download option
    else {
      return (
        <div className="p-4 text-center">
          <p className="mb-4">This file type cannot be previewed.</p>
          <Button onClick={() => onDownload(file)}>
            <Download size={16} className="mr-2" />
            Download to view
          </Button>
        </div>
      );
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby="file-viewer-description"
      >
        <div id="file-viewer-description" className="sr-only">
          File viewer dialog for {file?.name}
        </div>
        
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{file.name}</DialogTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
                <Download size={16} className="mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-[60vh]">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default FileManager;