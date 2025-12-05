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
    console.log('Receipt scan requested, image length:', input.base64Image.length);
    
    try {
      const { generateObject } = await import('@rork-ai/toolkit-sdk');

      const data = await generateObject({
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

      console.log('Receipt scanned successfully:', data);
      return data;
    } catch (error) {
      console.error('Error scanning receipt:', error);
      throw new Error('Failed to scan receipt: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  });
