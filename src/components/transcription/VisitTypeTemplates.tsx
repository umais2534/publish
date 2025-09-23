import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export interface VisitTypeTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  created_at?: string;
  updated_at?: string;
}

interface VisitTypeTemplatesProps {
  onSelectTemplate?: (template: VisitTypeTemplate) => void;
}

// Default templates
const DEFAULT_TEMPLATES: VisitTypeTemplate[] = [
  {
    id: "1",
    name: "SOAP Note",
    description: "Standard SOAP format for medical notes",
    template: "SUBJECTIVE:\n\nOBJECTIVE:\n\nASSESSMENT:\n\nPLAN:\n",
  },
  {
    id: "2",
    name: "Annual Checkup",
    description: "Template for routine annual examinations",
    template: "HISTORY:\n\nPHYSICAL EXAMINATION:\n- Weight:\n- Temperature:\n- Heart Rate:\n- Respiratory Rate:\n\nDIAGNOSTICS:\n\nASSESSMENT:\n\nRECOMMENDATIONS:\n",
  },
  {
    id: "3",
    name: "Vaccination Visit",
    description: "Template for vaccination appointments",
    template: "PRE-VACCINATION ASSESSMENT:\n\nVACCINES ADMINISTERED:\n\nPOST-VACCINATION INSTRUCTIONS:\n\nNEXT VACCINATION DUE:\n",
  },
];

const VisitTypeTemplates: React.FC<VisitTypeTemplatesProps> = ({
  onSelectTemplate,
}) => {
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<VisitTypeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<VisitTypeTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<VisitTypeTemplate>>({
    name: "",
    description: "",
    template: "",
  });
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const token = getToken();
        
        const response = await fetch('/api/templates', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const templatesData = await response.json();
          setTemplates(templatesData);
        } else {
          console.error('Failed to fetch templates');
          const savedTemplates = localStorage.getItem('visitTypeTemplates');
          if (savedTemplates) {
            setTemplates(JSON.parse(savedTemplates));
          } else {
            setTemplates(DEFAULT_TEMPLATES);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        const savedTemplates = localStorage.getItem('visitTypeTemplates');
        if (savedTemplates) {
          setTemplates(JSON.parse(savedTemplates));
        } else {
          setTemplates(DEFAULT_TEMPLATES);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [getToken]);

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template) {
      alert("Please provide a name and template content");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          template: newTemplate.template
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Template created:', result);
        setTemplates([...templates, result.template]);
        setNewTemplate({ name: "", description: "", template: "" });
        setIsAddTemplateOpen(false);
        const updatedTemplates = [...templates, result.template];
        localStorage.setItem('visitTypeTemplates', JSON.stringify(updatedTemplates));
      } else {
        const errorData = await response.json();
        console.error('Failed to create template:', errorData);
        const template: VisitTypeTemplate = {
          id: Date.now().toString(),
          name: newTemplate.name || '',
          description: newTemplate.description,
          template: newTemplate.template || '',
        };

        const updatedTemplates = [...templates, template];
        setTemplates(updatedTemplates);
        localStorage.setItem('visitTypeTemplates', JSON.stringify(updatedTemplates));
        
        setNewTemplate({ name: "", description: "", template: "" });
        setIsAddTemplateOpen(false);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      const template: VisitTypeTemplate = {
        id: Date.now().toString(),
        name: newTemplate.name || '',
        description: newTemplate.description,
        template: newTemplate.template || '',
      };

      const updatedTemplates = [...templates, template];
      setTemplates(updatedTemplates);
      localStorage.setItem('visitTypeTemplates', JSON.stringify(updatedTemplates));
      
      setNewTemplate({ name: "", description: "", template: "" });
      setIsAddTemplateOpen(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const token = getToken();
      if (!['1', '2', '3'].includes(selectedTemplate.id)) {
        const response = await fetch(`/api/templates/${selectedTemplate.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to delete template from API');
        }
      }
      const updatedTemplates = templates.filter((t) => t.id !== selectedTemplate.id);
      setTemplates(updatedTemplates);
      setSelectedTemplate(null);
      setIsDeleteDialogOpen(false);
      localStorage.setItem('visitTypeTemplates', JSON.stringify(updatedTemplates));
      
    } catch (error) {
      console.error('Error deleting template:', error);
      const updatedTemplates = templates.filter((t) => t.id !== selectedTemplate.id);
      setTemplates(updatedTemplates);
      localStorage.setItem('visitTypeTemplates', JSON.stringify(updatedTemplates));
      
      setSelectedTemplate(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUseTemplate = (template: VisitTypeTemplate) => {
    if (typeof onSelectTemplate === 'function') {
      onSelectTemplate(template);
    } else {
      console.warn('onSelectTemplate is not a function');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-10 mr-8">
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-10 mr-8">
      <div className="flex justify-between items-center flex-wrap max-[400px]:flex-col max-[400px]:items-start gap-4 mb-6 bg-gradient-to-r from-[#F0F4FF] to-[#E0ECFF] rounded-xl w-full p-0 sm:p-5 shadow-sm mb-8">
        <h3 className="text-2xl font-bold">Visit Type Templates</h3>
        
        <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto sm:self-end self-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new visit type template to use in your recordings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="e.g., Dental Examination"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-description">Description (Optional)</Label>
                <Input
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of when to use this template"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  value={newTemplate.template}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      template: e.target.value,
                    })
                  }
                  placeholder="Enter the template structure here..."
                  className="min-h-[200px] font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTemplate}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No templates found. Create your first template!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:scale-105"
            >
              <div className="flex-1 flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <CardTitle>
                    <div className="relative -mt-6 bg-[#272E3F] text-white text-center pt-0 pb-2 rounded-b-[110px] overflow-hidden w-[60%] mx-auto shadow-md">
                      <h2 className="text-[16px] font-semibold z-10 relative">{template.name}</h2>
                      <svg
                        className="absolute bottom-0 left-0 w-full"
                        viewBox="0 0 500 50"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0,0 C125,50 375,50 500,0 L500,50 L0,50 Z"
                          fill="#272E3F"
                        />
                      </svg>
                    </div>
                  </CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="bg-muted/50 p-3 rounded-md min-h-[140px] flex items-start">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {template.template.length > 100
                        ? `${template.template.substring(0, 100)}...`
                        : template.template}
                    </pre>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="flex justify-between mt-auto">
                {!['1', '2', '3'].includes(template.id) && (
                  <AlertDialog
                    open={isDeleteDialogOpen && selectedTemplate?.id === template.id}
                    onOpenChange={(open) => {
                      setIsDeleteDialogOpen(open);
                      if (!open) setSelectedTemplate(null);
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the "{template.name}" template?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteTemplate}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {['1', '2', '3'].includes(template.id) && <div />}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="bg-[#242C3F] text-white hover:bg-white"
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitTypeTemplates;