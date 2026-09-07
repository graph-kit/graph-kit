export type DNFTerm = {
  positive: Set<string>;
  negative: Set<string>;
};

type Implicant = { value: number; mask: number };

const canCombine = (a: Implicant, b: Implicant): boolean => {
  if (a.mask !== b.mask) return false;
  const diff = a.value ^ b.value;
  return diff !== 0 && (diff & (diff - 1)) === 0;
};

const combine = (a: Implicant, b: Implicant): Implicant => {
  const diff = a.value ^ b.value;
  return { value: a.value & b.value, mask: a.mask | diff };
};

const covers = (implicant: Implicant, minterm: number): boolean => {
  return (minterm & ~implicant.mask) === (implicant.value & ~implicant.mask);
};

const getPrimeImplicants = (ones: number[]): Implicant[] => {
  const primes: Implicant[] = [];
  let current: Implicant[] = ones.map((v) => ({ value: v, mask: 0 }));

  while (current.length > 0) {
    const used = new Set<number>();
    const nextMap = new Map<string, Implicant>();

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        if (canCombine(current[i], current[j])) {
          const merged = combine(current[i], current[j]);
          nextMap.set(`${merged.value},${merged.mask}`, merged);
          used.add(i);
          used.add(j);
        }
      }
    }

    current.forEach((implicant, i) => {
      if (!used.has(i)) primes.push(implicant);
    });
    current = [...nextMap.values()];
  }

  return primes;
};

const selectCover = (primes: Implicant[], ones: number[]): Implicant[] => {
  const uncovered = new Set(ones);
  const selected: Implicant[] = [];
  const selectedKeys = new Set<string>();

  const key = (implicant: Implicant) => `${implicant.value},${implicant.mask}`;

  const add = (implicant: Implicant) => {
    if (selectedKeys.has(key(implicant))) return;
    selectedKeys.add(key(implicant));
    selected.push(implicant);
    for (const minterm of ones) {
      if (covers(implicant, minterm)) uncovered.delete(minterm);
    }
  };

  // essential prime implicants: minterms covered by exactly one prime
  for (const minterm of ones) {
    const covering = primes.filter((p) => covers(p, minterm));
    if (covering.length === 1) add(covering[0]);
  }

  // greedy cover for any remaining uncovered minterms
  while (uncovered.size > 0) {
    let best: Implicant | null = null;
    let bestCount = 0;
    for (const prime of primes) {
      if (selectedKeys.has(key(prime))) continue;
      const count = [...uncovered].filter((minterm) =>
        covers(prime, minterm),
      ).length;
      if (count > bestCount) {
        bestCount = count;
        best = prime;
      }
    }
    if (!best) break;
    add(best);
  }

  return selected;
};

const implicantToDNFTerm = (
  implicant: Implicant,
  variables: string[],
): DNFTerm => {
  const positive = new Set<string>();
  const negative = new Set<string>();
  for (let i = 0; i < variables.length; i++) {
    if ((implicant.mask >> i) & 1) continue;
    if ((implicant.value >> i) & 1) positive.add(variables[i]);
    else negative.add(variables[i]);
  }
  return { positive, negative };
};

export const minimizeDNF = (ones: number[], variables: string[]): DNFTerm[] => {
  if (ones.length === 0) return [];
  if (ones.length === 2 ** variables.length) {
    return [{ positive: new Set(), negative: new Set() }];
  }
  const primes = getPrimeImplicants(ones);
  const cover = selectCover(primes, ones);
  return cover.map((implicant) => implicantToDNFTerm(implicant, variables));
};
