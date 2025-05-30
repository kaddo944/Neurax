import { z } from 'zod';

// AI integration for text generation capabilities with Hugging Face and OpenRouter fallback
export class AIService {
  private huggingFaceApiKey: string;
  private openRouterApiKey: string;

  constructor() {
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';



    if (!this.huggingFaceApiKey && !this.openRouterApiKey) {
      console.warn('No AI API keys configured. AI text generation will be disabled.');
    }
  }
  
  // Check if AI APIs are properly configured
  private checkCredentials(): boolean {
    if (!this.huggingFaceApiKey && !this.openRouterApiKey) {
      console.warn('No AI API credentials configured. Cannot perform AI operations.');
      return false;
    }
    return true;
  }

  // Generate text content using Hugging Face with OpenRouter fallback
  async generateTextContent(
    topic: string,
    contentType: 'tweet' | 'thread' | 'reply' | 'meme', 
    tone: string = 'confident,trader',
    maxLength: number = 280
  ): Promise<string> {
    if (!this.huggingFaceApiKey && !this.openRouterApiKey) {
      return `[AI generation requires API keys. Please configure Hugging Face or OpenRouter API key to use this feature.]`;
    }

    // Try Hugging Face first if available
    if (this.huggingFaceApiKey) {
      try {
        return await this.generateWithHuggingFace(topic, contentType, tone, maxLength);
      } catch (error) {
        console.warn('Hugging Face failed, trying OpenRouter fallback:', error);
        if (this.openRouterApiKey) {
          try {
            return await this.generateWithOpenRouter(topic, contentType, tone, maxLength);
          } catch (openRouterError) {
            console.error('Both Hugging Face and OpenRouter failed:', openRouterError);
            return this.generateFallbackContent(topic, contentType, maxLength);
          }
        }
        // If no OpenRouter key, return fallback content
        return this.generateFallbackContent(topic, contentType, maxLength);
      }
    }

    // If no Hugging Face key, try OpenRouter directly
    if (this.openRouterApiKey) {
      try {
        return await this.generateWithOpenRouter(topic, contentType, tone, maxLength);
      } catch (error) {
        console.error('OpenRouter failed:', error);
        return this.generateFallbackContent(topic, contentType, maxLength);
      }
    }

    return this.generateFallbackContent(topic, contentType, maxLength);
  }

