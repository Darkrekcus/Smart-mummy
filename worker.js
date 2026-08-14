/* Smart Helper 家庭云同步 — Cloudflare Worker
 * 部署：Cloudflare 控制台 Workers → 粘贴本文件 → 绑定 KV（变量名 STATE_KV）
 * 数据按"家庭密码"隔离：GET/POST /?family=家庭密码
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const family = url.searchParams.get('family') || '';
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    // 家庭密码即密钥：4~32位字母数字
    if (!/^[a-zA-Z0-9_-]{4,32}$/.test(family)) {
      return json({ error: 'family code invalid' }, 400);
    }
    const key = 'state:' + family;

    if (request.method === 'GET') {
      const data = await env.STATE_KV.get(key);
      return new Response(data || 'null', { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
      const body = await request.text();
      if (body.length > 200000) return json({ error: 'too large' }, 413);
      try { JSON.parse(body); } catch { return json({ error: 'bad json' }, 400); }
      await env.STATE_KV.put(key, body);
      return json({ ok: true });
    }

    return new Response('Smart Helper Sync OK', { headers: cors });
  },
};
