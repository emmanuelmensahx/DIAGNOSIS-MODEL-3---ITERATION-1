# Google Gemini API Setup Guide (FREE)

## Overview

Google Gemini API offers a generous **FREE tier** that's perfect for testing and moderate usage of the AfriDiag LLM integration. This guide will help you get started with Gemini as your primary LLM provider.

## Why Choose Gemini?

✅ **Completely FREE tier** with generous limits  
✅ **High-quality medical analysis** capabilities  
✅ **Fast response times**  
✅ **Easy setup** - just need a Google account  
✅ **No credit card required** for free tier  

## Free Tier Limits

- **15 requests per minute**
- **1,500 requests per day**
- **1 million tokens per month**
- **Rate limit**: 1 request per second

*These limits are more than sufficient for testing and initial deployment!*

## Step-by-Step Setup

### 1. Get Your Free API Key

1. **Visit Google AI Studio**: Go to [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Sign in** with your Google account (or create one if needed)
3. **Click "Get API Key"** in the top navigation
4. **Create a new API key** by clicking "Create API key"
5. **Copy your API key** - you'll need this for configuration

### 2. Configure AfriDiag

1. **Open your `.env` file** in the backend directory:
   ```bash
   cd afridiag/backend
   notepad .env
   ```

2. **Update the Gemini configuration**:
   ```env
   # Enable LLM integration
   LLM_ENABLED=true
   LLM_PRIMARY_PROVIDER=gemini
   
   # Enable Gemini
   GEMINI_ENABLED=true
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Replace `your_actual_api_key_here`** with the API key you copied from Google AI Studio

### 3. Test the Integration

1. **Restart the backend server** (if running):
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   python main.py
   ```

2. **Test with a sample request**:
   ```bash
   # Use the test endpoint
   curl -X POST "http://localhost:8000/api/v1/predict/tuberculosis/enhanced" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "symptoms": ["persistent cough", "fever", "weight loss"],
       "patient_data": {
         "age": 35,
         "gender": "male",
         "location": "rural"
       }
     }'
   ```

## Model Options

### Recommended Models (All FREE)

- **`gemini-1.5-flash`** (Default) - Fast, efficient, great for medical analysis
- **`gemini-1.5-pro`** - More powerful, slower, higher quality responses
- **`gemini-1.0-pro`** - Stable, reliable, good balance

### Changing Models

Update your `.env` file:
```env
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.0-pro
```

## Cost Management

### Monitor Usage

1. **Check usage** in Google AI Studio dashboard
2. **Set up alerts** when approaching limits
3. **Monitor logs** for API call frequency

### Optimize Usage

- **Use fallback providers** (Grok/OpenAI) when Gemini limits are reached
- **Implement caching** for repeated queries
- **Adjust temperature** and max tokens to reduce usage

## Troubleshooting

### Common Issues

**❌ "API key not valid"**
- Double-check your API key in the `.env` file
- Ensure no extra spaces or quotes around the key
- Verify the key is active in Google AI Studio

**❌ "Rate limit exceeded"**
- You've hit the free tier limits
- Wait for the rate limit to reset (1 minute/1 day)
- Consider upgrading or using fallback providers

**❌ "Model not found"**
- Check the model name in your `.env` file
- Use one of the supported models listed above

### Getting Help

- **Google AI Studio Documentation**: [https://ai.google.dev/](https://ai.google.dev/)
- **AfriDiag Issues**: Check the project repository
- **Community Support**: Google AI Developer community

## Next Steps

1. **Test thoroughly** with your medical use cases
2. **Monitor usage** to understand your needs
3. **Configure fallback providers** (Grok/OpenAI) for redundancy
4. **Consider upgrading** to paid tiers if you exceed free limits

## Upgrading Later

When you're ready to scale:
- **Pay-as-you-go pricing** starts at $0.00015 per 1K characters
- **Higher rate limits** available
- **Priority support** included

---

🎉 **Congratulations!** You now have a completely free, high-quality LLM integration for medical diagnosis in AfriDiag!