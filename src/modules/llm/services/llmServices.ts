import axios from 'axios';
import { ERROR_CODES } from "../../../shared/constants/errorDefinations";
import { AppError } from "../../../shared/utils/errorHandler";
import { pool } from "../../../shared/config/db";
import { userService } from "../../user/services/userServices";
import { timelineService } from "../../timeline/services/timelineServices";
import { withTransaction } from "../../../shared/db/withTransaction";
import logger from "../../../shared/utils/logger";

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const timelineGenerationPrompt = (data: {
  title: string;
  description: string;
  subject: string;
  skillLevel: string;
  audience: string;
  duration?: number;
  timeUnit?: string;
  hasTimeUnit: boolean;
}): string => {
  const durationText = data.hasTimeUnit 
    ? `The timeline has a fixed duration of ${data.duration} ${data.timeUnit}(s). You must generate exactly ${data.duration} sequential segments representing the milestone stages.`
    : `The timeline does not have a fixed duration or time unit. You must generate a set of relevant, sequential steps or milestones to achieve the goal. Generate NO MORE than 6 segments total.`;

  return `
You are an expert curriculum builder and learning path designer. 
Generate a comprehensive, highly-structured learning timeline/roadmap based on the following details:
- User's Goal / Topic: ${data.title}
- Goal Description & Scope: ${data.description}
- Category / Subject: ${data.subject}
- Skill Level: ${data.skillLevel}
- Target Audience: ${data.audience}

${durationText}

## OUTPUT FORMAT:
Return ONLY a valid JSON object matching the following structure:
{
  "title": "A highly professional, engaging title for the roadmap",
  "description": "An inspiring, detailed description summarizing the learning journey, scope, and key outcomes (max 400 characters)",
  "segments": [
    {
      "unitNumber": 1,
      "title": "Clear, concise name of the segment or milestone",
      "milestone": "A major achievement check point achieved at this stage (use null if not a major milestone, only 1-2 segments should have milestone text)",
      "goals": ["objective 1", "objective 2"],
      "references": ["reference resource 1", "reference resource 2"]
    }
    // ... sequential segments
  ]
}

## RULES:
1. Each segment must have 2-3 specific learning goals and 1-2 high-quality references or learning resource recommendations.
2. The progression of segments must be logical and lead toward achieving the master goal.
3. If hasTimeUnit is true, unitNumber must be sequential starting from 1 up to ${data.duration}.
4. If hasTimeUnit is false, unitNumber must be sequential starting from 1 up to the number of segments generated (max 6).
5. Output ONLY the JSON object. Do not include markdown wraps like \`\`\`json or any other text before/after.
`;
};

export const segmentGenerationPrompt = (data: {
  title: string;
  timeUnit: string;
  duration: number;
  type: string;
  goal: string;
  skillLevel?: string;
  targetAudience?: string;
  domain?: string;
}): string => {
  return `
You are generating a professional learning roadmap. If any field (like domain or level) seems invalid or unclear, IGNORE it and focus on building a sensible roadmap based on the remaining data.

- Title: ${data.title}
- Goal/Scope: ${data.goal}
- Domain/Category: ${data.domain || 'General'}
- Knowledge Level: ${data.skillLevel || 'Beginner'}
- Target Audience: ${data.targetAudience || 'General Learners'}
- Duration: ${data.duration} ${data.timeUnit}

Generate ${data.duration} sequential segments with logical progression toward the goal. Each segment should represent one unit of learning appropriate for the stated duration and skill level.

## OUTPUT FORMAT:
Return ONLY a valid JSON array with these fields per segment:
- title: Clear, concise name
- unitNumber: Sequential number starting at 1
- milestone: Text for major achievements (null for most segments, only 1-2 segments should have milestones)
- goals: Array of 2–3 specific learning objectives
- references: Array of 1–2 high-quality resources

Important: Return ONLY the valid JSON array. Do not include markdown wraps like \`\`\`json or any other text before/after.
`;
};

