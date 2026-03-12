const OpenAI = require('openai');

let client = null;

function getAI() {
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'FemFlow PCOS Tracker',
      },
    });
  }
  return client;
}

/**
 * Generate a sweet, girly motivational line for the user
 */
async function getMotivationalLine(userName, cycleDay, daysUntilPeriod) {
  try {
    const ai = getAI();

    let context = '';
    if (cycleDay && daysUntilPeriod !== null) {
      context = `She is on cycle day ${cycleDay} and her next period is ${daysUntilPeriod} days away.`;
    }

    const response = await ai.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        {
          role: 'system',
          content: "You are a warm, caring, and uplifting women's health companion app called FemFlow. Generate short sweet motivational lines for women.",
        },
        {
          role: 'user',
          content: `Generate ONE short, sweet, empowering motivational line for a woman named ${userName || 'her'}. ${context} The line should be girly, warm, and make her feel happy and confident about her body and health journey. Keep it under 20 words. Add a cute emoji at the start and end. Only return the line, nothing else.`,
        },
      ],
    });

    return response.choices[0].message.content?.trim() || getDefaultMotivationalLine();
  } catch (error) {
    console.error('OpenRouter motivational line error:', error.message);
    return getDefaultMotivationalLine();
  }
}

function getDefaultMotivationalLine() {
  const lines = [
    '🌸 You are blooming beautifully, one cycle at a time! 🌸',
    '💖 Your body is amazing and so are you, queen! 💖',
    '✨ Every day is a new chance to glow from within! ✨',
    '🦋 Embrace your rhythm — you are perfectly made! 🦋',
    '🌷 Self-care is not selfish, it is necessary. You got this! 🌷',
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * Get AI-powered cycle prediction analysis from Gemini
 */
async function getAICyclePrediction(cycleData) {
  try {
    const ai = getAI();

    const prompt = `You are an expert women's health AI assistant for a period tracking app called FemFlow.

Based on the following menstrual cycle data, provide a friendly, personalized analysis:

Cycle Data:
- Average cycle length: ${cycleData.avgCycleLength} days
- Average period length: ${cycleData.avgPeriodLength} days
- Next predicted period: ${cycleData.nextPeriodStart}
- Ovulation date: ${cycleData.ovulationDate}
- Days until next period: ${cycleData.daysUntilPeriod}
- Current cycle day: ${cycleData.cycleDay}
${cycleData.cycleLengths ? `- Recent cycle lengths: ${cycleData.cycleLengths.join(', ')} days` : ''}

Respond in JSON format ONLY (no markdown, no code blocks) with these fields:
{
  "phaseInfo": "Brief description of what phase she's currently in (follicular/ovulatory/luteal/menstrual) and what to expect",
  "bodyTip": "One helpful tip about what her body might be experiencing right now",
  "wellnessTip": "One actionable wellness tip specifically for her current cycle phase",
  "prediction_note": "A brief note about the prediction accuracy based on her cycle regularity",
  "encouragement": "A sweet, girly encouraging message about her health journey (with emoji)"
}`;

    const response = await ai.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const text = response.choices[0].message.content?.trim();
    // Parse JSON from response, handling potential markdown code blocks
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('OpenRouter cycle prediction error:', error.message);
    return {
      phaseInfo: 'Track more cycles to get personalized AI insights!',
      bodyTip: 'Stay hydrated and listen to your body.',
      wellnessTip: 'Regular exercise can help regulate your cycle.',
      prediction_note: 'Predictions improve as you log more cycles.',
      encouragement: '🌸 You are doing amazing by tracking your health! Keep it up! 🌸',
    };
  }
}

/**
 * Get personalized health suggestions from Gemini based on all user data
 */
async function getHealthSuggestions(userData) {
  try {
    const ai = getAI();

    const prompt = `You are a caring, expert women's health AI assistant for FemFlow, a period tracking and PCOS management app.

Based on the following health data, provide personalized suggestions to help this woman manage her health and reduce PCOS risk:

Health Data:
- PCOS Risk Score: ${userData.pcosScore}/100 (${userData.riskLevel})
- Cycle regularity: ${userData.cycleIrregularity || 'Not enough data'}
- Average sleep: ${userData.avgSleep || 'Not tracked'} hours
- Average water intake: ${userData.avgWater || 'Not tracked'} glasses/day
- Average exercise: ${userData.avgExercise || 'Not tracked'} minutes/day
- Average stress level: ${userData.avgStress || 'Not tracked'}/5
- Most common symptoms: ${userData.topSymptoms || 'None logged'}
- Diet patterns: ${userData.dietPatterns || 'Not tracked'}

Respond in JSON format ONLY (no markdown, no code blocks) with these fields:
{
  "greeting": "A warm, personalized girly greeting with emoji",
  "overallAssessment": "A brief, encouraging overall health assessment (2-3 sentences)",
  "suggestions": [
    {
      "category": "category name (e.g. Sleep, Exercise, Diet, Stress, Hydration, Cycle Health)",
      "icon": "one relevant emoji",
      "title": "Short suggestion title",
      "description": "Detailed actionable suggestion (2-3 sentences)",
      "priority": "high/medium/low"
    }
  ],
  "dailyAffirmation": "A beautiful, empowering daily affirmation with emojis",
  "disclaimer": "Brief medical disclaimer"
}

Provide 4-6 suggestions, prioritized by what would help her most. Be warm, encouraging, and specific.`;

    const response = await ai.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const text = response.choices[0].message.content?.trim();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('OpenRouter health suggestions error:', error.message);
    return {
      greeting: '🌸 Hey beautiful! Here are some health tips for you! 🌸',
      overallAssessment: 'Keep tracking your health to get more personalized AI insights!',
      suggestions: [
        {
          category: 'General',
          icon: '💪',
          title: 'Keep Going!',
          description: 'Continue logging your daily habits and symptoms. The more data we have, the better suggestions we can provide.',
          priority: 'high',
        },
      ],
      dailyAffirmation: '✨ You are strong, beautiful, and taking charge of your health! ✨',
      disclaimer: 'This is not medical advice. Please consult a healthcare professional.',
    };
  }
}

module.exports = {
  getMotivationalLine,
  getAICyclePrediction,
  getHealthSuggestions,
};


