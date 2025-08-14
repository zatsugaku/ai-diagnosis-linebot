// クリーン版 Fortune Diagnosis API v2.3 - フォールバック削除・点数表示完全除去
// /api/fortune-analyze.js として配置

export default async function handler(req, res) {
  const startTime = Date.now();
  console.log('🔮 Fortune API v2.3 Request:', req.method, new Date().toISOString());

  // CORS設定（本番環境対応）
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:8080', 'https://localhost:3000'];
    
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // より柔軟なCORS設定
  if (allowedOrigins.length > 0) {
    const isAllowed = allowedOrigins.some(allowed => 
      origin?.includes(allowed.replace('https://', '').replace('http://', '')) ||
      referer?.includes(allowed.replace('https://', '').replace('http://', ''))
    );
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Token, X-Session-Id');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      service: '🔮 Fortune Diagnosis API',
      version: '2.3-clean',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      features: [
        'Production-ready CORS',
        'Enhanced error handling', 
        'Scalable rate limiting',
        'Fortune-specific analysis',
        'No score display mode',
        'Clean error reporting' // フォールバック削除
      ]
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      allowed: ['GET', 'POST', 'OPTIONS']
    });
  }

  try {
    // リクエスト検証
    const validation = validateFortuneRequest(req);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      return res.status(400).json({
        success: false,
        error: validation.error,
        timestamp: new Date().toISOString()
      });
    }

    // 改良されたレート制限（Vercel環境対応）
    const rateLimit = await checkProductionRateLimit(req);
    if (!rateLimit.allowed) {
      console.log('⚠️ Rate limit exceeded');
      res.setHeader('Retry-After', rateLimit.retryAfter);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before trying again.',
        retryAfter: rateLimit.retryAfter,
        timestamp: new Date().toISOString()
      });
    }

    const { answers, totalScore, fortuneType, timestamp } = req.body;
    
    console.log('📊 Processing fortune analysis:', {
      fortuneType,
      answersCount: answers?.length || 0
    });

    // API設定確認
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ Missing OPENAI_API_KEY');
      return res.status(500).json({
        success: false,
        error: 'AI analysis service configuration error',
        timestamp: new Date().toISOString()
      });
    }

    // AI分析実行（フォールバックなし）
    const analysis = await generateFortuneAnalysis(
      totalScore, 
      fortuneType, 
      answers, 
      apiKey
    );
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${processingTime}ms`);
    
    return res.status(200).json({
      success: true,
      analysis: analysis,
      metadata: {
        fortuneType,
        processingTime,
        version: '2.3',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 API Error:', error);
    
    const processingTime = Date.now() - startTime;
    
    // ✅ エラーを隠さず、明確に報告
    const errorResponse = {
      success: false,
      error: 'AI analysis service is temporarily unavailable. Please try again in a few minutes.',
      timestamp: new Date().toISOString(),
      processingTime,
      // 開発環境では詳細表示
      ...(process.env.NODE_ENV !== 'production' && {
        details: error.message,
        stack: error.stack
      })
    };
    
    return res.status(500).json(errorResponse);
  }
}

// 本番対応リクエスト検証
function validateFortuneRequest(req) {
  const { answers, totalScore, fortuneType, timestamp } = req.body;
  
  // 基本データ検証
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return { valid: false, error: 'Invalid answers data' };
  }
  
  if (typeof totalScore !== 'number' || totalScore < 0 || totalScore > 100) {
    return { valid: false, error: 'Invalid total score' };
  }
  
  if (!fortuneType || typeof fortuneType !== 'string') {
    return { valid: false, error: 'Invalid fortune type' };
  }
  
  // セッションID検証（より柔軟）
  const sessionId = req.headers['x-session-id'];
  if (sessionId && !sessionId.match(/^fortune_\d+_[a-zA-Z0-9]+$/)) {
    return { valid: false, error: 'Invalid session format' };
  }
  
  // タイムスタンプ検証（より寛容）
  if (timestamp) {
    const requestTime = new Date(timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now - requestTime) / (1000 * 60);
    
    // 10分以内なら許可（より寛容）
    if (timeDiff > 10) {
      console.warn(`⚠️ Old timestamp: ${timeDiff} minutes`);
      // 警告のみ、エラーにはしない
    }
  }
  
  return { valid: true };
}

// 本番環境対応レート制限
async function checkProductionRateLimit(req) {
  // Vercel環境では単純な時間ベースチェック
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分
  const maxRequests = 5; // より寛容な設定
  
  // クライアント識別（複数の方法を組み合わせ）
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   'unknown';
                   
  const sessionId = req.headers['x-session-id'] || 'anonymous';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // 簡易ハッシュでクライアント識別
  const clientHash = Buffer.from(clientIP + sessionId + userAgent).toString('base64').substring(0, 16);
  
  // グローバル変数を使用（Vercel環境での制限対応）
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const store = global.rateLimitStore;
  const key = `rl_${clientHash}`;
  
  // 古いレコードをクリーンアップ
  const cleanupThreshold = now - (windowMs * 2);
  for (const [storeKey, data] of store.entries()) {
    if (data.lastRequest < cleanupThreshold) {
      store.delete(storeKey);
    }
  }
  
  const record = store.get(key) || { requests: [], lastRequest: 0 };
  
  // 時間窓外のリクエストを削除
  const validRequests = record.requests.filter(time => time > now - windowMs);
  
  if (validRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }
  
  // 新しいリクエストを記録
  validRequests.push(now);
  store.set(key, {
    requests: validRequests,
    lastRequest: now
  });
  
  return { allowed: true };
}

// ✅ クリーン版AI分析生成（フォールバック削除・点数表示完全除去）
async function generateFortuneAnalysis(totalScore, fortuneType, answers, apiKey) {
  console.log('🤖 Starting AI analysis (clean mode)');
  
  const personalityTraits = analyzePersonalityTraits(answers);
  const fortuneLevel = getFortuneLevelDescription(totalScore);
  
  // ✅ systemPromptから点数表示を完全除去
  const systemPrompt = `あなたは占い適性診断の専門コンサルタントです。1,000人以上の診断経験を持ち、科学的根拠とスピリチュアルな洞察を組み合わせた分析を行います。

