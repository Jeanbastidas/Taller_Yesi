export type UnitSystem = 'SI' | 'USCS';

export const getConv = (unitSystem: UnitSystem) => ({
  L: (val: number) => unitSystem === 'SI' ? val : val * 3.28084,
  P: (val: number) => unitSystem === 'SI' ? val : val * 0.0208854,
  M: (val: number) => unitSystem === 'SI' ? val : val * 0.0208854,
  D: (val: number) => unitSystem === 'SI' ? val : val * 0.00194032,
  V: (val: number) => unitSystem === 'SI' ? val : val * 3.28084,
  Q: (val: number) => unitSystem === 'SI' ? val : val * 35.3147,
  T: (val: number) => unitSystem === 'SI' ? val : val * 1.8 + 32,
});

export const getUnits = (unitSystem: UnitSystem) => ({
  L: unitSystem === 'SI' ? 'm' : 'ft',
  P: unitSystem === 'SI' ? 'Pa' : 'psf',
  M: unitSystem === 'SI' ? 'Pa·s' : 'lb·s/ft²',
  D: unitSystem === 'SI' ? 'kg/m³' : 'slug/ft³',
  V: unitSystem === 'SI' ? 'm/s' : 'ft/s',
  Q: unitSystem === 'SI' ? 'm³/s' : 'ft³/s',
  T: unitSystem === 'SI' ? '°C' : '°F',
});
