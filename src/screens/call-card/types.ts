// src/screens/call-card/types.ts
export type Icd10Item = {
  ID: number;
  MKB_CODE: string;
  MKB_NAME: string;
  ID_PARENT: string | null;
  REC_CODE: string;
};

export type TemplateDraft = {
  COMPLAINTS: string;
  ANAMNESIS: string;
  OBJECTIVELY: string;
  LOCAL_STATUS: string;
};
