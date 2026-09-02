import Fraction from 'fraction.js';

export type Node = {
  id: string;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
  weight: Fraction;
};
