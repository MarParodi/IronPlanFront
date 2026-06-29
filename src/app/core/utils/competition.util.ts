/** Jackson puede serializar `isMemberCompetition` como `memberCompetition`. */
export function readMemberCompetitionFlag(source: {
  isMemberCompetition?: boolean;
  memberCompetition?: boolean;
  participantMode?: string;
  scopeLevel?: string;
} | null | undefined): boolean {
  if (!source) return false;
  if (typeof source.isMemberCompetition === 'boolean') return source.isMemberCompetition;
  if (typeof source.memberCompetition === 'boolean') return source.memberCompetition;
  if (source.participantMode === 'ORGANIZATION_MEMBERS') return true;
  if (source.scopeLevel === 'GRUPO') return true;
  return false;
}

export function inferMemberCompetitionFromDetail(data: {
  competition?: {
    isMemberCompetition?: boolean;
    memberCompetition?: boolean;
    participantMode?: string;
    scopeLevel?: string;
  };
  groupLeaderboard?: unknown[] | null;
  memberLeaderboard?: unknown[] | null;
  myScore?: {
    isMemberCompetition?: boolean;
    memberCompetition?: boolean;
    memberRank?: number | null;
    groupRank?: number | null;
  } | null;
} | null | undefined): boolean {
  if (!data) return false;
  if (readMemberCompetitionFlag(data.competition)) return true;
  if (readMemberCompetitionFlag(data.myScore ?? undefined)) return true;
  if ((data.memberLeaderboard?.length ?? 0) > 0 && !(data.groupLeaderboard?.length ?? 0)) return true;
  if (data.myScore?.memberRank != null && data.myScore.groupRank == null) return true;
  return false;
}
