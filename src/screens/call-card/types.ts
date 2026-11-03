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

export type TacticDraft = {
  text: string;
};

export type NewTacticDraft = {
  tempId: string;
  text: string;
  priority: string;
};

export type TacticsDrafts = {
  drafts: Record<number, TacticDraft>; // key = linkId
  newTactics: NewTacticDraft[];
  deletedTactics: number[]; // linkId
};

export const emptyTacticsDrafts: TacticsDrafts = {
  drafts: {},
  newTactics: [],
  deletedTactics: [],
};
