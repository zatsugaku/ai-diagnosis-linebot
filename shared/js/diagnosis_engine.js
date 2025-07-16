/**
 * 診断システム共通エンジン
 * 全ての診断（企業向け・個人向け）で使用する基盤クラス
 * 設定ファイルベースで動作し、業種別カスタマイズに対応
 */

class DiagnosisEngine {
    constructor(config) {
        this.config = config;
        this.currentQuestion = 0;
        this.totalScore = 0;
        this.totalImprovement = 0;
        this.answers = [];
        this.startTime = null;
        
        // 設定検証
        if (!this.validateConfig(config)) {
            throw new Error('診断設定が無効です');
        }
        
        console.log(`${config.title} 診断エンジンを初期化しました`);
    }
    
    /**
     * 設定ファイルの検証
     */
    validateConfig(config) {
        const required = ['title', 'description', 'questions', 'resultMessages', 'scoreRanges'];
        return required.every(key => config[key] !== undefined);
    }
    
    /**
     * 診断システムの初期化
     */
    init() {
        try {
            this.startTime = new Date();
            this.setupUI();
            this.loadQuestion(0);
            this.updateProgress();
            
            console.log('診断システムを初期化しました');
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showError('システムの初期化に失敗しました。ページを再読み込みしてください。');
        }
    }
    
    /**
     * UI要素の初期設定
     */
    setupUI() {
        // タイトルと説明の設定
        const titleElement = document.querySelector('.title');
        const subtitleElement = document.querySelector('.subtitle');
        
        if (titleElement) titleElement.textContent = this.config.title;
        if (subtitleElement) subtitleElement.textContent = this.config.description;
        
        // カスタムスタイルの適用
        if (this.config.customStyles) {
            this.applyCustomStyles(this.config.customStyles);
        }
    }
    
    /**
     * カスタムスタイルの適用
     */
    applyCustomStyles(styles) {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
    
    /**
     * 質問の読み込みと表示
     */
    loadQuestion(questionIndex) {
        try {
            const question = this.config.questions[questionIndex];
            
            // 質問文の設定
            document.getElementById('question-text').textContent = question.text;
            
            // 選択肢の生成
            const container = document.getElementById('question-options');
            container.innerHTML = '';
            
            question.options.forEach((option, optionIndex) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.textContent = option;
                optionElement.onclick = () => this.selectOption(questionIndex, optionIndex);
                container.appendChild(optionElement);
            });
            
            // UI要素のリセット
            this.hideElements(['feedback', 'next-btn', 'analysis-btn']);
            
        } catch (error) {
            console.error('質問読み込みエラー:', error);
            this.showError('質問の読み込みに失敗しました。');
        }
    }
    
    /**
     * 選択肢の処理
     */
    selectOption(questionIndex, optionIndex) {
        try {
            const question = this.config.questions[questionIndex];
            const score = question.scores[optionIndex];
            const amount = question.amounts[optionIndex];
            const feedback = question.feedbacks[optionIndex];
            
            // 回答の保存
            this.answers[questionIndex] = { 
                score, 
                amount, 
                optionIndex,
                timestamp: new Date()
            };
            
            // UI更新
            this.updateSelectedOption(optionIndex);
            this.showFeedback(feedback, amount);
            this.updateTotals();
            this.showNavigationButton();
            
        } catch (error) {
            console.error('選択処理エラー:', error);
            this.showError('選択の処理に失敗しました。');
        }
    }
    
    /**
     * 選択された選択肢のハイライト
     */
    updateSelectedOption(selectedIndex) {
        const options = document.querySelectorAll('#question-options .option');
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    /**
     * フィードバックの表示
     */
    showFeedback(feedback, amount) {
        document.getElementById('feedback-title').textContent = feedback.title;
        document.getElementById('feedback-content').textContent = feedback.content;
        
        // 改善効果の表示（設定に応じて単位を変更）
        const unit = this.config.improvementUnit || '万円';
        document.getElementById('feedback-amount').textContent = `年間${amount}${unit}の改善効果`;
        document.getElementById('feedback').style.display = 'block';
    }
    
    /**
     * 累計スコアと改善効果の更新
     */
    updateTotals() {
        this.totalScore = 0;
        this.totalImprovement = 0;
        
        for (let i = 0; i < this.answers.length; i++) {
            if (this.answers[i]) {
                this.totalScore += this.answers[i].score;
                this.totalImprovement += this.answers[i].amount;
            }
        }
        
        // 累計表示の更新
        const unit = this.config.improvementUnit || '万円';
        document.getElementById('cumulative-amount').textContent = `年間${this.totalImprovement}${unit}`;
        document.getElementById('cumulative-display').style.display = 'block';
    }
    
    /**
     * ナビゲーションボタンの表示
     */
    showNavigationButton() {
        if (this.currentQuestion < this.config.questions.length - 1) {
            document.getElementById('next-btn').style.display = 'block';
        } else {
            document.getElementById('analysis-btn').style.display = 'block';
        }
    }
    
    /**
     * 次の質問へ進む
     */
    nextQuestion() {
        this.hideElements(['next-btn', 'feedback']);
        
        if (this.currentQuestion < this.config.questions.length - 1) {
            this.currentQuestion++;
            this.loadQuestion(this.currentQuestion);
            this.updateProgress();
        }
    }
    
    /**
     * プログレスバーの更新
     */
    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.config.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }
    
