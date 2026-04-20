export type LogEvidenceFormState = {
  status: "idle" | "error" | "success";
  fieldErrors: {
    title?: string;
    occurredAt?: string;
    attributes?: string;
  };
  formError?: string;
  successSummary?: {
    title: string;
    eventType: string;
    intensity: string;
    occurredAt: string;
    impacts: {
      attributeName: string;
      deltaCurrent: number;
    }[];
  };
};

export const INITIAL_LOG_EVIDENCE_FORM_STATE: LogEvidenceFormState = {
  status: "idle",
  fieldErrors: {},
};
