import {  CreateSegmentRequestDto } from "../../segment/dtos/dtos";

export interface GenerateSegmentsRequirements{
    goal:string;
    domain?: string;
    skillLevel?: string;
    targetAudience?: string;
}

export interface GenerateSegmentsRequestDto extends GenerateSegmentsRequirements{
    title: string;
    type:string;
    duration: number;
    timeUnit: string;
    credits: number;
}



export interface GenerateSegmentsResponseDto {
    segments: CreateSegmentRequestDto[];
    creditsUsed: number;
}