    /**
     * AI分析の開始
     */
    async startAnalysis() {
        document.getElementById('question-card').style.display = 'none';
        document.getElementById('analysis-section').style.display = 'block';
        
        // AI分析アニメーション開始
        this.runAnalysisAnimation();
        
        // AI分析API呼び出し
        try {
            await this.callAIAnalysis();
        } catch (error) {
            console.error('AI分析エラー:', error);
            this.showFallbackAnalysis();
        }
    }
    
    /**
     * 分析アニメーションの実行
     */
    runAnalysisAnimation() {
        const steps = this.config.analysisSteps || [1000, 1500, 2000, 1500, 1000];
        let currentStep = 0;
        const stepElements = document.querySelectorAll('.analysis-step');
        
        const runStep = () => {
            if (currentStep > 0) {
                stepElements[currentStep - 1].classList.remove('active');
                stepElements[currentStep - 1].classList.add('completed');
                stepElements[currentStep - 1].querySelector('.step-status').textContent = '✅';
            }
            
            if (currentStep < steps.length) {
                stepElements[currentStep].classList.add('active');
                stepElements[currentStep].querySelector('.step-status').textContent = '⏳';
                
                setTimeout(() => {
                    currentStep++;
                    runStep();
                }, steps[currentStep]);
            } else {
                stepElements[currentStep - 1].classList.remove('active');
                stepElements[currentStep - 1].classList.add('completed');
                stepElements[currentStep - 1].querySelector('.step-status').textContent = '✅';
                
                setTimeout(() => this.showResults(), 1000);
            }
        };
        
        runStep();
    }
    
