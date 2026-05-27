import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedOrder, GeminiResponse } from "@/lib/types";

// Initialize Gemini API client
const gemini_api_key = process.env.GOOGLE_GEMINI_API_KEY;

const gemini = new GoogleGenerativeAI(gemini_api_key!);

const EXTRACTION_PROMPT = `
You are an order extraction AI for RachamHub, a Lagos-based logistics company.
Extract order details from the provided text and return a valid JSON object.

IMPORTANT: Always return valid JSON that matches this exact structure:
{
  "customerName": "string (customer name)",
  "deliveryAddress": "string or null (delivery address)",
  "phoneNumbers": ["string (phone number)"],
  "merchant": "string or null (merchant name)",
  "comment": "string or null (customer comment or internal note)",
  "items": [
    {
      "name": "string (item name)",
      "quantity": number (quantity as a number),
    }
  ],
  "totalAmount": number (total amount as a number, use 0 if not specified),
}

Rules:
1. Extract customer name, delivery address, phone numbers, merchant, and comment from the text if available
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
      console.error(
        "[Gemini API] Missing GOOGLE_GEMINI_API_KEY environment variable",
      );
      return Response.json(
        {
          success: false,
          error:
            "Gemini API is not configured. Please set GOOGLE_GEMINI_API_KEY.",
        },
        { status: 500 },
      );
    }

    // Parse request body
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json(
        {
          success: false,
          error: "Please provide order text to extract",
        },
        { status: 400 },
      );
    }

    // Call Gemini API
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = EXTRACTION_PROMPT + "\n" + text;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("[Gemini API] Raw response:", responseText);

    // Parse JSON response
    let extractedData: ExtractedOrder;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("[Gemini API] JSON parse error:", parseError);
      return Response.json(
        {
          success: false,
          error:
            "Failed to parse extracted order data. Please try again with clearer information.",
        },
        { status: 400 },
      );
    }

    // Validate extracted data structure
    if (!extractedData.customerName || !Array.isArray(extractedData.items)) {
      return Response.json(
        {
          success: false,
          error:
            "Could not extract required order information. Please provide customer name and at least one item.",
        },
        { status: 400 },
      );
    }

    console.log("[Gemini API] Successfully extracted order:", extractedData);

    const response: GeminiResponse = {
      success: true,
      data: extractedData,
    };

    return Response.json(response);
  } catch (error) {
    console.error("[Gemini API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to extract order";
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
