import { ERROR_CODES } from "../../../shared/constants/errorDefinations";
import { AppError } from "../../../shared/utils/errorHandler";
import { openaiClient } from "../config/openAiClient";
import { GenerateSegmentsRequestDto, GenerateSegmentsResponseDto } from "../dtos/dtos";
import { segmentGenerationPrompt } from "../prompts/segmentGeneration";
import { hfClient, hfModel, hfProvider, hfRole } from "../config/hfClient";
import { SEGMENT_GENERATION_COST } from "../constants/costs";
import { error } from "console";

class LLMServices {


    private async parseResponse(llmResponse: any): Promise<any> {
        try {
            let cleanedContent = llmResponse.trim();
            
            // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
            if (cleanedContent.startsWith('```')) {
                // Remove opening ```json or ```
                cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '');
                // Remove closing ```
                cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
                cleanedContent = cleanedContent.trim();
            }
            
            // Try to parse the JSON
            const parsed = JSON.parse(cleanedContent);
            
            // Validate that it's an array
            if (!Array.isArray(parsed)) {
                console.error("Parsed response is not an array:", parsed);
                throw new Error("Response is not in the expected array format");
            }
            
            return parsed;
        } catch (error: any) {
            console.error("Error parsing LLM response:", error.message);
            console.error("Raw response:", llmResponse);
            throw new Error(`Failed to parse AI response: ${error.message}`);
        }
    }

    /**
     * Checks if a prompt contains unsafe or inappropriate content using OpenAI Moderation API.
     * @param prompt The user input to check.
     * @returns True if the content is flagged, false otherwise.
     */
    private async isPromptFlagged(prompt: string): Promise<boolean> {
        try {
            const response = await openaiClient.post('/moderations', {
                input: prompt,
            });
            console.log("Response!!!", response.data);
            const results = response.data.results[0];
            return results.flagged;
        } catch (error) {
            return true;
        }
    }

    /**
     * Generates segments based on user input using Hugging Face API.
     * @param prompt The user input to generate segments.
     * @returns The generated segments as a string.
     */
    async generateSegments(data: GenerateSegmentsRequestDto): Promise<GenerateSegmentsResponseDto> {

        const prompt = segmentGenerationPrompt(data);
        // const isFlagged = await this.isPromptFlagged(prompt);
        // if(isFlagged){
        //     throw new AppError(
        //         ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
        //         ERROR_CODES.FORBIDDEN_ERROR.code,
        //         'Access denied',
        //         'The values provided are not safe for Segment Generation'
        //     );
        // }
        if (data.credits < SEGMENT_GENERATION_COST) {
            throw new AppError(
                ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                ERROR_CODES.FORBIDDEN_ERROR.code,
                'Insufficient credits',
                'You do not have enough credits to generate segments!'
            );
        }
        console.log("Starting segment generation with model:", hfModel);
        
        try {
            const chatCompletion = await hfClient.chatCompletion({
                model: hfModel,
                messages: [
                    {
                        role: hfRole,
                        content: prompt,
                    },
                ],
                max_tokens: 2000,
                temperature: 0.7,
            });
            
            const response = chatCompletion?.choices[0]?.message?.content;

            if (!response) {
                throw new AppError(
                    ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                    ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                    'Internal Server Error',
                    'Failed to generate segments - no response from model'
                );
            }
            
            console.log("Successfully generated response, parsing...");
            
            let parsedResponse;
            try {
                parsedResponse = await this.parseResponse(response);
            } catch (parseError: any) {
                console.error("Failed to parse AI response:", parseError.message);
                console.error("Raw AI response:", response);
                throw new AppError(
                    ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                    ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                    'AI Response Parse Error',
                    `Failed to parse AI response: ${parseError.message}. The AI may have returned an invalid format.`
                );
            }
            
            if (!parsedResponse || !parsedResponse.length || parsedResponse.length === 0) {
                console.error("Parsed response is empty or invalid:", parsedResponse);
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Invalid AI Response',
                    'The AI generated an empty response. Please try again with different parameters.'
                );
            }
            
            console.log("Successfully parsed segments:", parsedResponse.length);
            return {
                segments: parsedResponse,
                creditsUsed: SEGMENT_GENERATION_COST
            };
        } catch (error: any) {
            console.error("Hugging Face API Error:", error);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            // If it's already an AppError, rethrow it
            if (error instanceof AppError) {
                throw error;
            }
            
            // Provide more specific error message based on error type
            let errorMessage = 'Failed to generate segments using AI service.';
            
            if (error.message?.includes('rate limit')) {
                errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
            } else if (error.message?.includes('timeout')) {
                errorMessage = 'Request timed out. Please try again.';
            } else if (error.message?.includes('parse')) {
                errorMessage = error.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new AppError(
                ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                'AI Service Error',
                errorMessage
            );
        }


    }
}

export const llmServices = new LLMServices(); 