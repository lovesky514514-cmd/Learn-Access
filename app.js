const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

const resources = window.COURSE_RESOURCES || {};
const plan = window.LEARNING_PLAN || [];
const knowledgeBase = window.KNOWLEDGE_BASE || [];
const problems = window.PRACTICE_BANK || [];

const looks = {
  glasses: { name: '眼镜认真版', src: 'assets/look-glasses.jpg', desc: '今天是认真听课的小老师。' },
  smile: { name: '元气笑脸版', src: 'assets/look-smile.jpg', desc: '学会一点就值得开心一下。' },
  sweater: { name: '毛衣安静版', src: 'assets/look-sweater.jpg', desc: '适合慢慢啃难题的安静模式。' },
  snack: { name: '零食摸鱼版', src: 'assets/look-snack.jpg', desc: '脑子转不动时先补充一点能量。' }
};

const badges = [
  ['🌱', '初学者', '完成第 1 天', s => s.completedDays.length >= 1],
  ['📅', '坚持一周', '累计学习 7 天', s => s.studyDates.length >= 7],
  ['⚔️', '刷题达人', '完成 30 次练习', s => s.practiceCount >= 30],
  ['📖', '笔记达人', '笔记超过 300 字', () => (store.get('algoNotes', '') || '').length >= 300],
  ['🔭', '探索者', '打开 5 个学习资料', s => s.openedResources.length >= 5],
  ['🧠', '算法脑', '完成动态规划日', s => s.completedDays.includes(18)],
  ['🤖', '推荐学徒', '完成推荐系统三日', s => [26,27,28].every(d => s.completedDays.includes(d))],
  ['🪞', '反茧房实验员', '完成反馈回路课程', s => s.completedDays.includes(29)],
  ['✨', '毕业啦', '完成 30 天项目', s => s.completedDays.includes(30)]
];
const quotes = [
  '算法不是背模板，而是把一个复杂问题拆成可验证的小问题。',
  '今天能讲清一个概念，比收藏十门课更值。',
  '先写出正确的笨办法，再想怎么让它更快。',
  '复杂度不是考试符号，它是在问：数据大十倍时会发生什么？',
  '推荐系统真正难的，不只是猜你喜欢什么，还要避免把你越推越窄。',
  '看懂代码只是第一层，能预测它为什么这样运行才算真的开始理解。'
];

function dateKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let state = store.get('algoState', {
  completedDays: [], completedTasks: {}, xp: 0, minutes: 0, dailyMinutes: {}, studyDates: [],
  openedResources: [], context: true, practiceCount: 0, buddyLook: 'glasses'
});
let settings = store.get('algoSettings', { workerUrl: '', accessToken: '', dailyGoal: 120, motionMode: 'full' });
let focusTimer = null, focusElapsed = 0, focusInitial = 0, lessonDay = 1, kbCategory = '全部';

function normalizeState() {
  state.completedDays = Array.isArray(state.completedDays) ? state.completedDays.filter(n => n >= 1 && n <= 30) : [];
  state.completedTasks = state.completedTasks && typeof state.completedTasks === 'object' ? state.completedTasks : {};
  state.dailyMinutes = state.dailyMinutes && typeof state.dailyMinutes === 'object' ? state.dailyMinutes : {};
  state.studyDates = Array.isArray(state.studyDates) ? [...new Set(state.studyDates)] : [];
  state.openedResources = Array.isArray(state.openedResources) ? [...new Set(state.openedResources)] : [];
  state.practiceCount = Number(state.practiceCount || 0);
  state.xp = Number(state.xp || 0);
  state.minutes = Number(state.minutes || 0);
  state.context = state.context !== false;
  if (state.outfit && !state.buddyLook) state.buddyLook = 'glasses';
  state.buddyLook = looks[state.buddyLook] ? state.buddyLook : 'glasses';
  delete state.accessory;
}
normalizeState();

