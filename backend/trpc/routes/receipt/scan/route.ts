import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

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
      let generateObject;
      try {
        const toolkit = await import('@rork-ai/toolkit-sdk');
        generateObject = toolkit.generateObject;
        console.log('[Receipt Scan] AI toolkit imported successfully');
      } catch (importError) {
        console.error('[Receipt Scan] AI toolkit import failed:', importError);
        throw new Error('AI toolkit is not configured. Please set up @rork-ai/toolkit-sdk or contact support.');
      }

      if (!generateObject) {
        console.error('[Receipt Scan] generateObject is undefined');
        throw new Error('AI toolkit generateObject function is not available');
      }

      console.log('[Receipt Scan] Calling generateObject with schema...');
      let result;
      try {
        result = await generateObject({
          schema: ReceiptDataSchema,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the receipt information from this image. Identify the merchant name, total amount, date (in YYYY-MM-DD format), and categorize the expense. Categories: fuel, maintenance, insurance, permits, tolls, parking, food, lodging, repairs, tires, other. If items are clearly visible, list them.',
                },
                {
                  type: 'image',
                  image: `data:image/jpeg;base64,${input.base64Image}`,
                },
              ],
            },
          ],
        });
      } catch (aiError) {
        console.error('[Receipt Scan] generateObject error:', aiError);
        if (aiError && typeof aiError === 'object' && 'message' in aiError) {
          throw new Error(`AI service error: ${(aiError as Error).message}`);
        }
        throw new Error('AI service encountered an error processing the receipt');
      }

      console.log('[Receipt Scan] AI response received:', JSON.stringify(result, null, 2));
      
      if (!result || typeof result !== 'object') {
        console.error('[Receipt Scan] Invalid result from AI:', result);
        throw new Error('Invalid response from AI service');
      }

      return result;
    } catch (error) {
      console.error('[Receipt Scan] Error:', error);
      console.error('[Receipt Scan] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to scan receipt: ${errorMessage}`);
    }
  });
