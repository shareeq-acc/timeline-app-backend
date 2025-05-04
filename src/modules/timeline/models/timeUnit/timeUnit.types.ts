export interface TimeUnitDto {
    id: string;
    code: string;
}

export interface TimeUnitProps extends TimeUnitDto {
    description: string;    
    updatedAt: string;
    durationInSeconds: number;
}

export type TimeUnitPartial = TimeUnitDto;
export type TimeUnitDbRow = TimeUnitProps;