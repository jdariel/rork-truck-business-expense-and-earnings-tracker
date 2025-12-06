import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(z.object({ 
    base64Image: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Receipt Scan] Started - Image length:', input.base64Image.length);
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.error('[Receipt Scan] OPENAI_API_KEY not configured');
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
      }

      console.log('[Receipt Scan] Calling OpenAI Vision API...');
      console.log('[Receipt Scan] OpenAI Key present:', !!process.env.OPENAI_API_KEY);
      console.log('[Receipt Scan] Image data prefix:', input.base64Image.substring(0, 50));
      
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          merchant: z.string().describe('Name of the merchant/vendor'),
          amount: z.number().describe('Total amount paid'),
          date: z.string().describe('Date of purchase in YYYY-MM-DD format'),
          category: z.enum(['fuel', 'maintenance', 'insurance', 'permits', 'tolls', 'parking', 'food', 'lodging', 'repairs', 'tires', 'other']).describe('Expense category'),
          items: z.array(z.string()).describe('List of items purchased').optional(),
        }),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the receipt information from this image. Identify the merchant name, total amount, date (in YYYY-MM-DD format), and categorize the expense. Categories: fuel, maintenance, insurance, permits, tolls, parking, food, lodging, repairs, tires, other. If items are clearly visible, list them. Be as accurate as possible.',
              },
              {
                type: 'image',
                image: `data:image/jpeg;base64,${input.base64Image}`,
              },
            ],
          },
        ],
      });

      console.log('[Receipt Scan] AI response received');
      console.log('[Receipt Scan] Result object:', JSON.stringify(result.object, null, 2));
      
      if (!result.object || typeof result.object !== 'object') {
        console.error('[Receipt Scan] Invalid result from AI - result:', JSON.stringify(result));
        throw new Error('Invalid response from AI service');
      }

      const responseData = {
        merchant: result.object.merchant,
        amount: result.object.amount,
        date: result.object.date,
        category: result.object.category,
        items: result.object.items,
      };

      console.log('[Receipt Scan] Returning data:', JSON.stringify(responseData));
      return responseData;
    } catch (error: any) {
      console.error('[Receipt Scan] Error:', error);
      console.error('[Receipt Scan] Error name:', error?.name);
      console.error('[Receipt Scan] Error message:', error?.message);
      console.error('[Receipt Scan] Error stack:', error?.stack);
      console.error('[Receipt Scan] Error cause:', error?.cause);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorDetails = {
        name: error?.name || 'Error',
        message: errorMessage,
        cause: error?.cause ? String(error.cause) : undefined,
      };
      
      console.error('[Receipt Scan] Error details:', JSON.stringify(errorDetails));
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to scan receipt: ${errorMessage}`,
        cause: error,
      });
    }
  });
