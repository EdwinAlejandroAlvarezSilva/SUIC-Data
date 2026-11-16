(function () {
  const OPEN_STATES = new Set(['en pausa', 'continuar']);
  const READ_NOTIFICATIONS_KEY = 'suic_notifications_read_v1';
  const REFRESH_INTERVAL = 1500;
  let previousState = null;
  let previousOpenState = null;

  function readReadNotifications() {
    try {
      const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
      const notificationIds = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(notificationIds) ? notificationIds.filter(id => typeof id === 'string') : []);
    } catch (error) {
      console.error('[notifications] No se pudieron leer las notificaciones marcadas como leídas:', error);
      return new Set();
    }
  }

  function saveReadNotifications(notificationIds) {
    try {
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...notificationIds]));
      return true;
    } catch (error) {
      console.error('[notifications] No se pudo guardar el estado de lectura:', error);
      return false;
    }
  }

  function readRecords() {
    try {
      const raw = localStorage.getItem('registros');
      const records = raw ? JSON.parse(raw) : [];
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error('[notifications] No se pudieron leer los registros:', error);
      return [];
    }
  }

  function getIdentity(row) {
    return JSON.stringify([row[0], row[4], row[6], row[13], row[15]].map(value => String(value || '').trim()));
  }

  function getOpenRecords(records) {
    const occurrences = new Map();
    return records.reduce((items, row, index) => {
      if (!Array.isArray(row)) return items;
      const identity = getIdentity(row);
      const occurrence = occurrences.get(identity) || 0;
      occurrences.set(identity, occurrence + 1);
      if (!OPEN_STATES.has(String(row[3] || '').trim().toLowerCase())) return items;
      items.push({
        id: `${identity}:${occurrence}`,
        index,
        name: String(row[4] || '').trim() || 'Tipificación sin nombre',
        state: String(row[3]).trim()
      });
      return items;
    }, []);
  }

  function updateHeader(openRecords, animateItems = false) {
    const button = document.getElementById('suic-notifications-button');
    const badge = document.getElementById('suic-notifications-count');
    const total = document.getElementById('suic-notifications-total');
    const list = document.getElementById('suic-notifications-list');
    if (!button || !badge || !list) return;

    const unreadCount = openRecords.filter(record => !record.isRead).length;
    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.hidden = unreadCount === 0;
    if (total) total.textContent = String(unreadCount);
    button.setAttribute('aria-label', `Notificaciones: ${unreadCount} sin leer, ${openRecords.length} abiertas`);
    button.title = `${unreadCount} notificaciones sin leer`;

    list.replaceChildren();
    if (openRecords.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'suic-notifications-empty';
      empty.textContent = 'No hay tipificaciones en pausa o por continuar.';
      list.appendChild(empty);
      return;
    }

    openRecords.forEach(record => {
      const item = document.createElement('article');
      item.className = 'suic-notification-item';
      if (record.isRead) item.classList.add('is-read');
      if (animateItems) item.classList.add('has-update');
      item.dataset.notificationId = record.id;
      item.dataset.recordIndex = String(record.index);

      const title = document.createElement('strong');
      title.className = 'suic-notification-name';
      title.textContent = record.name;
      const state = document.createElement('span');
      state.className = 'suic-notification-state';
      state.textContent = record.state;
      const readLabel = document.createElement('label');
      readLabel.className = 'suic-notification-read';
      const readCheckbox = document.createElement('input');
      readCheckbox.type = 'checkbox';
      readCheckbox.checked = record.isRead;
      readCheckbox.dataset.notificationRead = '';
      readCheckbox.setAttribute('aria-label', `Marcar como leído: ${record.name}`);
      readLabel.append(readCheckbox, document.createTextNode('Marcar como leído'));
      const actions = document.createElement('div');
      actions.className = 'suic-notification-actions';

      const goButton = document.createElement('button');
      goButton.type = 'button';
      goButton.dataset.notificationAction = 'edit';
      goButton.textContent = 'Ir';
      const finishButton = document.createElement('button');
      finishButton.type = 'button';
      finishButton.dataset.notificationAction = 'finish';
      finishButton.textContent = 'Cambiar Estado';
      actions.append(goButton, finishButton);
      item.append(title, state, readLabel, actions);
      list.appendChild(item);
    });
  }

  function refresh(animate = true) {
    const records = readRecords();
    const pendingRecords = getOpenRecords(records);
    const openState = JSON.stringify(pendingRecords.map(record => [record.id, record.state]));
    let readNotificationIds = readReadNotifications();
    if (previousOpenState !== openState) {
      previousOpenState = openState;
      const activeIds = new Set(pendingRecords.map(record => record.id));
      const retainedIds = new Set([...readNotificationIds].filter(id => activeIds.has(id)));
      if (retainedIds.size !== readNotificationIds.size) saveReadNotifications(retainedIds);
      readNotificationIds = retainedIds;
    }
    const openRecords = pendingRecords.map(record => ({
      ...record,
      isRead: readNotificationIds.has(record.id)
    }));
    const state = JSON.stringify(openRecords.map(record => [record.id, record.state, record.isRead]));
    const changed = previousState !== null && previousState !== state;
    const needsRender = previousState === null || changed;
    previousState = state;
    if (needsRender) updateHeader(openRecords, animate && changed);

    const button = document.getElementById('suic-notifications-button');
    const badge = document.getElementById('suic-notifications-count');
    if (animate && changed) {
      [button, badge].forEach(element => {
        if (!element) return;
        element.classList.remove('has-update');
        void element.offsetWidth;
        element.classList.add('has-update');
        setTimeout(() => element.classList.remove('has-update'), 900);
      });
      setTimeout(() => {
        document.querySelectorAll('.suic-notification-item.has-update').forEach(item => item.classList.remove('has-update'));
      }, 900);
    }
  }

  function findRecordIndex(records, notificationId) {
    return getOpenRecords(records).find(record => record.id === notificationId)?.index ?? -1;
  }

  function openRecord(notificationId) {
    const records = readRecords();
    const index = findRecordIndex(records, notificationId);
    if (index < 0) {
      refresh(false);
      return;
    }
    if (typeof window.openEditModal === 'function') {
      window.openEditModal(index);
      return;
    }
    window.location.href = `Registros.html?editNotification=${encodeURIComponent(notificationId)}`;
  }

  async function finishRecord(notificationId) {
    const records = readRecords();
    const index = findRecordIndex(records, notificationId);
    if (index < 0) {
      refresh(false);
      return;
    }

    const row = records[index].slice();
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    row[2] = timestamp;
    row[3] = 'Finalizado';
    row[18] = timestamp;
    records[index] = row;

    try {
      localStorage.setItem('registros', JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('registros:updated', { detail: { registros: records } }));
      if (typeof window.syncRegistros === 'function') {
        const synced = await window.syncRegistros(records);
        if (!synced) {
          alert('El estado se actualizó en este navegador, pero no se pudo sincronizar con el almacenamiento seleccionado.');
        }
      }
      refresh(true);
      if (typeof window.cargarYMostrar === 'function') window.cargarYMostrar();
    } catch (error) {
      console.error('[notifications] No se pudo finalizar la tipificación:', error);
      alert('No se pudo guardar el cambio de estado. Verifica el almacenamiento e inténtalo de nuevo.');
    }
  }

  function handleListClick(event) {
    const actionButton = event.target.closest('[data-notification-action]');
    if (!actionButton) return;
    const item = actionButton.closest('.suic-notification-item');
    if (!item) return;
    if (actionButton.dataset.notificationAction === 'edit') openRecord(item.dataset.notificationId);
    if (actionButton.dataset.notificationAction === 'finish') finishRecord(item.dataset.notificationId);
  }

  function handleListChange(event) {
    const checkbox = event.target.closest('[data-notification-read]');
    if (!checkbox) return;

    const item = checkbox.closest('.suic-notification-item');
    if (!item) return;

    const readNotificationIds = readReadNotifications();
    if (checkbox.checked) readNotificationIds.add(item.dataset.notificationId);
    else readNotificationIds.delete(item.dataset.notificationId);

    if (!saveReadNotifications(readNotificationIds)) {
      refresh(false);
      alert('No se pudo guardar el estado de lectura. Verifica el almacenamiento e inténtalo de nuevo.');
      return;
    }
    refresh(true);
  }

  function handleOutsideClick(event) {
    const panel = document.getElementById('suic-notifications-panel');
    const button = document.getElementById('suic-notifications-button');
    if (!panel || !button || panel.hidden) return;
    if (panel.contains(event.target) || button.contains(event.target)) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function openRequestedRecord() {
    const requestedId = new URLSearchParams(window.location.search).get('editNotification');
    if (!requestedId) return;

    const start = () => {
      let attempts = 0;
      const tryOpen = () => {
        if (typeof window.openEditModal === 'function') {
          const index = findRecordIndex(readRecords(), requestedId);
          if (index >= 0) {
            window.history.replaceState({}, '', window.location.pathname);
            window.openEditModal(index);
            return;
          }
        }
        attempts += 1;
        if (attempts < 20) setTimeout(tryOpen, 250);
        else console.error('[notifications] No se encontró el registro solicitado para editar.');
      };
      tryOpen();
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  function initialize() {
    const button = document.getElementById('suic-notifications-button');
    const panel = document.getElementById('suic-notifications-panel');
    const list = document.getElementById('suic-notifications-list');
    if (!button || !panel || !list) return;

    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) refresh(false);
    });
    list.addEventListener('click', handleListClick);
    list.addEventListener('change', handleListChange);
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('storage', event => {
      if (event.key === 'registros' || event.key === READ_NOTIFICATIONS_KEY) refresh(true);
    });
    ['registros:loaded', 'registros:updated', 'registros:cross-tab-updated'].forEach(eventName => {
      window.addEventListener(eventName, () => refresh(true));
    });

    refresh(false);
    setInterval(() => refresh(true), REFRESH_INTERVAL);
    openRequestedRecord();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
