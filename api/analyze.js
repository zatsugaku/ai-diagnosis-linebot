// Vercel Serverless Function for ChatGPT API Integration (改善版)
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
      version: '2.0-improved'
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
    
    // 新しいデータ形式に対応
    const { totalScore, totalImprovement, detailedAnswers } = req.body;
    
    console.log('受信データ:', {
      totalScore,
      totalImprovement,
      detailedAnswersCount: detailedAnswers?.length || 0
    });
    
    if (typeof totalScore !== 'number' || typeof totalImprovement !== 'number' || !detailedAnswers || !Array.isArray(detailedAnswers)) {
      console.log('無効なリクエストデータ');
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

    // 改善されたAI分析生成
    const analysis = await generateEnhancedAIAnalysis(totalScore, totalImprovement, detailedAnswers, apiKey);
    
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

// 改善されたAI分析生成関数
async function generateEnhancedAIAnalysis(totalScore, totalImprovement, detailedAnswers, apiKey) {
  console.log('ChatGPT API呼び出し開始 - 改善版');
  
  const systemPrompt = `あなたは1,200社のAI導入を支援した経験豊富な専門コンサルタントです。

# 重要な分析方針
- 高スコア = AI活用による改善余地が大きい（課題が多い状況）
- 低スコア = 既に効率的で、AI活用余地は少ない（良好な状況）

# 出力必須要件
1. 各質問の回答を具体的に分析（「Q3で技術革新への対応を選択されたことから...」）
2. 業界ベンチマークとの詳細比較
3. 具体的な改善施策（ツール名・実装期間・効果を明示）
4. ROI計算（投資回収期間を月単位で詳細に）
5. 3段階の実装ロードマップ（具体的な行動計画）

# 必須出力形式
以下のHTML構造で出力してください：

<div class="ai-analysis">
  <h3>🤖 AI専門分析レポート</h3>
  
  <div class="highlight-box">
    <h4>📊 診断結果サマリー</h4>
    <p><strong>AI活用余地スコア：${totalScore}点/100点</strong></p>
    <p><strong>年間改善効果ポテンシャル：${totalImprovement}万円</strong></p>
    <p>（200文字以上で現状を詳細分析）</p>
  </div>
  
  <h4>🔍 回答分析から見える課題</h4>
  <div class="highlight-box">
    （各質問の回答を具体的に分析し、課題を特定。400文字以上）
  </div>
  
  <h4>🎯 重要課題TOP3と解決策</h4>
  <ol>
    <li><strong>課題名（具体的）</strong><br>現状の問題点と、AI活用による具体的解決策（ツール名含む）</li>
    <li><strong>課題名（具体的）</strong><br>現状の問題点と、AI活用による具体的解決策（ツール名含む）</li>
    <li><strong>課題名（具体的）</strong><br>現状の問題点と、AI活用による具体的解決策（ツール名含む）</li>
  </ol>
  
  <h4>💡 段階別実装ロードマップ</h4>
  <ol>
    <li><strong>Phase 1（1-3ヶ月）</strong><br>具体的なツール名と実装内容、期待効果</li>
    <li><strong>Phase 2（3-6ヶ月）</strong><br>具体的なツール名と実装内容、期待効果</li>
    <li><strong>Phase 3（6-12ヶ月）</strong><br>具体的なツール名と実装内容、期待効果</li>
  </ol>
  
  <h4>📈 詳細ROI分析</h4>
  <ul>
    <li>初期投資額: <strong>○○万円</strong>（ツール導入費・人件費込み）</li>
    <li>年間削減効果: <strong>${Math.floor(totalImprovement * 0.6)}万円</strong></li>
    <li>年間売上向上: <strong>${Math.floor(totalImprovement * 0.4)}万円</strong></li>
    <li>投資回収期間: <strong>○ヶ月</strong></li>
    <li>3年間累計効果: <strong>○○○万円</strong></li>
  </ul>
  
  <div class="cta-box">
    <h4>🚀 推奨される即座のアクション</h4>
    <p>この分析結果を基に、貴社専用のAI活用戦略を60分の無料個別相談で詳細設計いたします。</p>
    <p><strong>特典：</strong>Phase 1の詳細実装計画書（30ページ）を無料提供</p>
  </div>
</div>

# 重要注意事項
- 文字数：1,500-2,000文字
- 具体性重視：抽象的な表現は避け、具体的なツール名・数値・期間を明示
- 実行可能性：実際に導入可能な現実的な提案
- 根拠明示：各提案の根拠を診断回答と結びつけて説明`;

  const userPrompt = createDetailedAnalysisPrompt(totalScore, totalImprovement, detailedAnswers);

  try {
    console.log('OpenAI API リクエスト送信');
    
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
        max_tokens: 2500, // 増量
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.3, // 繰り返し防止
        presence_penalty: 0.3 // 多様性向上
      }),
    });

    // 25秒でタイムアウト
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
    console.log('OpenAI API 成功 - 改善版');

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

// 詳細分析プロンプト作成
function createDetailedAnalysisPrompt(totalScore, totalImprovement, detailedAnswers) {
  return `
【AI活用診断 詳細分析依頼】

## 企業の基本状況
- **総合スコア**: ${totalScore}/100点 (${getScoreLevelDescription(totalScore)})
- **年間改善ポテンシャル**: ${totalImprovement}万円
- **診断完了日**: ${new Date().toLocaleDateString('ja-JP')}

## 各質問の詳細回答分析
${formatDetailedAnswersForAnalysis(detailedAnswers)}

## 分析観点
1. **最も改善効果が高い領域の特定**（スコアと改善金額の関係から）
2. **業界ベンチマークとの比較**（同業他社との差異分析）
3. **実装優先順位の決定**（費用対効果・実現可能性・緊急性）
4. **具体的ROI試算**（投資額・回収期間・長期効果）

## 出力要求
上記データを基に、この企業が「なぜこのスコアになったのか」の根拠を示しながら、
実行可能で具体的なAI活用戦略を提案してください。

特に重視する点：
- 診断回答と提案の論理的つながり
- 具体的なツール名・ベンダー名
- 月単位の実装スケジュール
- 詳細なコスト・効果試算
`;
}

// 詳細回答フォーマット
function formatDetailedAnswersForAnalysis(detailedAnswers) {
  if (!detailedAnswers || !Array.isArray(detailedAnswers)) {
    return "詳細回答データが利用できません";
  }
  
  return detailedAnswers.map((answer, index) => {
    return `
**${answer.questionText || `Q${index + 1}`}**
- 選択回答: 「${answer.selectedOption || '不明'}」
- スコア: ${answer.score}点 (改善効果: ${answer.improvementAmount}万円)
- カテゴリ: ${answer.category || '未分類'}
- 課題レベル: ${getIssueLevel(answer.score)}
`;
  }).join('\n');
}

// スコアレベル詳細説明
function getScoreLevelDescription(score) {
  if (score >= 80) return 'AI活用による大幅改善が期待できる状況';
  if (score >= 60) return 'AI活用による一定の改善効果が見込める';
  if (score >= 40) return 'AI活用の効果は限定的、慎重な検討が必要';
  if (score >= 20) return '現状は比較的効率的、補完的なAI活用を検討';
  return '現状は高度に効率化済み、AI活用の必要性は低い';
}

// 問題レベル判定
function getIssueLevel(score) {
  if (score >= 80) return '緊急対応必要';
  if (score >= 60) return '早期改善推奨';
  if (score >= 40) return '中期的改善検討';
  if (score >= 20) return '軽微な改善余地';
  return '現状維持で良好';
}
