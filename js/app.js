/* ==========================================
   羊舍管理系统 - 核心逻辑
   ========================================== */

// ---------- 常量 ----------
const STORAGE_KEY_EWES  = 'sheep_manager_ewes';
const STORAGE_KEY_LAMBS = 'sheep_manager_lambs';
const PREGNANCY_DAYS    = 150;       // 羊怀孕周期（天）

// ---------- 工具函数 ----------
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return fmtDate(d.toISOString().slice(0, 10));
}

function todayStr() {
  return fmtDate(new Date().toISOString().slice(0, 10));
}

function daysBetween(a, b) {
  // 返回 b - a 的天数，正数表示b在a之后
  if (!a || !b) return null;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

function daysFromToday(dateStr) {
  return daysBetween(todayStr(), dateStr);
}

// ---------- 数据管理 ----------
const Store = {
  getEwes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EWES);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveEwes(ewes) {
    localStorage.setItem(STORAGE_KEY_EWES, JSON.stringify(ewes));
  },

  getLambs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAMBS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveLambs(lambs) {
    localStorage.setItem(STORAGE_KEY_LAMBS, JSON.stringify(lambs));
  },

  // 获取母羊的羔羊列表
  getLambsByEwe(eweId) {
    return this.getLambs().filter(l => l.motherId === eweId);
  },

  // 判断羊只状态
  getEweStatus(ewe) {
    if (ewe.gender === 'male') return 'ram';      // 公羊
    const lambs = this.getLambsByEwe(ewe.id);
    const hasBorn = lambs.length > 0;
    if (hasBorn) return 'born';      // 已生产
    if (ewe.matingDate) return 'mated'; // 已配种
    return 'empty';                   // 空怀
  },
  // 获取存栏羔羊（未出栏的）
  getCurrentLambs() {
    return this.getLambs().filter(l => this.getLambStatus(l) !== 'sold');
  },

  // 判断羔羊状态
  getLambStatus(lamb) {
    if (!lamb.fatteningEnd) return 'nursing';
    const remain = daysFromToday(lamb.fatteningEnd);
    if (remain !== null && remain < 0) return 'sold';    // 已出栏
    return 'fattening';                                   // 育肥中
  }
};

