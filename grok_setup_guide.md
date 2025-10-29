# Grok Integration Setup Guide for AfriDiag

## Overview
This guide shows you how to enable Grok (X.AI's advanced AI model) in your AfriDiag system for enhanced medical diagnosis capabilities.

## Current Status
- **Grok Integration**: ✅ Fully implemented in codebase
- **Current State**: ❌ Disabled (`GROK_ENABLED=false`)
- **API Key**: ❌ Placeholder value (`your_grok_api_key_here`)

## Prerequisites
1. **Grok API Key**: You need a valid API key from X.AI
   - Visit: https://x.ai/api
   - Sign up for Grok API access
   - Generate your API key

## Step-by-Step Setup

### Step 1: Get Your Grok API Key
1. Go to https://x.ai/api
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the API key (format: `xai-...`)

### Step 2: Configure Environment Variables
Edit your `.env` file in the `afridiag/backend/` directory:

```bash
# Change from:
GROK_ENABLED=false
GROK_API_KEY=your_grok_api_key_here

# To:
GROK_ENABLED=true
GROK_API_KEY=xai-your-actual-api-key-here
```

### Step 3: Choose Provider Configuration

#### Option A: Grok as Primary Provider
```bash
LLM_PRIMARY_PROVIDER=grok
LLM_FALLBACK_PROVIDER=gemini
```

#### Option B: Grok as Secondary Provider
```bash
LLM_PRIMARY_PROVIDER=gemini
LLM_FALLBACK_PROVIDER=grok
```

#### Option C: Grok as Third Provider
```bash
LLM_PRIMARY_PROVIDER=gemini
LLM_FALLBACK_PROVIDER=openai
# Grok will be used if both Gemini and OpenAI fail
```

### Step 4: Optimize Settings for Medical Diagnosis
```bash
# Recommended settings for medical diagnosis
LLM_TEMPERATURE=0.1                    # Low temperature for precise medical responses
LLM_MAX_TOKENS=4000                   # Sufficient tokens for detailed diagnosis
GROK_MODEL=grok-4-fast-reasoning      # Latest Grok model with advanced reasoning
```

## Available Grok Models for Medical Diagnosis

### 🏆 **Recommended: grok-4-fast-reasoning**
- **Context Window**: 2,000,000 tokens (massive context for complex cases)
- **Rate Limits**: 4M tokens/min, 480 requests/min
- **Pricing**: $0.20 input / $0.50 output per million tokens
- **Best For**: Complex medical reasoning, comprehensive patient histories
- **Advantages**: 15x larger context than grok-3, 6x cheaper, advanced reasoning

### 💰 **Budget Option: grok-3-mini**
- **Context Window**: 131,072 tokens
- **Rate Limits**: 480 requests/min
- **Pricing**: $0.30 input / $0.50 output per million tokens
- **Best For**: Simple diagnoses, cost-conscious deployments
- **Advantages**: Most affordable option, still very capable

### 📊 **Standard: grok-3**
- **Context Window**: 131,072 tokens
- **Rate Limits**: 600 requests/min
- **Pricing**: $3.00 input / $15.00 output per million tokens
- **Best For**: Standard medical diagnosis (legacy option)
- **Note**: More expensive than newer models

## Complete Configuration Examples

### Example 1: Grok-First Configuration
```bash
# LLM Configuration
LLM_ENABLED=true
LLM_PRIMARY_PROVIDER=grok
LLM_FALLBACK_PROVIDER=gemini
LLM_MAX_TOKENS=4000
LLM_TEMPERATURE=0.1

# Grok Configuration
GROK_ENABLED=true
GROK_API_KEY=xai-your-actual-api-key-here
GROK_API_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-4-fast-reasoning

# Gemini (Fallback)
GEMINI_ENABLED=true
GEMINI_API_KEY=your-existing-gemini-key
GEMINI_MODEL=gemini-flash-latest
```

### Example 2: Triple-Provider Setup
```bash
# LLM Configuration
LLM_ENABLED=true
LLM_PRIMARY_PROVIDER=gemini
LLM_FALLBACK_PROVIDER=openai
LLM_MAX_TOKENS=4000
LLM_TEMPERATURE=0.1

# All providers enabled
GROK_ENABLED=true
GROK_API_KEY=xai-your-actual-api-key-here
GROK_API_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-4-fast-reasoning

GEMINI_ENABLED=true
GEMINI_API_KEY=your-existing-gemini-key
GEMINI_MODEL=gemini-flash-latest

OPENAI_ENABLED=true
OPENAI_API_KEY=your-existing-openai-key
OPENAI_MODEL=gpt-4o
```

## Testing Your Setup

### Quick Test Command
```bash
cd afridiag/backend
python test_ai_diagnosis.py
```

### Manual API Test
```python
import os
import httpx
import asyncio

async def test_grok():
    api_key = "xai-your-api-key"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "grok-4-fast-reasoning",
        "messages": [
            {"role": "system", "content": "You are a medical AI assistant."},
            {"role": "user", "content": "What are the symptoms of pneumonia?"}
        ],
        "max_tokens": 1000,
        "temperature": 0.1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.x.ai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

# Run test
asyncio.run(test_grok())
```

## Grok Advantages for Medical Diagnosis

### 🔥 **Real-Time Medical Data**
- Access to latest medical research via X platform
- Real-time health trends and outbreak information
- Current medical guidelines and protocols

### 🧠 **Advanced Reasoning**
- Superior logical reasoning for complex cases
- Better handling of rare diseases
- Excellent differential diagnosis capabilities

### 💬 **Natural Communication**
- More conversational and empathetic responses
- Better patient communication suggestions
- Less filtered, more direct medical advice

### ⚡ **Performance**
- Fast response times
- High availability
- Competitive pricing

## Troubleshooting

### Common Issues

#### 1. API Key Invalid
```
Error: 401 Unauthorized
Solution: Verify your API key is correct and active
```

#### 2. Rate Limiting
```
Error: 429 Too Many Requests
Solution: Grok has generous rate limits, but check your usage
```

#### 3. Model Not Found
```
Error: 404 Model not found
Solution: Ensure GROK_MODEL=grok-4-fast-reasoning (latest model)
```

#### 4. Connection Issues
```
Error: Connection timeout
Solution: Check GROK_API_BASE_URL=https://api.x.ai/v1
```

## Monitoring and Optimization

### Performance Metrics to Track
- Response time
- Diagnostic accuracy
- API success rate
- Cost per diagnosis

### Recommended Monitoring
```python
# Add to your monitoring dashboard
grok_metrics = {
    "avg_response_time": "< 3 seconds",
    "success_rate": "> 95%",
    "diagnostic_accuracy": "> 85%",
    "cost_per_diagnosis": "< $0.05"
}
```

## Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **Key Rotation**: Rotate API keys regularly
3. **Access Control**: Limit API key permissions
4. **Monitoring**: Monitor API usage for anomalies

## Next Steps

1. ✅ Get your Grok API key
2. ✅ Update `.env` configuration
3. ✅ Test the integration
4. ✅ Monitor performance
5. ✅ Optimize settings based on results

## Support

- **Grok API Documentation**: https://docs.x.ai/
- **AfriDiag Issues**: Check the project repository
- **Medical AI Best Practices**: Consult medical AI guidelines

---

**Ready to enable Grok? Follow the steps above and enhance your AfriDiag system with cutting-edge AI capabilities!**