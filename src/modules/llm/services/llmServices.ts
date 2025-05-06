import { ERROR_CODES } from "../../../shared/constants/errorDefinations";
import { AppError } from "../../../shared/utils/errorHandler";
import { openaiClient } from "../config/openAiClient";
import { GenerateSegmentsRequestDto, GenerateSegmentsResponseDto } from "../dtos/dtos";
import { segmentGenerationPrompt } from "../prompts/segmentGeneration";
import { hfClient, hfModel, hfProvider, hfRole } from "../config/hfClient";
import { SEGMENT_GENERATION_COST } from "../constants/costs";

class LLMServices {


    private async parseResponse(llmResponse: any): Promise<any> {
        const cleanedContent = llmResponse.trim();
        return await JSON.parse(cleanedContent);
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
    async generateSegments(data:GenerateSegmentsRequestDto): Promise<GenerateSegmentsResponseDto> {
    
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
            if(data.credits < SEGMENT_GENERATION_COST){
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Insufficient credits',
                    'You do not have enough credits to generate segments!'
                );
            }
            console.log("Starting!!!")
            const chatCompletion = await hfClient.chatCompletion({
                provider: hfProvider,
                model: hfModel,
                messages: [
                    {
                        role: hfRole,
                        content: prompt,
                    },
                ],
            });
            const response = chatCompletion?.choices[0]?.message?.content;

            if(!response){
                throw new AppError(
                    ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                    ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                    'Internal Server Error',
                    'Failed to generate segments'
                );
            }
            const parsedResponse = await this.parseResponse(response);
            if(!parsedResponse || !parsedResponse.length || parsedResponse.length === 0){
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Bad Request',
                    'Failed to generate segments'
                );
            }
            return {
                segments: parsedResponse,
                creditsUsed: SEGMENT_GENERATION_COST
            };
    
    }
}

export const llmServices = new LLMServices(); 