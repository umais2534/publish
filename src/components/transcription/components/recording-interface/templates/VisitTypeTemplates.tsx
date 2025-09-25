import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitTypeTemplate } from "../../types";

interface VisitTypeTemplatesProps {
  templates: VisitTypeTemplate[];
  onSelectTemplate: (template: VisitTypeTemplate) => void;
}

export function VisitTypeTemplates({
  templates,
  onSelectTemplate,
}: VisitTypeTemplatesProps) {
  const defaultTemplates: VisitTypeTemplate[] = [
    {
      id: "annual-checkup",
      name: "Annual Checkup",
      description: "Template for routine annual examinations",
      template: `ANNUAL CHECKUP - {PET_NAME}

SUBJECTIVE:
Owner {OWNER_NAME} reports no concerns. Patient is eating, drinking, and eliminating normally.

OBJECTIVE:
T: {TEMPERATURE}°F, HR: {HEART_RATE} bpm, RR: {RESP_RATE} rpm
Weight: {WEIGHT} lbs (change from last visit: {WEIGHT_CHANGE})
MM: Pink, moist, CRT <2s
Hydration: Good
BCS: {BCS}/9
EENT: Eyes clear, no ocular discharge, ears clean, no odor
Oral: {ORAL_ASSESSMENT}
Integument: Coat shiny, no evidence of parasites
Cardiac: Strong synchronous pulses, no murmurs
Respiratory: Normal respiratory effort, clear lung sounds
GI: Soft, non-painful abdomen, no masses palpated
MS: Ambulatory x4, no pain on palpation
Neuro: Appropriate mentation, normal gait

ASSESSMENT:
Healthy adult {SPECIES}

PLAN:
- Continue current diet and exercise
- Vaccines updated: {VACCINES}
- Next wellness visit in 1 year
- Recommended annual diagnostics: {DIAGNOSTICS}`,
    },
    {
      id: "vaccination",
      name: "Vaccination Visit",
      description: "Template for routine vaccination visits",
      template: `VACCINATION VISIT - {PET_NAME}

SUBJECTIVE:
Owner {OWNER_NAME} reports patient is healthy with no concerns.

OBJECTIVE:
T: {TEMPERATURE}°F, HR: {HEART_RATE} bpm, RR: {RESP_RATE} rpm
Weight: {WEIGHT} lbs
General physical examination within normal limits

VACCINES ADMINISTERED:
- {VACCINE_LIST}

ASSESSMENT:
Healthy patient, appropriate for vaccination

PLAN:
- Monitor for vaccine reactions (lethargy, vomiting, facial swelling)
- Next vaccines due: {NEXT_VACCINES}
- Follow-up in 1 year for annual examination`,
    },
    {
      id: "illness",
      name: "Illness Visit",
      description: "Template for sick patient visits",
      template: `ILLNESS VISIT - {PET_NAME}

SUBJECTIVE:
Owner {OWNER_NAME} reports {SYMPTOMS} for {DURATION}.

OBJECTIVE:
T: {TEMPERATURE}°F, HR: {HEART_RATE} bpm, RR: {RESP_RATE} rpm
Weight: {WEIGHT} lbs
MM: {MM_COLOR}, moist, CRT {CRT_TIME}
Hydration: {HYDRATION_STATUS}
EENT: {EENT_FINDINGS}
Cardiac: {CARDIAC_FINDINGS}
Respiratory: {RESP_FINDINGS}
GI: {GI_FINDINGS}
Integument: {INTEGUMENT_FINDINGS}

DIAGNOSTICS:
{DIAGNOSTIC_RESULTS}

ASSESSMENT:
{PRIMARY_DIAGNOSIS}

PLAN:
1. {TREATMENT_PLAN}
2. Follow-up in {FOLLOWUP_TIME} if no improvement
3. Emergency instructions provided`,
    },
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allTemplates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelectTemplate(template)}
        >
          <CardHeader>
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
            <div className="mt-4 text-xs text-muted-foreground line-clamp-3">
              {template.template.split('\n')[0]}...
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}