export type ParticipanteCategoria = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';
export type IpaqCorte = 'PRE' | 'POST';
export type CategoriaIpaq = 'BAJO' | 'MODERADO' | 'ALTO';
export type ExperimentoRetoEstado = 'PLANEACION' | 'ACTIVO' | 'CERRADO';
export type ClasificacionSus = 'INACEPTABLE' | 'MARGINAL' | 'ACEPTABLE' | 'EXCELENTE';

export interface RetoResumen {
  id: number;
  nombre: string;
  estado: ExperimentoRetoEstado;
  fechaInicio: string;
  fechaFin: string;
  organizacionId: number;
  organizacionNombre: string;
  competitionId: number | null;
}

export interface CreateRetoRequest {
  nombre: string;
  descripcion?: string;
  organizacionId: number;
  fechaInicio: string;
  fechaFin: string;
  semanasIntervencion?: number;
  competitionId?: number | null;
}

export interface CompetitionCandidate {
  id: number;
  name: string;
  status: string;
  competitionType: string;
  scopeReferenceId: number;
  scopeReferenceName: string;
  metricType: string;
  isMemberCompetition: boolean;
  participantMode?: string;
}

export interface ParticipanteStatus {
  participanteRetoId: number | null;
  retoId: number;
  tieneConsentimiento: boolean;
  completoPretest: boolean;
  completoPosttest: boolean;
  completoSus: boolean;
  activo: boolean;
  posttestIpaqActivo: boolean;
  susActivo: boolean;
  categoria: ParticipanteCategoria | null;
  objetivoCodigo: string | null;
}

export interface InscripcionRequest {
  categoria: ParticipanteCategoria;
  objetivoCodigo: string;
  objetivoTextoLibre?: string;
}

export interface IpaqFormData {
  vigorosaRealizo: boolean;
  vigorosaDiasSemana: number;
  vigorosaMinDia: number;
  moderadaRealizo: boolean;
  moderadaDiasSemana: number;
  moderadaMinDia: number;
  caminataRealizo: boolean;
  caminataDiasSemana: number;
  caminataMinDia: number;
}

export interface IpaqSubmitRequest {
  participanteRetoId: number;
  corte: IpaqCorte;
  caminataDiasSemana: number;
  caminataMinDia: number;
  moderadaDiasSemana: number;
  moderadaMinDia: number;
  vigorosaDiasSemana: number;
  vigorosaMinDia: number;
}

export interface IpaqSubmitResponse {
  metTotal: number;
  categoriaIpaq: CategoriaIpaq;
  esOutlier: boolean;
}

export interface IpaqRespuestaView {
  corte: IpaqCorte;
  caminataDiasSemana: number;
  caminataMinDia: number;
  moderadaDiasSemana: number;
  moderadaMinDia: number;
  vigorosaDiasSemana: number;
  vigorosaMinDia: number;
  metTotalSemana: number;
  categoriaIpaq: CategoriaIpaq;
  esOutlier: boolean;
  fechaAplicacion: string;
}

export interface SusSubmitRequest {
  participanteRetoId: number;
  susQ1: number;
  susQ2: number;
  susQ3: number;
  susQ4: number;
  susQ5: number;
  susQ6: number;
  susQ7: number;
  susQ8: number;
  susQ9: number;
  susQ10: number;
}

export interface ExperimentoEstado {
  id: number;
  nombre: string;
  estado: ExperimentoRetoEstado;
  fechaInicio: string;
  fechaFin: string;
  semanasIntervencion: number;
  competitionId: number | null;
  participantesInscritos: number;
  completaronPretest: number;
  completaronPosttest: number;
  completaronSus: number;
  participantesActivos: number;
  posttestIpaqActivo: boolean;
  susActivo: boolean;
}

export interface SusResumen {
  promedioSus: number;
  clasificacionPromedio: ClasificacionSus;
  n: number;
  distribucion: Record<string, number>;
}

export const OBJETIVOS = [
  { codigo: 'OBJ-1', label: 'Bajar de peso', desc: 'Reducción del peso corporal con actividad cardiovascular y/o fuerza' },
  { codigo: 'OBJ-2', label: 'Recomposición corporal', desc: 'Ganar músculo y reducir grasa simultáneamente' },
  { codigo: 'OBJ-3', label: 'Subir de peso / ganar músculo', desc: 'Aumento de peso con foco en hipertrofia' },
  { codigo: 'OBJ-4', label: 'Progresión de fuerza', desc: 'Mejorar cargas en ejercicios principales (1RM)' },
  { codigo: 'OBJ-5', label: 'Mejorar la constancia', desc: 'Aumentar frecuencia semanal de entrenamiento' },
  { codigo: 'OBJ-6', label: 'Rendimiento cardiovascular', desc: 'Mejorar tiempos/distancias en actividad libre' },
  { codigo: 'OBJ-7', label: 'Otro', desc: 'Describe tu objetivo con tus propias palabras' },
];

export const CATEGORIAS: { value: ParticipanteCategoria; label: string; desc: string }[] = [
  { value: 'PRINCIPIANTE', label: 'Principiante', desc: 'Sin experiencia previa o menos de 3 meses de entrenamiento regular' },
  { value: 'INTERMEDIO', label: 'Intermedio', desc: 'Entrenamiento regular de 3 a 18 meses' },
  { value: 'AVANZADO', label: 'Avanzado', desc: 'Más de 18 meses de entrenamiento estructurado' },
];

export const SUS_PREGUNTAS = [
  { id: 1, tipo: 'positivo', texto: 'Creo que me gustaría usar este sistema frecuentemente.' },
  { id: 2, tipo: 'negativo', texto: 'Encontré el sistema innecesariamente complejo.' },
  { id: 3, tipo: 'positivo', texto: 'Pensé que el sistema era fácil de usar.' },
  { id: 4, tipo: 'negativo', texto: 'Creo que necesitaría el apoyo de una persona técnica para usar este sistema.' },
  { id: 5, tipo: 'positivo', texto: 'Encontré que las diversas funciones del sistema estaban bien integradas.' },
  { id: 6, tipo: 'negativo', texto: 'Pensé que había demasiada inconsistencia en este sistema.' },
  { id: 7, tipo: 'positivo', texto: 'Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente.' },
  { id: 8, tipo: 'negativo', texto: 'Encontré el sistema muy difícil de usar.' },
  { id: 9, tipo: 'positivo', texto: 'Me sentí muy seguro/a usando el sistema.' },
  { id: 10, tipo: 'negativo', texto: 'Necesité aprender muchas cosas antes de poder comenzar a usar este sistema.' },
];

export const CONSENTIMIENTO_TEXTO = `
Al participar en el reto "Pongámonos en Forma" autorizo el tratamiento de mis datos de actividad física
registrados en Iron Plan con fines académicos (tesis de licenciatura UAS). Los datos serán anonimizados
en los reportes estadísticos. Puedo retirarme del reto en cualquier momento contactando al administrador.
`.trim();
