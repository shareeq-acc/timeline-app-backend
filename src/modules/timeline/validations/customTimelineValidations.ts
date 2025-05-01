import { Request, Response, NextFunction } from 'express';
import { TimelineType } from '../models/TimelineType';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';
import { TimeUnit } from '../models/TimeUnit';

export const validateTimelineBusinessRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typeId = req.body.typeId;
        const timelineType = await TimelineType.findById(typeId);

        if(!timelineType) {
            throw new AppError(ERROR_CODES.BAD_REQUEST.httpStatus, ERROR_CODES.BAD_REQUEST.code, ERROR_CODES.BAD_REQUEST.message, "Invalid timeline type");
        }

        if(timelineType.needsTimeUnit) {
            if(!req.body.timeUnitId) {
                throw new AppError(ERROR_CODES.BAD_REQUEST.httpStatus, ERROR_CODES.BAD_REQUEST.code, ERROR_CODES.BAD_REQUEST.message, "Time unit is required");
            }
            const timeUnit = await TimeUnit.findById(req.body.timeUnitId);
            if(!timeUnit) {
                throw new AppError(ERROR_CODES.BAD_REQUEST.httpStatus, ERROR_CODES.BAD_REQUEST.code, ERROR_CODES.BAD_REQUEST.message, "Invalid time unit");
            }
        }else {
            req.body.timeUnitId = null;
        }

        if(timelineType.needsDuration) {
            if(!req.body.duration){
                throw new AppError(ERROR_CODES.BAD_REQUEST.httpStatus, ERROR_CODES.BAD_REQUEST.code, ERROR_CODES.BAD_REQUEST.message, "Duration is required");
            }
        }else {
            req.body.duration = null;
        }

        if(!timelineType.supportsScheduling) {
            if(req.body.enableScheduling){
                throw new AppError(ERROR_CODES.BAD_REQUEST.httpStatus, ERROR_CODES.BAD_REQUEST.code, ERROR_CODES.BAD_REQUEST.message, "Scheduling is not supported for this timeline type");
            }
            req.body.enableScheduling = false;
        }

        next();
    } catch (error) {
        next(error);
    }
};

