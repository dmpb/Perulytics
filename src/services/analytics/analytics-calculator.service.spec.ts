import { AnalyticsCalculatorService } from './analytics-calculator.service';

describe('AnalyticsCalculatorService', () => {
  const service = new AnalyticsCalculatorService();
  const candidates = [
    {
      codigoAgrupacionPolitica: 8,
      nombreAgrupacionPolitica: 'FUERZA POPULAR',
      nombreCandidato: 'Candidata A',
      totalVotosValidos: 2715921,
      porcentajeVotosValidos: 17.047,
      porcentajeVotosEmitidos: 14.202,
    },
    {
      codigoAgrupacionPolitica: 10,
      nombreAgrupacionPolitica: 'JUNTOS POR EL PERU',
      nombreCandidato: 'Candidato B',
      totalVotosValidos: 1917364,
      porcentajeVotosValidos: 12.035,
      porcentajeVotosEmitidos: 10.027,
    },
    {
      codigoAgrupacionPolitica: 35,
      nombreAgrupacionPolitica: 'RENOVACION POPULAR',
      nombreCandidato: 'Candidato C',
      totalVotosValidos: 1896867,
      porcentajeVotosValidos: 11.906,
      porcentajeVotosEmitidos: 9.919,
    },
    {
      codigoAgrupacionPolitica: 16,
      nombreAgrupacionPolitica: 'PARTIDO DEL BUEN GOBIERNO',
      nombreCandidato: 'Candidato D',
      totalVotosValidos: 1759382,
      porcentajeVotosValidos: 11.043,
      porcentajeVotosEmitidos: 9.2,
    },
  ];

  it('calcula top 3 por porcentaje de votos validos', () => {
    const top3 = service.getTop3(candidates);
    expect(top3).toHaveLength(3);
    expect(top3[0].codigoAgrupacionPolitica).toBe(8);
    expect(top3[1].codigoAgrupacionPolitica).toBe(10);
    expect(top3[2].codigoAgrupacionPolitica).toBe(35);
  });

  it('calcula momentum comparando snapshot actual y anterior', () => {
    const previous = candidates.map((item) => ({
      ...item,
      porcentajeVotosValidos: item.porcentajeVotosValidos - 0.5,
    }));
    const momentum = service.getMomentum(candidates, previous);
    expect(momentum[0].momentum).toBeCloseTo(0.5, 3);
    expect(momentum).toHaveLength(candidates.length);
  });

  it('calcula diferencia critica entre 2do y 3er lugar', () => {
    const difference = service.getCriticalDifference(candidates);
    expect(difference).not.toBeNull();
    expect(difference?.candidate2.codigoAgrupacionPolitica).toBe(10);
    expect(difference?.candidate3.codigoAgrupacionPolitica).toBe(35);
    expect(difference?.diferencia).toBeCloseTo(0.129, 3);
  });
});
