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
import { VisitTypeTemplate } from "../../types/index";

interface VisitTypeTemplatesProps {
  onSelectTemplate?: (template: VisitTypeTemplate) => void;
}

const VisitTypeTemplates: React.FC<VisitTypeTemplatesProps> = ({
  onSelectTemplate,
}) => {
  const { getToken, isAuthenticated } = useAuth();
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

  const fetchTemplates = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = getToken();
      
      const response = await fetch('http://localhost:5000/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const templatesData = await response.json();
        // Convert database format to VisitTypeTemplate format
        const convertedTemplates: VisitTypeTemplate[] = templatesData.map((template: any) => ({
          id: template.id.toString(),
          name: template.name,
          description: template.description,
          template: template.template,
          fields: extractFieldsFromTemplate(template.template),
          created_at: template.created_at,
          updated_at: template.updated_at
        }));
        setTemplates(convertedTemplates);
      } else {
        console.error('Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractFieldsFromTemplate = (template: string): any[] => {
    const fieldRegex = /{([^}]+)}/g;
    const matches = template.match(fieldRegex);
    
    if (!matches) return [];

    const fields: any[] = [];
    matches.forEach(match => {
      const fieldName = match.replace(/[{}]/g, '');
      const predefinedFields = ['PET_NAME', 'OWNER_NAME', 'CLINIC_NAME', 'VISIT_TYPE', 'DATE'];
      if (!predefinedFields.includes(fieldName)) {
        fields.push({
          name: fieldName,
          label: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          pattern: /./,
          value: ""
        });
      }
    });

    return fields;
  };

  useEffect(() => {
    fetchTemplates();
  }, [isAuthenticated]);

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template) {
      alert("Please provide a name and template content");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/templates', {
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
        await fetchTemplates(); // Refresh the list
        setNewTemplate({ name: "", description: "", template: "" });
        setIsAddTemplateOpen(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to create template:', errorData);
        alert('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/templates/${selectedTemplate.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchTemplates(); // Refresh the list
        setSelectedTemplate(null);
        setIsDeleteDialogOpen(false);
      } else {
        console.error('Failed to delete template');
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const handleUseTemplate = (template: VisitTypeTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
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
                  placeholder="Enter the template structure here. Use {fieldName} for dynamic fields."
                  className="min-h-[200px] font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use curly braces for dynamic fields: {"{patientName}"}, {"{diagnosis}"}, etc.
                </p>
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
                  {template.fields.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Dynamic Fields:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.fields.slice(0, 4).map((field, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {field.label}
                          </span>
                        ))}
                        {template.fields.length > 4 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{template.fields.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="flex justify-between mt-auto">
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="bg-[#242C3F] text-white hover:bg-white hover:text-[#242C3F]"
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