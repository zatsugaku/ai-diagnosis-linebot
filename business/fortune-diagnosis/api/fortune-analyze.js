// Vercel Serverless Function for Fortune Analysis (占い分析専用)
export default async function handler(req, res) {
  console.log('🔮 占い分析API呼び出し受信:', req.method);

  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS リクエスト処理');
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    console.log('GET リクエスト - 動作確認');
    return res.status(200).json({ 
      success: true, 
      message: '占い分析API エンドポイント正常動作',
      timestamp: new Date().toISOString(),
      version: '1.0-fortune-analysis'
    });
  }

  if (req.method !== 'POST') {
    console.log('不正なメソッド:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('POST リクエスト処理開始');
    
    const { answers, fortunes, topFortune } = req.body;
    
    console.log('受信データ:', {
      topFortune,
      answersCount: answers?.length || 0,
      fortuneScores: fortunes
    });
    
    // データ検証
    if (!answers || !Array.isArray(answers) || !fortunes || !topFortune) {
      console.log('無効なリクエストデータ形式');
      return res.status(400).json({
        success: false,
        error: 'Invalid request data format'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('APIキー確認:', apiKey ? 'あり' : 'なし');
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY が設定されていません');
      return res.status(500).json({
        success: false,
        error: 'API configuration error - OPENAI_API_KEY not set'
      });
    }

    // 占い分析生成
    const analysis = await generateFortuneAnalysis(answers, fortunes, topFortune, apiKey);
    
    console.log('占い分析生成成功');
    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('API処理エラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// 占い分析生成関数
async function generateFortuneAnalysis(answers, fortunes, topFortune, apiKey) {
  console.log('ChatGPT API呼び出し開始 - 占い分析');
  
  // 占い手法の詳細情報
  const fortuneTypes = {
    'tarot': {
      name: 'タロットカード占い',
      characteristics: '直感的、象徴的思考、創造性重視',
      approach: '感覚的で芸術的なアプローチ'
    },
    'astrology': {
      name: '西洋占星術',
      characteristics: '論理的、体系的思考、分析力重視',
      approach: '理論的で構造化されたアプローチ'
    },
    'palmistry': {
      name: '手相占い',
      characteristics: '実用的、現実的思考、対人重視',
      approach: '具体的で実践的なアプローチ'
    },
    'numerology': {
      name: '数秘術',
      characteristics: '論理的、パターン認識、規則性重視',
      approach: '数学的で体系的なアプローチ'
    },
    'iching': {
      name: '易経',
      characteristics: '哲学的、深層思考、伝統重視',
      approach: '瞑想的で内省的なアプローチ'
    },
    'oracle': {
      name: 'オラクルカード',
      characteristics: 'スピリチュアル、直感的、癒し重視',
      approach: '感覚的で調和的なアプローチ'
    }
  };

  const selectedFortune = fortuneTypes[topFortune];
  const maxScore = Math.max(...Object.values(fortunes));
  const scoreRatio = (fortunes[topFortune] / maxScore * 100).toFixed(1);
  
  console.log('分析データ:', {
    selectedFortune: selectedFortune.name,
    scoreRatio: scoreRatio + '%',
    allScores: fortunes
  });

  const systemPrompt = `あなたは30年の経験を持つ占い専門家・心理分析の専門家です。

# 分析方針
- ユーザーの性格・価値観・思考パターンを深く分析
- なぜその占い手法が最適なのかを心理学的観点から説明
- 実践的で始めやすい具体的なアドバイス
- スピリチュアルと科学的視点のバランスを重視
- 初心者でも理解しやすい内容

# 出力形式（HTML構造で回答）
<div class="fortune-analysis">
  <h3>🔮 詳細分析レポート</h3>
  
  <div class="personality-analysis" style="background: linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #00b894;">
    <h4>📊 あなたの性格分析</h4>
    <p>診断結果から見えるあなたの特徴や思考パターンを詳しく分析...</p>
  </div>
  
  <div class="fortune-match">
    <h4>🎯 なぜ${selectedFortune.name}が最適なのか</h4>
    <p>あなたの性格特性と占い手法の特徴がどのように合致するかを具体的に説明...</p>
  </div>
  
  <div class="learning-path">
    <h4>📚 あなたに最適な学習方法</h4>
    <ol>
      <li>具体的なステップ1</li>
      <li>具体的なステップ2</li>
      <li>具体的なステップ3</li>
    </ol>
  </div>
  
  <div class="advanced-tips">
    <h4>🌟 上達のための特別アドバイス</h4>
    <p>あなたの性格に基づいた具体的な上達方法...</p>
  </div>
  
  <div class="compatibility-analysis">
    <h4>📈 他の占い手法との相性</h4>
    <p>将来的に学ぶと良い占い手法の提案...</p>
  </div>
</div>`;

  const userPrompt = `
【占い適性診断 詳細分析依頼】

■ 診断結果データ
- 最適占い手法: ${selectedFortune.name}
- 適性度: ${scoreRatio}% (${fortunes[topFortune]}/${maxScore}ポイント)
- 手法の特徴: ${selectedFortune.characteristics}
- アプローチ: ${selectedFortune.approach}

■ 全占い手法のスコア
${Object.entries(fortunes).map(([key, score]) => 
  `- ${fortuneTypes[key].name}: ${score}ポイント`
).join('\n')}

■ 回答パターン分析
${formatAnswersForFortune(answers)}

この方の性格・価値観・思考パターンを詳しく分析し、
なぜ${selectedFortune.name}が最適なのか、
どのように学習・活用すれば効果的なのかを、
心理学的観点も交えて詳しく解説してください。

実用的で始めやすく、かつ深い洞察を提供する内容でお願いします。
占い初心者でも理解できる優しい説明を心がけてください。
`;

  try {
    console.log('OpenAI API リクエスト送信');
    
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
        max_tokens: 2500,
        temperature: 0.7
      }),
    });

    console.log('OpenAI API レスポンス:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API 成功');

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Unexpected response format from OpenAI');
    }

  } catch (error) {
    console.error('ChatGPT API呼び出しエラー:', error);
    throw error;
  }
}

// 回答データの占い分析用フォーマット
function formatAnswersForFortune(answers) {
  const questionCategories = [
    '意思決定スタイル',
    'リラックス方法', 
    '未来観',
    '学習スタイル',
    '価値観',
    '対人関係',
    '問題解決志向',
    '運命観・スピリチュアル度'
  ];

  return answers.map((answer, index) => {
    const category = questionCategories[index] || `質問${index + 1}`;
    return `Q${index + 1}(${category}): 選択肢${answer.selectedIndex + 1}を選択`;
  }).join('\n');
}
