export interface TimelineForkProps {
    id: string;
    originalTimelineId: string;
    forkedTimelineId: string;
    forkedById: string;
    forkedVersion: string;
    updatedAt: string;
    createdAt: string;
}

export interface ForkDetails extends Omit<TimelineForkProps, 'updatedAt' | 'createdAt' | 'forkedTimelineId'> {}

export type TimelineForkDbRow = TimelineForkProps;