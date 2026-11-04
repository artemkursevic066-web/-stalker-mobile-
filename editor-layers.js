/* Дополнение к присланной версии редактора. Слои только среди наземных объектов, см. инструкцию. */
(() => {
  'use strict';
  const inspector = document.getElementById('insp-body');
  const row = document.createElement('div'); row.className = 'action-row';
  const down = document.createElement('button'), up = document.createElement('button');
  down.className = up.className = 'btn-dup'; down.textContent = '▼ СЛОЙ НИЖЕ'; up.textContent = '▲ СЛОЙ ВЫШЕ';
  row.append(down, up); inspector.appendChild(row);
  const isGround = o => ['trader','artifact','ground_loot','custom_sprite','stash','anomaly','collider','collider_box','collider_circle'].includes(o.type);
  function move(dir) {
    const i = objects.findIndex(o => o.id === selectedId);
    if (i < 0 || !isGround(objects[i])) { alert('Выберите наземный объект через СПИСОК. Деревья, собаки и игрок в этой версии рисуются отдельно.'); return; }
    let j = i + dir;
    while (j >= 0 && j < objects.length && !isGround(objects[j])) j += dir;
    if (j < 0 || j >= objects.length) return;
    saveState(); [objects[i], objects[j]] = [objects[j], objects[i]];
  }
  down.onclick = () => move(-1); up.onclick = () => move(1);
  const original = renderCustomSpritesUI;
  renderCustomSpritesUI = function () {
    original();
    const cards = document.querySelectorAll('#custom-sprites-grid .asset-card');
    cards.forEach((card, i) => {
      const sprite = customSprites[i]; if (!sprite) return;
      const del = document.createElement('button'); del.type = 'button'; del.className = 'btn-del';
      del.textContent = '🗑 УДАЛИТЬ'; del.style.width = '100%';
      del.onclick = e => {
        e.stopPropagation();
        if (!confirm('Удалить «' + sprite.name + '» из библиотеки? Объекты на карте останутся.')) return;
        customSprites = customSprites.filter(s => s.id !== sprite.id);
        saveCustomSprites(); renderCustomSpritesUI();
      };
      card.appendChild(del);
    });
  };
  renderCustomSpritesUI();
})();