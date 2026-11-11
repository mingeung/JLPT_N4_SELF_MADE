// 메모·이어 풀기·오늘 푼 문제 수·복습 표시 테스트. 실제 Supabase에 임시 계정을 만들고 끝에 지운다.
// 사용: APP_URL=https://... PFX=n4- node r4.mjs   (N3는 PFX= )
import { chromium } from 'playwright-core';
const URL_ = process.env.APP_URL || 'http://localhost:8766/', P = process.env.PFX ?? 'n4-';
const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) process.exitCode = 1; };
const b = await chromium.launch({ channel: 'chrome', headless: true });
const name = 'r4' + Date.now().toString(36), PW = 'pass-word-1234', errs = [];
const open = async () => { const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(URL_); await p.waitForSelector('#authform'); await p.evaluate(x => { window.P = x; }, P); return p; };
const p = await open();
await p.click('[data-m=signup]'); await p.fill('[name=u]', name); await p.fill('[name=p]', PW); await p.fill('[name=p2]', PW);
await p.click('#authform .primary'); await p.waitForSelector('[data-act=today]', { timeout: 20000 });
await p.click('[data-act=today]'); await p.waitForSelector('.opt');
for (let k = 0; k < 3; k++) { await p.evaluate(() => pick((Q[V.ids[V.i]].a + (V.i === 0 ? 1 : 0)) % Q[V.ids[V.i]].c.length)); await p.evaluate(() => next()); }
const ids = await p.evaluate(() => V.ids);
await p.click('[data-act=quit]'); await p.waitForSelector('[data-act=resume]');
ok('홈에 이어서 풀기', (await p.locator('[data-act=resume]').innerText()).includes('3/10'));
await p.evaluate(() => { startQuiz([QS[5].id], '다시 보기', 'review'); pick(0); next(); go('home'); });
ok('다시 보기 뒤에도 세트 유지', await p.locator('[data-act=resume]').count() === 1);
await p.click('[data-act=resume]'); await p.waitForSelector('.opt');
ok('그만둔 곳부터', await p.evaluate(i => V.i === 3 && V.ids.join() === i.join(), ids));
for (let k = 3; k < 10; k++) { await p.evaluate(() => { if (!V.res[V.ids[V.i]]) pick(Q[V.ids[V.i]].a); next(); }); }
await p.waitForSelector('[data-act=retry]'); await p.click('[data-act=retry]'); await p.waitForSelector('.opt');
await p.evaluate(() => { pick(Q[V.ids[0]].a); next(); });
await p.evaluate(() => go('home')); await p.waitForSelector('.stats3');
const todayN = await p.locator('.stats3 b').first().innerText();
const expect = await p.evaluate(i => new Set([...i, QS[5].id]).size, ids);
ok('오늘 푼 문제 중복 제외', +todayN === expect, `${todayN} (기대 ${expect})`);
ok('이어 풀기 사라짐', await p.locator('[data-act=resume]').count() === 0);
await p.evaluate(() => startQuiz(wrongIds().slice(0, 1), 't', 'review'));
ok('복습 표시', (await p.locator('.qtag').innerText()).includes('복습'));
await p.evaluate(() => pick(0)); await p.waitForSelector('[data-memo]');
const qid = await p.evaluate(() => V.ids[0]);
await p.fill('[data-memo]', '待つ: 기다리다 — まって 발음 주의');
await p.waitForTimeout(1200);
await p.waitForFunction(() => store.queue.length === 0, null, { timeout: 15000 });
const p2 = await open();
await p2.click('[data-m=login]'); await p2.fill('[name=u]', name); await p2.fill('[name=p]', PW);
await p2.click('#authform .primary'); await p2.waitForSelector('[data-act=today]', { timeout: 20000 });
ok('다른 기기에서 메모 보임', await p2.evaluate(id => store.notes[id], qid) === '待つ: 기다리다 — まって 발음 주의');
await p2.evaluate(() => go('notes'));
ok('오답노트에 메모한 문제', (await p2.locator('.lbl:has-text("메모한 문제")').count()) === 1);
await p2.click(`[data-review="${qid}"] >> nth=0`); await p2.click('.opt >> nth=0'); await p2.waitForSelector('[data-memo]');
ok('해설에 메모 표시', (await p2.inputValue('[data-memo]')).includes('待つ'));
await p2.screenshot({ path: 'shots/r4-memo.png' });
await p2.evaluate(() => go('me')); await p2.click('[data-act=delacc]'); await p2.waitForSelector('#authform', { timeout: 20000 });
ok('계정 삭제', true);
ok('페이지 오류 없음', errs.length === 0, errs.join(' | '));
await b.close();
