import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from '@trpc/server';
import OpenAI from 'openai';

export default publicProcedure
  .input(z.object({ 
    base64Image: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Receipt Scan] Started - Image length:', input.base64Image.length);
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.error('[Receipt Scan] OPENAI_API_KEY not configured');
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'OpenAI API key is not configured. Please contact support.',
        });
      }

      console.log('[Receipt Scan] Calling OpenAI Vision API...');
      console.log('[Receipt Scan] OpenAI Key present:', !!process.env.OPENAI_API_KEY);
      console.log('[Receipt Scan] OpenAI constructor available:', typeof OpenAI);
      
      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      console.log('[Receipt Scan] OpenAI client created successfully');

      let completion;
      try {
        completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the receipt information from this image and return a JSON object with the following structure: {"merchant": string, "amount": number, "date": string (YYYY-MM-DD), "category": string (one of: fuel, maintenance, insurance, permits, tolls, parking, food, lodging, repairs, tires, other), "items": array of strings (optional)}. Be as accurate as possible.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${input.base64Image}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        });
      } catch (apiError: any) {
        console.error('[Receipt Scan] OpenAI API error:', apiError);
        const errorMessage = apiError?.message || 'AI service request failed';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to process receipt: ${errorMessage}`,
        });
      }

      console.log('[Receipt Scan] AI response received');
      
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error('[Receipt Scan] No content in response');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No response from AI service',
        });
      }

      console.log('[Receipt Scan] Raw content:', content);
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        console.error('[Receipt Scan] Failed to parse JSON:', parseError);
        console.error('[Receipt Scan] Content that failed to parse:', content);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse AI response',
        });
      }

      console.log('[Receipt Scan] Parsed object:', JSON.stringify(parsed, null, 2));

      const responseData = {
        merchant: String(parsed.merchant || 'Unknown'),
        amount: Number(parsed.amount) || 0,
        date: String(parsed.date || new Date().toISOString().split('T')[0]),
        category: parsed.category || 'other',
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };

      console.log('[Receipt Scan] Returning data:', JSON.stringify(responseData));
      return responseData;
    } catch (error: any) {
      console.error('[Receipt Scan] Caught error:', error);
      console.error('[Receipt Scan] Error type:', typeof error);
      console.error('[Receipt Scan] Error name:', error?.name);
      console.error('[Receipt Scan] Error message:', error?.message);
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to scan receipt: ${errorMessage}`,
      });
    }
  });
