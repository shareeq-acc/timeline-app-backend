import { Timeline } from '../models/Timeline';
import { TimelineResponseDto } from '../types/dtos';
import { TimelineProps } from '../types/timelineTypes';

export const mapDbRowToTimeline = (row: any): Timeline => {
  
  // Transform from snake_case to camelCase
  const transformedRow = {
    id: row.id,
    type: row.type,
    timeUnit: row.time_unit,
    duration: row.duration,
    title: row.title,
    description: row.description,
    authorId: row.author_id,
    isGenerated: row.is_generated,
    prompt: row.prompt,
    isPublic: row.is_public,
    isForked: row.is_forked,
    forkCount: row.fork_count,
    originalTimelineId: row.original_timeline_id,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  return new Timeline(
    transformedRow.id,
    transformedRow.type,
    transformedRow.timeUnit,
    transformedRow.duration,
    transformedRow.title,
    transformedRow.description,
    transformedRow.authorId,
    transformedRow.isGenerated,
    transformedRow.prompt,
    transformedRow.isPublic,
    transformedRow.isForked,
    transformedRow.forkCount,
    transformedRow.originalTimelineId,
    transformedRow.version,
    transformedRow.createdAt,
    transformedRow.updatedAt
  );
};

export const mapTimelineToResponseDto = (timeline: Timeline): TimelineResponseDto => {
  return {
    id: timeline.id,
    type: timeline.type,
    timeUnit: timeline.timeUnit,
    duration: timeline.duration,
    title: timeline.title,
    description: timeline.description,
    isGenerated: timeline.isGenerated,
    prompt: timeline.prompt,
    isPublic: timeline.isPublic,
    isForked: timeline.isForked,
    forkCount: timeline.forkCount,
    originalTimelineId: timeline.originalTimelineId,
    version: timeline.version,
    authorId: timeline.authorId,
    createdAt: timeline.createdAt,
    updatedAt: timeline.updatedAt,
  };
};