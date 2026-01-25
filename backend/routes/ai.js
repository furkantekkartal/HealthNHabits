const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Analyze food using OpenRouter (works with GPT-4 Vision, Claude, etc.)
async function analyzeWithOpenRouter(imageBase64, mimeType) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Diet Tracker'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are a nutrition expert. Analyze this food image and provide detailed nutritional information.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "success": true,
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "items": [
    {
      "name": "food item name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "portion": number,
      "unit": "g" or "ml" or "piece",
      "confidence": "high" or "medium" or "low"
    }
  ],
  "healthTip": "brief health insight about this meal"
}

Rules:
- Identify ALL visible food items separately
- Estimate realistic portion sizes
- Use reasonable calorie estimates based on typical serving sizes
- If you cannot identify food, return {"success": false, "error": "Could not identify food"}
- Numbers should be integers, not strings`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Analyze food image endpoint
router.post('/analyze-food', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured in .env' });
        }

        // Convert image to base64
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        console.log('Analyzing food image with OpenRouter...');

        let text = await analyzeWithOpenRouter(imageBase64, mimeType);

        // Clean up response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON response
        let analysisResult;
        try {
            analysisResult = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw text:', text);
            return res.status(500).json({
                error: 'Failed to parse AI response',
                raw: text
            });
        }

        // Add IDs to items for frontend
        if (analysisResult.items) {
            analysisResult.items = analysisResult.items.map((item, index) => ({
                ...item,
                id: index + 1
            }));
        }

        console.log('Analysis successful!');
        res.json(analysisResult);

    } catch (error) {
        console.error('AI Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze image',
            message: error.message
        });
    }
});

// Analyze text description to create product
router.post('/analyze-text', async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'No description provided' });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
        }

        console.log('Analyzing food description:', description);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Diet Tracker'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'user',
                        content: `You are a nutrition expert. Given a food description, provide nutritional information.

Description: "${description}"

Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "success": true,
  "product": {
    "name": "proper food name (capitalize properly)",
    "emoji": "single relevant emoji",
    "category": "Meal" or "Fruit" or "Coffee" or "Snack",
    "portion": number (typical portion size),
    "unit": "g" or "ml" or "pc",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

Rules:
- Parse quantity from description (e.g., "1 large banana" = 1 pc, ~120g equivalent)
- Use realistic nutritional values for the specified portion
- "pc" means pieces (for items like fruits, eggs, slices)
- Numbers should be integers
- If description is unclear, return {"success": false, "error": "Could not understand description"}`
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        let text = data.choices[0].message.content;

        // Clean up response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const result = JSON.parse(text);
        console.log('Text analysis successful!');
        res.json(result);

    } catch (error) {
        console.error('Text analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze description',
            message: error.message
        });
    }
});

module.exports = router;
