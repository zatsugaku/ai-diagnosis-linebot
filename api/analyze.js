// Vercel Serverless Function for ChatGPT API Integration (修正版 - 0万円問題解決)
export default async function handler(req, res) {
  console.log('API呼び出し受信:', req.method);

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
      message: 'AI診断API エンドポイント正常動作',
      timestamp: new Date().toISOString(),
      version: '3.1-fixed-zero-amount-issue'
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
    
    // フロントエンドの送信形式に対応
    const { answers, totalScore, totalImprovement } = req.body;
    
    console.log('受信データ:', {
      totalScore,
      totalImprovement,
      answersCount: answers?.length || 0
    });
    
    // データ検証（フロントエンド形式）
    if (typeof totalScore !== 'number' || typeof totalImprovement !== 'number' || !answers || !Array.isArray(answers)) {
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

    // AI分析生成（修正版 - 0万円問題解決）
    const analysis = await generateAIAnalysis(totalScore, totalImprovement, answers, apiKey);
    
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

// AI分析生成関数（修正版 - 効果算出ロジック改善）
async function generateAIAnalysis(totalScore, totalImprovement, answers, apiKey) {
  console.log('ChatGPT API呼び出し開始');
  
  // スコアベースの効果算出（0万円問題の解決）
  const calculatedImprovement = Math.max(totalScore * 20, 300); // 最低300万円、1点につき20万円
  const effectiveImprovement = totalImprovement > 0 ? totalImprovement : calculatedImprovement;
  
  console.log('効果算出:', {
    originalImprovement: totalImprovement,
    calculatedImprovement: calculatedImprovement,
    effectiveImprovement: effectiveImprovement
  });
  
  const systemPrompt = `あなたは1,200社のAI導入を支援した経験豊富な専門コンサルタントです。

# 重要な分析方針
- 高スコア = AI活用による改善余地が大きい（課題が多い状況）
- 低スコア = 既に効率的で、AI活用余地は少ない（良好な状況）
- 金額表示は控えめに、定性的価値を重視
- 過度な期待値設定を避け、現実的な効果を提示

# 出力必須要件
1. 現状の課題を具体的に分析
2. AI活用による改善策を具体的に提案
3. 投資対効果を適切なレベルで算出
4. 実装ロードマップを段階的に提示

# 必須出力形式（```htmlは出力しない）
以下のHTML構造で出力してください：

<div class="ai-analysis">
  <h3>🤖 AI活用度分析レポート</h3>
  
  <div class="highlight-box">
    <h4>📊 診断結果サマリー</h4>
    <p><strong>AI活用改善スコア：${totalScore}点/100点</strong></p>
    <p><strong>年間改善効果ポテンシャル：${effectiveImprovement}万円規模</strong></p>
    <p>貴社の診断結果から、${getScoreLevelDescription(totalScore)}ことが判明いたしました。</p>
  </div>
  
  <h4>🎯 重要課題TOP3と解決策</h4>
  <ol>
    <li><strong>業務効率化</strong><br>ChatGPT/Claude活用による文書作成効率化で年間${Math.floor(effectiveImprovement * 0.3)}万円規模の効果</li>
    <li><strong>データ活用促進</strong><br>BIツール導入による意思決定高速化で年間${Math.floor(effectiveImprovement * 0.4)}万円規模の効果</li>
    <li><strong>人材育成強化</strong><br>AI学習システム導入で教育コスト削減、年間${Math.floor(effectiveImprovement * 0.3)}万円規模の効果</li>
  </ol>
  
  <h4>💡 段階別実装ロードマップ</h4>
  <ol>
    <li><strong>Phase 1（1-3ヶ月）：基盤構築</strong><br>ChatGPT Business導入、基本研修実施（投資額50万円、効果月額${Math.floor(effectiveImprovement/12 * 0.3)}万円規模）</li>
    <li><strong>Phase 2（3-6ヶ月）：活用拡大</strong><br>RPA・分析ツール導入、部門展開（投資額150万円、効果月額${Math.floor(effectiveImprovement/12 * 0.5)}万円規模）</li>
    <li><strong>Phase 3（6-12ヶ月）：高度化</strong><br>予測分析・自動化システム構築（投資額300万円、効果月額${Math.floor(effectiveImprovement/12)}万円規模）</li>
  </ol>
  
  <h4>📈 参考ROI分析</h4>
  <ul>
    <li>推奨初期投資額: <strong>500万円</strong>（ツール・研修・システム構築費込み）</li>
    <li>年間効率化効果: <strong>${Math.floor(effectiveImprovement * 0.6)}万円規模</strong></li>
    <li>年間売上・生産性向上: <strong>${Math.floor(effectiveImprovement * 0.4)}万円規模</strong></li>
    <li>投資回収期間: <strong>${Math.ceil(500 / (effectiveImprovement / 12))}ヶ月程度</strong></li>
    <li>3年間累計効果: <strong>${effectiveImprovement * 3 - 500}万円規模</strong></li>
  </ul>
  
  <h4>⚡ 即座に実行可能なクイックウィン</h4>
  <ul>
    <li>ChatGPT無料版での文書作成効率化テスト（即座開始可能）</li>
    <li>Excel/Googleスプレッドシートを使用したデータ可視化改善（1週間で効果実感）</li>
    <li>メール定型文作成の簡易自動化テンプレート導入（即実施可能）</li>
  </ul>
  
  <div class="cta-box">
    <h4>🚀 無料60分個別コンサルティングのご案内</h4>
    <p>この分析結果を基に、貴社専用のAI活用戦略を詳細設計いたします。</p>
    <p><strong>特典：</strong>Phase 1の詳細実装計画書（25ページ）を無料提供</p>
    <p><strong>参加者特典：</strong>ChatGPT Business導入支援（通常30万円）を特別価格でご提供</p>
    <a href="mailto:ai-consulting@business.com?subject=AI活用診断の相談&body=診断スコア: ${totalScore}点%0A改善効果: ${effectiveImprovement}万円規模" 
       style="background: #28a745; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 15px 0;">
       📧 無料個別相談を申し込む
    </a>
  </div>
</div>`;

  const userPrompt = `
【AI活用診断分析依頼】

企業診断結果:
- 総合スコア: ${totalScore}/100点
- 年間改善ポテンシャル: ${effectiveImprovement}万円規模
- 回答データ: ${answers.length}項目の詳細分析

${formatAnswersForAnalysis(answers)}

この企業の現状を分析し、具体的で実行可能なAI活用戦略を提案してください。
過度な期待値設定を避け、現実的で実行可能な内容を重視してください。
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
        max_tokens: 2000,
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

// 回答データの分析用フォーマット
function formatAnswersForAnalysis(answers) {
  return answers.map((answer, index) => {
    return `Q${index + 1}: スコア${answer.score}点, 改善効果${answer.amount}万円`;
  }).join('\n');
}

// スコアレベル説明
function getScoreLevelDescription(score) {
  if (score >= 80) return 'AI活用による大幅な改善が期待できる状況';
  if (score >= 60) return 'AI活用による一定の改善効果が見込める状況';
  if (score >= 40) return 'AI活用の効果は限定的ですが、慎重な検討により成果が期待できる状況';
  if (score >= 20) return '現状は比較的効率的ですが、補完的なAI活用により更なる向上が可能な状況';
  return '現状は高度に効率化されており、AI活用の必要性は低い状況';
}
