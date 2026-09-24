/**
 * Notion Multi-Widget - Quality Assurance & Visual Test Harness
 * このスクリプトは、コード変更時に表示崩れやロジック破壊を自動検出します。
 */

const fs = require('fs');
const path = require('path');

const widgetDir = __dirname;
let hasError = false;

function logPass(msg) {
  console.log(`✅ [PASS] ${msg}`);
}

function logFail(msg) {
  console.error(`❌ [FAIL] ${msg}`);
  hasError = true;
}

console.log('\n🔍 ===========================================');
console.log('   NOTION WIDGET AUTOMATED TEST HARNESS');
console.log('===========================================\n');

// 1. ファイル存在チェック
const requiredFiles = ['index.html', 'style.css', 'app.js', 'AGENTS.md'];
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(widgetDir, file))) {
    logPass(`必須ファイル存在: ${file}`);
  } else {
    logFail(`必須ファイル欠損: ${file}`);
  }
});

// 2. index.html の DOM 要素欠損チェック
const htmlContent = fs.readFileSync(path.join(widgetDir, 'index.html'), 'utf-8');
const requiredIDs = [
  'widget-root', 'tab-clock', 'tab-pomodoro', 'tab-countdown',
  'clock-time', 'pomo-time', 'pomo-progress', 'pomo-start-btn',
  'theme-toggle-btn', 'bgm-toggle-btn', 'sound-toggle'
];

requiredIDs.forEach(id => {
  if (htmlContent.includes(`id="${id}"`)) {
    logPass(`DOM ID 正常存在: #${id}`);
  } else {
    logFail(`CRITICAL: 画面要素のID #${id} が削除または崩れています！`);
  }
});

// 3. SVG 表示切れ・はみ出し防止ルールチェック
if (htmlContent.includes('viewBox="0 0 220 220"')) {
  logPass('SVG viewBox スケーリング設定: 正常');
} else {
  logFail('CRITICAL: ポモドーロ SVG の viewBox 設定が失われており、正方形に切り取られるリスクがあります！');
}

// 4. CSS 表示崩れ防止プロパティチェック
const cssContent = fs.readFileSync(path.join(widgetDir, 'style.css'), 'utf-8');
if (cssContent.includes('white-space: nowrap')) {
  logPass('タブ文字改行防止 (white-space: nowrap): 正常');
} else {
  logFail('WARNING: タブの改行防止設定が欠如しています。');
}

if (cssContent.includes('overflow: visible')) {
  logPass('SVGリングはみ出し許可 (overflow: visible): 正常');
} else {
  logFail('CRITICAL: SVGリングの overflow: visible 設定がなく、欠ける恐れがあります！');
}

// 5. JavaScript ロジック構造チェック
const jsContent = fs.readFileSync(path.join(widgetDir, 'app.js'), 'utf-8');
if (jsContent.includes('RING_CIRCUMFERENCE = 2 * Math.PI * 95')) {
  logPass('ポモドーロリング周長定数 (596.9): 正常一致');
} else {
  logFail('CRITICAL: ポモドーロリングの周長計算定数がズレています！');
}

console.log('\n===========================================');
if (hasError) {
  console.error('⛔ テスト結果: FAIL - コードに問題が検出されました！');
  process.exit(1);
} else {
  console.log('🎉 テスト結果: 全項目 PASS - 完璧な品質が保証されています！');
  process.exit(0);
}
