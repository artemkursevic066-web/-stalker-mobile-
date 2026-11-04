/* Облачное сохранение для stalker_studio_v2. Подключать после основного скрипта игры. */
(function () {
  'use strict';
  const URL = 'https://syhhlkyobtcrtpbtjpqd.supabase.co';
  const KEY = 'sb_publishable_yUcc2UdPzCJ4B29iyTFzeg__9h4KnJN';
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = init;
  script.onerror = () => alert('Не удалось загрузить облачный модуль. Проверьте интернет.');
  document.head.appendChild(script);
  function init() {
    const client = window.supabase.createClient(URL, KEY);
    const bar = document.getElementById('topbar');
    if (!bar) return;
    const button = document.createElement('button');
    button.className = 'tb-btn'; button.textContent = '☁ ОБЛАКО';
    bar.appendChild(button);
    button.onclick = menu;
    async function menu() {
      try {
        let { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          const email = prompt('Почта игрового аккаунта Supabase:');
          if (!email) return;
          const password = prompt('Пароль игрового аккаунта:');
          if (!password) return;
          const result = await client.auth.signInWithPassword({ email, password });
          if (result.error) throw result.error;
          data = { session: result.data.session };
        }
        const choice = prompt('ОБЛАКО\n1 — сохранить текущую сцену в облако\n2 — загрузить сцену из облака\n3 — выйти из аккаунта\n\nВведите 1, 2 или 3:');
        if (choice === '1') {
          if (typeof mode !== 'undefined' && mode !== 'edit') { alert('Сначала выйдите из режима теста кнопкой СТОП.'); return; }
          if (!confirm('Заменить облачное сохранение текущей сценой?')) return;
          const scene = { objects, player: { x: player.x, y: player.y, money: player.money }, inventory };
          const result = await client.from('game_saves').upsert({ user_id: data.session.user.id, scene, sprites: customSprites, updated_at: new Date().toISOString() });
          if (result.error) throw result.error;
          alert('Сцена и библиотека спрайтов сохранены в облаке.');
        } else if (choice === '2') {
          if (!confirm('Загрузить облачную сцену? Текущее локальное сохранение будет заменено.')) return;
          const result = await client.from('game_saves').select('scene,sprites').eq('user_id', data.session.user.id).maybeSingle();
          if (result.error) throw result.error;
          if (!result.data) { alert('Облачного сохранения ещё нет.'); return; }
          if (!result.data.scene || !Array.isArray(result.data.scene.objects) || !Array.isArray(result.data.sprites)) throw new Error('Некорректный формат сохранения.');
          const oldScene = localStorage.getItem('stalker_studio_save_v2');
          const oldSprites = localStorage.getItem('stalker_custom_sprites_v2');
          try {
            localStorage.setItem('stalker_studio_save_v2', JSON.stringify(result.data.scene));
            localStorage.setItem('stalker_custom_sprites_v2', JSON.stringify(result.data.sprites));
          } catch(e) {
            try { if (oldScene === null) localStorage.removeItem('stalker_studio_save_v2'); else localStorage.setItem('stalker_studio_save_v2', oldScene); if (oldSprites === null) localStorage.removeItem('stalker_custom_sprites_v2'); else localStorage.setItem('stalker_custom_sprites_v2', oldSprites); } catch (_) {}
            throw e;
          }
          alert('Сцена загружена. Страница перезапустится.'); location.reload();
        } else if (choice === '3') {
          const result = await client.auth.signOut(); if (result.error) throw result.error; alert('Вы вышли из аккаунта.');
        }
      } catch(e) { alert('Ошибка облака: ' + (e.message || String(e))); }
    }
  }
})();