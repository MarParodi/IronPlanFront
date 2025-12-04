type RoutineTemplateDTO = {
  id: string;
  title: string;
  goal: 'hipertrofia'|'fuerza'|'resistencia';
  access_type: 'FREE'|'XP_UNLOCK';
  blocks: any;
  is_public: boolean;
  // opcionales:
  cover_url?: string; // imagen
  description?: string;
  
};

import { Card } from "../../modules/home/models/response/card_response";

export function mapTemplateToCard(t: RoutineTemplateDTO): Card {
  return {
    id: t.id,
    name: t.title,
    imageUrl: t.cover_url ?? '/assets/placeholder-routine.png',
    accessType: t.access_type,
    goal: t.goal,
    description: t.description ?? '',
    
  };
}

export function mapTemplatesToCards(templates: RoutineTemplateDTO[]): Card[] {
  return templates.map(mapTemplateToCard);
}
