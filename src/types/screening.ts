export interface UnitEconomics {
    ltvCac: string;
    grossMargin: string;
    paybackPeriod: string;
    magicNumber: string;
}

export interface StartupProspect {
    id: string;
    name: string;
    initial: string;
    sector: string;
    stage: 'Bootstrapped' | 'Seed' | 'Series A';
    verification: {
        type: 'Stripe Verified' | 'SEC 10-Q' | 'AI Signal';
        detail: string;
    };
    description: string;
    arr: string;
    mrr: string;
    yoyGrowth: string;
    isPositiveGrowth: boolean;
    churnRate: string;
    isChurnWarning: boolean;
    valuation: string;
    multiple: string;
    thesis: string;
    moat: string;
    unitEconomics: UnitEconomics;
}
