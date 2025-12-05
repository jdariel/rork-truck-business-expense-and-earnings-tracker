import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

const ReceiptDataSchema = z.object({
  merchant: z.string().describe('Name of the merchant/vendor'),
  amount: z.number().describe('Total amount paid'),
  date: z.string().describe('Date of purchase in YYYY-MM-DD format'),
  category: z.enum(['fuel', 'maintenance', 'insurance', 'permits', 'tolls', 'parking', 'food', 'lodging', 'repairs', 'tires', 'other']).describe('Expense category - choose the most appropriate category from: fuel, maintenance, insurance, permits, tolls, parking, food, lodging, repairs, tires, or other'),
  items: z.array(z.string()).describe('List of items purchased').optional(),
});

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
      
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ReceiptDataSchema,
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

      console.log('[Receipt Scan] AI response received:', JSON.stringify(result.object, null, 2));
      
      if (!result.object || typeof result.object !== 'object') {
        console.error('[Receipt Scan] Invalid result from AI:', result);
        throw new Error('Invalid response from AI service');
      }

      return result.object;
    } catch (error) {
      console.error('[Receipt Scan] Error:', error);
      console.error('[Receipt Scan] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to scan receipt: ${errorMessage}`);
    }
  });
