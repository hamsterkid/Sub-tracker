// 데이터 흐름: 폼 입력 → localStorage 저장 → 목록과 모든 요약 다시 그리기.
(() => {
  'use strict';
  const STORAGE_KEY = 'moa.subscriptions.v1';
  const form = document.getElementById('subscription-form');
  const warning = document.getElementById('storage-warning');
  const categories = Array.from(form.elements.category.options, option => option.value);
  let editingId = null;
  let storageReadable = true;
  function showWarning(message) {
    warning.textContent = message;
    warning.hidden = false;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validSubscription(sub) {
    return sub && typeof sub.id === 'string' && sub.id.length > 0 &&
      typeof sub.name === 'string' && sub.name.trim().length > 0 && sub.name.length <= 60 &&
      Number.isInteger(sub.amount) && sub.amount >= 1 && sub.amount <= 1000000000 &&
      ['monthly', 'yearly'].includes(sub.cycle) && validDate(sub.nextPaymentDate) &&
      categories.includes(sub.category) && typeof sub.paymentMethod === 'string' && sub.paymentMethod.length <= 40;
  }
  function loadSubscriptions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return [];
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.every(validSubscription) || new Set(saved.map(sub => sub.id)).size !== saved.length) throw new Error('Invalid saved data');
      return saved;
    } catch (error) {
      storageReadable = false;
      showWarning('저장된 데이터를 읽을 수 없습니다. 기존 기록 보호를 위해 저장을 중단했습니다. 브라우저의 저장 권한과 데이터를 확인해 주세요.');
      return [];
    }
  }
  let subscriptions = loadSubscriptions();
  // 저장 실패 시 기존 화면/입력을 유지해 저장되지 않은 변경을 성공으로 표시하지 않습니다.
  function saveSubscriptions(next) {
    if (!storageReadable) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      subscriptions = next;
      warning.hidden = true;
      SubscriptionUI.render(subscriptions);
      return true;
    } catch (error) {
      showWarning('저장하지 못했습니다. 브라우저 저장 권한이나 남은 공간을 확인하고 다시 시도해 주세요. 입력 내용은 유지됩니다.');
      return false;
    }
  }
  function resetForm() {
    editingId = null;
    form.reset();
    const now = new Date();
    form.elements.nextPaymentDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    document.getElementById('form-title').textContent = '새 구독 추가';
    document.getElementById('submit-button').textContent = '+ 구독 추가하기';
    document.getElementById('cancel-edit').hidden = true;
  }
  function announce(message) { document.getElementById('status').textContent = message; }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const sub = {
      id: editingId || 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2),
      name: data.get('name').trim(),
      amount: Number(data.get('amount')),
      cycle: data.get('cycle'),
      nextPaymentDate: data.get('nextPaymentDate'),
      category: data.get('category'),
      paymentMethod: data.get('paymentMethod').trim()
    };
    if (!validSubscription(sub)) {
      announce('구독 이름, 금액, 결제일을 올바르게 입력해 주세요.');
      return;
    }
    const wasEditing = editingId !== null;
    const next = wasEditing ? subscriptions.map(item => item.id === editingId ? sub : item) : [...subscriptions, sub];
    if (saveSubscriptions(next)) {
      resetForm();
      announce(`${sub.name} 구독을 ${wasEditing ? '수정' : '추가'}했습니다.`);
    }
  });
  document.getElementById('subscription-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const sub = subscriptions.find(item => item.id === button.dataset.id);
    if (!sub) return;
    if (button.dataset.action === 'edit') {
      editingId = sub.id;
      ['name', 'amount', 'cycle', 'nextPaymentDate', 'category', 'paymentMethod'].forEach(key => { form.elements[key].value = sub[key]; });
      document.getElementById('form-title').textContent = '구독 수정';
      document.getElementById('submit-button').textContent = '변경 내용 저장';
      document.getElementById('cancel-edit').hidden = false;
      form.scrollIntoView({ block: 'center' });
      form.elements.name.focus({ preventScroll: true });
    } else if (window.confirm(`“${sub.name}” 구독을 삭제할까요?`)) {
      if (saveSubscriptions(subscriptions.filter(item => item.id !== sub.id))) {
        if (editingId === sub.id) resetForm();
        announce(`${sub.name} 구독을 삭제했습니다.`);
        form.elements.name.focus({ preventScroll: true });
      }
    }
  });
  document.getElementById('cancel-edit').addEventListener('click', () => { resetForm(); form.elements.name.focus(); });
  document.querySelectorAll('a[href="#subscription-form"]').forEach(link => link.addEventListener('click', () => { resetForm(); form.elements.name.focus(); }));
  // 다른 탭의 변경을 반영하고 오래 열어둔 화면의 D-day도 갱신합니다.
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    storageReadable = true;
    subscriptions = loadSubscriptions();
    if (storageReadable) warning.hidden = true;
    resetForm();
    SubscriptionUI.render(subscriptions);
    announce('다른 탭의 저장 내용을 반영했습니다.');
  });
  window.setInterval(() => SubscriptionUI.render(subscriptions), 60000);
  resetForm();
  SubscriptionUI.render(subscriptions);
})();
