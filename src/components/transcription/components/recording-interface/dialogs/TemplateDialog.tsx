import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisitTypeTemplate } from "../../types";
import { VisitTypeTemplates } from "../templates/VisitTypeTemplates";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: VisitTypeTemplate[];
  onSelectTemplate: (template: VisitTypeTemplate) => void;
}

export function TemplateDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
}: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>
            Choose a template to use for your transcription
          </DialogDescription>
        </DialogHeader>
        <VisitTypeTemplates
          templates={templates}
          onSelectTemplate={(template) => {
            onSelectTemplate(template);
            onOpenChange(false);
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}