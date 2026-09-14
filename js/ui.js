// 계산은 logic.js가 담당하고, 이 파일은 화면에 표시하는 일만 담당합니다.
window.SubscriptionUI = (() => {
  const money = value => new Intl.NumberFormat('ko-KR').format(value) + '원';
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  // 날짜 문자열에 현지 자정을 지정해 UTC 해석으로 인한 D-day 오차를 피합니다.
  function daysUntil(date) {
    return calculateDaysUntilNextPayment(date + 'T00:00:00');
  }
  function render(subscriptions) {
    const monthly = calculateTotalMonthly(subscriptions);
    document.getElementById('monthly-total').textContent = money(monthly);
    document.getElementById('yearly-total').textContent = money(calculateTotalYearly(subscriptions));
    document.getElementById('subscription-count').textContent = subscriptions.length;
    const sorted = [...subscriptions].sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate));
    const normalized = sorted.map(sub => ({ ...sub, nextPaymentDate: sub.nextPaymentDate + 'T00:00:00' }));
    // 기존 필터는 오늘을 제외하므로 오늘 결제를 별도로 포함합니다.
    const upcoming = [...normalized.filter(sub => calculateDaysUntilNextPayment(sub.nextPaymentDate) === 0), ...filterSubscriptionsByNextPayment(normalized, 6)];
    document.getElementById('upcoming-count').textContent = upcoming.length + '건';
    document.getElementById('upcoming-total').textContent = money(upcoming.reduce((sum, sub) => sum + sub.amount, 0));
    document.getElementById('upcoming-list').replaceChildren(...upcoming.map(sub => element('li', '', `${sub.name} · ${sub.nextPaymentDate.slice(5, 10).replace('-', '/')} · ${money(sub.amount)}`)));
    const list = document.getElementById('subscription-list');
    list.replaceChildren();
    if (!sorted.length) {
      const empty = element('div', 'empty-state');
      empty.append(element('strong', '', '아직 모아둔 구독이 없어요'), element('p', '', '첫 구독을 추가하고 지출을 확인해 보세요.'));
      const link = element('a', 'button secondary', '+ 첫 구독 추가');
      link.href = '#subscription-form';
      empty.append(link);
      list.append(empty);
    }
    sorted.forEach(sub => {
      const card = element('article', 'subscription-card');
      const info = element('div');
      info.append(element('h3', '', sub.name), element('p', 'card-meta', `${sub.category} · ${sub.paymentMethod || '결제 수단 미등록'}`));
      const price = element('div', 'card-price');
      price.append(element('strong', '', money(convertToMonthly(sub))), element('small', '', ' / 월'));
      price.append(element('p', 'card-meta', `${sub.cycle === 'yearly' ? '매년' : '매월'} ${money(sub.amount)} 결제`));
      const days = daysUntil(sub.nextPaymentDate);
      const dueText = days === 0 ? 'D-day · 오늘 결제' : days > 0 ? `D-${days}` : `D+${Math.abs(days)} · 결제일 확인`;
      const bottom = element('div', 'card-bottom');
      bottom.append(element('span', 'due' + (days < 0 ? ' overdue' : ''), `${dueText} · ${sub.nextPaymentDate}`));
      const actions = element('div', 'card-actions');
      ['edit', 'delete'].forEach(action => {
        const label = action === 'edit' ? '수정' : '삭제';
        const button = element('button', 'text-button ' + action, label);
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.id = sub.id;
        button.setAttribute('aria-label', `${sub.name} ${label}`);
        actions.append(button);
      });
      bottom.append(actions);
      card.append(element('div', 'subscription-icon', Array.from(sub.name)[0]), info, price, bottom);
      list.append(card);
    });
    const categories = document.getElementById('category-list');
    categories.replaceChildren();
    const groups = Object.entries(groupSubscriptionsByCategory(subscriptions)).sort((a, b) => b[1] - a[1]);
    if (!groups.length) categories.append(element('p', 'category-empty', '구독을 추가하면 카테고리별 비중이 표시돼요.'));
    groups.forEach(([category, amount]) => {
      const percentage = monthly > 0 ? amount / monthly * 100 : 0;
      const row = element('div', 'category-row');
      const label = element('div', 'category-label');
      label.append(element('span', '', category), element('span', '', `${money(amount)} · ${percentage.toFixed(1)}%`));
      const bar = element('div', 'category-bar');
      bar.setAttribute('aria-hidden', 'true');
      const fill = element('div', 'category-fill');
      fill.style.width = percentage + '%';
      bar.append(fill);
      row.append(label, bar);
      categories.append(row);
    });
  }
  return { render };
})();