// ---------- 示例数据 ----------
function initSampleData() {
  if (Store.getEwes().length > 0) return; // 已有数据，不覆盖

  const today = todayStr();

  const ewes = [
    {
      id: genId(), number: 'M001', breed: '小尾寒羊', gender: 'female',
      birthDate: '2024-03-15',
      breedingDate: '2026-04-15',
      matingDate: '2026-04-20',
      dueDate: addDays('2026-04-20', PREGNANCY_DAYS),
      notes: '体格健壮，第一胎'
    },
    {
      id: genId(), number: 'M002', breed: '杜泊羊', gender: 'female',
      birthDate: '2024-06-20',
      breedingDate: '2026-06-01',
      matingDate: '',
      dueDate: '',
      notes: ''
    },
    {
      id: genId(), number: 'M003', breed: '小尾寒羊', gender: 'female',
      birthDate: '2024-01-10',
      breedingDate: '2026-03-01',
      matingDate: '2026-03-10',
      dueDate: addDays('2026-03-10', PREGNANCY_DAYS),
      notes: '第二胎'
    },
    {
      id: genId(), number: 'M004', breed: '湖羊', gender: 'female',
      birthDate: '2024-08-05',
      breedingDate: '2026-01-01',
      matingDate: '2026-01-15',
      dueDate: addDays('2026-01-15', PREGNANCY_DAYS),
      notes: '重点关注，预产期临近'
    },
    {
      id: genId(), number: 'M005', breed: '杜泊羊', gender: 'female',
      birthDate: '2024-05-10',
      breedingDate: '2026-05-01',
      matingDate: '',
      dueDate: '',
      notes: '已到适孕期，需尽快配种'
    },
    {
      id: genId(), number: 'M006', breed: '小尾寒羊', gender: 'female',
      birthDate: '2023-11-20',
      breedingDate: '2025-08-01',
      matingDate: '2025-08-15',
      dueDate: addDays('2025-08-15', PREGNANCY_DAYS),
      notes: '已生产，双羔'
    },
    {
      id: genId(), number: 'G001', breed: '杜泊羊', gender: 'male',
      birthDate: '2023-06-10',
      breedingDate: '',
      matingDate: '',
      dueDate: '',
      notes: '种公羊'
    },
    {
      id: genId(), number: 'G002', breed: '小尾寒羊', gender: 'male',
      birthDate: '2024-02-15',
      breedingDate: '',
      matingDate: '',
      dueDate: '',
      notes: '育成公羊'
    }
  ];

  Store.saveEwes(ewes);

  const m006 = ewes[5]; // M006 已生产
  const lambs = [
    {
      id: genId(), number: 'L001', motherId: m006.id, gender: 'male',
      birthDate: '2026-01-10',
      fatteningStart: '2026-01-15',
      fatteningEnd: '2026-05-15',
      fatteningDays: 120,
      notes: '公羔，生长快'
    },
    {
      id: genId(), number: 'L002', motherId: m006.id, gender: 'female',
      birthDate: '2026-01-10',
      fatteningStart: '2026-01-15',
      fatteningEnd: addDays('2026-01-15', 145),
      fatteningDays: 145,
      notes: '母羔，即将出栏'
    },
    {
      id: genId(), number: 'L003', motherId: m006.id, gender: 'female',
      birthDate: '2026-01-10',
      fatteningStart: '2026-03-01',
      fatteningEnd: addDays('2026-03-01', 150),
      fatteningDays: 150,
      notes: ''
    }
  ];

  Store.saveLambs(lambs);
  console.log('已初始化示例数据');
}

// ---------- 获取时间线事件 ----------
function getTimelineEvents() {
  const ewes = Store.getEwes();
  const lambs = Store.getLambs();
  const events = [];

  ewes.forEach(ewe => {
    const genderLabel = ewe.gender === 'male' ? '公' : '母';
    if (ewe.gender === 'male') return; // 公羊不产生繁殖事件
    // 适孕事件
    if (ewe.breedingDate) {
      events.push({
        type: 'breeding',
        label: '适孕开始',
        cssClass: 'type-breeding',
        date: ewe.breedingDate,
        desc: `${ewe.number}（${ewe.breed || '未知品种'}）进入适孕期`,
        sheepId: ewe.id, sheepNumber: ewe.number
      });
    }
    if (ewe.matingDate) {
      events.push({
        type: 'mating', label: '配种', cssClass: 'type-mating',
        date: ewe.matingDate,
        desc: `${ewe.number}（${ewe.breed || '未知品种'}）完成配种`,
        sheepId: ewe.id, sheepNumber: ewe.number
      });
    }
    if (ewe.dueDate) {
      events.push({
        type: 'due', label: '预产', cssClass: 'type-due',
        date: ewe.dueDate,
        desc: `${ewe.number}（${ewe.breed || '未知品种'}）预产期`,
        sheepId: ewe.id, sheepNumber: ewe.number
      });
    }
  });

  lambs.forEach(lamb => {
    const motherEwe = ewes.find(e => e.id === lamb.motherId);
    const motherNum = motherEwe ? motherEwe.number : '未知母羊';
    const gLabel = lamb.gender === 'male' ? '♂' : '♀';

    if (lamb.birthDate) {
      events.push({
        type: 'birth', label: '羔羊出生', cssClass: 'type-birth',
        date: lamb.birthDate,
        desc: `${lamb.number}（${gLabel}）出生（母羊 ${motherNum}）`,
        sheepId: lamb.id, sheepNumber: lamb.number
      });
    }
    if (lamb.fatteningEnd) {
      events.push({
        type: 'fattening', label: '育肥结束', cssClass: 'type-fattening',
        date: lamb.fatteningEnd,
        desc: `${lamb.number}（${gLabel}）育肥期结束，可出栏（母羊 ${motherNum}）`,
        sheepId: lamb.id, sheepNumber: lamb.number
      });
    }
  });

  // 按日期排序（从近到远）
  events.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return events;
}