class LLMServices {
  private async callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError(
        ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
        ERROR_CODES.INTERNAL_SERVER_ERROR.code,
        'Gemini API key is not configured',
        'Gemini API key is not configured'
      );
    }

    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 45000, // 45s timeout for AI response
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text;
    } catch (error: any) {
      logger.error('Gemini API request failed', { error: error.message });
      throw new AppError(
        ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
        ERROR_CODES.INTERNAL_SERVER_ERROR.code,
        'AI Generation Failed',
        error.message || 'AI Generation Failed'
      );
    }
  }

  private async parseResponse(llmResponse: string): Promise<any> {
    try {
      let cleanedContent = llmResponse.trim();
      
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '');
        cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
        cleanedContent = cleanedContent.trim();
      }
      
      return JSON.parse(cleanedContent);
    } catch (error: any) {
      logger.error('Error parsing LLM response', { error: error.message, raw: llmResponse });
      throw new AppError(
        ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
        ERROR_CODES.INTERNAL_SERVER_ERROR.code,
        'AI Parse Error',
        'Failed to parse JSON response from Gemini API.'
      );
    }
  }

  async generateTimelineAndSegments(userId: string, data: any): Promise<string> {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND.httpStatus,
        ERROR_CODES.NOT_FOUND.code,
        'User not found',
        'User not found'
      );
    }

    if (user.aiUsage >= 100) {
      throw new AppError(
        403,
        'AI_LIMIT_REACHED',
        'Weekly AI usage limit reached. Please wait for reset.',
        'Weekly AI usage limit reached. Please wait for reset.'
      );
    }

    const hasTimeUnit = data.typeId === 'with_time_unit';
    const prompt = timelineGenerationPrompt({
      title: data.title,
      description: data.description,
      subject: data.aiDomain || 'General',
      skillLevel: data.aiLevel || 'Beginner',
      audience: data.aiAudience || 'General Learners',
      duration: hasTimeUnit ? Number(data.duration) : undefined,
      timeUnit: hasTimeUnit ? data.timeUnitId : undefined,
      hasTimeUnit,
    });

    logger.info('Calling Gemini to generate timeline and segments');
    const rawResult = await this.callGemini(prompt);
    const parsed = await this.parseResponse(rawResult);

    // Save in transaction
    const timelineId = await withTransaction(async (client) => {
      // 1. Fetch Timeline Type UUID
      const typeCode = hasTimeUnit ? 'ROADMAP' : 'CHRONICLE';
      const typeRes = await client.query('SELECT id FROM timeline_types WHERE type = $1', [typeCode]);
      if (typeRes.rows.length === 0) {
        throw new Error('Timeline type not found in database');
      }
      const typeUuid = typeRes.rows[0].id;

      // 2. Fetch Time Unit UUID if needed
      let timeUnitUuid: string | null = null;
      if (hasTimeUnit && data.timeUnitId) {
        const codeMap: Record<string, string> = {
          daily: 'DAILY',
          weekly: 'WEEK',
          monthly: 'MONTHLY',
        };
        const code = codeMap[data.timeUnitId.toLowerCase()] || 'WEEK';
        const unitRes = await client.query('SELECT id FROM time_units WHERE code = $1', [code]);
        if (unitRes.rows.length > 0) {
          timeUnitUuid = unitRes.rows[0].id;
        }
      }

      // 3. Create Timeline
      const timelineInsert = await client.query(
        `
        INSERT INTO timelines (
          type_id, time_unit_id, duration, title, description, 
          author_id, is_public, enable_scheduling, is_generated
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id
      `,
        [
          typeUuid,
          timeUnitUuid,
          hasTimeUnit ? Number(data.duration) : null,
          parsed.title || data.title,
          parsed.description || data.description,
          userId,
          data.isPublic ?? true,
          hasTimeUnit ? (data.enableScheduling ?? false) : false,
        ]
      );
      const createdTimelineId = timelineInsert.rows[0].id;

      // 4. Create Segments
      if (parsed.segments && Array.isArray(parsed.segments)) {
        for (const seg of parsed.segments) {
          const segInsert = await client.query(
            `
            INSERT INTO segments (timeline_id, unit_number, title, milestone)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `,
            [createdTimelineId, seg.unitNumber, seg.title, seg.milestone || null]
          );
          const segmentId = segInsert.rows[0].id;

          if (seg.goals && Array.isArray(seg.goals)) {
            for (const goal of seg.goals) {
              await client.query(
                'INSERT INTO segment_goals (segment_id, goal) VALUES ($1, $2)',
                [segmentId, goal]
              );
            }
          }

          if (seg.references && Array.isArray(seg.references)) {
            for (const ref of seg.references) {
              await client.query(
                'INSERT INTO segment_references (segment_id, reference) VALUES ($1, $2)',
                [segmentId, ref]
              );
            }
          }

          if (hasTimeUnit && (data.enableScheduling ?? false)) {
            await client.query(
              'INSERT INTO segment_schedules (segment_id, schedule_date) VALUES ($1, null)',
              [segmentId]
            );
          }
        }
      }

      // 5. Update user AI usage
      const currentUsage = user.aiUsage;
      let nextUsage = 100;
      if (currentUsage === 0) {
        nextUsage = 34;
      } else if (currentUsage === 34) {
        nextUsage = 67;
      }
      await client.query(
        'UPDATE users SET ai_usage = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId, nextUsage]
      );

      return createdTimelineId;
    });

    return timelineId;
  }

  async generateSegments(data: any, userId: string): Promise<any[]> {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND.httpStatus,
        ERROR_CODES.NOT_FOUND.code,
        'User not found',
        'User not found'
      );
    }

    if (user.aiUsage >= 100) {
      throw new AppError(
        403,
        'AI_LIMIT_REACHED',
        'Weekly AI usage limit reached. Please wait for reset.',
        'Weekly AI usage limit reached. Please wait for reset.'
      );
    }

    const prompt = segmentGenerationPrompt({
      title: data.title,
      timeUnit: data.timeUnit || 'WEEK',
      duration: data.duration || 5,
      type: data.type || 'ROADMAP',
      goal: data.goal || data.title,
      skillLevel: data.skillLevel || 'Beginner',
      targetAudience: data.targetAudience || 'General Learners',
      domain: data.domain || 'General',
    });

    logger.info('Calling Gemini to generate segments');
    const rawResult = await this.callGemini(prompt);
    const parsed = await this.parseResponse(rawResult);

    // Increment user AI usage
    await userService.incrementAiUsage(userId);

    return parsed;
  }
}

export const llmServices = new LLMServices();