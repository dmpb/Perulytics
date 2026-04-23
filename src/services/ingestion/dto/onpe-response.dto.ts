export interface OnpeApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface OnpeTotalsData {
  actasContabilizadas: number;
  contabilizadas: number;
  totalActas: number;
  participacionCiudadana: number;
  actasEnviadasJee: number;
  enviadasJee: number;
  actasPendientesJee: number;
  pendientesJee: number;
  fechaActualizacion: number;
  idUbigeoDepartamento: number;
  idUbigeoProvincia: number;
  idUbigeoDistrito: number;
  idUbigeoDistritoElectoral: number;
  totalVotosEmitidos: number;
  totalVotosValidos: number;
  porcentajeVotosEmitidos: number;
  porcentajeVotosValidos: number;
}

export interface OnpeParticipantData {
  nombreAgrupacionPolitica: string;
  codigoAgrupacionPolitica: number;
  nombreCandidato: string;
  dniCandidato: string;
  totalVotosValidos: number;
  porcentajeVotosValidos: number;
  porcentajeVotosEmitidos: number;
}