// ---------- 获取重点关注列表 ----------
function getAlerts() {
  const ewes = Store.getEwes();
  const lambs = Store.getLambs();
  const alerts = [];
  const today = todayStr();

  ewes.forEach(ewe => {
    if (ewe.gender === 'male') return; // 公羊不触发繁殖警报
    // 已到适孕期但未配种
    if (ewe.breedingDate && !ewe.matingDate) {
      const days = daysFromToday(ewe.breedingDate);
      if (days !== null && days <= 0) {
        alerts.push({
          level: 'warn',
          badge: '待配种',
          text: `${ewe.number}（${ewe.breed || ''}）已到适孕期，超过 ${Math.abs(days)} 天未配种`,
          date: ewe.breedingDate,
          sheepId: ewe.id,
          type: 'ewe'
        });
      }
    }

    // 预产期相关
    if (ewe.dueDate && ewe.matingDate) {
      const lambsOfEwe = lambs.filter(l => l.motherId === ewe.id);
      const hasBorn = lambsOfEwe.length > 0;
      const days = daysFromToday(ewe.dueDate);

      if (!hasBorn && days !== null) {
        if (days < 0) {
          // 已超预产期
          alerts.push({
            level: 'danger',
            badge: '超期！',
            text: `${ewe.number}（${ewe.breed || ''}）预产期已过 ${Math.abs(days)} 天，仍未生产！`,
            date: ewe.dueDate,
            sheepId: ewe.id,
            type: 'ewe'
          });
        } else if (days <= 30) {
          // 30天内预产
          alerts.push({
            level: 'danger',
            badge: '即将生产',
            text: `${ewe.number}（${ewe.breed || ''}）距预产期还有 ${days} 天`,
            date: ewe.dueDate,
            sheepId: ewe.id,
            type: 'ewe'
          });
        }
      }
    }
  });

  lambs.forEach(lamb => {
    if (!lamb.fatteningEnd) return;
    const days = daysFromToday(lamb.fatteningEnd);

    if (days !== null && days <= 15 && days >= 0) {
      // 15天内育肥结束
      const motherEwe = ewes.find(e => e.id === lamb.motherId);
      alerts.push({
        level: 'info',
        badge: '即将出栏',
        text: `${lamb.number} 育肥期 ${days === 0 ? '今天' : days + '天后'} 结束，可准备出栏`,
        date: lamb.fatteningEnd,
        sheepId: lamb.id,
        type: 'lamb'
      });
    } else if (days !== null && days < 0) {
      alerts.push({
        level: 'warn',
        badge: '已到期',
        text: `${lamb.number} 育肥期已结束 ${Math.abs(days)} 天，请及时出栏`,
        date: lamb.fatteningEnd,
        sheepId: lamb.id,
        type: 'lamb'
      });
    }
  });

  // 按紧急程度排序：danger > warn > info
  const order = { danger: 0, warn: 1, info: 2 };
  alerts.sort((a, b) => (order[a.level] || 3) - (order[b.level] || 3));

  return alerts;
}

// ========== UI 渲染 ==========

// ---------- 年度羔羊生产统计 ----------
function getAnnualStats() {
  const lambs = Store.getLambs();
  const stats = {}; // { year: { male: 0, female: 0 } }

  lambs.forEach(lamb => {
    if (!lamb.birthDate) return;
    const year = lamb.birthDate.slice(0, 4);
    if (!stats[year]) stats[year] = { male: 0, female: 0 };
    if (lamb.gender === 'male') stats[year].male++;
    else stats[year].female++;
  });

  // 按年份降序
  return Object.entries(stats)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, data]) => ({ year, ...data, total: data.male + data.female }));
}

