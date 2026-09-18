export interface Company {
    id: string;
    name: string;
    initial: string;
    type: string;
    revenue: string;
    revenueGrowth: string;
    orders: string;
    ordersGrowth: string;
    customers: string;
    customersGrowth: string;
    conversionRate: string;
    conversionGrowth: string;
    categoryRevenue: string;
    categoryPeriod: string;
    aiTier: 'Outperforming' | 'Moderate' | 'At Risk';
    aiScore: number;
    aiRationale: string;
    highChurnWarning?: boolean;
    churnRate: string;
    ltv: string;
    ltvCac: string;
    subscribers: string;
}

export interface MonthData {
    id?: string;
    name: string;
    label: string;
    empty: number;
    newCount: number;
    activeCount: number;
    newUser: string;
    existingUser: string;
    total: string;
}

export interface RevenueBreakdownBar {
    id: number;
    date: string;
    topH: string;
    botH: string;
    expansion: string;
    base: string;
    total: string;
}

export interface Transaction {
    id: string;
    code: string;
    customer: string;
    product: string;
    status: 'Success' | 'Pending' | 'Refunded' | 'Duplicated';
    qty?: number;
    unitPrice?: string;
    totalRevenue: string;
    timestamp?: string;
    relativeTime?: string;
}
