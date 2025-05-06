import { GenerateSegmentsRequestDto } from "../dtos/dtos"

export const segmentGenerationPrompt = (data: GenerateSegmentsRequestDto): string => {
    return `
    ## TIMELINE INFO:
    - Title: ${data.title}
    - Domain: ${data.domain}
    - Goal: ${data.goal}  
    - Knowledge Level: ${data.skillLevel}
    - Target Audience: ${data.targetAudience}
    - Duration: ${data.duration} ${data.timeUnit}

## TASK:
You are generating a professional learning roadmap. If any field (like domain or level) seems invalid or unclear, IGNORE it and focus on building a sensible roadmap based on the remaining data.

Generate ${data.duration} sequential segments with logical progression toward the goal. Each segment should represent one unit of learning appropriate for the stated duration and skill level.

## OUTPUT:
Return ONLY a valid JSON array with these fields per segment:
- title: Clear, concise name
- unitNumber: Sequential number starting at 1
- milestone: Text for major achievements (null for most segments, only 2–3 segments should have milestones)
- goals: Array of 2–3 specific learning objectives
- references: Array of 1–2 high-quality resources

Important: Return ONLY the valid JSON array with no additional text or explanation.
`
}