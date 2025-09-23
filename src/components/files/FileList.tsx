import React, { useState } from "react";
import { FileItem } from "./FileManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  Download,
  Trash2,
  Share,
  Printer,
  Eye,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useAuth } from "@/context/AuthContext";
interface FileListProps {
  files: FileItem[];
  onDelete: (fileId: string) => void;
  onDownload: (file: FileItem) => void;
  onView: (file: FileItem) => void;
  token: string;
}

export const FileList = ({ files, onDelete, onDownload, onView, token }: FileListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const { user, getToken } = useAuth();
  // Filter files based on search query
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort files based on sort criteria
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === "date") {
      return sortOrder === "asc"
        ? a.uploadDate.getTime() - b.uploadDate.getTime()
        : b.uploadDate.getTime() - a.uploadDate.getTime();
    } else {
      // Sort by size
      return sortOrder === "asc" ? a.size - b.size : b.size - a.size;
    }
  });

  const handleSort = (criteria: "name" | "date" | "size") => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(criteria);
      setSortOrder("asc");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText size={20} className="text-red-500" />;
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return <FileText size={20} className="text-blue-500" />;
    } else if (
      fileType.includes("sheet") ||
      fileType.includes("excel") ||
      fileType.includes("xls")
    ) {
      return <FileText size={20} className="text-green-500" />;
    } else if (
      fileType.includes("image") ||
      fileType.includes("jpg") ||
      fileType.includes("png")
    ) {
      return <FileText size={20} className="text-purple-500" />;
    } else {
      return <FileText size={20} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

const handlePrint = async (file: FileItem) => {

  try {
    const token = await getToken(); // Ensure we have the current token
    
    // For PDF files - open directly with print dialog
    if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
      const printUrl = `/api/files/view/${file.id}?token=${encodeURIComponent(token)}`;
      const printWindow = window.open(printUrl, '_blank');
      
      if (printWindow) {
        // Wait for the PDF to load and then print
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (error) {
            console.error('PDF print error:', error);
            // Fallback: close the window and show message
            printWindow.close();
            alert('Could not print PDF automatically. Please use the print button in the PDF viewer.');
          }
        }, 2000);
      }
    } 
    // For text files - create a print-friendly page
    else if (file.type.includes("text") || file.name.match(/\.(txt|json|xml|html|css|js|md)$/i)) {
      try {
        // Fetch file content
        const response = await fetch(`/api/files/content/${file.id}?token=${encodeURIComponent(token)}`);
        
        if (response.ok) {
          const content = await response.text();
          
          // Create print window with formatted content
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>${file.name}</title>
                <style>
                  body { 
                    font-family: 'Courier New', monospace; 
                    margin: 20px; 
                    line-height: 1.4;
                  }
                  .print-header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                  }
                  .filename { 
                    font-size: 20px; 
                    font-weight: bold;
                    margin-bottom: 5px;
                  }
                  .file-info {
                    font-size: 12px;
                    color: #666;
                  }
                  .content { 
                    white-space: pre-wrap; 
                    font-size: 12px;
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 5px;
                    border: 1px solid #ddd;
                  }
                  @media print {
                    body { margin: 15mm; }
                    .print-header { margin-bottom: 15mm; }
                    .content { 
                      background: none;
                      border: none;
                      padding: 0;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="print-header">
                  <div class="filename">${file.name}</div>
                  <div class="file-info">
                    Printed on ${new Date().toLocaleString()} | 
                    Size: ${(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <div class="content">${escapeHtml(content)}</div>
                <script>
                  // Auto-print and close after printing
                  window.onload = function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 100);
                  };
                </script>
              </body>
              </html>
            `);
            printWindow.document.close();
          }
        }
      } catch (error) {
        console.error('Text file print error:', error);
        alert('Error printing text file. Please try again.');
      }
    }
    // For images - create a print-friendly page
    else if (file.type.includes("image")) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${file.name}</title>
            <style>
              body { 
                text-align: center; 
                margin: 20px;
                font-family: Arial, sans-serif;
              }
              .print-header { 
                margin-bottom: 20px;
                border-bottom: 1px solid #ccc;
                padding-bottom: 10px;
              }
              .filename { 
                font-size: 18px; 
                font-weight: bold;
                margin-bottom: 5px;
              }
              .file-info {
                font-size: 12px;
                color: #666;
              }
              img { 
                max-width: 100%; 
                max-height: 80vh;
                border: 1px solid #ddd;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              @media print {
                body { margin: 10mm; }
                .print-header { margin-bottom: 10mm; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <div class="filename">${file.name}</div>
              <div class="file-info">
                Printed on ${new Date().toLocaleString()} | 
                Size: ${(file.size / 1024).toFixed(2)} KB
              </div>
            </div>
            <img src="/api/files/view/${file.id}?token=${encodeURIComponent(token)}" 
                 alt="${file.name}"
                 onload="window.print(); setTimeout(() => window.close(), 100);">
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    // For other file types - download first
    else {
      alert('This file type cannot be printed directly. Please download it first.');
      onDownload(file);
    }
  } catch (error) {
    console.error('Print error:', error);
    alert('Unable to print this file. Please try again or download the file.');
  }
};

// Add this helper function to escape HTML
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
  const handleShare = (file: FileItem) => {
    setShareDialogOpen(true);
    setShareSuccess(false);
    setShareEmail("");
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate email sending
    setTimeout(() => {
      setShareSuccess(true);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {sortedFiles.length > 0 ? (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">
                  <button
                    className="flex items-center space-x-1 hover:text-primary"
                    onClick={() => handleSort("name")}
                  >
                    <span>Name</span>
                    {sortBy === "name" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left p-3 font-medium text-sm hidden md:table-cell">
                  <button
                    className="flex items-center space-x-1 hover:text-primary"
                    onClick={() => handleSort("date")}
                  >
                    <span>Date</span>
                    {sortBy === "date" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left p-3 font-medium text-sm hidden md:table-cell">
                  <button
                    className="flex items-center space-x-1 hover:text-primary"
                    onClick={() => handleSort("size")}
                  >
                    <span>Size</span>
                    {sortBy === "size" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-right p-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file) => (
                <tr key={file.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.type)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-sm hidden md:table-cell">
                    {file.uploadDate instanceof Date && !isNaN(file.uploadDate.getTime()) 
                      ? format(file.uploadDate, "MMM d, yyyy")
                      : 'Invalid date'}
                  </td>
                  <td className="p-3 text-muted-foreground text-sm hidden md:table-cell">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(file)}
                        title="View"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownload(file)}
                        title="Download"
                      >
                        <Download size={16} />
                      </Button>
                     <Button
  variant="ghost"
  size="icon"
  onClick={() => handlePrint(file)}
  title="Print"
>
  <Printer size={16} />
</Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(file)}
                        title="Share"
                      >
                        <Share size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete file?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(file.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium">No files found</h3>
          <p className="text-muted-foreground">
            Upload files or adjust your search
          </p>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
          </DialogHeader>
          {!shareSuccess ? (
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Recipient Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  placeholder="Add a message..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShareDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Share</Button>
              </div>
            </form>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  File shared successfully!
                </h3>
                <p className="text-muted-foreground">
                  An email has been sent to {shareEmail} with a link to access
                  the file.
                </p>
              </div>
              <Button
                onClick={() => setShareDialogOpen(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};