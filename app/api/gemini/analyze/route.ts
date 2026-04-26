import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { neglectRatio, quadrantActivity, tremorScore, nudgeCount, context } = body;

    if (typeof neglectRatio !== 'number' || 
        typeof tremorScore !== 'number' || typeof nudgeCount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metrics provided' },
        { status: 400 }
      );
    }

    // Validate quadrant activity if provided
    if (quadrantActivity && (
      typeof quadrantActivity.topLeft !== 'number' ||
      typeof quadrantActivity.topRight !== 'number' ||
      typeof quadrantActivity.bottomLeft !== 'number' ||
      typeof quadrantActivity.bottomRight !== 'number'
    )) {
      return NextResponse.json(
        { error: 'Invalid quadrant activity data provided' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Build quadrant analysis string
    const quadrantInfo = quadrantActivity 
      ? `\n- Quadrant Activity Distribution:
  * Top-Left: ${quadrantActivity.topLeft.toFixed(1)}%
  * Top-Right: ${quadrantActivity.topRight.toFixed(1)}%
  * Bottom-Left: ${quadrantActivity.bottomLeft.toFixed(1)}%
  * Bottom-Right: ${quadrantActivity.bottomRight.toFixed(1)}%`
      : '';

    const prompt = `Act as a clinical neuropsychologist. A dementia patient colored a photo${context ? ` of ${context}` : ''}. 

Metrics:
- Neglect Ratio: ${neglectRatio.toFixed(3)} (0.5 is balanced, closer to 0 or 1 indicates spatial neglect - values closer to 0 suggest left-sided neglect, values closer to 1 suggest right-sided neglect)${quadrantInfo}
- Tremor Score: ${tremorScore.toFixed(3)} (higher indicates more micro-movements/jitter)
- Nudges used: ${nudgeCount}

Analyze the patient's spatial awareness using the 4-quadrant data. In clinical practice:
- Horizontal Neglect (Left vs Right): Most common in post-stroke or Alzheimer's patients. A 90%+ right-side bias suggests classic Left-Sided Neglect.
- Vertical Neglect (Top vs Bottom): Often seen in Progressive Supranuclear Palsy (PSP) or advanced dementia. If activity is concentrated in the bottom 40% of the screen, this may indicate vertical gaze palsy or altitudinal neglect.

Based on the quadrant activity distribution, provide a 3-sentence summary for a family caregiver:
1. First sentence: Comment on spatial awareness and attention distribution. Specifically analyze if there's horizontal neglect (left vs right bias), vertical neglect (top vs bottom bias), or quadrant-specific neglect patterns. For example, if Top-Left is <5% and Top-Right is >45%, this indicates significant left-sided and potentially top neglect.
2. Second sentence: Comment on motor control and hand stability based on the tremor score.
3. Third sentence: Comment on engagement level based on nudges used and overall participation.

Keep the language clear, compassionate, and informative. Focus on what the quadrant data suggests about the patient's current state, with particular attention to both horizontal and vertical spatial neglect patterns.`;

    console.log('Calling Gemini API with prompt:', prompt);
    
    // Try gemini-2.5-flash first, fallback to gemini-1.5-flash if rate limited
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    let result;
    let response;
    let text;
    
    try {
      console.log('Generating content with gemini-2.5-flash...');
      result = await model.generateContent(prompt);
      response = await result.response;
      text = response.text();
      console.log('Successfully generated analysis:', text);
    } catch (error: unknown) {
      // If rate limited (429) or model not found (404), try gemini-1.5-flash as fallback
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Error with gemini-2.5-flash:', errorMessage);
      if (errorMessage.includes('429') || errorMessage.includes('404')) {
        console.log('Rate limited or model unavailable, trying gemini-1.5-flash...');
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
        console.log('Successfully generated analysis with fallback:', text);
      } else {
        throw error;
      }
    }

    console.log('Returning analysis response');
    return NextResponse.json({
      success: true,
      analysis: text,
    });
  } catch (error) {
    console.error('Error calling Gemini API for analysis:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate analysis',
      },
      { status: 500 }
    );
  }
}
