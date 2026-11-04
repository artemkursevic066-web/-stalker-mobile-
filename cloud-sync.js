/* Автосинхронизация сцены: загрузка после входа, сохранение изменений в редакторе и проверка обновлений. */
(() => {
  'use strict';
  const url = 'https://syhhlkyobtcrtpbtjpqd.supabase.co';
  const key = 'sb_publishable_yUcc2UdPzCJ4B29iyTFzeg__9h4KnJN';
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onerror = () => alert('Облако недоступно: проверьте интернет и обновите страницу.');
  script.onload = init;
  document.head.appendChild(script);
  function init() {
    const client = window.supabase.createClient(url, key);
    const btn = document.createElement('button');
    btn.className = 'tb-btn'; btn.textContent = '☁ ВОЙТИ';
    document.getElementById('topbar').appendChild(btn);
    let session = null, baseline = null, remoteStamp = null, busy = false, paused = false;
    const readLocal = () => ({scene:{objects, player:{x:player.x,y:player.y,money:player.money},inventory}, sprites:customSprites});
    const fingerprint = v => JSON.stringify(v);
    function apply(v) {
      if (!v.scene || !Array.isArray(v.scene.objects) || !Array.isArray(v.sprites)) throw new Error('Некорректное облачное сохранение');
      objects = JSON.parse(JSON.stringify(v.scene.objects));
      if (v.scene.player) { player.x = v.scene.player.x ?? player.x; player.y = v.scene.player.y ?? player.y; player.money = v.scene.player.money ?? player.money; }
      if (Array.isArray(v.scene.inventory)) { inventory = v.scene.inventory.map(normalizeItem); while (inventory.length < 12) inventory.push(null); }
      customSprites = JSON.parse(JSON.stringify(v.sprites));
      nextId = Math.max(0, ...objects.map(o => Number(o.id) || 0)) + 1;
      selectedId = null;
      cam.x = player.x; cam.y = player.y;
      renderCustomSpritesUI(); updateHud();
      try { localStorage.setItem('stalker_studio_save_v2', JSON.stringify(v.scene)); localStorage.setItem('stalker_custom_sprites_v2', JSON.stringify(v.sprites)); } catch(e) { console.warn('Локальная копия не сохранена:', e); }
      baseline = fingerprint(readLocal());
    }
    async function fetchRemote() {
      const r = await client.from('game_saves').select('scene,sprites,updated_at').eq('user_id',session.user.id).maybeSingle();
      if (r.error) throw r.error;
      return r.data;
    }
    async function connect() {
      busy = true; btn.textContent = '☁ ЗАГРУЗКА';
      try {
        let r = await client.auth.getSession(); if (r.error) throw r.error;
        session = r.data.session;
        if (!session) {
          const email = prompt('Почта игрового аккаунта:'); if (!email) return;
          const password = prompt('Пароль игрового аккаунта:'); if (!password) return;
          r = await client.auth.signInWithPassword({email,password}); if (r.error) throw r.error;
          session = r.data.session;
        }
        const remote = await fetchRemote();
        if (remote) {
          if (!confirm('В облаке есть сохранение. Загрузить его вместо текущей сцены?')) { paused = true; btn.textContent = '☁ ПАУЗА'; return; }
          apply(remote); remoteStamp = remote.updated_at;
        } else {
          baseline = null; remoteStamp = null;
          if (!confirm('Облачного сохранения нет. Создать его из текущей сцены?')) { paused=true; btn.textContent='☁ ПАУЗА'; return; }
        }
        paused = false; btn.textContent = '☁ ГОТОВО';
      } catch(e) { paused = true; btn.textContent = '☁ ОШИБКА'; alert('Ошибка облака: ' + (e.message || e)); }
      finally { busy = false; }
    }
    btn.onclick = () => { if (busy) return; if (!session || paused) connect(); else alert('Облако подключено. Изменения редактора проверяются каждые 5 секунд. Не редактируйте одновременно на двух устройствах.'); };
    async function tick() {
      if (!session || busy || paused || mode !== 'edit') return;
      busy = true;
      try {
        const local = readLocal(), localHash = fingerprint(local);
        const remote = await fetchRemote();
        const changedRemote = remote ? remote.updated_at !== remoteStamp : remoteStamp !== null;
        const changedLocal = localHash !== baseline;
        if (changedRemote && changedLocal) {
          paused = true; btn.textContent = '☁ КОНФЛИКТ';
          alert('На двух устройствах есть разные изменения. Автосинхронизация остановлена, чтобы не потерять данные. Не закрывайте страницу.');
          return;
        }
        if (changedRemote) {
          if (!remote) { paused = true; btn.textContent='☁ ПАУЗА'; alert('Облачное сохранение удалено.'); return; }
          apply(remote); remoteStamp = remote.updated_at; btn.textContent='☁ ОБНОВЛЕНО'; return;
        }
        if (changedLocal) {
          btn.textContent='☁ СОХРАНЕНИЕ';
          const stamp = new Date().toISOString();
          const payload = {user_id:session.user.id, scene:local.scene, sprites:local.sprites, updated_at:stamp};
          let result;
          if (remote) result = await client.from('game_saves').update(payload).eq('user_id',session.user.id).eq('updated_at',remoteStamp).select('updated_at').maybeSingle();
          else result = await client.from('game_saves').insert(payload).select('updated_at').single();
          if (result.error) throw result.error;
          if (!result.data) { paused=true; btn.textContent='☁ КОНФЛИКТ'; alert('Облако изменилось во время сохранения. Синхронизация остановлена. Не закрывайте страницу.'); return; }
          remoteStamp=result.data.updated_at; baseline=localHash; btn.textContent='☁ СОХРАНЕНО';
        }
      } catch(e) { btn.textContent='☁ НЕТ СВЯЗИ'; console.error(e); }
      finally { busy=false; }
    }
    setInterval(tick,5000);
    client.auth.getSession().then(r => { if (r.data.session) connect(); });
  }
})();