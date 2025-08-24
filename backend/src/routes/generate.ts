import express from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import { protect } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting for AI generation (more restrictive)
const aiGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 AI generations per windowMs
  message: 'Too many AI generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/generate/content
// @desc    Generate blog content using AI
// @access  Private
router.post('/content', [
  protect,
  aiGenerationLimiter,
  body('prompt')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Prompt must be between 10 and 1000 characters'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'friendly', 'authoritative', 'conversational'])
    .withMessage('Invalid tone specified'),
  body('length')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Invalid length specified'),
  body('style')
    .optional()
    .isIn(['blog', 'article', 'news', 'tutorial', 'review'])
    .withMessage('Invalid style specified'),
], async (req: any, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { prompt, tone = 'professional', length = 'medium', style = 'blog' } = req.body;

    // Calculate target word count based on length
    const wordCountMap = {
      short: 300,
      medium: 800,
      long: 1500,
    };

    const targetWords = wordCountMap[length as keyof typeof wordCountMap];

    // Construct the AI prompt
    const aiPrompt = `Write a ${length} ${style} post about: "${prompt}"

Requirements:
- Tone: ${tone}
- Target word count: ${targetWords} words
- Include an engaging introduction
- Use clear headings and subheadings
- Include practical examples or tips
- End with a compelling conclusion
- Make it SEO-friendly with natural keyword usage
- Write in a way that's easy to read and understand

Format the response with proper HTML tags for headings (h2, h3), paragraphs, and lists.`;

    // Generate content using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer specializing in creating engaging, SEO-friendly blog posts. Always respond with properly formatted HTML content.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      max_tokens: targetWords * 2, // Approximate token count
      temperature: 0.7,
    });

    const generatedContent = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Calculate estimated cost (GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens)
    const estimatedCost = (tokensUsed * 0.000045).toFixed(4); // Approximate cost

    res.json({
      success: true,
      data: {
        content: generatedContent,
        tokensUsed,
        estimatedCost: parseFloat(estimatedCost),
        prompt,
        settings: { tone, length, style },
      },
      message: 'Content generated successfully',
    });
  } catch (error) {
    console.error('Content generation error:', error);
    
    // Handle OpenAI API errors specifically
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          error: {
            message: 'Rate limit exceeded. Please try again later.',
          },
        });
      }
      
      if (error.status === 401) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'AI service configuration error. Please contact support.',
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate content. Please try again.',
      },
    });
  }
});

// @route   POST /api/generate/title
// @desc    Generate SEO-optimized title using AI
// @access  Private
router.post('/title', [
  protect,
  aiGenerationLimiter,
  body('topic')
    .isLength({ min: 5, max: 200 })
    .withMessage('Topic must be between 5 and 200 characters'),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('style')
    .optional()
    .isIn(['clickbait', 'professional', 'question', 'how-to', 'list'])
    .withMessage('Invalid title style specified'),
], async (req: any, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { topic, keywords = [], style = 'professional' } = req.body;

    // Construct the AI prompt for title generation
    const aiPrompt = `Generate 5 SEO-optimized blog post titles for the topic: "${topic}"

Requirements:
- Style: ${style}
- Include these keywords naturally: ${keywords.join(', ')}
- Each title should be 50-60 characters
- Make them engaging and click-worthy
- Ensure they're SEO-friendly
- Avoid clickbait unless specifically requested

Provide only the titles, one per line, without numbering.`;

    // Generate titles using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert specializing in creating compelling, search-engine-optimized blog post titles.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const generatedTitles = completion.choices[0]?.message?.content || '';
    const titles = generatedTitles.split('\n').filter(title => title.trim().length > 0);

    res.json({
      success: true,
      data: {
        titles,
        topic,
        keywords,
        style,
      },
      message: 'Titles generated successfully',
    });
  } catch (error) {
    console.error('Title generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate titles. Please try again.',
      },
    });
  }
});

// @route   POST /api/generate/tags
// @desc    Generate relevant tags using AI
// @access  Private
router.post('/tags', [
  protect,
  aiGenerationLimiter,
  body('content')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Content must be between 50 and 5000 characters'),
  body('topic')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Topic must be between 3 and 100 characters'),
  body('count')
    .optional()
    .isInt({ min: 5, max: 20 })
    .withMessage('Tag count must be between 5 and 20'),
], async (req: any, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { content, topic, count = 10 } = req.body;

    // Construct the AI prompt for tag generation
    const aiPrompt = `Generate ${count} relevant, SEO-friendly tags for this blog post content.

Content: "${content.substring(0, 500)}..."
${topic ? `Topic: ${topic}` : ''}

Requirements:
- Generate exactly ${count} tags
- Make them relevant to the content
- Include both broad and specific tags
- Use single words or short phrases (2-3 words max)
- Ensure they're search-friendly
- Avoid overly generic tags
- Separate tags with commas

Provide only the tags, separated by commas, without numbering or additional text.`;

    // Generate tags using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert specializing in keyword research and tag generation for blog posts.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.6,
    });

    const generatedTags = completion.choices[0]?.message?.content || '';
    const tags = generatedTags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50);

    res.json({
      success: true,
      data: {
        tags,
        count: tags.length,
        topic,
      },
      message: 'Tags generated successfully',
    });
  } catch (error) {
    console.error('Tag generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate tags. Please try again.',
      },
    });
  }
});

// @route   POST /api/generate/meta
// @desc    Generate meta description using AI
// @access  Private
router.post('/meta', [
  protect,
  aiGenerationLimiter,
  body('title')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('content')
    .isLength({ min: 50, max: 1000 })
    .withMessage('Content must be between 50 and 1000 characters'),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
], async (req: any, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { title, content, keywords = [] } = req.body;

    // Construct the AI prompt for meta description generation
    const aiPrompt = `Generate an SEO-optimized meta description for this blog post.

Title: "${title}"
Content: "${content.substring(0, 300)}..."
Keywords: ${keywords.join(', ')}

Requirements:
- Length: 150-160 characters (optimal for SEO)
- Include primary keywords naturally
- Make it compelling and click-worthy
- Summarize the main benefit or value
- Use action words when appropriate
- Avoid keyword stuffing

Provide only the meta description without quotes or additional text.`;

    // Generate meta description using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert specializing in meta description optimization for search engines.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const metaDescription = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      data: {
        metaDescription: metaDescription.trim(),
        characterCount: metaDescription.trim().length,
        title,
        keywords,
      },
      message: 'Meta description generated successfully',
    });
  } catch (error) {
    console.error('Meta description generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate meta description. Please try again.',
      },
    });
  }
});

export default router;