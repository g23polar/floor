import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { generateFloorplanContext } from '@/lib/ai/tools';

export async function POST(req: Request) {
  try {
    const { messages, provider, model, apiKey, floorplan } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create provider-specific client
    let aiModel;
    switch (provider) {
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey });
        aiModel = anthropic(model);
        break;
      }
      case 'openai': {
        const openai = createOpenAI({ apiKey });
        aiModel = openai(model);
        break;
      }
      case 'google': {
        const google = createGoogleGenerativeAI({ apiKey });
        aiModel = google(model);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // Generate context from current floorplan state
    const floorplanContext = floorplan
      ? generateFloorplanContext(floorplan)
      : 'No floorplan data provided.';

    // System prompt for floorplan assistance
    const systemPrompt = `You are an AI assistant for a floorplan editing application. You can both give advice AND directly manipulate the floorplan using the tools provided.

## Your Capabilities
- Add, remove, and modify walls
- Add doors and windows to walls
- Place and arrange furniture
- Create and label rooms
- Provide interior design advice and best practices

## Important Guidelines
1. All measurements are in INCHES. Convert feet to inches (1 foot = 12 inches).
2. The coordinate system starts from the top-left corner (0, 0).
3. When adding walls, think about creating enclosed spaces for rooms.
4. Consider standard clearances: 36" for main traffic paths, 24" for secondary paths.
5. Standard door width is 32" (interior) or 36" (exterior).
6. When the user asks you to do something, USE THE TOOLS to do it - don't just describe what should be done.
7. After using a tool, briefly confirm what you did.

## Current Floorplan State
${floorplanContext}

## Tool Usage Examples
- "Add a 10 foot wall" → addWall with coordinates spanning 120 inches (10 * 12)
- "Place a queen bed at 50, 50" → addFurniture with type "bed-queen", x: 50, y: 50
- "Remove the first wall" → removeWall with the wall's ID from the current state

Be helpful, concise, and take action when asked. If you need clarification about exact positions, ask the user.`;

    // Define tools with inputSchema (new API format)
    const tools = {
      addWall: {
        description: 'Add a wall to the floorplan. Coordinates are in inches from the top-left origin.',
        inputSchema: z.object({
          startX: z.number().describe('X coordinate of wall start point in inches'),
          startY: z.number().describe('Y coordinate of wall start point in inches'),
          endX: z.number().describe('X coordinate of wall end point in inches'),
          endY: z.number().describe('Y coordinate of wall end point in inches'),
          thickness: z.number().optional().describe('Wall thickness in inches (default: 6)'),
        }),
      },
      removeWall: {
        description: 'Remove a wall by its ID',
        inputSchema: z.object({
          wallId: z.string().describe('The ID of the wall to remove'),
        }),
      },
      addDoor: {
        description: 'Add a door to an existing wall',
        inputSchema: z.object({
          wallId: z.string().describe('The ID of the wall to add the door to'),
          position: z.number().min(0).max(1).describe('Position along the wall (0-1, where 0.5 is center)'),
          width: z.number().optional().describe('Door width in inches (default: 32)'),
        }),
      },
      addWindow: {
        description: 'Add a window to an existing wall',
        inputSchema: z.object({
          wallId: z.string().describe('The ID of the wall to add the window to'),
          position: z.number().min(0).max(1).describe('Position along the wall (0-1)'),
          width: z.number().optional().describe('Window width in inches (default: 36)'),
        }),
      },
      addFurniture: {
        description: 'Add furniture to the floorplan. Types: bed-twin, bed-full, bed-queen, bed-king, sofa-2, sofa-3, dining-table-4, dining-table-6, desk, chair, armchair, coffee-table, nightstand, dresser, toilet, sink-bathroom, bathtub, shower, sink-kitchen, stove, refrigerator, dishwasher',
        inputSchema: z.object({
          type: z.string().describe('Type of furniture (e.g., bed-queen, sofa-3, desk)'),
          x: z.number().describe('X position in inches from left'),
          y: z.number().describe('Y position in inches from top'),
          rotation: z.number().optional().describe('Rotation in degrees (default: 0)'),
        }),
      },
      moveFurniture: {
        description: 'Move existing furniture to a new position',
        inputSchema: z.object({
          furnitureId: z.string().describe('The ID of the furniture to move'),
          x: z.number().describe('New X position in inches'),
          y: z.number().describe('New Y position in inches'),
        }),
      },
      removeFurniture: {
        description: 'Remove furniture by its ID',
        inputSchema: z.object({
          furnitureId: z.string().describe('The ID of the furniture to remove'),
        }),
      },
      clearAll: {
        description: 'Clear the entire floorplan (use with caution, requires confirmation)',
        inputSchema: z.object({
          confirm: z.boolean().describe('Must be true to confirm clearing'),
        }),
      },
    };

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages,
      tools,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
