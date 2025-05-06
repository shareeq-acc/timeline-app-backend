import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_ACCESS_TOKEN);
export const hfClient = client;
export const hfModel = "mistralai/Mixtral-8x7B-Instruct-v0.1";
export const hfProvider = "together";
export const hfRole = "user";
