import { TimeLineEnum, TimeUnitEnum } from './enums';
import { TimelineProps } from './timelineTypes';

export interface CreateTimelineRequestDto {
  type: TimeLineEnum;
  timeUnit: TimeUnitEnum;
  duration: number;
  title: string;
  description: string;
  isPublic?: boolean;
}

export interface TimelineResponseDto extends TimelineProps {}

export interface GetTimelinesResponseDto {
  timelines: TimelineResponseDto[];
  total: number;
  page: number;
  limit: number;
}