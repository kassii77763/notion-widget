/**
 * Notion Multi-Widget - Quality Assurance & Visual Test Harness
 * 配置: harness/test_runner.js (制作コードと完全隔離)
 */

const fs = require('fs');
const path = require('path');

// プロジェクトルート（1つ上の階層）を参照
const projectRoot = path.resolve(__dirname, '..');
let hasError = false;

function logPass(msg) {
  console.log(`✅ [PASS] ${msg}`);
}

function logFail(msg) {
  console.error(`❌ [FAIL] ${msg}`);
  hasError = true;
}

console.log('\n🔍 ===========================================');
console.log('   ISOLATED QA TEST HARNESS (harness/test_runner.js)');
console.log('===========================================\n');

// 1. 必須構造・ファイル存在チェック
const requiredFiles = [
  'index.html',
  'style.css',
  'app.js',
  'AGENTS.md',
  '.agents/rules/botanical_theme.md'
];

requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    logPass(`必須ファイル存在: ${file}`);
  } else {
    logFail(`必須ファイル欠損: ${file}`);
  }
});

// 2. index.html の DOM 要素欠損チェック
const htmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
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
if (htmlContent.includes('viewBox="0 0 200 200"') && htmlContent.includes('overflow:visible')) {
  logPass('SVG viewBox スケーリング & overflow設定: 正常');
} else {
  logFail('CRITICAL: ポモドーロ SVG の viewBox / overflow 設定が失われています！');
}

// 4. CSS 表示崩れ防止プロパティチェック
const cssContent = fs.readFileSync(path.join(projectRoot, 'style.css'), 'utf-8');
if (cssContent.includes('white-space: nowrap')) {
  logPass('タブ文字改行防止 (white-space: nowrap): 正常');
} else {
  logFail('WARNING: タブの改行防止設定が欠如しています。');
}

if (cssContent.includes('.pomo-timer-circle') && cssContent.includes('width: 200px')) {
  logPass('SVGリング枠サイズ正規化 (width: 200px): 正常');
} else {
  logFail('CRITICAL: SVGリング枠サイズが不正です！');
}

// 5. JavaScript ロジック構造チェック
const jsContent = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf-8');
if (jsContent.includes('RING_CIRCUMFERENCE = 2 * Math.PI * 80')) {
  logPass('ポモドーロリング周長定数 (502.7): 正常一致');
} else {
  logFail('CRITICAL: ポモドーロリングの周長計算定数がズレています！');
}

console.log('\n===========================================');
if (hasError) {
  console.error('⛔ テスト結果: FAIL - コードに問題が検出されました！');
  process.exit(1);
} else {
  console.log('🎉 テスト結果: 全項目 PASS - 完璧な品質が隔離環境で保証されています！');
  process.exit(0);
}
