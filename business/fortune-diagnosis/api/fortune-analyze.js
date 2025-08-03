// Vercel Serverless Function for Fortune Analysis (占い分析専用 - 修正版)
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
      message: '占い分析API エンドポイント正常動作（修正版）',
      timestamp: new Date().toISOString(),
      version: '2.0-receive-direction'
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

    // 占い分析生成（修正版）
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

// 占い分析生成関数（修正版：受ける方向）
async function generateFortuneAnalysis(answers, fortunes, topFortune, apiKey) {
  console.log('ChatGPT API呼び出し開始 - 占い分析（修正版）');
  
  // 占い手法の詳細情報
  const fortuneTypes = {
    'tarot': {
      name: 'タロットカード占い',
      characteristics: '直感的、象徴的思考、創造性重視',
      approach: '感覚的で芸術的なアプローチ',
      benefits: '感覚に響くメッセージ、創造性の刺激、心の声を引き出す'
    },
    'astrology': {
      name: '西洋占星術',
      characteristics: '論理的、体系的思考、分析力重視',
      approach: '理論的で構造化されたアプローチ',
      benefits: '詳細な性格分析、科学的根拠、長期的人生設計'
    },
    'palmistry': {
      name: '手相占い',
      characteristics: '実用的、現実的思考、対人重視',
      approach: '具体的で実践的なアプローチ',
      benefits: '目に見える証拠、実用的アドバイス、対面での相談'
    },
    'numerology': {
      name: '数秘術',
      characteristics: '論理的、パターン認識、規則性重視',
      approach: '数学的で体系的なアプローチ',
      benefits: '数字による客観分析、人生の周期把握、論理的納得感'
    },
    'iching': {
      name: '易経',
      characteristics: '哲学的、深層思考、伝統重視',
      approach: '瞑想的で内省的なアプローチ',
      benefits: '古の智恵、精神的成長、困難への対処法'
    },
    'oracle': {
      name: 'オラクルカード',
      characteristics: 'スピリチュアル、直感的、癒し重視',
      approach: '感覚的で調和的なアプローチ',
      benefits: '愛に満ちたメッセージ、心の癒し、ポジティブエネルギー'
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

# 重要な分析方針
- ユーザーの性格・価値観・思考パターンを深く分析
- なぜその占いを「受ける」ことが最適なのかを心理学的観点から説明
- どんな悩みや状況で、その占いが最も効果的かを提案
- 占いを受ける方法や注意点をアドバイス
- 「占いを学ぶ」ではなく「占いを受ける」ことに完全に焦点を当てる

# 出力形式（HTML構造で回答）
<div class="fortune-analysis">
  <h3>🔮 詳細分析レポート</h3>
  
  <div class="personality-analysis" style="background: linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #00b894;">
    <h4>📊 あなたの性格分析</h4>
    <p>診断結果から見えるあなたの特徴や思考パターンを詳しく分析...</p>
  </div>
  
  <div class="fortune-match">
    <h4>🎯 なぜ${selectedFortune.name}を受けると良いのか</h4>
    <p>あなたの性格特性と占い手法の特徴がどのように合致するかを具体的に説明...</p>
  </div>
  
  <div class="fortune-benefits">
    <h4>💡 この占いを受けるメリット</h4>
    <ul>
      <li>具体的なメリット1</li>
      <li>具体的なメリット2</li>
      <li>具体的なメリット3</li>
    </ul>
  </div>
  
  <div class="when-to-consult">
    <h4>🔍 どんな時に受けると良いか</h4>
    <p>あなたの性格に基づいた占いのタイミング...</p>
  </div>
  
  <div class="how-to-receive">
    <h4>🎯 効果的な受け方</h4>
    <p>あなたに最適な占いの受け方や注意点...</p>
  </div>
  
  <div class="additional-advice">
    <h4>🌟 さらに良い結果を得るために</h4>
    <p>あなたの性格を活かした占いの活用法...</p>
  </div>
</div>`;

  const userPrompt = `
【占い適性診断 詳細分析依頼】

■ 診断結果データ
- 最適占い手法: ${selectedFortune.name}
- 適性度: ${scoreRatio}% (${fortunes[topFortune]}/${maxScore}ポイント)
- 手法の特徴: ${selectedFortune.characteristics}
- アプローチ: ${selectedFortune.approach}
- 期待できる効果: ${selectedFortune.benefits}

■ 全占い手法のスコア
${Object.entries(fortunes).map(([key, score]) => 
  `- ${fortuneTypes[key].name}: ${score}ポイント`
).join('\n')}

■ 回答パターン分析
${formatAnswersForFortune(answers)}

この方の性格・価値観・思考パターンを詳しく分析し、
なぜ${selectedFortune.name}を「受ける」ことが最適なのか、
どのような悩みや状況で受けると効果的なのか、
どのように受けると最良の結果を得られるのかを、
心理学的観点も交えて詳しく解説してください。

重要：「占いを学ぶ・覚える」ではなく「占いを受ける・相談する」ことに完全に焦点を当ててください。
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
