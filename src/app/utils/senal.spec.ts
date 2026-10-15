import { distanciaAproximada } from './senal';

describe('distanciaAproximada', () => {
  it('clasifica señales fuertes como cercanas', () => {
    expect(distanciaAproximada(-60)).toBe('Cerca');
    expect(distanciaAproximada(-45)).toBe('Cerca');
  });

  it('clasifica señales medias entre -60 y -80 dBm', () => {
    expect(distanciaAproximada(-61)).toBe('Medio');
    expect(distanciaAproximada(-80)).toBe('Medio');
  });

  it('clasifica señales inferiores a -80 dBm como lejanas', () => {
    expect(distanciaAproximada(-81)).toBe('Lejos');
    expect(distanciaAproximada(-100)).toBe('Lejos');
  });
});
