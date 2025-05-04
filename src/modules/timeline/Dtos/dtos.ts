import { TimelineProps } from '../models/timeline/timeline.types';
import { ForkDetails } from '../models/timelineFork/timelineFork.types';
import { TimelineTypeDto, TimelineTypePartial } from '../models/timelineTypes/timelineType.types';
import { TimeUnitPartial } from '../models/timeUnit/timeUnit.types';
export interface GetTimelinesMetadata {
  timelineTypes:TimelineTypePartial[],
  timeUnits:TimeUnitPartial[],
}
export interface CreateTimelineRequestDto {
  typeId: string;
  timeUnitId: string;
  duration: number;
  title: string;
  description: string;
  isPublic?: boolean;
  enableScheduling?: boolean;
}

export interface TimelineResponse extends TimelineProps {}
export interface TimelineResponseDto extends Omit<TimelineResponse, 'typeId' | 'timeUnitId'> {
  type: TimelineTypeDto;
  timeUnit?: TimeUnitPartial | null; // optional because it can be null
  forkDetails?: ForkDetails;
  isForked?: boolean;
}

export interface GetTimelinesResponseDto {
  timelines: TimelineResponseDto[];
  total: number;
  page: number;
  limit: number;
}