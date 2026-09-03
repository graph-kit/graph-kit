export const definitions = {
  communicatingClasses: 'A group of states that can all reach each other.',
  recurrentClasses: 'A communicating class with no way out.',
  recurrentStates: 'A state inside a recurrent class.',
  transientStates: 'A state that is not in any recurrent class.',
  absorbingStates:
    'A state whose only transition is back to itself. Once the chain arrives it can never leave.',
  absorbingChain:
    'A chain where every state can reach an absorbing state, so wherever it starts it ends up stuck in one of them.',
  periodic:
    'The greatest common divisor of the cycle lengths through a state. Every state in a communicating class shares the same one, so the period belongs to the class. A chain is periodic when any recurrent class has a period above 1.',
  reducible:
    'A chain is reducible when it contains more than 1 communicating class. Chains with 1 communicating class are irreducible.',
  ergodic:
    'Irreducible and aperiodic. ⚠️ This also goes by the name "regular chain" and may be used to mean just irreducible.',
  stationaryDistribution:
    'The distribution of state probabilities that returns itself when multiplied against the transition matrix. Unique when the chain has 1 recurrent class.',
  limitingDistribution:
    'The distribution that every starting distribution settles on when multiplied against the transition matrix over and over. Also called converging to a steady state. Needs 1 recurrent class that is aperiodic.',
  meanRecurrenceTime:
    'The average number of steps before the chain comes back to a state.',
  reversible:
    'A chain that crosses between every pair of states as often one way as the other, so a recording of it looks the same played backwards. Chains like this satisfy detailed balance.',
  doublyStochastic: 'Every row and column of the transition matrix sums to 1.',
  validity:
    'The sum of all transitions leaving a state must add up to exactly 1.',
};
