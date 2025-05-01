import { TimelineFork } from '../models/TimelineFork';
import { TimelineResponseDto } from '../types/dtos';
import { TimelineDbRow } from '../types/timeline.types';
import { TimelineTypePartial } from '../types/timelineType.types';
import { TimeUnitDto } from '../types/timeUnit.types';

export const mapDbRowToTimeline = (row: any): TimelineDbRow => {
  if (!row) {
    throw new Error('Row is null or undefined');
  }
  return {
    id: row.id,
    typeId: row.type_id,
    timeUnitId: row.time_unit_id,
    duration: row.duration, 
    title: row.title,
    description: row.description,
    isGenerated: row.is_generated,  
    isPublic: row.is_public,
    enableScheduling: row.enable_scheduling,
    version: row.version,
    author: {
      id: row.author_id,
      username: row.author_username
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
};


export const mapTimelineToResponseDto = (timeline: TimelineDbRow, timelineTypes:TimelineTypePartial, includeForkDetails: boolean = false, timeUnit:TimeUnitDto | null = null, forkDetails?: TimelineFork): TimelineResponseDto=> {
  const baseResponse :TimelineResponseDto ={
    id: timeline.id,
    type: {
      id:timelineTypes.id,
      type:timelineTypes.type
    },
    timeUnit: timeUnit? {
      id:timeUnit.id,
      code:timeUnit.code
    } : null,
    duration: timeline.duration,
    title: timeline.title,
    description: timeline.description,
    isGenerated: timeline.isGenerated,
    isPublic: timeline.isPublic,
    enableScheduling: timeline.enableScheduling,
    version: timeline.version,
    author: {
      id: timeline.author.id,
      username: timeline.author.username
    },
    createdAt: timeline.createdAt,
    updatedAt: timeline.updatedAt,
    forkDetails:undefined
  };

  if (!includeForkDetails) {
    return baseResponse;
  }

  const extendedResponse: TimelineResponseDto = {
    ...baseResponse,
    isForked: forkDetails ? true : false,
    forkDetails: forkDetails ? forkDetails : undefined
  };
  return extendedResponse;
};


