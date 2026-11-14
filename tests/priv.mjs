// 개인 문제집 오답(private_items) 표시 테스트. 서버 응답을 가로채 rows.json을 돌려준다. 임시 계정은 끝에 지운다.
// 사용: ROWS=<rows.json> CLIPS=<clips 폴더> APP_URL=http://localhost:8765/ node priv.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';
const URL_ = process.env.APP_URL || 'http://localhost:8765/';
const ALL = JSON.parse(fs.readFileSync(process.env.ROWS));
const rows = ALL.private.map(r => ({ kind: r.kind, item_id: r.item_id, data: r.data }));
const ok = (n, c, x = '') => { console.log(c ? 'PASS' : 'FAIL', n, x); if (!c) process.exitCode = 1; };
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [], name = 'pv' + Date.now().toString(36), PW = 'pass-word-1234';
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route('**/rest/v1/private_items*', r => r.fulfill({ json: rows }));
await ctx.route('**/storage/v1/object/sign/private-audio', r => { const { paths } = r.request().postDataJSON(); r.fulfill({ json: paths.map(p => ({ path: p, signedURL: `/object/sign/private-audio/${p}?token=x`, error: null })) }); });
await ctx.route('**/storage/v1/object/sign/private-audio/**', r => { const f = new URL(r.request().url()).pathname.split('/').pop().replace(/^hk1-/, ''); r.fulfill({ body: fs.readFileSync(`${process.env.CLIPS}/${f}`), contentType: 'audio/mp4' }); });
const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
await p.goto(URL_); await p.waitForSelector('#authform');
await p.click('[data-m=signup]'); await p.fill('[name=u]', name); await p.fill('[name=p]', PW); await p.fill('[name=p2]', PW);
await p.click('#authform .primary'); await p.waitForSelector('[data-act=today]', { timeout: 20000 });
await p.waitForFunction(() => PRIV_EXAMS.length === 1, null, { timeout: 15000 });
const n = await p.evaluate(() => QS.filter(q => q.src).length);
ok('개인 문항 불러옴', n === 60, n);
ok('전체 문제 수에는 안 들어감', !(await p.locator('.stats3').innerText()).includes(String(await p.evaluate(() => QS.length))));
await p.evaluate(() => go('exams')); await p.waitForSelector('[data-exam="-1"]');
ok('모의고사 탭에 문제집 시험', (await p.locator('[data-exam="-1"]').innerText()).includes('한끝'));
await p.screenshot({ path: 'shots/priv-exams.png' });
await p.click('[data-exam="-1"]'); await p.waitForSelector('[data-act=exreview]');
await p.screenshot({ path: 'shots/priv-result.png', fullPage: true });
ok('틀린 문제 수', (await p.locator('[data-act=exreview]').innerText()).includes('49'));
ok('헷갈린 문제 버튼', (await p.locator('[data-act=exflag]').innerText()).includes('11'));
await p.click('[data-act=exreview]'); await p.waitForSelector('.choices');
ok('배지', (await p.locator('.pill.src').first().innerText()).includes('한끝'));
ok('내 답 표시', await p.locator('.choices .pill.no').count() >= 1);
await p.screenshot({ path: 'shots/priv-q1.png', fullPage: true });
// 청해 문항으로 이동해서 재생
const li = await p.evaluate(() => V.ids.findIndex(id => Q[id].aup));
await p.evaluate(i => { V.i = i; render(); }, li); await p.waitForSelector('[data-act=play]');
await p.click('[data-act=play]'); await p.waitForTimeout(2500);
console.log(await p.evaluate(() => [Q[V.ids[V.i]].au, TTS.audio && [TTS.audio.paused, TTS.audio.currentTime, TTS.audio.error?.code]])); ok('청해 음성 재생', await p.evaluate(() => !!TTS.audio && !TTS.audio.paused && TTS.audio.currentTime > 0.5));
await p.click('[data-act=play]');
await p.screenshot({ path: 'shots/priv-listen.png', fullPage: true });
await p.evaluate(at => { store.attempts.push(...at); indexAttempts(); go('home'); }, ALL.attempts.map(a => ({ ...a, id: crypto.randomUUID() })));
// 오늘의 학습에 섞이는지 (복습 자리에 2개까지)
const today = await p.evaluate(() => todaySet(todayDone()).filter(id => Q[id].src).length);
ok('오늘의 10문제에 문제집 오답', today >= 1, today);
await p.evaluate(() => go('notes')); 
ok('오답노트 표시', (await p.locator('.part.item').first().innerText()).length > 0);
await p.evaluate(() => go('me')); await p.click('[data-act=delacc]'); await p.waitForSelector('#authform', { timeout: 20000 });
ok('페이지 오류 없음', errs.length === 0, errs.join(' | '));
await b.close();
