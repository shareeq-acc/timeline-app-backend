export interface TimelineTypeDto{
    id: string;
    type: string;
}

export interface TimelineTypeProps extends TimelineTypeDto {
    description: string;
    needsTimeUnit: boolean;
    needsDuration: boolean;
    supportsScheduling: boolean;  
    supportGeneration:boolean;  
    isSubscribable:boolean;
    createdAt: string;
    updatedAt: string;
}

export type TimelineTypePartial = Omit<TimelineTypeProps, 'description' | 'createdAt' | 'updatedAt'>;
export type TimelineTypeDbRow = TimelineTypeProps;