function save() { store.set('algoState', state); updateHUD(); }
function currentDay() {
  for (let d = 1; d <= 30; d++) if (!state.completedDays.includes(d)) return d;
  return 30;
}
function dayData(d = currentDay()) { return plan[Math.max(0, Math.min(plan.length - 1, d - 1))]; }
function taskId(day, i) { return `${day}-${i}`; }
function todayMinutes() { return Number(state.dailyMinutes[dateKey()] || 0); }
function addMinutes(n) {
  n = Math.max(0, Number(n || 0));
  state.minutes += n;
  state.dailyMinutes[dateKey()] = todayMinutes() + n;
  markStudyToday();
}
function markStudyToday() {
  const k = dateKey();
  if (!state.studyDates.includes(k)) state.studyDates.push(k);
}
function streak() {
  const dates = new Set(state.studyDates);
  let count = 0, d = new Date();
  if (!dates.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (dates.has(dateKey(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}
function reward(xp = 20, minutes = 0) { state.xp += xp; addMinutes(minutes); }
function levelInfo() {
  const size = 1200, level = Math.floor(state.xp / size) + 1, within = state.xp % size;
  return { size, level, within, left: size - within, pct: Math.round(within / size * 100) };
}
function levelTitle(level) {
  if (level >= 10) return '能独立拆算法的冒险者';
  if (level >= 7) return '推荐系统探索者';
  if (level >= 4) return '数据结构练习生';
  if (level >= 2) return '开始形成算法脑';
  return '刚刚启程的学习者';
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function showView(name) {
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.viewPanel === name));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  $$('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.viewJump === name));
  $('.main')?.scrollTo({ top: 0, behavior: settings.motionMode === 'off' ? 'auto' : 'smooth' });
  if (name === 'settings') fillSettings();
  if (name === 'buddy') renderWardrobe();
  if (name === 'achievements') renderBadges();
  if (name === 'knowledge') renderKnowledge();
}
$$('[data-view]').forEach(b => b.onclick = () => showView(b.dataset.view));
$$('[data-view-jump]').forEach(b => b.onclick = () => showView(b.dataset.viewJump));

function applyLook() {
  const src = looks[state.buddyLook]?.src || looks.glasses.src;
  const wardrobe = $('#wardrobeBuddy');
  const home = $('#homeBuddy');
  if (wardrobe) wardrobe.src = src;
  if (home) home.src = src;
}

function renderCourses() {
  const groups = [
    ['01','Python 地基','🐍',1,7],['02','数据结构与算法','🧩',8,18],['03','数学与机器学习','🤖',19,25],['04','推荐系统','⭐',26,29],['05','结业项目','🧊',30,30]
  ];
  const c = currentDay();
  $('#courseStrip').innerHTML = groups.map(g => {
    const [num, name, pet, start, end] = g, total = end - start + 1;
    const done = state.completedDays.filter(d => d >= start && d <= end).length;
    const p = Math.round(done / total * 100);
    return `<article class="course-card ${c>=start&&c<=end?'current':''}"><span class="num">${num}</span><h3>${name}</h3><div class="pet">${pet}</div><small>${done}/${total} 天 · ${p}%</small><div class="bar"><i style="width:${p}%"></i></div></article>`;
  }).join('');
}

function taskSet(day = currentDay()) {
  const d = dayData(day);
  return [
    { title: `主课：${d.title}`, meta: `${d.minutes} 分钟 · 站内讲义`, action: 'study', label: '打开课程' },
    { title: `动手：${d.exercises[0]}`, meta: '25–35 分钟', action: 'practice', label: '去练习' },
    { title: '复述：不看资料讲清今天 3 个关键点', meta: '15 分钟', action: 'notes', label: '写复盘' },
    { title: '自测：先自己答，再让 AI 检查', meta: '15 分钟', action: 'quiz', label: '开始自测' }
  ];
}
function renderTasks() {
  const day = currentDay(), tasks = taskSet(day);
  $('#todayLabel').textContent = `Day ${day}`;
  $('#taskList').innerHTML = tasks.map((t, i) => {
    const id = taskId(day, i), done = !!state.completedTasks[id];
    return `<div class="task"><button class="task-state spring ${done?'done':''}" data-toggle-task="${id}">${done?'✓':'○'}</button><div class="task-copy"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.meta)}</small></div><div class="task-actions"><button class="${done?'ghost':'primary'} spring" data-task-action="${t.action}" data-task-index="${i}">${done?'再看一次':t.label}</button></div></div>`;
  }).join('');
  $$('[data-toggle-task]').forEach(b => b.onclick = () => toggleTask(b.dataset.toggleTask));
  $$('[data-task-action]').forEach(b => b.onclick = () => runTaskAction(b.dataset.taskAction, +b.dataset.taskIndex));
}
function runTaskAction(action) {
  const d = dayData();
  if (action === 'study') { openLesson(d.day); startFocus(Math.min(45, d.minutes)); }
  if (action === 'practice') { showView('practice'); startFocus(25); }
  if (action === 'notes') {
    showView('notes'); const ta = $('#notesArea');
    if (!ta.value.trim()) ta.value = `## Day ${d.day} · ${d.title}\n\n- 我今天真正理解的 3 件事：\n  1. \n  2. \n  3. \n- 我能用自己的话解释：\n- 我卡住的地方：\n- 我犯过的错误：\n- 明天先复习：\n`;
    ta.focus(); store.set('algoNotes', ta.value);
  }
  if (action === 'quiz') {
    showView('lab'); $('#modeSelect').value = 'hint';
    $('#chatInput').value = `请根据 Day ${d.day}「${d.title}」的自测题逐题问我：${d.checks.join('；')}。一次只问一题，我回答后只判断思路并追问，不要立刻给标准答案。`;
    $('#chatInput').focus();
  }
}
function toggleTask(id) {
  const was = !!state.completedTasks[id];
  state.completedTasks[id] = !was;
  if (was) state.xp = Math.max(0, state.xp - 25);
  else { reward(25, 10); popBuddy('这一步算数，今天的理解又厚了一层 ✨'); }
  store.set('algoState', state); renderTasks(); updateHUD(); renderBadges();
}
function completeDay(day) {
  if (!state.completedDays.includes(day)) {
    state.completedDays.push(day); state.completedDays.sort((a,b)=>a-b); reward(120, 15);
    for (let i=0;i<4;i++) state.completedTasks[taskId(day,i)] = true;
    popBuddy(`Day ${day} 完成！下一天已经解锁。`);
  }
  store.set('algoState', state); renderAll();
}

function renderMap(week = Math.floor((currentDay()-1)/7)+1) {
  const maxWeek = Math.ceil(plan.length / 7);
  $('#weekTabs').innerHTML = Array.from({length:maxWeek}, (_,i)=>`<button class="spring ${i+1===week?'active':''}" data-week="${i+1}">第 ${i+1} 周</button>`).join('');
  $$('[data-week]').forEach(b => b.onclick = () => renderMap(+b.dataset.week));
  const days = plan.filter(d => d.week === week);
  $('#dayGrid').innerHTML = days.map(d => {
    const done = state.completedDays.includes(d.day), current = currentDay() === d.day;
    return `<article class="day-card glass-card ${done?'done':''} ${current?'current':''}"><div class="day-top"><span>Day ${d.day}</span><em>${escapeHtml(d.stage)}</em></div><h3>${escapeHtml(d.title)}</h3><p>${escapeHtml(d.summary)}</p><div class="day-tags">${d.concepts.slice(0,4).map(c=>`<span>${escapeHtml(c.term)}</span>`).join('')}</div><small>建议 ${d.minutes} 分钟 · ${d.exercises.length} 个动手任务</small><button class="${current?'primary':'ghost'} spring" data-open-day="${d.day}">${done?'复习这天':'打开课程'}</button></article>`;
  }).join('');
  $$('[data-open-day]').forEach(b => b.onclick = () => openLesson(+b.dataset.openDay));
}

function openLesson(day) {
  const d = dayData(day); if (!d) return; lessonDay = day;
  $('#lessonKicker').textContent = `Day ${d.day} · ${d.stage}`;
  $('#lessonTitle').textContent = d.title;
  $('#lessonSummary').textContent = d.summary;
  $('#lessonMeta').innerHTML = `<span>建议 ${d.minutes} 分钟</span><span>${d.goals.length} 个能力目标</span><span>${d.exercises.length} 个动手任务</span>`;
  $('#lessonGoals').innerHTML = d.goals.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  $('#lessonConcepts').innerHTML = d.concepts.map(c=>`<article><b>${escapeHtml(c.term)}</b><p>${escapeHtml(c.text)}</p></article>`).join('');
  $('#lessonCode').textContent = d.code || '今天以概念推演为主。';
  $('#lessonExercises').innerHTML = d.exercises.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  $('#lessonChecks').innerHTML = d.checks.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  $('#lessonResources').innerHTML = d.resources.map(id => {
    const r=resources[id]; if(!r)return'';
    return `<a href="${r.url}" target="_blank" rel="noopener" data-resource-id="${id}"><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.type)}</small><span>${escapeHtml(r.desc)}</span></a>`;
  }).join('');
  $$('[data-resource-id]', $('#lessonResources')).forEach(a => a.onclick = () => trackResource(a.dataset.resourceId));
  $('#lessonCompleteBtn').textContent = state.completedDays.includes(day) ? '这天已完成 ✓' : '完成今天';
  $('#lessonDialog').showModal();
}
$('#closeLessonBtn').onclick = () => $('#lessonDialog').close();
$('#lessonCompleteBtn').onclick = () => { completeDay(lessonDay); $('#lessonDialog').close(); };
$('#lessonAskAiBtn').onclick = () => {
  const d=dayData(lessonDay); $('#lessonDialog').close(); showView('lab'); $('#modeSelect').value='teach';
  $('#chatInput').value=`我正在学 Day ${d.day}「${d.title}」。请先用一个生活类比解释，再逐步讲这几个概念：${d.concepts.map(c=>c.term).join('、')}。每讲一个就问我一个检查问题，不要一口气灌完。`;
  $('#chatInput').focus();
};

let problemDiff = 'all';
function renderProblems() {
  const list = problems.filter(p => problemDiff === 'all' || p.difficulty === problemDiff);
  $('#practiceGrid').innerHTML = list.map((p, i) => `<article class="problem-card glass-card"><div class="problem-top"><span>${escapeHtml(p.topic)}</span><em class="${p.difficulty}">${p.difficulty==='easy'?'简单':'中等'}</em></div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.prompt)}</p><small>训练目标：${escapeHtml(p.goal)}</small><div class="problem-actions"><button class="ghost spring" data-hint="${i}">看最小提示</button><button class="primary spring" data-ai-problem="${i}">让 AI 陪练</button></div></article>`).join('');
  $$('[data-hint]').forEach(b => b.onclick = () => {
    const p = list[+b.dataset.hint]; alert(`最小提示：${p.hint}`); state.practiceCount++; reward(4, 2); save(); renderBadges();
  });
  $$('[data-ai-problem]').forEach(b => b.onclick = () => {
    const p = list[+b.dataset.aiProblem]; state.practiceCount++; reward(6, 2); save();
    showView('lab'); $('#modeSelect').value='hint';
    $('#chatInput').value=`陪我做这道题，不要先给完整答案：\n题目：${p.title}\n${p.prompt}\n目标：${p.goal}\n请先问我准备怎么做，再根据我的思路只给最小提示。`;
    $('#chatInput').focus(); renderBadges();
  });
}
$$('[data-diff]').forEach(b => b.onclick = () => { problemDiff = b.dataset.diff; $$('[data-diff]').forEach(x=>x.classList.toggle('active',x===b)); renderProblems(); });

function badgeUnlocked(index) { return !!badges[index][3](state); }
function renderBadges() {
  const unlocked = badges.filter((_,i)=>badgeUnlocked(i)).length;
  $('#achievementStats').innerHTML = [
    ['等级', `Lv.${levelInfo().level}`], ['已完成', `${state.completedDays.length}/30 天`], ['练习次数', state.practiceCount], ['徽章', `${unlocked}/${badges.length}`]
  ].map(x=>`<div class="stat-card glass-card"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
  $('#badgeGrid').innerHTML = badges.map((b,i)=>`<article class="badge-card glass-card ${badgeUnlocked(i)?'':'locked'}"><div>${b[0]}</div><h3>${b[1]}</h3><p>${b[2]}</p><small>${badgeUnlocked(i)?'已获得':'未解锁'}</small></article>`).join('');
  $('#miniBadges').innerHTML = badges.slice(0,6).map((b,i)=>`<div class="${badgeUnlocked(i)?'':'locked'}">${b[0]}<small>${b[1]}</small></div>`).join('');
}

function trackResource(id) {
  if (!state.openedResources.includes(id)) { state.openedResources.push(id); reward(8, 0); save(); renderBadges(); }
}
function renderResources() {
  $('#resourceGrid').innerHTML = Object.entries(resources).map(([id,r])=>`<article class="resource glass-card"><div class="resource-badges"><span class="resource-type">${escapeHtml(r.type)}</span><span class="authority-badge">${escapeHtml(r.authority||'官方资料')}</span></div><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.desc)}</p><a class="spring" data-resource="${id}" href="${r.url}" target="_blank" rel="noopener">打开权威来源 ↗</a></article>`).join('');
  $$('[data-resource]').forEach(a => a.onclick = () => trackResource(a.dataset.resource));
}

function renderKnowledge() {
  const cats = ['全部', ...new Set(knowledgeBase.map(x=>x.category))];
  const counts = Object.fromEntries(cats.map(c=>[c,c==='全部'?knowledgeBase.length:knowledgeBase.filter(x=>x.category===c).length]));
  $('#knowledgeTabs').innerHTML = cats.map(c=>`<button class="spring ${kbCategory===c?'active':''}" data-kb-cat="${escapeHtml(c)}">${escapeHtml(c)} <small>${counts[c]}</small></button>`).join('');
  $$('[data-kb-cat]').forEach(b=>b.onclick=()=>{kbCategory=b.dataset.kbCat;renderKnowledge();});
  const q = ($('#knowledgeSearch')?.value || '').trim().toLowerCase();
  const list = knowledgeBase.filter(x => (kbCategory==='全部'||x.category===kbCategory) && (!q || [x.term,x.brief,x.detail,x.example,x.pitfall,x.level].join(' ').toLowerCase().includes(q)));
  $('#knowledgeCount') && ($('#knowledgeCount').textContent=`当前显示 ${list.length} / ${knowledgeBase.length} 条`);
  $('#knowledgeGrid').innerHTML = list.map(x=>{
    const r=resources[x.source]||null;
    const source=r?`<a class="kb-source spring" href="${r.url}" target="_blank" rel="noopener" data-resource="${x.source}">来源：${escapeHtml(r.name)}</a>`:'';
    return `<article class="kb-card glass-card"><div class="kb-card-top"><span>${escapeHtml(x.category)} · ${escapeHtml(x.level||'核心')}</span><button class="ghost spring" data-kb-ai="${escapeHtml(x.term)}">问 AI</button></div><h3>${escapeHtml(x.term)}</h3><b>${escapeHtml(x.brief)}</b><p>${escapeHtml(x.detail)}</p><div class="kb-example"><small>例子</small>${escapeHtml(x.example)}</div>${x.pitfall?`<div class="kb-pitfall"><small>常见坑</small>${escapeHtml(x.pitfall)}</div>`:''}${source}</article>`;
  }).join('') || '<div class="empty-card glass-card">没有匹配词条，换个关键词试试。</div>';
  $$('[data-kb-ai]').forEach(b=>b.onclick=()=>{showView('lab');$('#modeSelect').value='teach';$('#chatInput').value=`请把「${b.dataset.kbAi}」讲到我真正理解：先用生活例子，再给一个最小代码/公式例子，最后问我一个检查题。`;$('#chatInput').focus();});
  $$('[data-resource]', $('#knowledgeGrid')).forEach(a => a.onclick = () => trackResource(a.dataset.resource));
}
$('#knowledgeSearch')?.addEventListener('input', renderKnowledge);

function renderWardrobe() {
  $('#outfitGrid').innerHTML = Object.entries(looks).map(([id,o])=>`<button class="outfit-choice spring ${state.buddyLook===id?'active':''}" data-look="${id}"><img src="${o.src}" alt="${escapeHtml(o.name)}"><b>${escapeHtml(o.name)}</b><small>${state.buddyLook===id?'正在使用':escapeHtml(o.desc)}</small></button>`).join('');
  $$('[data-look]').forEach(b=>b.onclick=()=>{state.buddyLook=b.dataset.look;store.set('algoState',state);renderWardrobe();applyLook();popBuddy(`${looks[state.buddyLook].name} 已经换好啦。`);});
  applyLook();
}

function updateHUD() {
  const goal = Number(settings.dailyGoal || 120), mins=todayMinutes(), p=Math.min(100,Math.round(mins/goal*100)), li=levelInfo(), st=streak();
  $('#progressPct').textContent=p+'%'; $('#progressRing').style.setProperty('--p',p); $('#hoursDone').textContent=(mins/60).toFixed(1);
  $('#goalLabel').textContent = goal%60===0 ? `学习 ${goal/60} 小时` : `学习 ${goal} 分钟`;
  $('#xpText').textContent=li.within; $('#xpBar').style.width=li.pct+'%'; $('#nextLevel').textContent=`再学 ${li.left} 经验升级`;
  $('#levelText').textContent=`Lv.${li.level}`; $('#xpLevelTag').textContent=`Lv.${li.level}`; $('#streakDays').textContent=st;
  $('#mobileLevel').textContent=`Lv.${li.level}`; $('#mobileXp').textContent=`${li.within} / ${li.size}`; $('#mobileStreak').textContent=`${st} 天`;
  const d=dayData(); $('#tipText').textContent = d ? `今天只抓住一个目标：${d.goals[0]}` : '继续复习已经完成的内容。';
  renderCourses(); applyLook();
}
function popBuddy(text) {
  const el=$('#buddySpeech'); if(el) el.textContent=text;
  const card=$('.buddy-card'); if(card && settings.motionMode!=='off') card.animate([{transform:'scale(1)'},{transform:'scale(1.02) translateY(-3px)'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.2,1.5,.3,1)'});
}

function openLevel() {
  const li=levelInfo(), dlg=$('#levelDialog');
  $('#dialogLevel').textContent=`Lv.${li.level}`; $('#dialogTitle').textContent=levelTitle(li.level); $('#dialogXpBar').style.width=li.pct+'%';
  $('#levelFacts').innerHTML=[['经验',state.xp],['课程',`${state.completedDays.length}/30`],['总学习',`${Math.round(state.minutes/60*10)/10}h`]].map(x=>`<div><b>${x[1]}</b><small>${x[0]}</small></div>`).join(''); dlg.showModal();
}
$('#profileBtn').onclick=openLevel; $('#xpCard').onclick=openLevel; $('#xpCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' ')openLevel();};
$('#openLevelBtn').onclick=openLevel; $('#closeLevelBtn').onclick=()=>$('#levelDialog').close();
$('#notesBtn').onclick=()=>showView('notes'); $('#continueBtn').onclick=()=>openLesson(currentDay());
$('#newQuoteBtn').onclick=()=>$('#quoteText').textContent=quotes[Math.floor(Math.random()*quotes.length)];
$('#resetPlanBtn').onclick=()=>{if(confirm('重置课程进度和学习计时？笔记、AI 设置和小人图片选择会保留。')){state.completedDays=[];state.completedTasks={};state.xp=0;state.minutes=0;state.dailyMinutes={};state.studyDates=[];state.practiceCount=0;store.set('algoState',state);renderAll();}};

function renderCalendar() {
  const now=new Date(), y=now.getFullYear(), m=now.getMonth(), first=new Date(y,m,1), last=new Date(y,m+1,0);
  $('#monthLabel').textContent=`${y}年${m+1}月`;
  const heads=['日','一','二','三','四','五','六'].map(x=>`<span class="head">${x}</span>`).join('');
  let html=heads;
  for(let i=0;i<first.getDay();i++) html+='<span></span>';
  for(let d=1;d<=last.getDate();d++){
    const dt=new Date(y,m,d), k=dateKey(dt), cls=[state.studyDates.includes(k)?'studied':'',k===dateKey()?'today':''].join(' ');
    html+=`<span class="${cls}">${d}</span>`;
  }
  $('#calendarGrid').innerHTML=html;
}

const notes = store.get('algoNotes',''); $('#notesArea').value=notes;
$('#notesArea').addEventListener('input',e=>{store.set('algoNotes',e.target.value);$('#noteStatus').textContent='已自动保存 '+new Date().toLocaleTimeString().slice(0,5);renderBadges();});
$('#insertTemplateBtn').onclick=()=>{const d=dayData(),template=`\n\n## Day ${d.day} · ${d.title} 复盘\n- 我今天真正理解的 3 件事：\n  1. \n  2. \n  3. \n- 我能用自己的话解释：\n- 我卡住的地方：\n- 我犯过的错误：\n- 明天先复习：\n`;$('#notesArea').value+=template;store.set('algoNotes',$('#notesArea').value);$('#notesArea').focus();};
$('#downloadNotesBtn').onclick=()=>{const blob=new Blob([`# 算法学习笔记\n\n${$('#notesArea').value}`],{type:'text/markdown'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='算法学习笔记.md';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};

function fillSettings(){settings=store.get('algoSettings',settings);$('#workerUrl').value=settings.workerUrl||'';$('#accessToken').value=settings.accessToken||'';$('#dailyGoal').value=settings.dailyGoal||120;$('#motionMode').value=settings.motionMode||'full';applyMotion();}
function applyMotion(){document.body.classList.toggle('motion-soft',settings.motionMode==='soft');document.body.classList.toggle('motion-off',settings.motionMode==='off');}
function readSettingsForm(){return{workerUrl:$('#workerUrl').value.trim().replace(/\/$/,''),accessToken:$('#accessToken').value.trim(),dailyGoal:+$('#dailyGoal').value||120,motionMode:$('#motionMode').value||'full'};}
$('#saveSettingsBtn').onclick=()=>{settings=readSettingsForm();store.set('algoSettings',settings);applyMotion();updateHUD();$('#testResult').textContent='设置已保存在这台设备。';$('#testResult').className='test-result ok';};
const settingsDialog=$('#settingsDialog');
$('#settingsBtn').onclick=()=>{fillSettings();$('#dialogWorkerUrl').value=settings.workerUrl||'';$('#dialogToken').value=settings.accessToken||'';settingsDialog.showModal();};
$('#dialogSave').onclick=e=>{e.preventDefault();settings.workerUrl=$('#dialogWorkerUrl').value.trim().replace(/\/$/,'');settings.accessToken=$('#dialogToken').value.trim();store.set('algoSettings',settings);settingsDialog.close();};
$('#testWorkerBtn').onclick=async()=>{
  const result=$('#testResult'); settings=readSettingsForm(); store.set('algoSettings',settings);
  if(!settings.workerUrl||!settings.accessToken){result.textContent='先填 Worker 地址和访问口令。';result.className='test-result bad';return;}
  result.textContent='正在测试……';result.className='test-result';
  try{const resp=await fetch(settings.workerUrl+'/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Learn-Token':settings.accessToken},body:JSON.stringify({model:'deepseek-v4-flash',mode:'teach',context:'连接测试',messages:[{role:'user',content:'只回复：连接成功'}]})});if(!resp.ok)throw new Error((await resp.text()).slice(0,180)||`HTTP ${resp.status}`);const data=await resp.json();result.textContent='连接成功：'+(data.content||'DeepSeek 已响应').slice(0,80);result.className='test-result ok';}catch(err){result.textContent='连接失败：'+err.message;result.className='test-result bad';}
};

$('#contextBtn').onclick=()=>{state.context=!state.context;$('#contextBtn').textContent=`带上今日课程 ${state.context?'✓':'✗'}`;store.set('algoState',state);};
$('#clearChatBtn').onclick=()=>{if(confirm('清空本机保存的 AI 对话？')){store.set('algoChat',[]);renderChat();}};
$$('[data-quick]').forEach(b=>b.onclick=()=>{$('#chatInput').value=b.dataset.quick;$('#chatInput').focus();});
function getChat(){return store.get('algoChat',[]);} function setChat(x){store.set('algoChat',x);}
function renderChat(){const list=getChat();$('#chatBox').innerHTML=`<div class="msg assistant">你好，我会陪你把问题一点点拆开。课程、代码、题目、知识库词条都可以丢给我 (´▽｀) /</div>`+list.map(m=>`<div class="msg ${m.role}">${escapeHtml(m.content).replace(/\n/g,'<br>')}</div>`).join('');$('#chatBox').scrollTop=$('#chatBox').scrollHeight;}
$('#chatForm').onsubmit=async e=>{
  e.preventDefault(); const text=$('#chatInput').value.trim(); if(!text)return; settings=store.get('algoSettings',settings);
  if(!settings.workerUrl||!settings.accessToken){$('#dialogWorkerUrl').value=settings.workerUrl||'';$('#dialogToken').value='';settingsDialog.showModal();return;}
  let chat=getChat(); chat.push({role:'user',content:text}); setChat(chat); $('#chatInput').value=''; renderChat();
  const loading=document.createElement('div');loading.className='msg assistant loading';loading.textContent='SuKoYa 正在想……';$('#chatBox').appendChild(loading);$('#sendBtn').disabled=true;
  try{
    const mode=$('#modeSelect').value, d=dayData();
    const context=state.context?`当前学习 Day ${d.day}：${d.title}。课程概要：${d.summary}。能力目标：${d.goals.join('；')}。核心概念：${d.concepts.map(c=>c.term+':'+c.text).join('；')}。自测：${d.checks.join('；')}。已完成 ${state.completedDays.length}/30 天，练习 ${state.practiceCount} 次。`:'';
    const resp=await fetch(settings.workerUrl+'/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Learn-Token':settings.accessToken},body:JSON.stringify({model:$('#modelSelect').value,mode,context,messages:chat.slice(-12)})});
    if(!resp.ok)throw new Error((await resp.text())||`HTTP ${resp.status}`); const data=await resp.json(); chat.push({role:'assistant',content:data.content||'没有收到有效回复。'}); setChat(chat); reward(5,0); store.set('algoState',state);
  }catch(err){chat.push({role:'assistant',content:`连接失败：${err.message}\n请到“设置中心”检查 Worker 地址和访问口令。`});setChat(chat);}finally{$('#sendBtn').disabled=false;renderChat();updateHUD();}
};

function startFocus(minutes){if(focusTimer)return;focusInitial=minutes*60;focusElapsed=0;$('#focusToast').hidden=false;tickFocus();focusTimer=setInterval(()=>{focusElapsed++;tickFocus();if(focusElapsed>=focusInitial)stopFocus(true);},1000);}
function tickFocus(){const remain=Math.max(0,focusInitial-focusElapsed),m=Math.floor(remain/60),s=remain%60;$('#focusTime').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function stopFocus(auto=false){if(!focusTimer)return;clearInterval(focusTimer);focusTimer=null;const recorded=Math.max(1,Math.round(focusElapsed/60));addMinutes(recorded);state.xp+=Math.min(30,recorded);store.set('algoState',state);$('#focusToast').hidden=true;updateHUD();renderCalendar();if(auto)popBuddy('这一轮专注完成啦，休息一下再继续。');}
$('#focusStopBtn').onclick=()=>stopFocus(false);

function renderAll(){renderTasks();renderMap(Math.floor((currentDay()-1)/7)+1);renderProblems();renderBadges();renderResources();renderKnowledge();renderCalendar();renderWardrobe();updateHUD();renderChat();$('#contextBtn').textContent=`带上今日课程 ${state.context?'✓':'✗'}`;$('#headerQuote').textContent=`☆ Day ${currentDay()}：${dayData().title}`;}
fillSettings(); renderAll();
