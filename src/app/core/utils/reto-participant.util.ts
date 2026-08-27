/**
 * Utilidades de la vista de participante en un reto.
 *
 * Los puntajes de equipo llegan en la respuesta del backend, pero no se muestran al
 * participante: aquí solo se usan para derivar posiciones y mensajes cualitativos.
 */

export interface RetoLeaderboardEntry {
  rank: number;
  groupId: number;
  groupName: string;
  groupScore?: number;
  activeMembers?: number;
}

export interface RetoMyScore {
  groupRank?: number;
  groupScore?: number;
  internalRank?: number;
  individualScore?: number;
  groupName?: string;
  memberRank?: number;
  isMemberCompetition?: boolean;
  participantGroupId?: number;
}

const ORDINAL_LABELS: Record<number, string> = {
  1: '1.er lugar',
  2: '2.º lugar',
  3: '3.er lugar',
};

export function ordinalPosition(rank?: number | null): string {
  if (rank == null || rank < 1) return '';
  return ORDINAL_LABELS[rank] ?? `${rank}.º lugar`;
}

export function findMyEntry(
  entries: RetoLeaderboardEntry[] | null | undefined,
  myParticipantGroupId?: number | null
): RetoLeaderboardEntry | null {
  if (!entries?.length || myParticipantGroupId == null) return null;
  return entries.find((e) => e.groupId === myParticipantGroupId) ?? null;
}

export function teamMemberCount(
  entries: RetoLeaderboardEntry[] | null | undefined,
  myParticipantGroupId?: number | null
): number | null {
  const mine = findMyEntry(entries, myParticipantGroupId);
  return mine?.activeMembers ?? null;
}

/**
 * Traduce la distancia entre el 1.er y 2.º lugar a un mensaje, sin revelar puntajes.
 * `myParticipantGroupId` se conserva en la firma para usos futuros del contrato de vista.
 */
export function buildClosenessMessage(
  entries: RetoLeaderboardEntry[] | null | undefined,
  _myParticipantGroupId?: number | null
): string {
  if (!entries || entries.length < 2) return '';

  const ranked = [...entries].sort((a, b) => (b.groupScore ?? 0) - (a.groupScore ?? 0));
  const leaderScore = ranked[0].groupScore ?? 0;
  const secondScore = ranked[1].groupScore ?? 0;

  if (leaderScore <= 0) {
    return 'El reto acaba de empezar. Cada actividad cuenta.';
  }

  const relativeGap = (leaderScore - secondScore) / leaderScore;

  if (relativeGap < 0.05) return 'Los equipos están más cerca de lo que parece.';
  if (relativeGap < 0.15) return 'Una buena semana puede mover las posiciones.';
  if (relativeGap < 0.30) return 'Ambos equipos siguen sumando. Nada está definido.';
  return 'Cada actividad de esta semana puede hacer la diferencia.';
}

export function buildContributionMessages(myScore: RetoMyScore | null | undefined): string[] {
  if (!myScore) return [];

  const contribution = myScore.individualScore ?? 0;
  const isMember = !!myScore.isMemberCompetition;

  if (contribution <= 0) {
    return [
      isMember
        ? 'Cada actividad suma a tu progreso en el reto.'
        : 'Cada actividad suma al resultado de tu equipo.',
    ];
  }

  const points = Math.round(contribution);
  const messages: string[] = [];

  if (!isMember && myScore.groupRank === 1) {
    messages.push('Tu actividad ha ayudado al equipo a mantenerse en 1.er lugar.');
  }

  if (isMember) {
    messages.push(`Has sumado ${points} puntos con tu actividad.`);
    messages.push('Tu constancia sigue sumando al objetivo del reto.');
  } else {
    messages.push(`Has aportado ${points} puntos a tu equipo.`);
    if (myScore.groupName) {
      messages.push(`Tu constancia está ayudando a ${myScore.groupName}.`);
    }
  }

  return messages;
}
