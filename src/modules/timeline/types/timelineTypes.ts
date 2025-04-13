import { TimeLineEnum, TimeUnitEnum } from "./enums";

export interface TimelineProps {
    id: string;
    type: TimeLineEnum;
    timeUnit: TimeUnitEnum;
    duration: number;
    title: string;
    description: string;
    authorId: string;
    isGenerated: boolean;
    prompt: string | null;
    isPublic: boolean;
    isForked: boolean;
    forkCount: number;
    originalTimelineId: string | null;
    version: string;
    createdAt: string;
    updatedAt: string;
}
  
export type TimelineDbRow = TimelineProps;