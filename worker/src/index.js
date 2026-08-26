const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Learn-Token',
  'Content-Type': 'application/json; charset=utf-8'
};
const modePrompt = {
  hint: '你处于“只给提示”模式。不要直接给完整答案或完整代码。先判断学生卡在哪里，只给最小必要提示，并用问题引导他继续思考。',
  teach: '你处于“讲解模式”。用零计算机基础也能理解的大白话解释，但保留必要的技术准确性；优先用例子、图景和小步骤。',
  answer: '你处于“直接答案模式”。可以给出完整答案，但仍要解释关键原因与复杂度，避免只甩代码。'
};
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null,{headers:cors});
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/chat') return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:cors});
    const token=request.headers.get('X-Learn-Token')||'';
    if (!env.LEARN_ACCESS_TOKEN || token !== env.LEARN_ACCESS_TOKEN) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:cors});
    try {
      const body=await request.json();
      const model=['deepseek-v4-flash','deepseek-v4-pro'].includes(body.model)?body.model:'deepseek-v4-flash';
      const mode=['hint','teach','answer'].includes(body.mode)?body.mode:'hint';
      const userMessages=Array.isArray(body.messages)?body.messages.slice(-12).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,12000)})):[];
      const system=`你叫“SuKoYa”，是一个可爱但严谨的私人算法老师，学生是计算机零基础，目标是从 Python、数据结构与算法一路学到机器学习和推荐系统。不要用羞辱、考试式口吻；不要为了鼓励而牺牲准确性。可以偶尔使用简短颜文字或可爱语气，但不要每句话都加、不要用力过猛，技术解释始终优先清楚准确。${modePrompt[mode]} ${body.context?`\n学生上下文：${String(body.context).slice(0,3000)}`:''}`;
      const ds=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model,messages:[{role:'system',content:system},...userMessages],thinking:{type: mode==='hint'?'enabled':'disabled'},reasoning_effort:model==='deepseek-v4-flash'?'high':'high',stream:false,max_tokens:3000})});
      const text=await ds.text();
      if(!ds.ok) return new Response(JSON.stringify({error:'DeepSeek API error',detail:text.slice(0,1000)}),{status:502,headers:cors});
      const data=JSON.parse(text);const content=data?.choices?.[0]?.message?.content||'';
      return new Response(JSON.stringify({content,model,usage:data.usage||null}),{headers:cors});
    } catch(e){return new Response(JSON.stringify({error:e.message||'Server error'}),{status:500,headers:cors})}
  }
};
