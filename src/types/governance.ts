export interface BoardCommitment {
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'delayed';
    owner: string;
    targetDeadline?: string;
    resolutionNote?: string;
}

export interface StrategicProbe {
    id: string;
    category: string;
    question: string;
    contextHint: string;
}

export interface BoardMeeting {
    id: string;
    companyName: string;
    initials: string;
    ticker: string;
    sector: string;
    boardRole: 'Board Director' | 'Board Observer';
    nextMeetingDate: string;
    status: 'Scheduled' | 'Consent Required' | 'Materials Sent';
    quorum: string;
    agendaTopic: string;
    pendingResolution?: string;
    materialsStatus: 'Audit Deck Ready' | 'Draft Pending' | 'Signed';
    agendaItems?: string[];
    resolutionType?: string;
    resolutionText?: string;
    resolutionStatus?: string;
    isSigned?: boolean;
    priorCommitments?: BoardCommitment[];
    deliveryRate?: string;
    strategicProbes?: StrategicProbe[];
    boardSeats?: {
        votingDirectors: string;
        observers: string;
        auditLead: string;
        compLead: string;
    };
    preMeetingChecklist?: {
        deckStatus: string;
        financialsStatus: string;
        quorumStatus: string;
        legalStatus: string;
    };
}


