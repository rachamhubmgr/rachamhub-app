import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedOrder, GeminiResponse } from '@/lib/types';

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const EXTRACTION_PROMPT = `
You are an order extraction AI for RachamHub, a Lagos-based logistics company.
Extract order details from the provided text and return a valid JSON object.

IMPORTANT: Always return valid JSON that matches this exact structure:
{
  "customerId": "string (customer ID or generate one if not provided)",
  "customerName": "string (customer name)",
  "items": [
    {
      "name": "string (item name)",
      "quantity": number (quantity as a number),
      "weight": "string or null (weight if provided)",
      "dimensions": "string or null (dimensions if provided)"
    }
  ],
  "totalAmount": number (total amount as a number, use 0 if not specified),
  "notes": "string or null (any additional notes)"
}

Rules:
1. Extract customer name and ID from the text
2. List all items with their quantities
3. Calculate or extract total amount
4. Return ONLY valid JSON, no markdown, no extra text
5. If a field is not provided, use null for optional fields
6. Ensure quantities are numbers, not strings
7. If no total amount is provided, use 0

Text to extract from:
`;

export async function POST(request: Request) {
  try {
    // Validate API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('[Gemini API] Missing GOOGLE_GEMINI_API_KEY environment variable');
      return Response.json(
        {
          success: false,
          error: 'Gemini API is not configured. Please set GOOGLE_GEMINI_API_KEY.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Please provide order text to extract',
        },
        { status: 400 }
      );
    }

    console.log('[Gemini API] Extracting order from text:', text.substring(0, 100) + '...');

    // Call Gemini API
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = EXTRACTION_PROMPT + '\n' + text;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log('[Gemini API] Raw response:', responseText);

    // Parse JSON response
    let extractedData: ExtractedOrder;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Gemini API] JSON parse error:', parseError);
      return Response.json(
        {
          success: false,
          error: 'Failed to parse extracted order data. Please try again with clearer information.',
        },
        { status: 400 }
      );
    }

    // Validate extracted data structure
    if (!extractedData.customerName || !extractedData.customerId || !Array.isArray(extractedData.items)) {
      return Response.json(
        {
          success: false,
          error: 'Could not extract required order information. Please provide customer name and at least one item.',
        },
        { status: 400 }
      );
    }

    console.log('[Gemini API] Successfully extracted order:', extractedData);

    const response: GeminiResponse = {
      success: true,
      data: extractedData,
    };

    return Response.json(response);
  } catch (error) {
    console.error('[Gemini API] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract order';
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