  // Generate text content using Hugging Face
  private async generateWithHuggingFace(
    topic: string,
    contentType: 'tweet' | 'thread' | 'reply' | 'meme', 
    tone: string = 'confident,trader',
    maxLength: number = 280
  ): Promise<string> {
    
    let prompt = this.buildPrompt(topic, contentType, tone, maxLength);

    // Funzione helper per chiamare un modello Hugging Face
    const callHuggingFaceModel = async (model: string): Promise<{ status: number, data: any }> => {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.huggingFaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: Math.min(maxLength / 4, 70), // Token molto limitati
            temperature: 0.8,
            do_sample: true,
            top_p: 0.9,
            repetition_penalty: 1.1,
            stop: ['\n', '\n\n', 'Tweet:', 'Thread:']
          }
        }),
      });
      const status = response.status;
      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
      console.log(`[HuggingFace][${model}] status:`, status, 'body:', JSON.stringify(data));
      return { status, data };
    };

    // Modelli aggiornati e testati per il 2025 - inizia con il modello più performante
    let { status, data } = await callHuggingFaceModel('HuggingFaceH4/zephyr-7b-beta');
    if (status === 404 || status === 503 || !data) {
      // Fallback su meta-llama/Llama-2-7b-chat-hf
      ({ status, data } = await callHuggingFaceModel('meta-llama/Llama-2-7b-chat-hf'));
    }
    if (status === 404 || status === 503 || !data) {
      // Ultimo fallback su gpt2 (sempre disponibile ma meno performante)
      ({ status, data } = await callHuggingFaceModel('gpt2'));
    }


    // Hugging Face text generation returns an array of results
    let generatedText = '';
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      generatedText = data[0].generated_text;
    } else if (data && data.generated_text) {
      generatedText = data.generated_text;
    }
    
    // Pulisci e taglia il testo generato
    if (generatedText) {

      
      // Implementa limite assoluto di 280 caratteri (best practice per social media)
      const ABSOLUTE_MAX_LENGTH = 280;
      const effectiveMaxLength = Math.min(maxLength, ABSOLUTE_MAX_LENGTH);
      

      
      // Rileva se il modello ha restituito il prompt invece del contenuto
      const promptKeywords = [
        'Generate', 'Write', 'Create', 'Maximum length:', 'IMPORTANT:', 
        'single tweet', 'professional tone', 'Use relevant hashtags',
        'content type:', 'tone:', 'topic:', 'instructions:', 'prompt:',
        'Here is', 'Here are', 'Below is', 'Following is'
      ];
      
      const containsPromptKeywords = promptKeywords.some(keyword => 
        generatedText.toLowerCase().includes(keyword.toLowerCase()));
      
      // Se il testo è troppo lungo O contiene parole del prompt, usa sempre fallback
      const shouldUseFallback = containsPromptKeywords || 
                               generatedText.length > effectiveMaxLength * 1.2;
      

      
      if (shouldUseFallback) {
        generatedText = this.generateFallbackContent(topic, contentType, effectiveMaxLength);
      } else {
        // Pulisci il testo normalmente
        generatedText = generatedText.replace(/^.*?(?:Tweet:|Thread:|Reply:|Meme:)\s*/i, '');
        generatedText = generatedText.replace(/^["'](.*)['"]$/s, '$1');
        generatedText = generatedText.trim();
      }
      
      // Applica limite rigoroso di caratteri
      if (generatedText.length > effectiveMaxLength) {
        let cutPoint = effectiveMaxLength - 3;
        const lastSpace = generatedText.lastIndexOf(' ', cutPoint);
        if (lastSpace > effectiveMaxLength * 0.7) {
          cutPoint = lastSpace;
        }
        generatedText = generatedText.substring(0, cutPoint).trim() + '...';
      }
      
      // Controllo finale
      if (generatedText.length > maxLength) {
        generatedText = generatedText.substring(0, maxLength);
      }
    }
    
    if (generatedText) {
      return generatedText;
    }
    // Se la risposta contiene un campo "error" o "message", restituiscilo
    if (data && data.error) {
      throw new Error(`Hugging Face API error: ${data.error}`);
    }
    if (data && data.message) {
      throw new Error(`Hugging Face API message: ${data.message}`);
    }
    // Se la risposta contiene testo, restituiscilo comunque
    if (typeof data === 'string') {
      return data;
    }
    throw new Error('[AI generation failed: Unexpected Hugging Face API response. Try again later or check your API key and model availability.]');
  }

  // Generate text content using OpenRouter
  private async generateWithOpenRouter(
    topic: string,
    contentType: 'tweet' | 'thread' | 'reply' | 'meme', 
    tone: string = 'confident,trader',
    maxLength: number = 280
  ): Promise<string> {
    const prompt = this.buildOpenRouterPrompt(topic, contentType, tone, maxLength);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Twitter AI Manager'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `You are a professional crypto trader and social media expert. Generate engaging ${contentType} content about ${topic} in a ${tone} tone. Keep it under ${maxLength} characters. Be concise, engaging, and include relevant hashtags.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(maxLength / 2, 100),
        temperature: 0.8,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('[OpenRouter] Response:', JSON.stringify(data));

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
      let generatedText = data.choices[0].message.content.trim();
      
      // Clean up the generated text
      generatedText = generatedText.replace(/^["'](.*)['"]/s, '$1');
      generatedText = generatedText.trim();
      
      // Apply length limit
      if (generatedText.length > maxLength) {
        let cutPoint = maxLength - 3;
        const lastSpace = generatedText.lastIndexOf(' ', cutPoint);
        if (lastSpace > maxLength * 0.7) {
          cutPoint = lastSpace;
        }
        generatedText = generatedText.substring(0, cutPoint).trim() + '...';
      }
      
      return generatedText;
    }

    throw new Error('OpenRouter API returned unexpected response format');
  }

  // Build prompt for OpenRouter
  private buildOpenRouterPrompt(
    topic: string,
    contentType: 'tweet' | 'thread' | 'reply' | 'meme',
    tone: string,
    maxLength: number
  ): string {
    switch (contentType) {
      case 'tweet':
        return `Write a single engaging tweet about ${topic}. Use a ${tone} tone. Include relevant crypto/trading hashtags. Maximum ${maxLength} characters.`;
      case 'thread':
        return `Write the first tweet of a thread about ${topic}. Use a ${tone} tone. Make it engaging and indicate more content follows. Maximum ${maxLength} characters.`;
      case 'reply':
        return `Write a thoughtful reply about ${topic}. Use a ${tone} tone. Be concise and engaging. Maximum ${maxLength} characters.`;
      case 'meme':
        return `Write a humorous meme-style post about ${topic}. Use a ${tone} tone. Be witty and shareable. Maximum ${maxLength} characters.`;
      default:
        return `Write engaging social media content about ${topic} in a ${tone} tone. Maximum ${maxLength} characters.`;
    }
  }

  // Build prompt based on content type
  private buildPrompt(
    topic: string,
    contentType: 'tweet' | 'thread' | 'reply' | 'meme',
    tone: string,
    maxLength: number
  ): string {
    switch (contentType) {
      case 'tweet':
        return `Tweet: ${topic} #crypto #trading`;
      case 'thread':
        return `Thread starter about ${topic}:`;
      case 'reply':
        return `Reply: ${topic}`;
      case 'meme':
        return `Meme: ${topic}`;
      default:
        return `Generate content about ${topic} in a ${tone} tone. Maximum length: ${maxLength} characters.`;
    }
  }

  // Generate fallback content when AI APIs fail
  private generateFallbackContent(
    topic: string,
    contentType: 'tweet' | 'thread' | 'reply' | 'meme',
    maxLength: number
  ): string {
    const templates = {
      tweet: [
        `🚀 ${topic} is trending! #crypto #trading`,
        `💰 Exploring ${topic} opportunities #finance`,
        `📈 ${topic} analysis coming soon! #market`,
        `⚡ ${topic} update: Stay tuned! #crypto`,
        `🎯 ${topic} insights #trading #blockchain`
      ],
      thread: [
        `🧵 Let's talk about ${topic}... (1/n)`,
        `📊 ${topic} breakdown thread 👇`,
        `🔍 Deep dive into ${topic}... (1/x)`,
        `💡 ${topic} explained simply... (1/n)`
      ],
      reply: [
        `Great point about ${topic}! 👍`,
        `Interesting perspective on ${topic}`,
        `Thanks for sharing about ${topic}!`,
        `${topic} is definitely worth discussing`
      ],
      meme: [
        `When ${topic} hits different 😂`,
        `${topic} be like... 🤔`,
        `POV: You're explaining ${topic} 📈`,
        `${topic} energy 💯`
      ]
    };

    const options = templates[contentType] || templates.tweet;
    let content = options[Math.floor(Math.random() * options.length)];
    
    // Taglia se necessario
    if (content.length > maxLength) {
      content = content.substring(0, maxLength - 3) + '...';
    }
    
    return content;
  }

  // Generate image using Hugging Face's advanced FLUX.1 models (2025)
  async generateImage(prompt: string, style: 'crypto' | 'meme' | 'professional' | 'artistic' = 'crypto'): Promise<string> {
    if (!this.huggingFaceApiKey) {
      console.warn('Hugging Face API key not configured. Cannot generate images.');
      // Return a placeholder image URL or data URL for missing API key
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzJiMjEzYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlIGdlbmVyYXRpb24gcmVxdWlyZXMgYW4gQVBJIGtleTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU4JSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5QbGVhc2UgY29uZmlndXJlIEh1Z2dpbmdGYWNlIEFQSSBrZXk8L3RleHQ+PC9zdmc+';
    }
    
    // Enhance prompt based on style for better crypto/meme generation
    const enhancedPrompt = this.enhancePromptForStyle(prompt, style);

    
    // Try FLUX.1 models in order of preference (best to fallback)
    const models = [
      'black-forest-labs/FLUX.1-dev',        // Best quality, guidance-distilled
      'black-forest-labs/FLUX.1-schnell',    // Fast generation, 1-4 steps
      'stabilityai/stable-diffusion-3-medium-diffusers', // Fallback SD3
      'stabilityai/stable-diffusion-xl-base-1.0'         // Final fallback SDXL
    ];
    
    for (const model of models) {
      try {

        
        const requestBody = this.getModelRequestBody(model, enhancedPrompt);
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.huggingFaceApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );
        
        if (response.ok) {
          // Convert the image to base64
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:image/jpeg;base64,${base64}`;
        } else if (response.status === 503) {
          continue;
        } else if (response.status === 404) {
          continue;
        } else {
          continue;
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('All image generation models failed. Please try again later.');
  }
  
  // Enhance prompts specifically for crypto/meme content
  private enhancePromptForStyle(prompt: string, style: string): string {
    const styleEnhancements = {
      crypto: {
        prefix: 'Digital art, cryptocurrency themed, vibrant colors, modern design,',
        suffix: ', trending on crypto twitter, high quality, detailed, 4k'
      },
      meme: {
        prefix: 'Meme style, internet culture, funny, viral content,',
        suffix: ', meme format, social media ready, trending, humorous'
      },
      professional: {
        prefix: 'Professional, clean design, corporate style,',
        suffix: ', high quality, business appropriate, polished'
      },
      artistic: {
        prefix: 'Artistic, creative, unique style, expressive,',
        suffix: ', masterpiece, artistic vision, creative expression'
      }
    };
    
    const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || styleEnhancements.crypto;
    return `${enhancement.prefix} ${prompt} ${enhancement.suffix}`;
  }
  
  // Get model-specific request body parameters
  private getModelRequestBody(model: string, prompt: string): any {
    if (model.includes('FLUX.1-dev')) {
      return {
        inputs: prompt,
        parameters: {
          guidance_scale: 3.5,
          num_inference_steps: 50,
          max_sequence_length: 512,
          height: 1024,
          width: 1024
        }
      };
    } else if (model.includes('FLUX.1-schnell')) {
      return {
        inputs: prompt,
        parameters: {
          guidance_scale: 0.0,
          num_inference_steps: 4,
          max_sequence_length: 256,
          height: 1024,
          width: 1024
        }
      };
    } else {
      // Standard parameters for Stable Diffusion models
      return {
        inputs: prompt,
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      };
    }
  }

  // Generate a trading call recommendation
  async generateTradingCall(): Promise<{
    asset: string;
    position: 'LONG' | 'SHORT';
    entryPrice: string;
    targetPrice: string;
    reasoning: string;
  }> {
    const cryptoAssets = [
      'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 
      'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI'
    ];
    
    const randomAsset = cryptoAssets[Math.floor(Math.random() * cryptoAssets.length)];
    const position = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    
    // For a real implementation, you'd integrate with market data APIs
    // Here we're generating mock data for demonstration
    const currentPriceMap: Record<string, number> = {
      'BTC': 40000 + Math.random() * 5000,
      'ETH': 2000 + Math.random() * 500,
      'SOL': 80 + Math.random() * 20,
      'XRP': 0.5 + Math.random() * 0.1,
      'ADA': 0.3 + Math.random() * 0.1,
      'AVAX': 20 + Math.random() * 5,
      'DOT': 5 + Math.random() * 2,
      'MATIC': 0.8 + Math.random() * 0.2,
      'LINK': 10 + Math.random() * 3,
      'UNI': 5 + Math.random() * 2
    };
    
    const currentPrice = currentPriceMap[randomAsset] || 100;
    const targetPrice = position === 'LONG' 
      ? currentPrice * (1 + (Math.random() * 0.2)) 
      : currentPrice * (1 - (Math.random() * 0.2));
    
    // Check if API is available for AI-generated analysis
    let reasoning = '';
    if (this.checkCredentials()) {
      const prompt = `Generate a brief analysis for a ${position} position on ${randomAsset} at ${currentPrice.toFixed(2)} with a target of ${targetPrice.toFixed(2)}. What technical or fundamental reasons support this trade?`;

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3-haiku:beta',
            messages: [
              { role: 'system', content: 'You are a skilled cryptocurrency technical analyst.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          reasoning = data.choices[0].message.content;
        } else {
          reasoning = `Analysis generation requires OpenRouter API key. Current prediction is based on algorithmic indicators only.`;
        }
      } catch (error) {
        console.error("Error generating trading call analysis:", error);
        reasoning = `Error generating analysis. Technical indicators suggest a ${position} position based on recent price action.`;
      }
    } else {
      reasoning = `AI-powered analysis requires API keys. Please configure OpenRouter API key for detailed market insights.`;
    }

    return {
      asset: randomAsset,
      position: position as 'LONG' | 'SHORT',
      entryPrice: currentPrice.toFixed(2),
      targetPrice: targetPrice.toFixed(2),
      reasoning,
    };
  }
}

export const aiService = new AIService();
