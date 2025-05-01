export interface TimelineProps {
    id: string;
    typeId: string;
    timeUnitId: string;
    duration: number;
    title: string;
    description: string;
    author: {
        id:string,
        username:string,
    };
    isGenerated: boolean;
    isPublic: boolean;
    enableScheduling: boolean;
    version: string;
    createdAt: string;
    updatedAt: string;
}

export interface TimelineIdentification{
    timelineId:string
}
  
export type TimelineDbRow = TimelineProps;