// ---------- 渲染仪表盘 ----------
function renderDashboard() {
  const ewes = Store.getEwes();
  const lambs = Store.getLambs();
  const currentLambs = Store.getCurrentLambs();

  // 统计
  const femaleEwes = ewes.filter(e => e.gender !== 'male');
  const ramCount = ewes.filter(e => e.gender === 'male').length;
  const totalEwes = femaleEwes.length;
  const matedEwes = femaleEwes.filter(e => e.matingDate && Store.getEweStatus(e) === 'mated').length;
  const emptyEwes = femaleEwes.filter(e => Store.getEweStatus(e) === 'empty').length;
  const totalLambs = lambs.length;

  document.getElementById('stats-cards').innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${totalEwes}</div>
      <div class="stat-label">母羊数量</div>
    </div>
    <div class="stat-card warn">
      <div class="stat-number">${matedEwes}</div>
      <div class="stat-label">已配种/怀孕中</div>
    </div>
    <div class="stat-card info">
      <div class="stat-number">${emptyEwes}</div>
      <div class="stat-label">待配种</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${ramCount}</div>
      <div class="stat-label">公羊数量</div>
    </div>
  `;

  document.getElementById('stats-cards-2').innerHTML = `
    <div class="stat-card danger">
      <div class="stat-number">${totalLambs}</div>
      <div class="stat-label">总生产羔羊</div>
    </div>
    <div class="stat-card info">
      <div class="stat-number">${currentLambs.length}</div>
      <div class="stat-label">存栏羔羊</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${lambs.filter(l => l.gender === 'male').length}</div>
      <div class="stat-label">公羔总数</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${lambs.filter(l => l.gender === 'female').length}</div>
      <div class="stat-label">母羔总数</div>
    </div>
  `;

  // 年度统计
  const annualStats = getAnnualStats();
  const annualDiv = document.getElementById('annual-stats');
  if (annualStats.length === 0) {
    annualDiv.innerHTML = '<p class="empty-tip">暂无羔羊生产记录</p>';
  } else {
    annualDiv.innerHTML = `
      <table class="annual-table">
        <thead>
          <tr><th>年份</th><th>公羔（只）</th><th>母羔（只）</th><th>合计</th></tr>
        </thead>
        <tbody>
          ${annualStats.map(s => `
            <tr>
              <td class="td-year">${s.year}年</td>
              <td class="td-male">♂ ${s.male}</td>
              <td class="td-female">♀ ${s.female}</td>
              <td><strong>${s.total}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // 重点关注
  const alerts = getAlerts();
  const alertList = document.getElementById('alert-list');
  if (alerts.length === 0) {
    alertList.innerHTML = '<p class="empty-tip">✅ 暂无需要重点关注的项目</p>';
  } else {
    alertList.innerHTML = alerts.map(a => `
      <div class="alert-item ${a.level}">
        <span class="alert-badge ${a.level}">${a.badge}</span>
        <span class="alert-text">${a.text}</span>
        <span class="alert-date">${fmtDate(a.date)}</span>
      </div>
    `).join('');
  }

  // 时间线
  const events = getTimelineEvents();
  const timeline = document.getElementById('timeline');
  if (events.length === 0) {
    timeline.innerHTML = '<p class="empty-tip">暂无事件记录</p>';
  } else {
    timeline.innerHTML = events.map(e => {
      const days = daysFromToday(e.date);
      let daysHtml = '';
      let overdueClass = '';

      if (days !== null) {
        if (e.type === 'due' && days < 0) {
          daysHtml = `<span class="tl-days past">超期 ${Math.abs(days)} 天</span>`;
          overdueClass = 'overdue';
        } else if (days < 0) {
          daysHtml = `<span class="tl-days past">${Math.abs(days)} 天前</span>`;
        } else if (days === 0) {
          daysHtml = '<span class="tl-days soon">今天</span>';
        } else if (days <= 30) {
          daysHtml = `<span class="tl-days soon">${days} 天后</span>`;
        } else {
          daysHtml = `<span class="tl-days future">${days} 天后</span>`;
        }
      }

      return `
        <div class="timeline-item ${e.cssClass} ${overdueClass}">
          <div class="tl-header">
            <span class="tl-type ${e.cssClass}">${e.label}</span>
            <span class="tl-date">${fmtDate(e.date)}</span>
            ${daysHtml}
          </div>
          <div class="tl-desc">${e.desc}</div>
        </div>
      `;
    }).join('');
  }
}

// ---------- 渲染羊只列表 ----------
function renderEweList(filterText) {
  const ewes = Store.getEwes();
  const filtered = filterText
    ? ewes.filter(e => e.number.toLowerCase().includes(filterText.toLowerCase()))
    : ewes;

  const statusMap = {
    empty:   { cls: 'empty',   label: '空怀/待配种' },
    mated:   { cls: 'mated',   label: '已配种' },
    born:    { cls: 'born',    label: '已生产' },
    ram:     { cls: 'empty',   label: '公羊' }
  };

  const list = document.getElementById('ewe-list');
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-tip">暂无符合条件的羊只</p>';
    return;
  }

  list.innerHTML = filtered.map(ewe => {
    const status = Store.getEweStatus(ewe);
    const s = statusMap[status] || statusMap.empty;
    const lambCount = Store.getLambsByEwe(ewe.id).length;
    const genderTag = ewe.gender === 'male'
      ? '<span class="gender-tag male">♂公</span>'
      : '<span class="gender-tag female">♀母</span>';
    let subInfo = [`品种: ${ewe.breed || '--'}`];
    if (ewe.gender !== 'male') {
      if (ewe.matingDate) subInfo.push(`配种: ${fmtDate(ewe.matingDate)}`);
      if (ewe.dueDate) subInfo.push(`预产: ${fmtDate(ewe.dueDate)}`);
    }
    if (lambCount > 0) subInfo.push(`羔羊: ${lambCount}只`);

    const avatar = ewe.gender === 'male' ? '🐃' : '🐏';
    return `
      <div class="sheep-card status-${status}" data-id="${ewe.id}" data-type="ewe">
        <div class="card-avatar ewe">${avatar}</div>
        <div class="card-info">
          <div class="card-title">${ewe.number} ${genderTag}</div>
          <div class="card-sub">${subInfo.join(' | ')}</div>
        </div>
        <span class="card-status ${s.cls}">${s.label}</span>
        <div class="card-actions">
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${ewe.id}" data-type="ewe">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- 渲染羔羊列表 ----------
function renderLambList(filterText) {
  const lambs = Store.getLambs();
  const ewes = Store.getEwes();
  const filtered = filterText
    ? lambs.filter(l => l.number.toLowerCase().includes(filterText.toLowerCase()))
    : lambs;

  const statusMap = {
    nursing:   { cls: 'nursing', label: '哺乳期' },
    fattening: { cls: 'mated',   label: '育肥中' },
    sold:      { cls: 'empty',   label: '已出栏' }
  };

  const list = document.getElementById('lamb-list');
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-tip">暂无符合条件的羔羊</p>';
    return;
  }

  list.innerHTML = filtered.map(lamb => {
    const mother = ewes.find(e => e.id === lamb.motherId);
    const status = Store.getLambStatus(lamb);
    const s = statusMap[status] || statusMap.nursing;
    const genderTag = lamb.gender === 'male'
      ? '<span class="gender-tag male">♂公</span>'
      : '<span class="gender-tag female">♀母</span>';

    let subInfo = [`母羊: ${mother ? mother.number : '--'}`];
    if (lamb.fatteningStart) subInfo.push(`育肥开始: ${fmtDate(lamb.fatteningStart)}`);
    if (lamb.fatteningEnd) subInfo.push(`育肥结束: ${fmtDate(lamb.fatteningEnd)}`);

    return `
      <div class="sheep-card status-${status === 'fattening' ? 'mated' : status === 'nursing' ? 'nursing' : 'empty'}" data-id="${lamb.id}" data-type="lamb">
        <div class="card-avatar lamb">🐑</div>
        <div class="card-info">
          <div class="card-title">${lamb.number} ${genderTag}</div>
          <div class="card-sub">${subInfo.join(' | ')}</div>
        </div>
        <span class="card-status ${s.cls}">${s.label}</span>
        <div class="card-actions">
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${lamb.id}" data-type="lamb">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- 刷新所有视图 ----------
function refreshAll() {
  renderDashboard();
  renderEweList(document.getElementById('ewe-search')?.value || '');
  renderLambList(document.getElementById('lamb-search')?.value || '');
}

// ========== 弹窗管理 ==========

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// ---------- 母羊弹窗 ----------
function toggleBreedingFields() {
  const gender = document.getElementById('ewe-gender').value;
  const breedingDiv = document.getElementById('ewe-breeding-fields');
  const titleEl = document.getElementById('ewe-modal-title');
  const eweId = document.getElementById('ewe-id').value;
  const isEdit = !!eweId;

  if (gender === 'male') {
    breedingDiv.style.display = 'none';
    titleEl.textContent = isEdit ? '编辑公羊' : '添加公羊';
  } else {
    breedingDiv.style.display = '';
    titleEl.textContent = isEdit ? '编辑母羊' : '添加母羊';
  }
}

function openEweModal(ewe) {
  const isEdit = !!ewe;
  const isMale = ewe && ewe.gender === 'male';
  document.getElementById('ewe-modal-title').textContent = isEdit
    ? (isMale ? '编辑公羊' : '编辑母羊')
    : '添加羊只';
  document.getElementById('ewe-id').value = ewe ? ewe.id : '';
  document.getElementById('ewe-number').value = ewe ? ewe.number : '';
  document.getElementById('ewe-breed').value = ewe ? ewe.breed : '';
  document.getElementById('ewe-gender').value = ewe ? (ewe.gender || 'female') : 'female';
  document.getElementById('ewe-birthDate').value = ewe ? ewe.birthDate : '';
  document.getElementById('ewe-breedingDate').value = ewe ? ewe.breedingDate : '';
  document.getElementById('ewe-matingDate').value = ewe ? ewe.matingDate : '';
  document.getElementById('ewe-dueDate').value = ewe ? ewe.dueDate : '';
  document.getElementById('ewe-notes').value = ewe ? (ewe.notes || '') : '';
  toggleBreedingFields();
  openModal('ewe-modal');
}

function saveEwe(e) {
  e.preventDefault();

  const id = document.getElementById('ewe-id').value;
  const gender = document.getElementById('ewe-gender').value;
  const data = {
    number: document.getElementById('ewe-number').value.trim(),
    breed: document.getElementById('ewe-breed').value.trim(),
    gender: gender,
    birthDate: document.getElementById('ewe-birthDate').value,
    breedingDate: gender === 'male' ? '' : document.getElementById('ewe-breedingDate').value,
    matingDate: gender === 'male' ? '' : document.getElementById('ewe-matingDate').value,
    dueDate: gender === 'male' ? '' : document.getElementById('ewe-dueDate').value,
    notes: document.getElementById('ewe-notes').value.trim()
  };

  if (!data.number) {
    alert('请输入羊只编号');
    return;
  }
  if (gender !== 'male' && !data.breedingDate) {
    alert('母羊请选择适孕日期');
    return;
  }

  const ewes = Store.getEwes();

  // 检查编号唯一性
  const dup = ewes.find(e => e.number === data.number && e.id !== id);
  if (dup) {
    alert(`编号 ${data.number} 已存在，请使用其他编号`);
    return;
  }

  if (id) {
    // 编辑
    const idx = ewes.findIndex(e => e.id === id);
    if (idx >= 0) {
      ewes[idx] = { ...ewes[idx], ...data };
    }
  } else {
    // 新增
    ewes.push({ id: genId(), ...data });
  }

  Store.saveEwes(ewes);
  closeModal('ewe-modal');
  refreshAll();
}

// ---------- 羔羊弹窗 ----------
function populateMotherSelect() {
  const select = document.getElementById('lamb-mother');
  const ewes = Store.getEwes().filter(e => e.gender !== 'male');
  select.innerHTML = '<option value="">请选择母羊</option>' +
    ewes.map(e => `<option value="${e.id}">${e.number}（${e.breed || '未知'}）</option>`).join('');
}

function openLambModal(lamb) {
  populateMotherSelect();
  const isEdit = !!lamb;
  document.getElementById('lamb-modal-title').textContent = isEdit ? '编辑羔羊' : '添加羔羊';
  document.getElementById('lamb-id').value = lamb ? lamb.id : '';
  document.getElementById('lamb-number').value = lamb ? lamb.number : '';
  document.getElementById('lamb-gender').value = lamb ? (lamb.gender || 'male') : 'male';
  document.getElementById('lamb-mother').value = lamb ? lamb.motherId : '';
  document.getElementById('lamb-birthDate').value = lamb ? lamb.birthDate : '';
  document.getElementById('lamb-fatteningStart').value = lamb ? lamb.fatteningStart : '';
  document.getElementById('lamb-fatteningDays').value = lamb ? (lamb.fatteningDays || '') : '';
  document.getElementById('lamb-fatteningEnd').value = lamb ? lamb.fatteningEnd : '';
  document.getElementById('lamb-notes').value = lamb ? (lamb.notes || '') : '';
  openModal('lamb-modal');
}

function saveLamb(e) {
  e.preventDefault();

  const id = document.getElementById('lamb-id').value;
  const data = {
    number: document.getElementById('lamb-number').value.trim(),
    gender: document.getElementById('lamb-gender').value,
    motherId: document.getElementById('lamb-mother').value,
    birthDate: document.getElementById('lamb-birthDate').value,
    fatteningStart: document.getElementById('lamb-fatteningStart').value,
    fatteningDays: parseInt(document.getElementById('lamb-fatteningDays').value) || 0,
    fatteningEnd: document.getElementById('lamb-fatteningEnd').value,
    notes: document.getElementById('lamb-notes').value.trim()
  };

  if (!data.number) {
    alert('请输入羔羊编号');
    return;
  }
  if (!data.motherId) {
    alert('请选择关联母羊');
    return;
  }
  if (!data.birthDate) {
    alert('请选择出生日期');
    return;
  }

  // 自动计算育肥结束日期
  if (data.fatteningStart && data.fatteningDays && !data.fatteningEnd) {
    data.fatteningEnd = addDays(data.fatteningStart, data.fatteningDays);
  }

  const lambs = Store.getLambs();

  // 检查编号唯一性
  const dup = lambs.find(l => l.number === data.number && l.id !== id);
  if (dup) {
    alert(`编号 ${data.number} 已存在，请使用其他编号`);
    return;
  }

  if (id) {
    const idx = lambs.findIndex(l => l.id === id);
    if (idx >= 0) {
      lambs[idx] = { ...lambs[idx], ...data };
    }
  } else {
    lambs.push({ id: genId(), ...data });
  }

  Store.saveLambs(lambs);
  closeModal('lamb-modal');
  refreshAll();
}

// ---------- 删除确认 ----------
let pendingDelete = null; // { type: 'ewe'|'lamb', id: string, number: string }

function openDeleteConfirm(type, id, number) {
  pendingDelete = { type, id, number };
  document.getElementById('confirm-message').textContent =
    `确定要删除${type === 'ewe' ? '羊只' : '羔羊'}「${number}」吗？${type === 'ewe' ? '关联的羔羊记录也将一并删除。' : ''}此操作不可撤销。`;
  openModal('confirm-modal');
}

function executeDelete() {
  if (!pendingDelete) return;

  if (pendingDelete.type === 'ewe') {
    const ewes = Store.getEwes().filter(e => e.id !== pendingDelete.id);
    Store.saveEwes(ewes);
    // 同时删除关联羔羊
    const lambs = Store.getLambs().filter(l => l.motherId !== pendingDelete.id);
    Store.saveLambs(lambs);
  } else {
    const lambs = Store.getLambs().filter(l => l.id !== pendingDelete.id);
    Store.saveLambs(lambs);
  }

  pendingDelete = null;
  closeModal('confirm-modal');
  refreshAll();
}

// ========== 事件绑定 ==========

function bindEvents() {
  // 标签切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById(`tab-${tab}`).classList.add('active');
      // 切换时刷新
      refreshAll();
    });
  });

  // 模态框关闭按钮
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => closeModal(el.dataset.close));
  });
  // 点击遮罩关闭
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // 添加母羊
  document.getElementById('btn-add-ewe').addEventListener('click', () => openEweModal(null));
  document.getElementById('ewe-form').addEventListener('submit', saveEwe);

  // 添加羔羊
  document.getElementById('btn-add-lamb').addEventListener('click', () => openLambModal(null));
  document.getElementById('lamb-form').addEventListener('submit', saveLamb);

  // 删除确认
  document.getElementById('btn-confirm-delete').addEventListener('click', executeDelete);

  // 搜索
  document.getElementById('ewe-search').addEventListener('input', (e) => {
    renderEweList(e.target.value);
  });
  document.getElementById('lamb-search').addEventListener('input', (e) => {
    renderLambList(e.target.value);
  });

  // 性别切换时显示/隐藏繁殖字段
  document.getElementById('ewe-gender').addEventListener('change', toggleBreedingFields);

  // 配种日期变化时自动计算预产日期
  document.getElementById('ewe-matingDate').addEventListener('change', function() {
    const matingDate = this.value;
    if (matingDate) {
      const dueDate = addDays(matingDate, PREGNANCY_DAYS);
      document.getElementById('ewe-dueDate').value = dueDate;
    }
  });

  // 羔羊：育肥开始日期+天数自动计算结束日期
  function calcFatteningEnd() {
    const start = document.getElementById('lamb-fatteningStart').value;
    const days = parseInt(document.getElementById('lamb-fatteningDays').value) || 0;
    if (start && days > 0) {
      document.getElementById('lamb-fatteningEnd').value = addDays(start, days);
    }
  }
  document.getElementById('lamb-fatteningStart').addEventListener('change', calcFatteningEnd);
  document.getElementById('lamb-fatteningDays').addEventListener('input', calcFatteningEnd);

  // 卡片点击（编辑）和删除按钮
  document.getElementById('ewe-list').addEventListener('click', function(e) {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const card = e.target.closest('.sheep-card');

    if (deleteBtn) {
      e.stopPropagation();
      const ewes = Store.getEwes();
      const ewe = ewes.find(ew => ew.id === deleteBtn.dataset.id);
      if (ewe) openDeleteConfirm('ewe', ewe.id, ewe.number);
      return;
    }

    if (card && card.dataset.type === 'ewe') {
      const ewes = Store.getEwes();
      const ewe = ewes.find(ew => ew.id === card.dataset.id);
      if (ewe) openEweModal(ewe);
    }
  });

  document.getElementById('lamb-list').addEventListener('click', function(e) {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const card = e.target.closest('.sheep-card');

    if (deleteBtn) {
      e.stopPropagation();
      const lambs = Store.getLambs();
      const lamb = lambs.find(l => l.id === deleteBtn.dataset.id);
      if (lamb) openDeleteConfirm('lamb', lamb.id, lamb.number);
      return;
    }

    if (card && card.dataset.type === 'lamb') {
      const lambs = Store.getLambs();
      const lamb = lambs.find(l => l.id === card.dataset.id);
      if (lamb) openLambModal(lamb);
    }
  });
}

// ========== 启动 ==========
function init() {
  initSampleData();
  bindEvents();
  refreshAll();
  console.log('羊舍管理系统已就绪');
}

document.addEventListener('DOMContentLoaded', init);
