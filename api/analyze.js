// Vercel Serverless Function for ChatGPT API Integration (CORS修正版)
export default async function handler(req, res) {
  console.log('API呼び出し受信:', req.method);

  // 強化されたCORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS リクエスト処理');
    res.status(200).end();
    return;
  }

  // GETリクエストで動作確認
  if (req.method === 'GET') {
    console.log('GET リクエスト - 動作確認');
    return res.status(200).json({ 
      success: true, 
      message: 'API エンドポイント正常動作',
      timestamp: new Date().toISOString(),
      cors: 'enabled'
    });
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    console.log('不正なメソッド:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('POST リクエスト処理開始');
    
    // リクエストデータの取得
    const { answers, totalScore, totalImprovement } = req.body;
    
    console.log('受信データ:', {
      answersCount: answers?.length || 0,
      totalScore,
      totalImprovement
    });
    
    if (!answers || !Array.isArray(answers) || typeof totalScore !== 'number' || typeof totalImprovement !== 'number') {
      console.log('無効なリクエストデータ');
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    // OpenAI APIキーの確認
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('APIキー確認:', apiKey ? 'あり' : 'なし');
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY が設定されていません');
      return res.status(500).json({
        success: false,
        error: 'API configuration error - OPENAI_API_KEY not set'
      });
    }

    // ChatGPT API分析生成（タイムアウト対応版）
    const analysis = await generateAIAnalysisWithTimeout(answers, totalScore, totalImprovement, apiKey);
    
    console.log('AI分析生成成功');
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

// タイムアウト対応版のAI分析関数
async function generateAIAnalysisWithTimeout(answers, totalScore, totalImprovement, apiKey) {
  console.log('ChatGPT API呼び出し開始');
  
  const systemPrompt = `あなたは経験豊富な経営コンサルタント・AI活用専門家です。
企業の診断結果から、具体的で実行可能な改善提案を行います。

以下のHTML形式で分析結果を出力してください：

<div class="ai-analysis">
  <h3>🤖 AI専門分析レポート</h3>
  
  <div class="current-status">
    <h4>📊 現状分析</h4>
    <p>（貴社の現状を150文字程度で分析）</p>
  </div>
  
  <div class="key-issues">
    <h4>🎯 最重要課題TOP3</h4>
    <ol>
      <li><strong>課題名</strong>: 具体的な問題と影響</li>
      <li><strong>課題名</strong>: 具体的な問題と影響</li>
      <li><strong>課題名</strong>: 具体的な問題と影響</li>
    </ol>
  </div>
  
  <div class="improvement-plan">
    <h4>💡 AI活用による改善策</h4>
    <ul>
      <li><strong>短期（1-3ヶ月）</strong>: 即効性のある改善</li>
      <li><strong>中期（3-6ヶ月）</strong>: 本格的なAI導入</li>
      <li><strong>長期（6-12ヶ月）</strong>: 組織変革</li>
    </ul>
  </div>
  
  <div class="expected-results">
    <h4>📈 期待される効果</h4>
    <ul>
      <li>年間コスト削減: <strong>${Math.floor(totalImprovement * 0.6)}万円</strong></li>
      <li>売上向上効果: <strong>${Math.floor(totalImprovement * 0.4)}万円</strong></li>
      <li>生産性向上: <strong>${Math.min(50, Math.floor(totalImprovement / 10))}%</strong></li>
    </ul>
  </div>
  
  <div class="next-steps">
    <h4>🚀 推奨される次のステップ</h4>
    <ol>
      <li>AI活用戦略の策定と優先順位の決定</li>
      <li>パイロットプロジェクトの選定と実行</li>
      <li>効果測定と本格展開の計画作成</li>
    </ol>
  </div>
</div>

文字数: 600-800字
トーン: 専門的だが親しみやすく、具体的で実行可能`;

  const userPrompt = createAnalysisPrompt(answers, totalScore, totalImprovement);

  try {
    console.log('OpenAI API リクエスト送信');
    
    // タイムアウト制御（Vercelの制限内）
    const fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
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
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    // 25秒でタイムアウト（Vercelの30秒制限内）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 25 seconds')), 25000);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    console.log('OpenAI API レスポンス:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI API 成功');

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from OpenAI');
    }

  } catch (error) {
    console.error('ChatGPT API呼び出しエラー:', error);
    throw error;
  }
}

function createAnalysisPrompt(answers, totalScore, totalImprovement) {
  return `
【企業診断AI分析依頼】

## 診断結果サマリー
- 総合スコア: ${totalScore}/100点
- 年間改善効果: ${totalImprovement}万円
- 診断レベル: ${getScoreLevel(totalScore)}

## 各質問の回答詳細
${formatAnswersForAnalysis(answers)}

上記データを基に、この企業に最適なAI活用戦略と具体的な改善提案を提供してください。
特に実行可能性と投資対効果を重視した提案をお願いします。
`;
}

function formatAnswersForAnalysis(answers) {
  const questions = [
    'Q1: 昨年度と比較した一人当たり売上高',
    'Q2: 新入社員の育成期間',
    'Q3: 最優秀社員の残業理由',
    'Q4: 社員の退職理由',
    'Q5: 知識・ノウハウの共有状況',
    'Q6: 管理職の本来業務への時間配分',
    'Q7: 競合に対する提案力の自信',
    'Q8: 若手からの改善提案の頻度',
    'Q9: 主力社員不在時の業務継続性',
    'Q10: データに基づく意思決定の頻度'
  ];
  
  return answers.map((answer, index) => 
    `${questions[index] || `Q${index + 1}`}: スコア${answer.score}点 (改善効果: ${answer.amount}万円)`
  ).join('\n');
}

function getScoreLevel(score) {
  if (score >= 80) return '業界トップクラス';
  if (score >= 65) return '業界上位レベル';
  if (score >= 50) return '業界平均レベル';
  if (score >= 35) return '改善余地大';
  return '緊急改善必要';
}
