export interface SystemAlert {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'risk' | 'error' | 'success' | 'info';
    isRead: boolean;
    tag: string;
    actionNav?: string;
    actionCompanyId?: string;
}

export interface TeamMessage {
    id: string;
    sender: string;
    initials: string;
    role: string;
    subject: string;
    preview: string;
    time: string;
    isRead: boolean;
}
