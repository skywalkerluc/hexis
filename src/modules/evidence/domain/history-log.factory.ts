export type HistoryEntryFactoryInput = {
  userId: string;
  userAttributeId: string;
  causeType: "EVENT" | "DECAY" | "SYSTEM" | "MANUAL";
  causeReferenceId: string | null;
  explanation: string;
  previousCurrent: number;
  nextCurrent: number;
  previousBase: number;
  nextBase: number;
  previousPotential: number;
  nextPotential: number;
  changedAt: Date;
};

export function buildHistoryLogEntry(input: HistoryEntryFactoryInput) {
  return {
    userId: input.userId,
    userAttributeId: input.userAttributeId,
    causeType: input.causeType,
    causeReferenceId: input.causeReferenceId,
    explanation: input.explanation,
    previousCurrent: input.previousCurrent,
    nextCurrent: input.nextCurrent,
    previousBase: input.previousBase,
    nextBase: input.nextBase,
    previousPotential: input.previousPotential,
    nextPotential: input.nextPotential,
    changedAt: input.changedAt,
  };
}
