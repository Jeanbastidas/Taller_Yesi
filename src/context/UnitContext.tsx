import { createContext } from 'react';

export type UnitSystem = 'SI' | 'USCS';

export const UnitContext = createContext<{ 
  unitSystem: UnitSystem, 
  setUnitSystem: (v: UnitSystem) => void 
}>({ unitSystem: 'SI', setUnitSystem: () => {} });
