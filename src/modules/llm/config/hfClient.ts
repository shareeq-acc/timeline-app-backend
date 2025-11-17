import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_ACCESS_TOKEN);
export const hfClient = client;

// Use environment variable or fallback to a currently available model
// Models that work with HF Serverless Inference API:
// - "Qwen/Qwen2.5-7B-Instruct" (Qwen's latest - very stable)
// - "mistralai/Mistral-7B-Instruct-v0.3" (Mistral's latest 7B)
// - "meta-llama/Meta-Llama-3-8B-Instruct" (Meta's Llama 3)
// - "microsoft/Phi-3-mini-4k-instruct" (Microsoft's efficient model)
export const hfModel = process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct";

// Provider is no longer needed with the standard API
export const hfProvider = "together" as const;
export const hfRole = "user";