    /**
     * AI分析APIの呼び出し
     */
    async callAIAnalysis() {
        try {
            console.log('AI分析API呼び出し開始');
            console.log('送信データ:', {
                answers: this.answers,
                totalScore: this.totalScore,
                totalImprovement: this.totalImprovement,
                diagnosisType: this.config.type
            });
            
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: this.answers,
                    totalScore: this.totalScore,
                    totalImprovement: this.totalImprovement,
                    diagnosisType: this.config.type,
                    industry: this.config.industry
                })
            });

            console.log('API応答受信:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('API応答データ:', data);
                
                if (data.success && data.analysis) {
                    document.getElementById('ai-analysis-content').innerHTML = data.analysis;
                    document.getElementById('ai-analysis-section').style.display = 'block';
                    console.log('AI分析成功 - 結果表示完了');
                } else {
                    console.log('API応答の形式エラー:', data);
                    this.showFallbackAnalysis();
                }
            } else {
                console.log('API応答エラー:', response.status);
                const errorText = await response.text();
                console.log('エラー詳細:', errorText);
                this.showFallbackAnalysis();
            }
        } catch (error) {
            console.error('AI分析API呼び出しエラー:', error);
            this.showFallbackAnalysis();
        }
    }
    
    /**
     * フォールバック分析の表示
     */
    showFallbackAnalysis() {
        console.log('フォールバック分析を表示');
        const contact = this.config.contactInfo || {
            email: 'info@diagnosis.com',
            subject: '診断結果の相談'
        };
        
        const fallbackHTML = `
            <div class="ai-analysis">
                <h3>🤖 診断分析レポート</h3>
                
                <div class="current-status">
                    <h4>📊 現状分析</h4>
                    <p>診断スコア${this.totalScore}点、年間改善効果${this.totalImprovement}${this.config.improvementUnit || '万円'}の結果となりました。</p>
                </div>
                
                <div class="improvement-plan">
                    <h4>💡 改善提案</h4>
                    <ul>
                        <li><strong>短期改善</strong>: 最も効果の高い業務の効率化</li>
                        <li><strong>中期改善</strong>: システム化・自動化の推進</li>
                        <li><strong>長期改善</strong>: 組織全体の最適化</li>
                    </ul>
                </div>
                
                <div class="expected-results">
                    <h4>📈 期待される効果</h4>
                    <ul>
                        <li>年間コスト削減: <strong>${Math.floor(this.totalImprovement * 0.6)}${this.config.improvementUnit || '万円'}</strong></li>
                        <li>売上向上効果: <strong>${Math.floor(this.totalImprovement * 0.4)}${this.config.improvementUnit || '万円'}</strong></li>
                        <li>生産性向上: <strong>${Math.min(50, Math.floor(this.totalImprovement / 10))}%</strong></li>
                    </ul>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #155724;">💼 専門コンサルタントによる詳細分析</h4>
                    <p style="color: #155724; margin: 10px 0;">この診断結果を基に、より詳細な改善プランを作成いたします。</p>
                    <a href="mailto:${contact.email}?subject=${contact.subject}&body=診断スコア: ${this.totalScore}点%0A改善効果: ${this.totalImprovement}${this.config.improvementUnit || '万円'}%0A%0A相談希望内容:%0A" 
                       style="background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                       📧 無料個別相談を申し込む
                    </a>
                </div>
            </div>
        `;
        
        document.getElementById('ai-analysis-content').innerHTML = fallbackHTML;
        document.getElementById('ai-analysis-section').style.display = 'block';
    }
    
    /**
     * 最終結果の表示
     */
    showResults() {
        document.getElementById('analysis-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        // スコア判定
        const scoreLevel = this.determineScoreLevel(this.totalScore);
        const resultData = this.config.resultMessages[scoreLevel];
        const scoreRange = this.config.scoreRanges[scoreLevel];
        
        // UI更新
        const unit = this.config.improvementUnit || '万円';
        document.getElementById('total-score').textContent = `${this.totalScore}点`;
        document.getElementById('total-score').style.color = scoreRange.color || '#667eea';
        document.getElementById('total-improvement').textContent = `年間改善効果: ${this.totalImprovement}${unit}`;
        document.getElementById('analysis-level').textContent = scoreRange.level;
        document.getElementById('analysis-message').textContent = resultData.message;
        document.getElementById('analysis-recommendation').textContent = `推奨アクション: ${resultData.recommendation}`;
        
        this.saveDiagnosisData();
    }
    
    /**
     * スコアレベルの判定
     */
    determineScoreLevel(score) {
        for (const [level, range] of Object.entries(this.config.scoreRanges)) {
            if (score >= range.min && score <= range.max) {
                return level;
            }
        }
        return 'urgent';
    }
    
    /**
     * 診断データの保存
     */
    saveDiagnosisData() {
        try {
            const diagnosisData = {
                id: `diagnosis_${Date.now()}`,
                type: this.config.type,
                timestamp: new Date().toISOString(),
                totalScore: this.totalScore,
                totalImprovement: this.totalImprovement,
                answers: this.answers,
                duration: new Date() - this.startTime
            };
            
            console.log('診断完了:', diagnosisData);
            
            // 将来的にはデータベースへの保存を実装
            // await this.saveToDatabase(diagnosisData);
            
        } catch (error) {
            console.error('データ保存エラー:', error);
        }
    }
    
    /**
     * 要素の非表示
     */
    hideElements(elementIds) {
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }
    
    /**
     * エラーメッセージの表示
     */
    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        document.querySelector('.container').insertBefore(
            errorDiv, 
            document.querySelector('.card')
        );
    }
}

// グローバル変数
let diagnosisEngine;

/**
 * 診断エンジンの初期化関数
 * 各診断ページでこの関数を呼び出す
 */
function initializeDiagnosis(config) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM読み込み完了 - 診断エンジン初期化開始');
        diagnosisEngine = new DiagnosisEngine(config);
        diagnosisEngine.init();
    });
}

// グローバル関数（HTMLから呼び出し用）
function selectOption(questionIndex, optionIndex) {
    if (diagnosisEngine) {
        diagnosisEngine.selectOption(questionIndex, optionIndex);
    }
}

function nextQuestion() {
    if (diagnosisEngine) {
        diagnosisEngine.nextQuestion();
    }
}

function startAnalysis() {
    if (diagnosisEngine) {
        diagnosisEngine.startAnalysis();
    }
}

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiagnosisEngine, initializeDiagnosis };
}