# 分析ガイドライン
- 個人の性格特性を尊重した提案
- 具体的で実践的なアドバイス
- バランスの取れた現実的な視点
- 押し付けがましくない表現

# 出力形式（HTMLタグなし、プレーンテキスト）
以下の構造で出力してください：

**🔮 あなたの占い適性：${fortuneType}**

**診断タイプ：${fortuneLevel}**
${fortuneType}があなたに最適である理由をお伝えします。

**✨ あなたの特徴**
- [特徴1]
- [特徴2]  
- [特徴3]

**🎯 ${fortuneType}が適している理由**
[詳細な説明]

**💫 具体的な活用方法**
1. [方法1]
2. [方法2]
3. [方法3]

**🌟 期待できる効果**
- [効果1]
- [効果2]
- [効果3]

**📅 おすすめのタイミング**
[相談に適したタイミング]

---
この分析があなたの人生にとって有意義な指針となることを願っています。`;

  const userPrompt = `
【分析対象】
- 適性占術: ${fortuneType}
- レベル: ${fortuneLevel}
- 性格特性: ${personalityTraits.join(', ')}

この方に${fortuneType}が最適である理由と、具体的な活用方法を分析してください。
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return data.choices[0].message.content;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('🔥 AI Analysis Error:', error);
    
    // ✅ フォールバック削除 - エラーをそのまま投げる
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

// 性格特性分析（改良版）
function analyzePersonalityTraits(answers) {
  const traits = [];
  const categoryScores = {};
  
  // カテゴリ別スコア集計
  answers.forEach(answer => {
    if (answer.category) {
      categoryScores[answer.category] = (categoryScores[answer.category] || 0) + (answer.score || 0);
    }
  });
  
  // 特性判定（より具体的）
  const highThreshold = Math.max(...Object.values(categoryScores)) * 0.8;
  
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score >= highThreshold) {
      switch (category) {
        case '直感・感性':
          traits.push('直感力に優れ、感性豊かなタイプ');
          break;
        case '論理・分析':
          traits.push('論理的思考を重視する分析型タイプ');
          break;
        case '人間関係':
          traits.push('人とのつながりを大切にするコミュニケーション型');
          break;
        case 'スピリチュアル':
          traits.push('精神性を重視するスピリチュアル志向');
          break;
        default:
          traits.push(`${category}を重視するタイプ`);
      }
    }
  }
  
  // 基本特性（最低3つ保証）
  while (traits.length < 3) {
    const remaining = [
      'バランス感覚に優れたタイプ',
      '新しい体験に興味を持つオープンなタイプ', 
      '思慮深く慎重なタイプ'
    ];
    traits.push(remaining[traits.length] || '多面的な魅力を持つタイプ');
  }
  
  return traits.slice(0, 5); // 最大5つ
}

// ✅ 適性レベル説明（点数言及なし）
function getFortuneLevelDescription(score) {
  if (score >= 65) return '非常に高い占い適性を持つ';
  if (score >= 50) return '高い占い適性を持つ';
  if (score >= 35) return 'バランスの取れた占い適性を持つ';
  if (score >= 20) return '実用重視の占い活用を好む';
  return '現実的な占い活用スタイルを持つ';
}
