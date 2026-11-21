(() => {
  const QUICK_SUGGESTIONS = {
    expense: ['อาหารกลางวัน', 'กาแฟเย็น', 'ข้าวมันไก่', 'ค่ารถไฟฟ้า/เดินทาง', 'ของใช้เข้าบ้าน', 'ค่าน้ำมัน'],
    income: ['รับงานฟรีแลนซ์', 'เงินเดือนเข้า', 'ขายของออนไลน์', 'เงินปันผล', 'รับเงินคืนจากเพื่อน'],
    scheduled: ['ค่าเช่าคอนโด/หอพัก', 'ชำระบิลบัตรเครดิต', 'ค่าไฟ-ค่าน้ำ', 'ค่าอินเทอร์เน็ตรายเดือน', 'ค่าผ่อนสินค้า']
  };

  const STORAGE_KEY = 'krapaoflow_local_store_v4_clean';
  const PEER_ID_KEY = 'krapaoflow_peer_id';
  const PERMANENT_BONJOUR_URL = window.__PERMANENT_BONJOUR_URL__ || 'http://sakulpongs-macbook-air.local:3456';

  // Clear legacy seed & stale hardcoded IP keys so app never gets stuck on an old Wi-Fi IP
  try {
    localStorage.removeItem('krapaoflow_local_store_v1');
    localStorage.removeItem('krapaoflow_local_store_v2');
    localStorage.removeItem('krapaoflow_local_store_v3');
    localStorage.removeItem('krapaoflow_wifi_hub_url');
  } catch (e) {}

  function detectDeviceProfile() {
    const ua = navigator.userAgent || '';
    const isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIphone = /iPhone/i.test(ua);
    if (isIPad) return { name: 'iPad', type: 'ipad' };
    if (isIphone) return { name: 'iPhone', type: 'ipad' };
    return { name: 'MacBook', type: 'macbook' };
  }

  const deviceProfile = detectDeviceProfile();
  let peerId = localStorage.getItem(PEER_ID_KEY);
  if (!peerId) {
    peerId = 'peer-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(PEER_ID_KEY, peerId);
  }

  function getDefaultHubBaseUrl() {
    if (window.location.protocol.startsWith('http')) return window.location.origin;
    return PERMANENT_BONJOUR_URL;
  }

  function getTodayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDaysToDateStr(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  function addMonthsToDateStr(dateStr, months) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1 + months, d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  function formatCurrency(num, showPlus = false) {
    const val = Number(num || 0);
    const absFormatted = val.toLocaleString('th-TH', {
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    if (showPlus && val > 0) return `+฿${absFormatted}`;
    return `฿${absFormatted}`;
  }

  function formatThaiDate(dateStr, includeWeekday = true) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const todayStr = getTodayStr(0);
    const yesterdayStr = getTodayStr(-1);
    const tomorrowStr = getTodayStr(1);

    const monthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    const base = `${d} ${monthsShort[m - 1]} ${y}`;
    const wd = weekdays[dateObj.getDay()];

    if (dateStr === todayStr) return `วันนี้ (${d} ${monthsShort[m - 1]})`;
    if (dateStr === yesterdayStr) return `เมื่อวาน (${d} ${monthsShort[m - 1]})`;
    if (dateStr === tomorrowStr) return `พรุ่งนี้ (${d} ${monthsShort[m - 1]})`;
    return includeWeekday ? `${wd} ${base}` : base;
  }

  function formatShortDayMonth(dateStr) {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-').map(Number);
    const monthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d} ${monthsShort[m - 1]}`;
  }

  function formatThaiMonth(yyyyMm) {
    if (!yyyyMm) return '-';
    const [y, m] = yyyyMm.split('-').map(Number);
    const monthsFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${monthsFull[m - 1]} ${y}`;
  }

  function formatShortThaiMonth(yyyyMm) {
    if (!yyyyMm) return '-';
    const [y, m] = yyyyMm.split('-').map(Number);
    const monthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${monthsShort[m - 1]} ${String(y).slice(2)}`;
  }

  function diffDaysFromToday(targetDateStr) {
    if (!targetDateStr) return 0;
    const [ty, tm, td] = targetDateStr.split('-').map(Number);
    const [cy, cm, cd] = getTodayStr(0).split('-').map(Number);
    const tDate = new Date(ty, tm - 1, td);
    const cDate = new Date(cy, cm - 1, cd);
    return Math.round((tDate - cDate) / 86400000);
  }

  function createInitialCategories() {
    const now = Date.now();
    return [
      { id: 'exp_food', type: 'expense', name: 'อาหาร & เครื่องดื่ม', icon: '🍜', color: '#E11D48', updatedAt: now, deleted: false },
      { id: 'exp_coffee', type: 'expense', name: 'กาแฟ & ของว่าง', icon: '☕', color: '#D97706', updatedAt: now, deleted: false },
      { id: 'exp_transport', type: 'expense', name: 'เดินทาง & น้ำมัน', icon: '🚗', color: '#0284C7', updatedAt: now, deleted: false },
      { id: 'exp_housing', type: 'expense', name: 'ที่อยู่อาศัย & น้ำ-ไฟ', icon: '🏠', color: '#4F46E5', updatedAt: now, deleted: false },
      { id: 'exp_shopping', type: 'expense', name: 'ของใช้ & ช้อปปิ้ง', icon: '🛍️', color: '#DB2777', updatedAt: now, deleted: false },
      { id: 'exp_bills', type: 'expense', name: 'บิล & ผ่อนชำระ', icon: '💳', color: '#7C3AED', updatedAt: now, deleted: false },

      { id: 'inc_salary', type: 'income', name: 'เงินเดือนประจำ', icon: '💼', color: '#059669', updatedAt: now, deleted: false },
      { id: 'inc_freelance', type: 'income', name: 'ฟรีแลนซ์ & งานเสริม', icon: '💻', color: '#0D9488', updatedAt: now, deleted: false },
      { id: 'inc_business', type: 'income', name: 'ค้าขาย & อื่นๆ', icon: '🏪', color: '#16A34A', updatedAt: now, deleted: false }
    ];
  }

  // --- App State (Clean 0-Value Default) ---
  let state = {
    activeView: 'record',
    selectedDate: getTodayStr(0),
    selectedMonth: getTodayStr(0).slice(0, 7),
    periodView: 'daily',
    typeFilter: 'all',
    categoryFilter: 'all',
    searchQuery: '',

    chartDays: 7,
    donutType: 'expense',

    entryMode: 'expense',
    selectedCategory: 'exp_food',
    manageCategoriesMode: false,
    pendingSlipDataUrl: null,
    showNumpad: true,
    calendarModalContext: 'main',
    calendarModalMonth: getTodayStr(0).slice(0, 7),

    syncHubUrl: getDefaultHubBaseUrl(),
    wifiConnected: false,
    lastSyncedAt: null,
    networkInfo: {
      primaryIp: '192.168.1.35',
      primarySubnet: '192.168.1.0/24',
      lanUrl: getDefaultHubBaseUrl(),
      mdnsUrl: 'MacBook.local',
      launchAgentActive: true,
      syncRoomCode: 'KP-8899',
      connectedPeers: []
    },

    store: {
      version: 4,
      resetEpoch: 0,
      lastUpdated: Date.now(),
      settings: {
        targetDate: getTodayStr(7),
        targetMode: 'net_shortfall',
        syncRoomCode: 'KP-8899',
        updatedAt: Date.now()
      },
      categories: createInitialCategories(),
      transactions: [],
      scheduledExpenses: [
        {
          id: "sch-user-2026-11-23-internet",
          title: "ค่าเน็ต",
          amount: 200,
          category: "exp_bills",
          dueDate: "2026-11-23",
          recurrence: "monthly",
          installmentCurrent: 0,
          installmentTotal: 0,
          note: "",
          isPaid: false,
          updatedAt: 1794939500000,
          device: "MacBook",
          deleted: false
        },
        {
          id: "sch-user-2026-12-01-google-ai",
          title: "Google AI pro",
          amount: 279,
          category: "exp_bills",
          dueDate: "2026-12-01",
          recurrence: "monthly",
          installmentCurrent: 0,
          installmentTotal: 0,
          note: "",
          isPaid: false,
          updatedAt: 1794939500000,
          device: "MacBook",
          deleted: false
        },
        {
          id: "sch-user-2026-12-04-car-payment",
          title: "งวดรถ",
          amount: 4018,
          category: "exp_bills",
          dueDate: "2026-12-04",
          recurrence: "monthly",
          installmentCurrent: 0,
          installmentTotal: 0,
          note: "",
          isPaid: false,
          updatedAt: 1794939500000,
          device: "MacBook",
          deleted: false
        },
        {
          id: "sch-user-2026-12-12-insurance-2",
          title: "ค่าประกันงวด 2",
          amount: 1100,
          category: "exp_bills",
          dueDate: "2026-12-12",
          recurrence: "installment",
          installmentCurrent: 2,
          installmentTotal: 3,
          note: "",
          isPaid: false,
          updatedAt: 1794939500000,
          device: "MacBook",
          deleted: false
        },
        {
          id: "sch-user-2026-12-25-payback-gib",
          title: "คืนตางกิ๊บ 1000",
          amount: 1000,
          category: "exp_bills",
          dueDate: "2026-12-25",
          recurrence: "none",
          installmentCurrent: 0,
          installmentTotal: 0,
          note: "",
          isPaid: false,
          updatedAt: 1794939500000,
          device: "MacBook",
          deleted: false
        }
      ]
    }
  };

  const USER_SCHEDULED_EXPENSES = [
    {
      id: "sch-user-2026-11-23-internet",
      title: "ค่าเน็ต",
      amount: 200,
      category: "exp_bills",
      dueDate: "2026-11-23",
      recurrence: "monthly",
      installmentCurrent: 0,
      installmentTotal: 0,
      note: "",
      isPaid: false,
      updatedAt: 1794939500000,
      device: "MacBook",
      deleted: false
    },
    {
      id: "sch-user-2026-12-01-google-ai",
      title: "Google AI pro",
      amount: 279,
      category: "exp_bills",
      dueDate: "2026-12-01",
      recurrence: "monthly",
      installmentCurrent: 0,
      installmentTotal: 0,
      note: "",
      isPaid: false,
      updatedAt: 1794939500000,
      device: "MacBook",
      deleted: false
    },
    {
      id: "sch-user-2026-12-04-car-payment",
      title: "งวดรถ",
      amount: 4018,
      category: "exp_bills",
      dueDate: "2026-12-04",
      recurrence: "monthly",
      installmentCurrent: 0,
      installmentTotal: 0,
      note: "",
      isPaid: false,
      updatedAt: 1794939500000,
      device: "MacBook",
      deleted: false
    },
    {
      id: "sch-user-2026-12-12-insurance-2",
      title: "ค่าประกันงวด 2",
      amount: 1100,
      category: "exp_bills",
      dueDate: "2026-12-12",
      recurrence: "installment",
      installmentCurrent: 2,
      installmentTotal: 3,
      note: "",
      isPaid: false,
      updatedAt: 1794939500000,
      device: "MacBook",
      deleted: false
    },
    {
      id: "sch-user-2026-12-25-payback-gib",
      title: "คืนตางกิ๊บ 1000",
      amount: 1000,
      category: "exp_bills",
      dueDate: "2026-12-25",
      recurrence: "none",
      installmentCurrent: 0,
      installmentTotal: 0,
      note: "",
      isPaid: false,
      updatedAt: 1794939500000,
      device: "MacBook",
      deleted: false
    }
  ];

  const localChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('krapaoflow_local_channel_v4')
    : null;

  if (localChannel) {
    localChannel.onmessage = ev => {
      if (ev.data && ev.data.type === 'LOCAL_STORE_UPDATED' && ev.data.store) {
        state.store = ev.data.store;
        renderAll();
      }
    };
  }

  function loadLocalStore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version >= 4 && Array.isArray(parsed.transactions)) {
          state.store = parsed;
          if (!Array.isArray(state.store.categories) || state.store.categories.length === 0) {
            state.store.categories = createInitialCategories();
          }
        }
      }

      if (!Array.isArray(state.store.scheduledExpenses)) {
        state.store.scheduledExpenses = [];
      }
      const oldTestIds = new Set(['sch-1794935293091-fofp', 'sch-1794936258057-8omf', 'sch-1794936329941-1kds', 'sch-1794936470842-h0ut', 'sch-1794936518075-etag']);
      state.store.scheduledExpenses = state.store.scheduledExpenses.filter(s => !oldTestIds.has(s.id));

      for (const item of USER_SCHEDULED_EXPENSES) {
        const idx = state.store.scheduledExpenses.findIndex(s => s.id === item.id);
        if (idx >= 0) {
          state.store.scheduledExpenses[idx] = { ...state.store.scheduledExpenses[idx], ...item };
        } else {
          state.store.scheduledExpenses.push(item);
        }
      }
      saveLocalStore();
    } catch (e) {
      console.warn('Could not load local store:', e);
    }
  }

  function saveLocalStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
      if (localChannel) {
        localChannel.postMessage({ type: 'LOCAL_STORE_UPDATED', store: state.store });
      }
    } catch (e) {
      console.warn('Could not save local store:', e);
    }
  }

  function activeCategories() {
    return (state.store.categories || []).filter(c => !c.deleted);
  }

  function getCategoryById(catId) {
    const found = (state.store.categories || []).find(c => c.id === catId);
    if (found) return found;
    return {
      id: catId || 'other',
      name: 'หมวดหมู่ทั่วไป',
      icon: '🏷️',
      color: '#64748B',
      type: 'expense'
    };
  }

  function mergeIncomingStore(serverStore, forceReplace = false) {
    if (!serverStore) return;

    if (forceReplace || (serverStore.resetEpoch && Number(serverStore.resetEpoch) > Number(state.store.resetEpoch || 0) && serverStore.transactions.length === 0)) {
      state.store = JSON.parse(JSON.stringify(serverStore));
      saveLocalStore();
      return;
    }

    const mergeList = (listA = [], listB = []) => {
      const map = new Map();
      for (const item of listA) {
        if (item && item.id) map.set(item.id, item);
      }
      for (const item of listB) {
        if (!item || !item.id) continue;
        const existing = map.get(item.id);
        if (!existing || Number(item.updatedAt || 0) >= Number(existing.updatedAt || 0)) {
          map.set(item.id, item);
        }
      }
      return Array.from(map.values());
    };

    state.store.transactions = mergeList(state.store.transactions, serverStore.transactions);
    state.store.scheduledExpenses = mergeList(state.store.scheduledExpenses, serverStore.scheduledExpenses);
    if (Array.isArray(serverStore.categories)) {
      state.store.categories = mergeList(state.store.categories, serverStore.categories);
    }

    if (serverStore.settings) {
      const localS = Number((state.store.settings && state.store.settings.updatedAt) || 0);
      const remoteS = Number(serverStore.settings.updatedAt || 0);
      if (remoteS >= localS) {
        state.store.settings = { ...state.store.settings, ...serverStore.settings };
      }
    }

    if (serverStore.resetEpoch) {
      state.store.resetEpoch = Math.max(Number(state.store.resetEpoch || 0), Number(serverStore.resetEpoch || 0));
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
    } catch (e) {}
  }

  function showToast(msg, icon = '✅') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // --- Zero-IP Auto-Discovery & Serverless Same-Wi-Fi P2P Memory Sync Engine ---
  let syncInProgress = false;
  let eventSource = null;
  let p2pWifiEventSource = null;
  let currentWifiGatewayIp = null;
  let currentP2pTopic = null;
  const p2pPeersMap = new Map();
  let activeEndpointBase = window.location.protocol.startsWith('http') ? '' : PERMANENT_BONJOUR_URL;

  // Detect the current Wi-Fi router's Public Gateway IP so devices on the SAME Wi-Fi automatically get the exact same signature
  async function detectWifiGatewayIp() {
    try {
      const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
      const text = await res.text();
      const match = text.match(/^ip=(.+)$/m);
      if (match && match[1]) return match[1].trim();
    } catch (e) {}
    return null;
  }

  function getSameWifiP2pTopic(wifiIp) {
    if (!wifiIp) return null;
    const roomCode = (state.store.settings && state.store.settings.syncRoomCode) || 'KP-8899';
    const cleanRoom = roomCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanIp = wifiIp.replace(/[^a-zA-Z0-9]/g, '_');
    return `krapaoflow_wifi_v4_${cleanRoom}_${cleanIp}`;
  }

  async function pushToSameWifiP2pChannel(msgType = 'WIFI_P2P_SYNC') {
    const wifiIp = currentWifiGatewayIp || (await detectWifiGatewayIp());
    if (!wifiIp) return false;
    currentWifiGatewayIp = wifiIp;
    const topic = getSameWifiP2pTopic(wifiIp);
    if (!topic) return false;

    const compactStore = {
      version: state.store.version,
      resetEpoch: state.store.resetEpoch,
      lastUpdated: Date.now(),
      settings: state.store.settings,
      categories: state.store.categories,
      scheduledExpenses: state.store.scheduledExpenses,
      transactions: (state.store.transactions || []).map(t => ({
        ...t,
        slipDataUrl: t.slipDataUrl && t.slipDataUrl.length < 2500 ? t.slipDataUrl : null
      }))
    };

    try {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: JSON.stringify({
          type: msgType,
          originPeerId: peerId,
          deviceName: deviceProfile.name,
          deviceType: deviceProfile.type,
          wifiIp,
          roomCode: (state.store.settings && state.store.settings.syncRoomCode) || 'KP-8899',
          timestamp: Date.now(),
          store: compactStore
        })
      });
      state.wifiConnected = true;
      state.lastSyncedAt = Date.now();
      return true;
    } catch (e) {
      return false;
    }
  }

  async function initSameWifiP2pChannel() {
    const wifiIp = await detectWifiGatewayIp();
    if (!wifiIp) return;
    currentWifiGatewayIp = wifiIp;
    const topic = getSameWifiP2pTopic(wifiIp);
    if (!topic) return;

    p2pPeersMap.set(peerId, {
      peerId,
      deviceName: deviceProfile.name,
      deviceType: deviceProfile.type,
      ip: `Wi-Fi Gateway ${wifiIp}`,
      roomCode: (state.store.settings && state.store.settings.syncRoomCode) || 'KP-8899'
    });

    // 1. Pull latest cached messages on this Wi-Fi channel (even if the other device synced earlier & was turned off!)
    try {
      const pollRes = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=12h`);
      if (pollRes.ok) {
        const text = await pollRes.text();
        const lines = text.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const outer = JSON.parse(line);
            if (outer && outer.event === 'message' && outer.message) {
              const payload = JSON.parse(outer.message);
              if (payload && payload.store) {
                mergeIncomingStore(payload.store, payload.type === 'HARD_RESET');
                if (payload.originPeerId) {
                  p2pPeersMap.set(payload.originPeerId, {
                    peerId: payload.originPeerId,
                    deviceName: payload.deviceName || 'อุปกรณ์ในวง Wi-Fi เดียวกัน',
                    deviceType: payload.deviceType || 'ipad',
                    ip: `Wi-Fi เดียวกัน (${wifiIp})`,
                    roomCode: payload.roomCode
                  });
                }
              }
            }
          } catch (e) {}
        }
        state.wifiConnected = true;
        state.lastSyncedAt = Date.now();
        renderAll();
      }
    } catch (e) {}

    // 2. Subscribe to real-time Same-Wi-Fi P2P SSE stream
    if (p2pWifiEventSource && currentP2pTopic === topic) return;
    if (p2pWifiEventSource) {
      try { p2pWifiEventSource.close(); } catch (e) {}
    }
    currentP2pTopic = topic;

    try {
      p2pWifiEventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);
      p2pWifiEventSource.onmessage = event => {
        try {
          const outer = JSON.parse(event.data);
          if (!outer || !outer.message) return;
          const payload = JSON.parse(outer.message);
          if (!payload || payload.originPeerId === peerId) return;

          p2pPeersMap.set(payload.originPeerId, {
            peerId: payload.originPeerId,
            deviceName: payload.deviceName || 'อุปกรณ์ในวง Wi-Fi เดียวกัน',
            deviceType: payload.deviceType || 'ipad',
            ip: `Wi-Fi เดียวกัน (${wifiIp})`,
            roomCode: payload.roomCode
          });

          if (payload.store) {
            const prevCount = activeTransactions().length;
            mergeIncomingStore(payload.store, payload.type === 'HARD_RESET');
            const newCount = activeTransactions().length;
            state.wifiConnected = true;
            state.lastSyncedAt = Date.now();
            renderAll();
            if (newCount > prevCount) {
              showToast(`ซิงค์ข้อมูลจากหน่วยความจำของ ${payload.deviceName} (Wi-Fi เดียวกัน) แล้ว!`, '📲');
            }
          }
          if (payload.type === 'WIFI_PEER_HELLO') {
            pushToSameWifiP2pChannel('WIFI_P2P_SYNC');
          }
        } catch (e) {}
      };
      // Announce presence & current memory to peers on the same Wi-Fi
      pushToSameWifiP2pChannel('WIFI_PEER_HELLO');
    } catch (e) {}
  }

  const isHttpsCloud = window.location.protocol === 'https:';
  const CLOUD_APP_URL = 'https://potae13.github.io/krapaoflow/';

  async function probeEndpoint(baseUrl) {
    if (isHttpsCloud && baseUrl.startsWith('http:')) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);
    try {
      const res = await fetch(`${baseUrl}/api/ping`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.app === 'krapaoflow') return baseUrl;
      }
    } catch (e) {
      clearTimeout(timer);
    }
    return null;
  }

  async function autoDiscoverWifiHub() {
    if (isHttpsCloud) return null;
    const candidates = [];
    if (window.location.protocol.startsWith('http:')) {
      candidates.push('');
    }
    candidates.push(PERMANENT_BONJOUR_URL);
    candidates.push('http://localhost:3456');
    const cachedIpUrl = localStorage.getItem('krapaoflow_dynamic_ip_url');
    if (cachedIpUrl && !candidates.includes(cachedIpUrl)) {
      candidates.push(cachedIpUrl);
    }
    if (window.__LAST_KNOWN_IP_URL__ && !candidates.includes(window.__LAST_KNOWN_IP_URL__)) {
      candidates.push(window.__LAST_KNOWN_IP_URL__);
    }

    for (const cand of candidates) {
      const found = await probeEndpoint(cand);
      if (found !== null) {
        activeEndpointBase = found;
        return found;
      }
    }
    return null;
  }

  function getApiBase() {
    return activeEndpointBase;
  }

  async function syncWithWifiServer(showFeedback = false, pushP2p = true) {
    if (pushP2p) {
      const okP2p = await pushToSameWifiP2pChannel('WIFI_P2P_SYNC').catch(() => false);
      if (okP2p && showFeedback) {
        renderAll();
        showToast('ซิงค์หน่วยความจำผ่านวง Wi-Fi เดียวกันเรียบร้อยแล้ว!', '🟢');
      }
    }
    if (isHttpsCloud) {
      renderSyncStatusUI();
      return;
    }
    if (syncInProgress) return;
    syncInProgress = true;

    try {
      let base = getApiBase();
      const roomCode = (state.store.settings && state.store.settings.syncRoomCode) || 'KP-8899';

      let response;
      try {
        response = await fetch(`${base}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peerId,
            deviceName: deviceProfile.name,
            deviceType: deviceProfile.type,
            roomCode,
            transactions: state.store.transactions,
            scheduledExpenses: state.store.scheduledExpenses,
            categories: state.store.categories,
            settings: state.store.settings
          })
        });
      } catch (initialErr) {
        const discovered = await autoDiscoverWifiHub();
        if (discovered === null) throw initialErr;
        base = discovered;
        connectRealtimeStream();
        response = await fetch(`${base}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peerId,
            deviceName: deviceProfile.name,
            deviceType: deviceProfile.type,
            roomCode,
            transactions: state.store.transactions,
            scheduledExpenses: state.store.scheduledExpenses,
            categories: state.store.categories,
            settings: state.store.settings
          })
        });
      }

      if (!response.ok) throw new Error('Wi-Fi Hub unreachable');
      const data = await response.json();

      if (data.ok) {
        const wasDisconnected = !state.wifiConnected;
        state.wifiConnected = true;
        state.lastSyncedAt = Date.now();
        if (data.network) {
          state.networkInfo = data.network;
          if (data.network.permanentUrl) {
            state.syncHubUrl = data.network.permanentUrl;
          }
          if (data.network.currentIpUrl) {
            try { localStorage.setItem('krapaoflow_dynamic_ip_url', data.network.currentIpUrl); } catch (e) {}
          }
        }
        if (data.store) mergeIncomingStore(data.store);
        renderAll();
        if (showFeedback || wasDisconnected) {
          showToast('เชื่อมต่อ Wi-Fi เดียวกัน • ซิงค์ข้อมูลล่าสุดอัตโนมัติแล้ว!', '🟢');
        }
      }
    } catch (err) {
      // Even if Mac server is turned OFF, Same-Wi-Fi P2P Engine + LocalStorage keeps working!
      if (currentWifiGatewayIp) {
        state.wifiConnected = true;
      }
      renderSyncStatusUI();
    } finally {
      syncInProgress = false;
    }
  }

  function connectRealtimeStream() {
    if (isHttpsCloud) return;
    if (eventSource) {
      try { eventSource.close(); } catch (e) {}
    }

    const base = getApiBase();
    const roomCode = (state.store.settings && state.store.settings.syncRoomCode) || 'KP-8899';
    const params = new URLSearchParams({
      peerId,
      deviceName: deviceProfile.name,
      deviceType: deviceProfile.type,
      roomCode
    });

    try {
      eventSource = new EventSource(`${base}/api/events?${params.toString()}`);

      eventSource.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'HARD_RESET' && payload.store) {
            mergeIncomingStore(payload.store, true);
            renderAll();
            showToast('รีเซ็ตข้อมูลทั้งหมดเป็น 0 เรียบร้อยแล้ว', '🔄');
            return;
          }
          if (payload.type === 'SYNC_STATE') {
            state.wifiConnected = true;
            state.lastSyncedAt = payload.timestamp || Date.now();
            if (payload.network) state.networkInfo = payload.network;
            if (payload.store) {
              const prevCount = activeTransactions().length;
              mergeIncomingStore(payload.store);
              const newCount = activeTransactions().length;
              if (payload.originPeerId && payload.originPeerId !== peerId && payload.originPeerId !== 'server' && newCount > prevCount) {
                showToast('ซิงค์รายการใหม่จากอีกเครื่องในวง Wi-Fi เดียวกันอัตโนมัติ!', '📲');
              }
            }
            renderAll();
          }
        } catch (e) {}
      };

      eventSource.onerror = () => {
        state.wifiConnected = false;
        renderSyncStatusUI();
      };
    } catch (e) {}
  }

  function activeTransactions() {
    return (state.store.transactions || []).filter(t => !t.deleted);
  }

  function activeScheduledExpenses() {
    return (state.store.scheduledExpenses || []).filter(s => !s.deleted);
  }

  function switchView(viewName) {
    state.activeView = viewName;
    document.querySelectorAll('[data-nav-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.navView === viewName);
    });
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });
    renderAll();
  }

  function renderNavBadgesAndDate() {
    const txs = activeTransactions();
    const unpaidSch = activeScheduledExpenses().filter(s => !s.isPaid);
    document.getElementById('navTxCountBadge').textContent = txs.length;
    document.getElementById('navUpcomingCountBadge').textContent = unpaidSch.length;

    const todayStr = getTodayStr(0);
    const isToday = state.selectedDate === todayStr;

    const datePicker = document.getElementById('mainDatePicker');
    if (datePicker && datePicker.value !== state.selectedDate) {
      datePicker.value = state.selectedDate;
    }

    document.getElementById('selectedDateThaiLabel').textContent = formatThaiDate(state.selectedDate, true);

    const btnToday = document.getElementById('btnGoToday');
    const btnTodayLabel = document.getElementById('btnTodayLabel');
    if (isToday) {
      btnToday.className = 'btn-today is-today';
      btnTodayLabel.textContent = 'วันนี้';
    } else {
      btnToday.className = 'btn-today not-today';
      btnTodayLabel.textContent = '⏎ กลับไปวันนี้';
    }

    const monthInput = document.getElementById('monthPickerInput');
    if (monthInput && monthInput.value !== state.selectedMonth) {
      monthInput.value = state.selectedMonth;
    }
    const dashMonthInput = document.getElementById('dashMonthPicker');
    if (dashMonthInput && dashMonthInput.value !== state.selectedMonth) {
      dashMonthInput.value = state.selectedMonth;
    }
    const dashMonthLabel = document.getElementById('dashMonthLabel');
    if (dashMonthLabel) dashMonthLabel.textContent = formatThaiMonth(state.selectedMonth);
    const txMonthLabel = document.getElementById('txMonthLabel');
    if (txMonthLabel) txMonthLabel.textContent = formatThaiMonth(state.selectedMonth);
  }

  // --- VIEW 1: QUICK RECORD + EDITABLE CATEGORIES ---
  function renderQuickRecordView() {
    document.getElementById('tabExpense').className = 'type-tab' + (state.entryMode === 'expense' ? ' active-expense' : '');
    document.getElementById('tabIncome').className = 'type-tab' + (state.entryMode === 'income' ? ' active-income' : '');
    document.getElementById('tabScheduled').className = 'type-tab' + (state.entryMode === 'scheduled' ? ' active-scheduled' : '');

    const entryDateVal = document.getElementById('entryDateInput').value || state.selectedDate;
    const entryDateDisplay = document.getElementById('entryDateDisplayText');
    if (entryDateDisplay) {
      entryDateDisplay.textContent = `📅 ${formatThaiDate(entryDateVal, true)}`;
    }

    const dateLabel = document.getElementById('entryDateLabel');
    const btnNext7 = document.getElementById('btnEntryNext7Days');
    const recurGroup = document.getElementById('entryRecurrenceGroup');
    const submitBtn = document.getElementById('btnSubmitEntry');
    const submitLabel = document.getElementById('btnSubmitEntryLabel');
    const submitBtnTop = document.getElementById('btnSubmitEntryTop');
    const submitLabelTop = document.getElementById('btnSubmitEntryTopLabel');

    if (state.entryMode === 'scheduled') {
      dateLabel.textContent = 'กำหนดชำระภายในวันที่ (Due Date)';
      btnNext7.style.display = 'inline-block';
      recurGroup.style.display = 'block';
      submitBtn.className = 'btn-submit scheduled';
      submitLabel.textContent = '⏰ บันทึกรายจ่ายล่วงหน้า';
      if (submitBtnTop) submitBtnTop.className = 'btn-submit scheduled';
      if (submitLabelTop) submitLabelTop.textContent = '⏰ บันทึกรายจ่ายล่วงหน้าทันที';
    } else if (state.entryMode === 'income') {
      dateLabel.textContent = 'วันที่รับเงิน';
      btnNext7.style.display = 'none';
      recurGroup.style.display = 'none';
      submitBtn.className = 'btn-submit income';
      submitLabel.textContent = '📈 บันทึกรายรับทันที';
      if (submitBtnTop) submitBtnTop.className = 'btn-submit income';
      if (submitLabelTop) submitLabelTop.textContent = '📈 บันทึกรายรับทันที (ไม่ต้องกรอกชื่อก็ได้)';
    } else {
      dateLabel.textContent = 'วันที่จ่ายเงิน';
      btnNext7.style.display = 'none';
      recurGroup.style.display = 'none';
      submitBtn.className = 'btn-submit expense';
      submitLabel.textContent = '📉 บันทึกรายจ่ายทันที';
      if (submitBtnTop) submitBtnTop.className = 'btn-submit expense';
      if (submitLabelTop) submitLabelTop.textContent = '📉 บันทึกรายจ่ายทันที (ไม่ต้องกรอกชื่อก็ได้)';
    }

    const catType = state.entryMode === 'income' ? 'income' : 'expense';
    const categories = activeCategories().filter(c => c.type === catType);

    if (!categories.some(c => c.id === state.selectedCategory) && categories.length > 0) {
      state.selectedCategory = categories[0].id;
    }

    const manageHint = document.getElementById('manageCatHintBanner');
    const btnManage = document.getElementById('btnToggleManageCategories');
    if (manageHint) manageHint.style.display = state.manageCategoriesMode ? 'block' : 'none';
    if (btnManage) {
      btnManage.textContent = state.manageCategoriesMode ? '✓ เสร็จสิ้นการจัดการประเภท' : '⚙️ แก้ไข / ลบประเภทที่ไม่ได้ใช้';
    }

    const grid = document.getElementById('categoryPickerGrid');
    if (categories.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:span 3;text-align:center;padding:16px;background:var(--bg-subtle);border-radius:12px;border:1px dashed var(--border-color);font-size:0.84rem;">
          ยังไม่มีหมวดหมู่ กดปุ่ม <strong>"+ เพิ่มประเภทใหม่"</strong> ด้านบนได้เลยครับ
        </div>
      `;
    } else {
      grid.innerHTML = categories.map(cat => {
        const isSel = cat.id === state.selectedCategory ? 'selected' : '';
        const editOverlay = state.manageCategoriesMode
          ? `
            <div class="cat-edit-actions">
              <button type="button" class="cat-action-mini edit" data-edit-cat="${cat.id}" title="แก้ไขหมวดหมู่นี้">✏️</button>
              <button type="button" class="cat-action-mini del" data-del-cat="${cat.id}" title="ลบหมวดหมู่นี้">✕</button>
            </div>
          `
          : '';

        return `
          <div class="cat-chip-wrap">
            ${editOverlay}
            <button type="button" class="cat-chip ${isSel}" data-cat-id="${cat.id}">
              <div class="cat-chip-top">
                <span class="cat-chip-icon">${cat.icon}</span>
                <span class="cat-chip-name">${escapeHtml(cat.name)}</span>
              </div>
            </button>
          </div>
        `;
      }).join('');
    }

    const suggestions = QUICK_SUGGESTIONS[state.entryMode] || [];
    document.getElementById('quickTitleSuggestions').innerHTML = suggestions.map(text =>
      `<button type="button" class="quick-tag" data-sug="${text}">+${text}</button>`
    ).join('');

    document.getElementById('ipadNumpad').style.display = state.showNumpad ? 'grid' : 'none';

    const dayTxs = activeTransactions()
      .filter(t => t.date === state.selectedDate)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    const dayInc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const dayExp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

    document.getElementById('quickRecordSideTitle').textContent = `รายการของ ${formatThaiDate(state.selectedDate, false)}`;
    document.getElementById('quickDayIncomeVal').textContent = `+${formatCurrency(dayInc)}`;
    document.getElementById('quickDayExpenseVal').textContent = `-${formatCurrency(dayExp)}`;

    const recentEl = document.getElementById('quickRecentListContainer');
    if (dayTxs.length === 0) {
      recentEl.innerHTML = `
        <div style="text-align:center;padding:28px 16px;color:var(--text-secondary);background:var(--bg-subtle);border-radius:12px;border:1px dashed var(--border-color);">
          ยังไม่มีรายการใน ${formatThaiDate(state.selectedDate, false)} • พร้อมเริ่มต้นบันทึกจริงได้เลยครับ
        </div>
      `;
    } else {
      recentEl.innerHTML = dayTxs.slice(0, 7).map(tx => renderTxItemHtml(tx)).join('');
    }
  }

  function renderTxItemHtml(tx) {
    const cat = getCategoryById(tx.category);
    const sign = tx.type === 'income' ? '+' : '-';
    const devIcon = (tx.device || '').toLowerCase().includes('ipad') ? '📱' : '💻';
    const slipBtn = tx.slipDataUrl
      ? `<button type="button" class="btn-action-sm" data-view-slip="${tx.id}" title="ดูรูปสลิปที่แนบไว้">🧾 สลิป</button>`
      : '';

    return `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon ${tx.type}">${cat.icon}</div>
          <div>
            <div class="tx-title">${escapeHtml(tx.title)}</div>
            <div class="tx-meta">
              <span class="tx-cat-tag">${cat.icon} ${escapeHtml(cat.name)}</span>
              ${tx.note ? `<span>• ${escapeHtml(tx.note)}</span>` : ''}
              <span>${devIcon} ${escapeHtml(tx.device || 'MacBook')}</span>
            </div>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${tx.type}">${sign}${formatCurrency(tx.amount)}</span>
          ${slipBtn}
          <button type="button" class="btn-action-sm dup" data-dup-tx="${tx.id}" title="บันทึกซ้ำเข้าวันนี้ในคลิกเดียว">📋 ซ้ำ</button>
          <button type="button" class="btn-action-sm edit" data-edit-tx="${tx.id}" title="แก้ไขรายการนี้">✏️ แก้ไข</button>
          <button type="button" class="btn-delete-icon" data-del-tx="${tx.id}" title="ลบรายการนี้">🗑️</button>
        </div>
      </div>
    `;
  }

  // --- VIEW 2: DASHBOARD & CHARTS ---
  function renderDashboardAndCharts() {
    const txs = activeTransactions();
    const todayStr = getTodayStr(0);
    const currentMonthPrefix = state.selectedMonth || todayStr.slice(0, 7);

    const todayTxs = txs.filter(t => t.date === todayStr);
    const todayIncomeTxs = todayTxs.filter(t => t.type === 'income');
    const todayExpenseTxs = todayTxs.filter(t => t.type === 'expense');

    const todayIncome = todayIncomeTxs.reduce((s, t) => s + Number(t.amount || 0), 0);
    const todayExpense = todayExpenseTxs.reduce((s, t) => s + Number(t.amount || 0), 0);
    const todayNet = todayIncome - todayExpense;

    const selDayTxs = txs.filter(t => t.date === state.selectedDate);
    const selIncome = selDayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const selExpense = selDayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

    const monthTxs = txs.filter(t => (t.date || '').startsWith(currentMonthPrefix));
    const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

    const totalIncomeAll = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpenseAll = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const availableBalance = totalIncomeAll - totalExpenseAll;

    document.getElementById('todayIncomeAmount').textContent = `+${formatCurrency(todayIncome)}`;
    document.getElementById('todayIncomeCountBadge').textContent = `${todayIncomeTxs.length} รายการ`;
    document.getElementById('selectedDayIncomeCompare').textContent =
      state.selectedDate === todayStr ? 'ข้อมูลวันนี้' : `วันที่เลือก: +${formatCurrency(selIncome)}`;
    document.getElementById('monthIncomeMini').textContent = `เดือนนี้: +${formatCurrency(monthIncome)}`;

    document.getElementById('todayExpenseAmount').textContent = `-${formatCurrency(todayExpense)}`;
    document.getElementById('todayExpenseCountBadge').textContent = `${todayExpenseTxs.length} รายการ`;
    document.getElementById('selectedDayExpenseCompare').textContent =
      state.selectedDate === todayStr ? 'ข้อมูลวันนี้' : `วันที่เลือก: -${formatCurrency(selExpense)}`;
    document.getElementById('monthExpenseMini').textContent = `เดือนนี้: -${formatCurrency(monthExpense)}`;

    document.getElementById('totalAvailableBalance').textContent = formatCurrency(availableBalance);
    const netSign = todayNet >= 0 ? '+' : '-';
    document.getElementById('todayNetBadge').textContent = `สุทธิวันนี้ ${netSign}${formatCurrency(Math.abs(todayNet))}`;
    document.getElementById('totalTxCountLabel').textContent = `${txs.length} รายการ`;

    const targetDate = (state.store.settings && state.store.settings.targetDate) || getTodayStr(7);
    const targetMode = (state.store.settings && state.store.settings.targetMode) || 'net_shortfall';

    const targetDateInput = document.getElementById('targetCutoffDateInput');
    if (targetDateInput && targetDateInput.value !== targetDate) {
      targetDateInput.value = targetDate;
    }
    const targetCutoffDisplay = document.getElementById('targetCutoffDateDisplayText');
    if (targetCutoffDisplay) {
      targetCutoffDisplay.textContent = `${formatThaiDate(targetDate, true)} ▾`;
    }

    document.getElementById('btnModeNetShortfall').classList.toggle('active', targetMode === 'net_shortfall');
    document.getElementById('btnModeGrossUpcoming').classList.toggle('active', targetMode === 'gross_upcoming');

    const unpaidScheduled = activeScheduledExpenses().filter(s => !s.isPaid);
    const dueBeforeTarget = unpaidScheduled.filter(s => s.dueDate <= targetDate);
    const upcomingTotal = dueBeforeTarget.reduce((s, item) => s + Number(item.amount || 0), 0);

    const usableCash = Math.max(0, availableBalance);
    const netShortfall = Math.max(0, upcomingTotal - usableCash);
    const displayedTargetNeeded = targetMode === 'net_shortfall' ? netShortfall : upcomingTotal;

    const daysLeft = diffDaysFromToday(targetDate);
    const effectiveDays = Math.max(1, daysLeft);
    const dailyNeeded = displayedTargetNeeded > 0 ? Math.ceil(displayedTargetNeeded / effectiveDays) : 0;

    document.getElementById('targetNeededAmount').textContent = formatCurrency(displayedTargetNeeded);
    document.getElementById('targetDaysRemainingBadge').textContent =
      daysLeft < 0 ? `เลยกำหนด ${Math.abs(daysLeft)} วัน` : daysLeft === 0 ? 'ครบกำหนดวันนี้!' : `อีก ${daysLeft} วัน`;
    document.getElementById('targetDueDateSubLabel').textContent = `ก่อน ${formatThaiDate(targetDate, false)}`;
    document.getElementById('targetDailyRateLabel').textContent =
      displayedTargetNeeded > 0 ? `ต้องหา ฿${dailyNeeded.toLocaleString('th-TH')}/วัน` : '฿0/วัน';

    document.getElementById('pmUpcomingTotal').textContent = formatCurrency(upcomingTotal);
    document.getElementById('pmCurrentAvailable').textContent = formatCurrency(usableCash);
    document.getElementById('pmShortfallTitle').textContent =
      targetMode === 'net_shortfall' ? 'ยอดที่ต้องหาเพิ่มให้ทันกำหนด' : 'ยอดรวมที่ต้องเตรียมก่อนกำหนด';
    document.getElementById('pmShortfallValue').textContent = formatCurrency(displayedTargetNeeded);

    const coveragePct = upcomingTotal === 0
      ? 100
      : Math.min(100, Math.round((usableCash / upcomingTotal) * 100));

    document.getElementById('targetCoverageText').textContent =
      `ความพร้อมของเงินทุน: ${coveragePct}% (${formatCurrency(usableCash)} / ${formatCurrency(upcomingTotal)})`;
    document.getElementById('targetActionHintText').textContent =
      displayedTargetNeeded > 0
        ? `ต้องหาให้ได้อีก ${formatCurrency(displayedTargetNeeded)} ก่อนวันที่ ${formatThaiDate(targetDate, false)} (เฉลี่ยวันละ ${formatCurrency(dailyNeeded)})`
        : 'ไม่มีภาระยอดเงินที่ขาดก่อนวันกำหนด ✅';

    renderDailyBarChart(txs, state.chartDays);
    renderCategoryDonutChart(monthTxs, state.donutType);
    renderCalendarHeatmap(monthTxs, currentMonthPrefix);
    renderMonthlyTrendChart(txs);
    renderTargetGaugeChart(coveragePct, displayedTargetNeeded, dailyNeeded, daysLeft);
  }

  function renderCalendarHeatmap(monthTxs, yyyyMm) {
    const container = document.getElementById('calendarHeatmapContainer');
    const subtitle = document.getElementById('calendarHeatmapSubtitle');
    if (!container) return;

    subtitle.textContent = `ประจำเดือน ${formatThaiMonth(yyyyMm)} • คลิกช่องวันเพื่อดูหรือบันทึกรายการของวันนั้น`;

    const [year, month] = yyyyMm.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    let html = weekdays.map(w => `<div class="cal-weekday-head">${w}</div>`).join('');

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day-cell empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayItems = monthTxs.filter(t => t.date === dateStr);
      const inc = dayItems.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = dayItems.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

      let bg = '#FFFFFF';
      if (exp > 1500) bg = '#FFE4E6';
      else if (exp > 500) bg = '#FFF1F2';
      else if (inc > 0 && exp === 0) bg = '#ECFDF5';
      else if (dayItems.length > 0) bg = '#F8FAFC';

      const isSel = dateStr === state.selectedDate ? 'selected' : '';
      const isToday = dateStr === getTodayStr(0);

      html += `
        <div class="cal-day-cell ${isSel}" data-cal-date="${dateStr}" style="background:${bg};">
          <div class="cal-day-num">
            <span>${d}</span>
            ${isToday ? '<span style="font-size:0.62rem;color:#2563EB;">วันนี้</span>' : ''}
          </div>
          <div class="cal-day-amts">
            ${inc > 0 ? `<span style="color:#059669;">+${inc >= 1000 ? (inc/1000).toFixed(1)+'k' : inc}</span>` : ''}
            ${exp > 0 ? `<span style="color:#E11D48;">-${exp >= 1000 ? (exp/1000).toFixed(1)+'k' : exp}</span>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderMonthlyTrendChart(txs) {
    const container = document.getElementById('monthlyTrendChartContainer');
    if (!container) return;

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mTxs = txs.filter(t => (t.date || '').startsWith(ym));
      const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      months.push({
        ym,
        label: formatShortThaiMonth(ym),
        inc,
        exp
      });
    }

    const maxVal = Math.max(1000, ...months.map(m => Math.max(m.inc, m.exp))) * 1.15;
    const width = 520;
    const height = 240;
    const padLeft = 48;
    const padRight = 16;
    const padTop = 24;
    const padBottom = 36;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * i);
      const y = padTop + chartH - (i / 4) * chartH;
      gridLines += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="${i === 0 ? 'none' : '4 4'}" />
        <text x="${padLeft - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#64748B" font-weight="600">฿${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}</text>
      `;
    }

    const slotW = chartW / months.length;
    const barW = 16;
    let barsSvg = '';

    months.forEach((m, idx) => {
      const cx = padLeft + idx * slotW + slotW / 2;
      const incH = Math.max(m.inc > 0 ? 4 : 0, (m.inc / maxVal) * chartH);
      const expH = Math.max(m.exp > 0 ? 4 : 0, (m.exp / maxVal) * chartH);
      const incY = padTop + chartH - incH;
      const expY = padTop + chartH - expH;

      barsSvg += `
        <g style="cursor:pointer;" data-pick-month="${m.ym}">
          <rect x="${cx - barW - 2}" y="${incY}" width="${barW}" height="${incH}" rx="4" fill="#10B981">
            <title>${m.label} รายรับ: ${formatCurrency(m.inc)}</title>
          </rect>
          <rect x="${cx + 2}" y="${expY}" width="${barW}" height="${expH}" rx="4" fill="#F43F5E">
            <title>${m.label} รายจ่าย: ${formatCurrency(m.exp)}</title>
          </rect>
          <text x="${cx}" y="${height - 12}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#475569">${m.label}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}
        ${barsSvg}
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary);">
        <span><strong style="color:#10B981;">■</strong> รายรับรวมรายเดือน • <strong style="color:#F43F5E;">■</strong> รายจ่ายรวมรายเดือน</span>
        <span>คลิกที่เดือนเพื่อสลับดูปฏิทินของเดือนนั้น</span>
      </div>
    `;
  }

  function renderDailyBarChart(txs, numDays = 7) {
    const container = document.getElementById('dailyBarChartContainer');
    if (!container) return;

    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const dateStr = getTodayStr(-i);
      const dayTxs = txs.filter(t => t.date === dateStr);
      const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      days.push({
        dateStr,
        label: i === 0 ? 'วันนี้' : formatShortDayMonth(dateStr),
        inc,
        exp
      });
    }

    const maxVal = Math.max(1000, ...days.map(d => Math.max(d.inc, d.exp))) * 1.15;
    const avgExp = days.reduce((s, d) => s + d.exp, 0) / days.length;

    const width = 680;
    const height = 240;
    const padLeft = 52;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 36;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * i);
      const y = padTop + chartH - (i / 4) * chartH;
      const label = val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val;
      gridLines += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="${i === 0 ? 'none' : '4 4'}" />
        <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#64748B" font-weight="600">฿${label}</text>
      `;
    }

    const avgY = padTop + chartH - (avgExp / maxVal) * chartH;
    const avgLine = avgExp > 0 ? `
      <line x1="${padLeft}" y1="${avgY}" x2="${width - padRight}" y2="${avgY}" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="5 4" />
      <rect x="${width - padRight - 108}" y="${avgY - 16}" width="106" height="15" rx="4" fill="#FFFBEB" stroke="#FDE68A"/>
      <text x="${width - padRight - 55}" y="${avgY - 5}" text-anchor="middle" font-size="9.5" fill="#B45309" font-weight="700">จ่ายเฉลี่ย ฿${Math.round(avgExp).toLocaleString('th-TH')}/วัน</text>
    ` : '';

    const slotW = chartW / days.length;
    const barW = Math.min(20, Math.max(8, slotW * 0.28));

    let barsSvg = '';
    days.forEach((d, idx) => {
      const centerX = padLeft + idx * slotW + slotW / 2;
      const incH = Math.max(d.inc > 0 ? 4 : 0, (d.inc / maxVal) * chartH);
      const expH = Math.max(d.exp > 0 ? 4 : 0, (d.exp / maxVal) * chartH);
      const incY = padTop + chartH - incH;
      const expY = padTop + chartH - expH;
      const isSelected = d.dateStr === state.selectedDate;

      barsSvg += `
        <g data-chart-pick-date="${d.dateStr}" style="cursor:pointer;">
          ${isSelected ? `<rect x="${centerX - slotW * 0.44}" y="${padTop}" width="${slotW * 0.88}" height="${chartH}" rx="8" fill="#EEF2FF" opacity="0.7"/>` : ''}
          <rect x="${centerX - barW - 2}" y="${incY}" width="${barW}" height="${incH}" rx="4" fill="#10B981">
            <title>${d.label} รายรับ: ${formatCurrency(d.inc)}</title>
          </rect>
          <rect x="${centerX + 2}" y="${expY}" width="${barW}" height="${expH}" rx="4" fill="#F43F5E">
            <title>${d.label} รายจ่าย: ${formatCurrency(d.exp)}</title>
          </rect>
          <text x="${centerX}" y="${height - 12}" text-anchor="middle" font-size="${numDays > 7 ? '9.5' : '11'}" font-weight="${isSelected ? '800' : '600'}" fill="${isSelected ? '#4F46E5' : '#475569'}">${d.label}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}
        ${barsSvg}
        ${avgLine}
      </svg>
    `;
  }

  function renderCategoryDonutChart(monthTxs, type = 'expense') {
    const svgContainer = document.getElementById('donutSvgContainer');
    const rankList = document.getElementById('donutRankList');
    const centerTitle = document.getElementById('donutCenterTitle');
    const centerAmt = document.getElementById('donutCenterAmount');
    const subtitle = document.getElementById('donutPeriodSubtitle');

    subtitle.textContent = `ประจำเดือน ${formatThaiMonth(state.selectedMonth)}`;
    centerTitle.textContent = type === 'income' ? 'รวมรายรับเดือนนี้' : 'รวมรายจ่ายเดือนนี้';

    const filtered = monthTxs.filter(t => t.type === type);
    const total = filtered.reduce((s, t) => s + Number(t.amount || 0), 0);
    centerAmt.textContent = formatCurrency(total);

    if (filtered.length === 0 || total === 0) {
      svgContainer.innerHTML = `<svg viewBox="0 0 186 186" width="186" height="186"><circle cx="93" cy="93" r="66" fill="none" stroke="#E2E8F0" stroke-width="24" /></svg>`;
      rankList.innerHTML = `<div style="color:var(--text-muted);font-size:0.84rem;padding:20px 0;">ยังไม่มีรายการในเดือนนี้</div>`;
      return;
    }

    const byCat = new Map();
    for (const tx of filtered) {
      byCat.set(tx.category, (byCat.get(tx.category) || 0) + Number(tx.amount || 0));
    }

    const sorted = Array.from(byCat.entries())
      .map(([catId, amount]) => ({
        cat: getCategoryById(catId),
        amount,
        pct: Math.round((amount / total) * 100)
      }))
      .sort((a, b) => b.amount - a.amount);

    const radius = 66;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const circles = sorted.map(item => {
      const frac = item.amount / total;
      const dash = frac * circumference;
      const gap = circumference - dash;
      const strokeOffset = -offset;
      offset += dash;
      return `
        <circle
          cx="93" cy="93" r="${radius}"
          fill="none"
          stroke="${item.cat.color}"
          stroke-width="24"
          stroke-dasharray="${dash} ${gap}"
          stroke-dashoffset="${strokeOffset}"
          transform="rotate(-90 93 93)"
        />
      `;
    }).join('');

    svgContainer.innerHTML = `<svg viewBox="0 0 186 186" width="186" height="186"><circle cx="93" cy="93" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="24" />${circles}</svg>`;

    rankList.innerHTML = sorted.map(item => `
      <div class="donut-rank-item">
        <div class="donut-rank-top">
          <span>${item.cat.icon} ${escapeHtml(item.cat.name)}</span>
          <span>${formatCurrency(item.amount)} <small style="color:var(--text-secondary);">(${item.pct}%)</small></span>
        </div>
        <div class="donut-rank-bar-bg">
          <div style="width:${Math.max(4, item.pct)}%;height:100%;background:${item.cat.color};border-radius:999px;"></div>
        </div>
      </div>
    `).join('');
  }

  function renderTargetGaugeChart(coveragePct, shortfallAmt, dailyNeeded, daysLeft) {
    const container = document.getElementById('targetGaugeSvgContainer');
    if (!container) return;

    const pct = Math.max(0, Math.min(100, coveragePct));
    const radius = 82;
    const arcLength = Math.PI * radius;
    const filledLength = (pct / 100) * arcLength;
    const gaugeColor = pct >= 100 ? '#10B981' : pct >= 60 ? '#4F46E5' : '#F59E0B';

    container.innerHTML = `
      <svg viewBox="0 0 220 135" width="225" height="138" xmlns="http://www.w3.org/2000/svg">
        <path d="M 28 110 A 82 82 0 0 1 192 110" fill="none" stroke="#E2E8F0" stroke-width="20" stroke-linecap="round" />
        <path d="M 28 110 A 82 82 0 0 1 192 110" fill="none" stroke="${gaugeColor}" stroke-width="20" stroke-linecap="round" stroke-dasharray="${filledLength} ${arcLength}" />
        <text x="110" y="82" text-anchor="middle" font-size="25" font-weight="800" fill="#0F172A">${pct}%</text>
        <text x="110" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#64748B">ความพร้อมของเงินทุน</text>
        <text x="110" y="124" text-anchor="middle" font-size="11.5" font-weight="800" fill="${shortfallAmt > 0 ? '#E11D48' : '#059669'}">
          ${shortfallAmt > 0 ? `ต้องหาอีก ${formatCurrency(shortfallAmt)} (${daysLeft} วัน)` : 'ยอดที่ต้องหาเพิ่ม ฿0'}
        </text>
      </svg>
    `;
  }

  // --- VIEW 3: TRANSACTIONS EXPLORER ---
  function renderTransactionsView() {
    document.getElementById('btnViewDaily').classList.toggle('active', state.periodView === 'daily');
    document.getElementById('btnViewMonthly').classList.toggle('active', state.periodView === 'monthly');

    document.querySelectorAll('[data-type-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.typeFilter === state.typeFilter);
    });

    const select = document.getElementById('categoryFilterSelect');
    const cats = activeCategories();
    const expCats = cats.filter(c => c.type === 'expense');
    const incCats = cats.filter(c => c.type === 'income');
    select.innerHTML = `
      <option value="all">🏷️ ทุกประเภทหมวดหมู่</option>
      <optgroup label="ประเภทรายจ่าย">
        ${expCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
      </optgroup>
      <optgroup label="ประเภทรายรับ">
        ${incCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
      </optgroup>
    `;
    select.value = state.categoryFilter;

    const filteredTxs = getFilteredTransactionsForCurrentView();

    const periodIncome = filteredTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const periodExpense = filteredTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const periodNet = periodIncome - periodExpense;

    const periodDesc = state.periodView === 'daily'
      ? formatThaiDate(state.selectedDate, false)
      : formatThaiMonth(state.selectedMonth);

    document.getElementById('periodIncomeLabel').textContent = `รายรับ (${periodDesc})`;
    document.getElementById('periodExpenseLabel').textContent = `รายจ่าย (${periodDesc})`;
    document.getElementById('periodIncomeVal').textContent = `+${formatCurrency(periodIncome)}`;
    document.getElementById('periodExpenseVal').textContent = `-${formatCurrency(periodExpense)}`;
    document.getElementById('periodNetVal').textContent =
      `${periodNet >= 0 ? '+' : '-'}${formatCurrency(Math.abs(periodNet))}`;

    const listContainer = document.getElementById('transactionsListContainer');
    if (filteredTxs.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center;padding:42px 20px;color:var(--text-secondary);">
          <div style="font-size:2.4rem;margin-bottom:8px;">📭</div>
          <div style="font-weight:700;">ยังไม่มีรายการในช่วงเวลาที่เลือก</div>
        </div>
      `;
      return;
    }

    const groups = new Map();
    for (const tx of filteredTxs) {
      if (!groups.has(tx.date)) groups.set(tx.date, []);
      groups.get(tx.date).push(tx);
    }

    let html = '';
    for (const [dateStr, dayList] of groups.entries()) {
      const dayInc = dayList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const dayExp = dayList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

      html += `
        <div class="tx-day-group">
          <div class="tx-day-header">
            <span>📅 ${formatThaiDate(dateStr, true)} (${dayList.length} รายการ)</span>
            <span>
              ${dayInc > 0 ? `<span style="color:#059669;margin-right:8px;">+${formatCurrency(dayInc)}</span>` : ''}
              ${dayExp > 0 ? `<span style="color:#E11D48;">-${formatCurrency(dayExp)}</span>` : ''}
            </span>
          </div>
          ${dayList.map(tx => renderTxItemHtml(tx)).join('')}
        </div>
      `;
    }
    listContainer.innerHTML = html;
  }

  function getFilteredTransactionsForCurrentView() {
    const allTxs = activeTransactions();
    const periodTxs = allTxs.filter(t => {
      if (state.periodView === 'daily') return t.date === state.selectedDate;
      return (t.date || '').startsWith(state.selectedMonth);
    });

    const searchLower = (state.searchQuery || '').trim().toLowerCase();
    return periodTxs.filter(t => {
      if (state.typeFilter === 'expense' && t.type !== 'expense') return false;
      if (state.typeFilter === 'income' && t.type !== 'income') return false;
      if (state.categoryFilter !== 'all' && t.category !== state.categoryFilter) return false;
      if (searchLower) {
        const cat = getCategoryById(t.category);
        const hay = `${t.title || ''} ${t.note || ''} ${cat.name || ''} ${t.device || ''}`.toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  }

  // --- VIEW 4: UPCOMING & RECURRING SCHEDULED EXPENSES ---
  function renderUpcomingView() {
    const expCats = activeCategories().filter(c => c.type === 'expense');
    const schCatSelect = document.getElementById('schCategorySelect');
    if (schCatSelect) {
      const cur = schCatSelect.value;
      schCatSelect.innerHTML = expCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
      if (cur && expCats.some(c => c.id === cur)) schCatSelect.value = cur;
    }
    const schDueInput = document.getElementById('schDueDateInput');
    if (schDueInput && !schDueInput.value) {
      schDueInput.value = getTodayStr(7);
    }
    const schDueDisplay = document.getElementById('schDueDateDisplayText');
    if (schDueDisplay && schDueInput) {
      schDueDisplay.textContent = `📅 ${formatThaiDate(schDueInput.value, true)}`;
    }

    const listEl = document.getElementById('scheduledExpensesList');
    const items = activeScheduledExpenses().sort((a, b) => {
      if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    if (items.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-secondary);">ยังไม่มีรายการรายจ่ายล่วงหน้า • สามารถเพิ่มจากแบบฟอร์มด้านซ้ายได้เลยครับ</div>`;
      return;
    }

    listEl.innerHTML = items.map(item => {
      const cat = getCategoryById(item.category);
      const days = diffDaysFromToday(item.dueDate);
      let badgeClass = 'normal';
      let badgeText = `อีก ${days} วัน`;

      if (item.isPaid) {
        badgeClass = 'paid';
        badgeText = '✓ จ่ายแล้ว';
      } else if (days < 0) {
        badgeClass = 'overdue';
        badgeText = `เลยกำหนด ${Math.abs(days)} วัน!`;
      } else if (days === 0) {
        badgeClass = 'overdue';
        badgeText = 'ครบกำหนดวันนี้!';
      } else if (days <= 5) {
        badgeClass = 'soon';
        badgeText = `ด่วน • อีก ${days} วัน`;
      }

      let recurBadge = '';
      if (item.recurrence === 'monthly') {
        recurBadge = `<span class="due-badge recur">🔁 ประจำทุกเดือน</span>`;
      } else if (item.recurrence === 'weekly') {
        recurBadge = `<span class="due-badge recur">🔁 ประจำทุกสัปดาห์</span>`;
      } else if (item.recurrence === 'installment') {
        recurBadge = `<span class="due-badge recur">💳 ผ่อนงวดที่ ${item.installmentCurrent || 1}/${item.installmentTotal || 10}</span>`;
      }

      return `
        <div class="scheduled-item ${item.isPaid ? 'paid' : ''}">
          <div class="sch-info">
            <div class="tx-icon expense">${cat.icon}</div>
            <div>
              <div class="sch-title">${escapeHtml(item.title)}</div>
              <div class="sch-meta">
                <span class="due-badge ${badgeClass}">${badgeText}</span>
                ${recurBadge}
                <span>ครบกำหนด: ${formatThaiDate(item.dueDate, false)}</span>
                <span style="cursor:pointer;color:#4F46E5;text-decoration:underline;font-weight:700;" data-set-target-date="${item.dueDate}">
                  🎯 ตั้งเป็นวันเป้าหมาย
                </span>
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-weight:800;font-size:1.05rem;color:#4F46E5;">${formatCurrency(item.amount)}</span>
            ${
              !item.isPaid
                ? `<button type="button" class="btn-pay-now" data-pay-scheduled="${item.id}">✓ จ่ายแล้ว</button>`
                : ''
            }
            <button type="button" class="btn-delete-icon" data-del-scheduled="${item.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- VIEW 5: SYNC & ANYWHERE ACCESS ---
  function renderSyncStatusUI() {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncStatusText');
    const peerBadge = document.getElementById('syncPeerCountBadge');

    const serverPeers = (state.networkInfo && state.networkInfo.connectedPeers) || [];
    const combinedPeersMap = new Map();
    for (const p of serverPeers) {
      if (p && p.peerId) combinedPeersMap.set(p.peerId, p);
    }
    for (const [id, p] of p2pPeersMap.entries()) {
      if (!combinedPeersMap.has(id)) combinedPeersMap.set(id, p);
    }
    const peers = Array.from(combinedPeersMap.values());
    const peerCount = Math.max(1, peers.length);
    const roomCode = (state.store.settings && state.store.settings.syncRoomCode) || 'KP-8899';

    if (state.wifiConnected) {
      dot.className = 'sync-dot';
      const wifiSig = currentWifiGatewayIp ? `Wi-Fi ${currentWifiGatewayIp}` : ((state.networkInfo && state.networkInfo.primarySubnet) || 'Wi-Fi เดียวกัน');
      text.textContent = `ตรวจพบวง ${wifiSig} • ห้อง ${roomCode} • ซิงค์ข้อมูลล่าสุดแล้ว`;
      peerBadge.textContent = `(${peerCount} เครื่อง)`;
    } else {
      dot.className = 'sync-dot standalone';
      text.textContent = 'หน่วยความจำอิสระในเครื่อง (ใช้ได้แม้ปิดอีกเครื่อง • ซิงค์เมื่อต่อ Wi-Fi เดียวกัน)';
      peerBadge.textContent = '';
    }

    const roomInput = document.getElementById('syncRoomCodeInput');
    if (roomInput && document.activeElement !== roomInput) {
      roomInput.value = roomCode;
    }

    const lanUrlEl = document.getElementById('lanUrlText');
    const subnetEl = document.getElementById('wifiSubnetText');
    const roomDisplayEl = document.getElementById('roomCodeDisplayText');
    const lastSyncEl = document.getElementById('lastSyncedTimeText');
    const peersListEl = document.getElementById('connectedPeersList');

    const permUrl = isHttpsCloud ? window.location.href : CLOUD_APP_URL;
    if (lanUrlEl) lanUrlEl.textContent = permUrl;
    if (subnetEl) {
      const curIp = currentWifiGatewayIp || (state.networkInfo && state.networkInfo.primaryIp) || 'กำลังตรวจจับ...';
      subnetEl.textContent = `ตรวจจับอัตโนมัติ (รหัสวง Wi-Fi: ${curIp})`;
    }
    if (roomDisplayEl) roomDisplayEl.textContent = roomCode;
    if (lastSyncEl) {
      lastSyncEl.textContent = state.lastSyncedAt
        ? `วันนี้ เวลา ${new Date(state.lastSyncedAt).toLocaleTimeString('th-TH')} น.`
        : 'บันทึกในเครื่องเรียบร้อย (รอซิงค์เมื่อเจอ Wi-Fi เดียวกัน)';
    }

    if (peersListEl) {
      if (peers.length === 0) {
        peersListEl.innerHTML = `
          <div class="peer-row">
            <span>💻 <strong>${deviceProfile.name}</strong> (เครื่องนี้ - ทำงานแยกอิสระได้ทุกที่)</span>
            <span style="color:#0284C7;font-weight:700;">พร้อมซิงค์เมื่อต่อ Wi-Fi เดียวกัน</span>
          </div>
        `;
      } else {
        peersListEl.innerHTML = peers.map(p => {
          const icon = p.deviceType === 'ipad' ? '📱' : '💻';
          const isSelf = p.peerId === peerId ? ' (เครื่องนี้)' : '';
          return `
            <div class="peer-row">
              <span>${icon} <strong>${escapeHtml(p.deviceName)}${isSelf}</strong> <small style="color:#64748B;">(${p.ip || 'LAN'} • ห้อง ${escapeHtml(p.roomCode || roomCode)})</small></span>
              <span style="color:#059669;font-weight:700;">🟢 ซิงค์ข้อมูลล่าสุดตรงกันแล้ว</span>
            </div>
          `;
        }).join('');
      }
    }

    renderQrVisual(permUrl);
  }

  function renderQrVisual(urlText) {
    const container = document.getElementById('qrCodeSvgContainer');
    if (!container || container.dataset.url === urlText) return;
    container.dataset.url = urlText;

    const size = 21;
    const grid = Array.from({ length: size }, () => Array(size).fill(false));
    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (border || inner) grid[r0 + r][c0 + c] = true;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    let hash = 2166136261;
    for (let i = 0; i < urlText.length; i++) {
      hash ^= urlText.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder = (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
        if (inFinder) continue;
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        grid[r][c] = (Math.abs(hash) % 10) < 5;
      }
    }

    let rects = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c]) {
          rects += `<rect x="${c * 5.6 + 4}" y="${r * 5.6 + 4}" width="4.8" height="4.8" rx="1" fill="#0F172A"/>`;
        }
      }
    }
    container.innerHTML = `<svg viewBox="0 0 126 126" width="124" height="124"><rect width="126" height="126" rx="8" fill="#FFF"/>${rects}</svg>`;
  }

  function exportCurrentTransactionsToCsv() {
    const list = activeTransactions().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'ชื่อรายการ', 'จำนวนเงิน (บาท)', 'หมายเหตุ', 'อุปกรณ์ที่บันทึก'];
    const rows = list.map(tx => {
      const cat = getCategoryById(tx.category);
      const typeName = tx.type === 'income' ? 'รายรับ' : 'รายจ่าย';
      const signedAmt = tx.type === 'income' ? tx.amount : -tx.amount;
      return [
        tx.date,
        typeName,
        `${cat.icon} ${cat.name}`,
        `"${String(tx.title || '').replace(/"/g, '""')}"`,
        signedAmt,
        `"${String(tx.note || '').replace(/"/g, '""')}"`,
        `"${String(tx.device || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KrapaoFlow-Report-${getTodayStr(0)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ Excel (.CSV รองรับภาษาไทย) เรียบร้อยแล้ว!', '📊');
  }

  function handleSlipImageFile(file) {
    if (!file) return;
    const matchAmt = (file.name || '').match(/(\d+(?:\.\d{1,2})?)/);
    const amountInput = document.getElementById('entryAmountInput');
    if (matchAmt && !amountInput.value && Number(matchAmt[1]) > 0 && Number(matchAmt[1]) < 1000000) {
      amountInput.value = matchAmt[1];
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        state.pendingSlipDataUrl = dataUrl;

        const preview = document.getElementById('entrySlipPreviewImg');
        preview.src = dataUrl;
        preview.style.display = 'block';
        document.getElementById('btnRemoveEntrySlip').style.display = 'inline-block';
        document.getElementById('entrySlipStatusText').textContent = `แนบรูปสลิป "${file.name}" เรียบร้อยแล้ว`;
        showToast('แนบรูปสลิปเรียบร้อยแล้ว', '🧾');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function openCategoryModal(editCatId = null) {
    const modal = document.getElementById('categoryModalBackdrop');
    const titleEl = document.getElementById('categoryModalTitle');
    const idInput = document.getElementById('catEditIdInput');
    const typeSelect = document.getElementById('catEditTypeSelect');
    const iconInput = document.getElementById('catEditIconInput');
    const nameInput = document.getElementById('catEditNameInput');
    const colorInput = document.getElementById('catEditColorInput');
    const delBtn = document.getElementById('btnDeleteCategoryInModal');

    if (editCatId) {
      const cat = getCategoryById(editCatId);
      titleEl.textContent = `✏️ แก้ไขหมวดหมู่ "${cat.name}"`;
      idInput.value = cat.id;
      typeSelect.value = cat.type || 'expense';
      iconInput.value = cat.icon || '🏷️';
      nameInput.value = cat.name || '';
      colorInput.value = cat.color || '#4F46E5';
      delBtn.style.display = 'inline-flex';
    } else {
      titleEl.textContent = '🏷️ เพิ่มประเภทหมวดหมู่ใหม่';
      idInput.value = '';
      typeSelect.value = state.entryMode === 'income' ? 'income' : 'expense';
      iconInput.value = state.entryMode === 'income' ? '🌟' : '🍜';
      nameInput.value = '';
      colorInput.value = state.entryMode === 'income' ? '#059669' : '#4F46E5';
      delBtn.style.display = 'none';
    }

    modal.classList.add('open');
  }

  function handleTransactionListAction(e) {
    const slipBtn = e.target.closest('[data-view-slip]');
    if (slipBtn) {
      const tx = state.store.transactions.find(t => t.id === slipBtn.dataset.viewSlip);
      if (tx && tx.slipDataUrl) {
        document.getElementById('slipViewerTitle').textContent = `🧾 สลิป: ${tx.title} (${formatCurrency(tx.amount)})`;
        document.getElementById('slipViewerFullImg').src = tx.slipDataUrl;
        document.getElementById('slipViewerModalBackdrop').classList.add('open');
      }
      return;
    }

    const dupBtn = e.target.closest('[data-dup-tx]');
    if (dupBtn) {
      const tx = state.store.transactions.find(t => t.id === dupBtn.dataset.dupTx);
      if (tx) {
        const now = Date.now();
        const today = getTodayStr(0);
        const copyTx = {
          ...tx,
          id: `tx-dup-${now}-${Math.random().toString(36).slice(2, 6)}`,
          date: today,
          createdAt: now,
          updatedAt: now,
          device: deviceProfile.name,
          deleted: false
        };
        state.store.transactions.push(copyTx);
        state.selectedDate = today;
        state.selectedMonth = today.slice(0, 7);
        saveLocalStore();
        syncWithWifiServer(false);
        renderAll();
        showToast(`บันทึกซ้ำ "${tx.title}" (${formatCurrency(tx.amount)}) เข้าวันนี้เรียบร้อย!`, '📋');
      }
      return;
    }

    const editBtn = e.target.closest('[data-edit-tx]');
    if (editBtn) {
      const tx = state.store.transactions.find(t => t.id === editBtn.dataset.editTx);
      if (tx) {
        document.getElementById('editTxIdInput').value = tx.id;
        document.getElementById('editTxTypeSelect').value = tx.type;
        document.getElementById('editTxDateInput').value = tx.date;
        const editDateBtn = document.getElementById('btnOpenEditTxCalendar');
        if (editDateBtn) editDateBtn.textContent = '📅 ' + formatThaiDate(tx.date, true);
        document.getElementById('editTxAmountInput').value = tx.amount;
        document.getElementById('editTxTitleInput').value = tx.title;
        document.getElementById('editTxNoteInput').value = tx.note || '';

        const catSelect = document.getElementById('editTxCategorySelect');
        const cats = activeCategories().filter(c => c.type === tx.type);
        catSelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        catSelect.value = tx.category;

        document.getElementById('editTxModalBackdrop').classList.add('open');
      }
      return;
    }

    const delBtn = e.target.closest('[data-del-tx]');
    if (delBtn) {
      const tx = state.store.transactions.find(t => t.id === delBtn.dataset.delTx);
      if (tx) {
        tx.deleted = true;
        tx.updatedAt = Date.now();
        saveLocalStore();
        syncWithWifiServer(false);
        renderAll();
        showToast(`ลบรายการ "${tx.title}" แล้ว`, '🗑️');
      }
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAll() {
    renderNavBadgesAndDate();
    renderSyncStatusUI();
    renderQuickRecordView();
    renderDashboardAndCharts();
    renderTransactionsView();
    renderUpcomingView();
  }

  function getActiveDateForContext(ctx) {
    if (ctx === 'entry') return document.getElementById('entryDateInput').value || state.selectedDate;
    if (ctx === 'target') return (state.store.settings && state.store.settings.targetDate) || getTodayStr(15);
    if (ctx === 'scheduled') return document.getElementById('schDueDateInput').value || getTodayStr(7);
    if (ctx === 'editTx') return document.getElementById('editTxDateInput').value || state.selectedDate;
    if (ctx === 'lineStart') return document.getElementById('lineFilterStartInput').value || getTodayStr(-7);
    if (ctx === 'lineEnd') return document.getElementById('lineFilterEndInput').value || getTodayStr(0);
    return state.selectedDate;
  }

  function openCustomCalendarModal(ctx) {
    state.calendarModalContext = ctx || 'main';
    const curDate = getActiveDateForContext(state.calendarModalContext);
    state.calendarModalMonth = (curDate || getTodayStr(0)).slice(0, 7);
    renderCustomCalendarModal();
    document.getElementById('customCalendarModalBackdrop').classList.add('open');
  }

  function renderCustomCalendarModal() {
    const ym = state.calendarModalMonth || getTodayStr(0).slice(0, 7);
    const [year, month] = ym.split('-').map(Number);
    const titleEl = document.getElementById('calModalMonthTitle');
    if (titleEl) titleEl.textContent = formatThaiMonth(ym);

    const grid = document.getElementById('calModalDaysGrid');
    if (!grid) return;

    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeekday = firstDay.getDay();
    const activeDate = getActiveDateForContext(state.calendarModalContext);
    const todayStr = getTodayStr(0);

    const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    let html = weekdays.map(w => `<div class="cal-weekday">${w}</div>`).join('');

    for (let i = 0; i < startWeekday; i++) {
      html += `<div class="cal-day-cell empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dateStr === activeDate;
      const isToday = dateStr === todayStr;
      html += `
        <div class="cal-day-cell ${isSelected ? 'selected' : ''}" data-custom-cal-date="${dateStr}" style="min-height:46px;align-items:center;justify-content:center;">
          <div class="cal-day-num" style="font-size:0.95rem;">${d} ${isToday ? '📍' : ''}</div>
        </div>
      `;
    }
    grid.innerHTML = html;
  }

  function selectCustomCalendarDate(dateStr) {
    if (!dateStr) return;
    const ctx = state.calendarModalContext;
    if (ctx === 'main') {
      state.selectedDate = dateStr;
      state.selectedMonth = dateStr.slice(0, 7);
      document.getElementById('entryDateInput').value = dateStr;
    } else if (ctx === 'entry') {
      document.getElementById('entryDateInput').value = dateStr;
      if (state.entryMode !== 'scheduled') {
        state.selectedDate = dateStr;
        state.selectedMonth = dateStr.slice(0, 7);
      }
    } else if (ctx === 'target') {
      state.store.settings = { ...state.store.settings, targetDate: dateStr, updatedAt: Date.now() };
      saveLocalStore();
      syncWithWifiServer(false);
    } else if (ctx === 'scheduled') {
      document.getElementById('schDueDateInput').value = dateStr;
    } else if (ctx === 'editTx') {
      document.getElementById('editTxDateInput').value = dateStr;
      const editDateBtn = document.getElementById('btnOpenEditTxCalendar');
      if (editDateBtn) editDateBtn.textContent = '📅 ' + formatThaiDate(dateStr, true);
    } else if (ctx === 'lineStart') {
      document.getElementById('lineFilterStartInput').value = dateStr;
      const el = document.getElementById('lineFilterStartText');
      if (el) el.textContent = 'ตั้งแต่: ' + formatThaiDate(dateStr, false);
      if ((document.getElementById('lineImportTextarea').value || '').trim()) {
        doParseAndRenderLineText();
      }
    } else if (ctx === 'lineEnd') {
      document.getElementById('lineFilterEndInput').value = dateStr;
      const el = document.getElementById('lineFilterEndText');
      if (el) el.textContent = 'ถึง: ' + formatThaiDate(dateStr, false);
      if ((document.getElementById('lineImportTextarea').value || '').trim()) {
        doParseAndRenderLineText();
      }
    }
    document.getElementById('customCalendarModalBackdrop').classList.remove('open');
    renderAll();
  }

  function shiftSelectedMonth(deltaMonths) {
    const [y, m] = (state.selectedMonth || getTodayStr(0).slice(0, 7)).split('-').map(Number);
    const dt = new Date(y, m - 1 + deltaMonths, 1);
    state.selectedMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    renderAll();
  }

  function initEvents() {
    // Synchronous iPadOS Touch Bridge: fires click synchronously inside touchend (trusted gesture) and suppresses delayed duplicate native click
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTarget = null;
    let lastTouchTriggeredAt = 0;

    document.addEventListener('click', e => {
      if (e.isTrusted && Date.now() - lastTouchTriggeredAt < 420) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, true);

    document.addEventListener('touchstart', e => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTarget = e.target.closest('button, .cal-day-cell, [data-chart-pick-date], [data-pick-month], [data-set-target-date]');
      } else {
        touchStartTarget = null;
      }
    }, { passive: true });

    document.addEventListener('touchend', e => {
      if (!touchStartTarget || !e.changedTouches || e.changedTouches.length !== 1) return;
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      const targetBtn = touchStartTarget;
      touchStartTarget = null;
      if (dx < 16 && dy < 16) {
        lastTouchTriggeredAt = Date.now();
        targetBtn.click();
      }
    }, { passive: true });

    // Close modals when tapping backdrop on iPad
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });

    const btnForceReload = document.getElementById('btnForceReloadApp');
    if (btnForceReload) {
      btnForceReload.addEventListener('click', async () => {
        showToast('กำลังอัปเดตและรีเฟรชแอป...', '↻');
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) await r.unregister();
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            for (const k of keys) await caches.delete(k);
          }
        } catch (e) {}
        window.location.replace(window.location.pathname + '?v=' + Date.now());
      });
    }

    document.querySelectorAll('[data-nav-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.navView));
    });

    document.getElementById('btnTopSyncPill').addEventListener('click', () => switchView('sync'));

    // Pure HTML Custom Calendar Modal triggers (zero native UIKit date pickers)
    const btnOpenMainCal = document.getElementById('btnOpenMainCalendar');
    if (btnOpenMainCal) btnOpenMainCal.addEventListener('click', () => openCustomCalendarModal('main'));

    const btnOpenEntryCal = document.getElementById('btnOpenEntryCalendar');
    if (btnOpenEntryCal) btnOpenEntryCal.addEventListener('click', () => openCustomCalendarModal('entry'));

    const btnOpenTargetCal = document.getElementById('btnOpenTargetCalendar');
    if (btnOpenTargetCal) btnOpenTargetCal.addEventListener('click', () => openCustomCalendarModal('target'));

    const btnOpenSchCal = document.getElementById('btnOpenSchCalendar');
    if (btnOpenSchCal) btnOpenSchCal.addEventListener('click', () => openCustomCalendarModal('scheduled'));

    const btnOpenEditTxCal = document.getElementById('btnOpenEditTxCalendar');
    if (btnOpenEditTxCal) btnOpenEditTxCal.addEventListener('click', () => openCustomCalendarModal('editTx'));

    const btnCloseCustomCal = document.getElementById('btnCloseCustomCalendar');
    if (btnCloseCustomCal) {
      btnCloseCustomCal.addEventListener('click', () => {
        document.getElementById('customCalendarModalBackdrop').classList.remove('open');
      });
    }

    const btnCalModalPrev = document.getElementById('btnCalModalPrevMonth');
    if (btnCalModalPrev) {
      btnCalModalPrev.addEventListener('click', () => {
        const [y, m] = (state.calendarModalMonth || getTodayStr(0).slice(0, 7)).split('-').map(Number);
        const dt = new Date(y, m - 2, 1);
        state.calendarModalMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        renderCustomCalendarModal();
      });
    }

    const btnCalModalNext = document.getElementById('btnCalModalNextMonth');
    if (btnCalModalNext) {
      btnCalModalNext.addEventListener('click', () => {
        const [y, m] = (state.calendarModalMonth || getTodayStr(0).slice(0, 7)).split('-').map(Number);
        const dt = new Date(y, m, 1);
        state.calendarModalMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        renderCustomCalendarModal();
      });
    }

    const calModalDaysGrid = document.getElementById('calModalDaysGrid');
    if (calModalDaysGrid) {
      calModalDaysGrid.addEventListener('click', e => {
        const cell = e.target.closest('[data-custom-cal-date]');
        if (cell) selectCustomCalendarDate(cell.dataset.customCalDate);
      });
    }

    document.querySelectorAll('[data-cal-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const offset = Number(btn.dataset.calQuick || 0);
        selectCustomCalendarDate(getTodayStr(offset));
      });
    });

    const btnPrevMonthDash = document.getElementById('btnPrevMonthDash');
    if (btnPrevMonthDash) btnPrevMonthDash.addEventListener('click', () => shiftSelectedMonth(-1));
    const btnNextMonthDash = document.getElementById('btnNextMonthDash');
    if (btnNextMonthDash) btnNextMonthDash.addEventListener('click', () => shiftSelectedMonth(1));

    const btnPrevMonthTx = document.getElementById('btnPrevMonthTx');
    if (btnPrevMonthTx) btnPrevMonthTx.addEventListener('click', () => { state.periodView = 'monthly'; shiftSelectedMonth(-1); });
    const btnNextMonthTx = document.getElementById('btnNextMonthTx');
    if (btnNextMonthTx) btnNextMonthTx.addEventListener('click', () => { state.periodView = 'monthly'; shiftSelectedMonth(1); });

    document.getElementById('btnGoToday').addEventListener('click', () => {
      const today = getTodayStr(0);
      state.selectedDate = today;
      state.selectedMonth = today.slice(0, 7);
      document.getElementById('entryDateInput').value = today;
      renderAll();
      showToast('เลือกวันที่เป็น "วันนี้" เรียบร้อยแล้ว', '📍');
    });

    document.getElementById('btnPrevDate').addEventListener('click', () => shiftSelectedDate(-1));
    document.getElementById('btnNextDate').addEventListener('click', () => shiftSelectedDate(1));

    document.querySelectorAll('[data-entry-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.entryMode = btn.dataset.entryType;
        document.getElementById('entryDateInput').value =
          state.entryMode === 'scheduled' ? getTodayStr(7) : state.selectedDate;
        renderQuickRecordView();
      });
    });

    document.getElementById('entryRecurrenceSelect').addEventListener('change', e => {
      document.getElementById('entryInstallmentWrap').style.display =
        e.target.value === 'installment' ? 'flex' : 'none';
    });

    document.getElementById('schRecurrenceSelect').addEventListener('change', e => {
      document.getElementById('schInstallmentFields').style.display =
        e.target.value === 'installment' ? 'grid' : 'none';
    });

    document.getElementById('btnEntryToday').addEventListener('click', () => {
      const today = getTodayStr(0);
      document.getElementById('entryDateInput').value = today;
      state.selectedDate = today;
      renderAll();
    });

    document.getElementById('btnEntryTomorrow').addEventListener('click', () => {
      document.getElementById('entryDateInput').value = getTodayStr(1);
      renderQuickRecordView();
    });

    document.getElementById('btnEntryNext7Days').addEventListener('click', () => {
      document.getElementById('entryDateInput').value = getTodayStr(7);
      renderQuickRecordView();
    });

    document.querySelectorAll('[data-add-amt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('entryAmountInput');
        const curVal = parseFloat(String(input.value || '0').replace(/,/g, '')) || 0;
        input.value = curVal + Number(btn.dataset.addAmt);
      });
    });

    document.getElementById('btnClearAmount').addEventListener('click', () => {
      document.getElementById('entryAmountInput').value = '';
    });

    document.getElementById('btnToggleNumpad').addEventListener('click', () => {
      state.showNumpad = !state.showNumpad;
      renderQuickRecordView();
    });

    document.getElementById('ipadNumpad').addEventListener('click', e => {
      const btn = e.target.closest('[data-numpad]');
      if (!btn) return;
      const key = btn.dataset.numpad;
      const input = document.getElementById('entryAmountInput');
      const cur = String(input.value || '');
      input.value = key === 'DEL' ? cur.slice(0, -1) : cur + key;
    });

    const schNumpad = document.getElementById('schNumpad');
    if (schNumpad) {
      schNumpad.addEventListener('click', e => {
        const btn = e.target.closest('[data-sch-numpad]');
        if (!btn) return;
        const key = btn.dataset.schNumpad;
        const input = document.getElementById('schAmountInput');
        const cur = String(input.value || '');
        input.value = key === 'DEL' ? cur.slice(0, -1) : cur + key;
      });
    }

    document.querySelectorAll('[data-sch-add-amt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('schAmountInput');
        const curVal = parseFloat(String(input.value || '0').replace(/,/g, '')) || 0;
        input.value = curVal + Number(btn.dataset.schAddAmt);
      });
    });

    const btnClearSchAmt = document.getElementById('btnClearSchAmount');
    if (btnClearSchAmt) {
      btnClearSchAmt.addEventListener('click', () => {
        document.getElementById('schAmountInput').value = '';
      });
    }

    document.getElementById('btnOpenAddCategoryModal').addEventListener('click', () => openCategoryModal(null));

    document.getElementById('btnToggleManageCategories').addEventListener('click', () => {
      state.manageCategoriesMode = !state.manageCategoriesMode;
      renderQuickRecordView();
    });

    document.getElementById('categoryPickerGrid').addEventListener('click', e => {
      const delBtn = e.target.closest('[data-del-cat]');
      if (delBtn) {
        e.stopPropagation();
        const catId = delBtn.dataset.delCat;
        const cat = getCategoryById(catId);
        const found = state.store.categories.find(c => c.id === catId);
        if (found) {
          found.deleted = true;
          found.updatedAt = Date.now();
          saveLocalStore();
          syncWithWifiServer(false);
          renderAll();
          showToast(`ลบประเภท "${cat.icon} ${cat.name}" ออกจากรายการแล้ว`, '🗑️');
        }
        return;
      }

      const editBtn = e.target.closest('[data-edit-cat]');
      if (editBtn) {
        e.stopPropagation();
        openCategoryModal(editBtn.dataset.editCat);
        return;
      }

      const chip = e.target.closest('[data-cat-id]');
      if (chip) {
        state.selectedCategory = chip.dataset.catId;
        renderQuickRecordView();
      }
    });

    document.getElementById('btnCloseCategoryModal').addEventListener('click', () => {
      document.getElementById('categoryModalBackdrop').classList.remove('open');
    });

    document.getElementById('emojiQuickPicker').addEventListener('click', e => {
      const btn = e.target.closest('[data-emoji]');
      if (btn) document.getElementById('catEditIconInput').value = btn.dataset.emoji;
    });

    document.getElementById('categoryEditorForm').addEventListener('submit', e => {
      e.preventDefault();
      const id = document.getElementById('catEditIdInput').value;
      const type = document.getElementById('catEditTypeSelect').value;
      const icon = document.getElementById('catEditIconInput').value.trim() || '🏷️';
      const name = document.getElementById('catEditNameInput').value.trim();
      const color = document.getElementById('catEditColorInput').value || '#4F46E5';

      if (!name) return;
      const now = Date.now();

      if (id) {
        const existing = state.store.categories.find(c => c.id === id);
        if (existing) {
          existing.type = type;
          existing.icon = icon;
          existing.name = name;
          existing.color = color;
          existing.updatedAt = now;
          existing.deleted = false;
        }
        showToast(`แก้ไขหมวดหมู่ "${icon} ${name}" เรียบร้อยแล้ว`, '✏️');
      } else {
        const newCat = {
          id: `cat_${now}`,
          type,
          icon,
          name,
          color,
          updatedAt: now,
          deleted: false
        };
        state.store.categories.push(newCat);
        state.selectedCategory = newCat.id;
        showToast(`เพิ่มหมวดหมู่ "${icon} ${name}" เรียบร้อยแล้ว`, '🏷️');
      }

      document.getElementById('categoryModalBackdrop').classList.remove('open');
      saveLocalStore();
      syncWithWifiServer(false);
      renderAll();
    });

    document.getElementById('btnDeleteCategoryInModal').addEventListener('click', () => {
      const id = document.getElementById('catEditIdInput').value;
      const found = state.store.categories.find(c => c.id === id);
      if (found) {
        found.deleted = true;
        found.updatedAt = Date.now();
        document.getElementById('categoryModalBackdrop').classList.remove('open');
        saveLocalStore();
        syncWithWifiServer(false);
        renderAll();
        showToast(`ลบหมวดหมู่ "${found.name}" แล้ว`, '🗑️');
      }
    });

    document.getElementById('entrySlipFileInput').addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        handleSlipImageFile(e.target.files[0]);
      }
    });

    window.addEventListener('paste', e => {
      if (state.activeView !== 'record') return;
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          handleSlipImageFile(item.getAsFile());
          break;
        }
      }
    });

    document.getElementById('btnRemoveEntrySlip').addEventListener('click', () => {
      state.pendingSlipDataUrl = null;
      document.getElementById('entrySlipPreviewImg').style.display = 'none';
      document.getElementById('btnRemoveEntrySlip').style.display = 'none';
      document.getElementById('entrySlipStatusText').textContent = 'เลือกรูปสลิป หรือกดวางรูป (Cmd+V) เพื่อแนบและดึงยอดเงิน';
    });

    document.getElementById('btnCloseSlipViewer').addEventListener('click', () => {
      document.getElementById('slipViewerModalBackdrop').classList.remove('open');
    });

    document.getElementById('quickTitleSuggestions').addEventListener('click', e => {
      const tag = e.target.closest('[data-sug]');
      if (tag) document.getElementById('entryTitleInput').value = tag.dataset.sug;
    });

    document.getElementById('entryForm').addEventListener('submit', e => {
      e.preventDefault();
      const rawAmt = String(document.getElementById('entryAmountInput').value || '').replace(/,/g, '').trim();
      const amount = parseFloat(rawAmt);
      const rawTitle = document.getElementById('entryTitleInput').value.trim();
      const note = document.getElementById('entryNoteInput').value.trim();
      const dateVal = document.getElementById('entryDateInput').value || getTodayStr(0);

      if (!amount || amount <= 0) {
        showToast('กรุณาระบุจำนวนเงินก่อนกดบันทึกครับ', '⚠️');
        return;
      }
      const catObj = getCategoryById(state.selectedCategory);
      const title = rawTitle || (catObj ? catObj.name : 'รายการทั่วไป');
      const now = Date.now();

      if (state.entryMode === 'scheduled') {
        const recurrence = document.getElementById('entryRecurrenceSelect').value || 'none';
        const instCur = Number(document.getElementById('entryInstCurrent').value || 1);
        const instTot = Number(document.getElementById('entryInstTotal').value || 10);

        state.store.scheduledExpenses.push({
          id: `sch-${now}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          amount,
          category: state.selectedCategory,
          dueDate: dateVal,
          recurrence,
          installmentCurrent: recurrence === 'installment' ? instCur : 0,
          installmentTotal: recurrence === 'installment' ? instTot : 0,
          note,
          isPaid: false,
          updatedAt: now,
          device: deviceProfile.name,
          deleted: false
        });
        showToast(`ตั้งรายจ่ายล่วงหน้า "${title}" (${formatCurrency(amount)}) แล้ว`, '⏰');
      } else {
        state.store.transactions.push({
          id: `tx-${now}-${Math.random().toString(36).slice(2, 6)}`,
          type: state.entryMode,
          amount,
          category: state.selectedCategory,
          title,
          note,
          date: dateVal,
          slipDataUrl: state.pendingSlipDataUrl || null,
          createdAt: now,
          updatedAt: now,
          device: deviceProfile.name,
          deleted: false
        });
        state.selectedDate = dateVal;
        state.selectedMonth = dateVal.slice(0, 7);
        showToast(
          `บันทึก${state.entryMode === 'income' ? 'รายรับ' : 'รายจ่าย'} "${title}" ${formatCurrency(amount)} แล้ว`,
          state.entryMode === 'income' ? '📈' : '📉'
        );
      }

      document.getElementById('entryAmountInput').value = '';
      document.getElementById('entryTitleInput').value = '';
      document.getElementById('entryNoteInput').value = '';
      state.pendingSlipDataUrl = null;
      document.getElementById('entrySlipPreviewImg').style.display = 'none';
      document.getElementById('btnRemoveEntrySlip').style.display = 'none';
      document.getElementById('entrySlipStatusText').textContent = 'เลือกรูปสลิป หรือกดวางรูป (Cmd+V) เพื่อแนบและดึงยอดเงิน';

      saveLocalStore();
      syncWithWifiServer(false);
      renderAll();
    });

    document.getElementById('quickRecentListContainer').addEventListener('click', handleTransactionListAction);
    document.getElementById('transactionsListContainer').addEventListener('click', handleTransactionListAction);

    document.getElementById('btnCloseEditTxModal').addEventListener('click', () => {
      document.getElementById('editTxModalBackdrop').classList.remove('open');
    });

    document.getElementById('editTxTypeSelect').addEventListener('change', e => {
      const cats = activeCategories().filter(c => c.type === e.target.value);
      document.getElementById('editTxCategorySelect').innerHTML =
        cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    });

    document.getElementById('editTxForm').addEventListener('submit', e => {
      e.preventDefault();
      const id = document.getElementById('editTxIdInput').value;
      const tx = state.store.transactions.find(t => t.id === id);
      if (tx) {
        tx.type = document.getElementById('editTxTypeSelect').value;
        tx.date = document.getElementById('editTxDateInput').value;
        tx.amount = parseFloat(String(document.getElementById('editTxAmountInput').value || '').replace(/,/g, '')) || 0;
        tx.category = document.getElementById('editTxCategorySelect').value;
        tx.title = document.getElementById('editTxTitleInput').value.trim();
        tx.note = document.getElementById('editTxNoteInput').value.trim();
        tx.updatedAt = Date.now();

        document.getElementById('editTxModalBackdrop').classList.remove('open');
        saveLocalStore();
        syncWithWifiServer(false);
        renderAll();
        showToast(`บันทึกการแก้ไข "${tx.title}" เรียบร้อยแล้ว`, '✏️');
      }
    });

    document.querySelectorAll('[data-chart-days]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-chart-days]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.chartDays = Number(btn.dataset.chartDays);
        renderDashboardAndCharts();
      });
    });

    document.querySelectorAll('[data-donut-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-donut-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.donutType = btn.dataset.donutType;
        renderDashboardAndCharts();
      });
    });

    document.getElementById('dailyBarChartContainer').addEventListener('click', e => {
      const col = e.target.closest('[data-chart-pick-date]');
      if (!col) return;
      state.selectedDate = col.dataset.chartPickDate;
      state.selectedMonth = state.selectedDate.slice(0, 7);
      document.getElementById('entryDateInput').value = state.selectedDate;
      renderAll();
      showToast(`เลือกดูข้อมูลวันที่ ${formatThaiDate(state.selectedDate, false)}`, '📅');
    });

    document.getElementById('calendarHeatmapContainer').addEventListener('click', e => {
      const cell = e.target.closest('[data-cal-date]');
      if (!cell) return;
      state.selectedDate = cell.dataset.calDate;
      state.selectedMonth = state.selectedDate.slice(0, 7);
      document.getElementById('entryDateInput').value = state.selectedDate;
      renderAll();
      showToast(`เลือกวันที่ ${formatThaiDate(state.selectedDate, false)} จากปฏิทินแล้ว`, '🗓️');
    });

    document.getElementById('dashMonthPicker').addEventListener('change', e => {
      if (e.target.value) {
        state.selectedMonth = e.target.value;
        renderAll();
      }
    });

    document.getElementById('monthlyTrendChartContainer').addEventListener('click', e => {
      const col = e.target.closest('[data-pick-month]');
      if (!col) return;
      state.selectedMonth = col.dataset.pickMonth;
      renderAll();
      showToast(`แสดงข้อมูลประจำเดือน ${formatThaiMonth(state.selectedMonth)}`, '📈');
    });

    document.getElementById('targetCutoffDateInput').addEventListener('change', e => {
      if (e.target.value) {
        state.store.settings = { ...state.store.settings, targetDate: e.target.value, updatedAt: Date.now() };
        saveLocalStore();
        syncWithWifiServer(false);
        renderAll();
      }
    });

    document.getElementById('btnModeNetShortfall').addEventListener('click', () => {
      state.store.settings = { ...state.store.settings, targetMode: 'net_shortfall', updatedAt: Date.now() };
      saveLocalStore();
      syncWithWifiServer(false);
      renderAll();
    });

    document.getElementById('btnModeGrossUpcoming').addEventListener('click', () => {
      state.store.settings = { ...state.store.settings, targetMode: 'gross_upcoming', updatedAt: Date.now() };
      saveLocalStore();
      syncWithWifiServer(false);
      renderAll();
    });

    document.getElementById('btnExportCsvTx').addEventListener('click', exportCurrentTransactionsToCsv);
    document.getElementById('btnExportCsvFromDash').addEventListener('click', exportCurrentTransactionsToCsv);
    document.getElementById('btnPrintPdfTx').addEventListener('click', () => window.print());
    document.getElementById('btnPrintReportFromDash').addEventListener('click', () => window.print());

    document.querySelectorAll('[data-sch-offset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('schDueDateInput').value = getTodayStr(Number(btn.dataset.schOffset));
        renderUpcomingView();
      });
    });

    document.getElementById('scheduledOnlyForm').addEventListener('submit', e => {
      e.preventDefault();
      const rawTitle = document.getElementById('schTitleInput').value.trim();
      const amount = parseFloat(String(document.getElementById('schAmountInput').value || '').replace(/,/g, '')) || 0;
      const dueDate = document.getElementById('schDueDateInput').value || getTodayStr(7);
      const recurrence = document.getElementById('schRecurrenceSelect').value || 'none';
      const instCur = Number(document.getElementById('schInstCurInput').value || 1);
      const instTot = Number(document.getElementById('schInstTotalInput').value || 10);
      const category = document.getElementById('schCategorySelect').value || 'exp_bills';
      const note = document.getElementById('schNoteInput').value.trim();

      if (!amount || amount <= 0) {
        showToast('กรุณาระบุจำนวนเงินของรายจ่ายล่วงหน้าก่อนครับ', '⚠️');
        return;
      }
      const catObj = getCategoryById(category);
      const title = rawTitle || (catObj ? catObj.name : 'รายจ่ายล่วงหน้า');
      const now = Date.now();
      state.store.scheduledExpenses.push({
        id: `sch-${now}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        amount,
        category,
        dueDate,
        recurrence,
        installmentCurrent: recurrence === 'installment' ? instCur : 0,
        installmentTotal: recurrence === 'installment' ? instTot : 0,
        note,
        isPaid: false,
        updatedAt: now,
        device: deviceProfile.name,
        deleted: false
      });

      document.getElementById('schTitleInput').value = '';
      document.getElementById('schAmountInput').value = '';
      document.getElementById('schNoteInput').value = '';

      saveLocalStore();
      syncWithWifiServer(false);
      renderAll();
      showToast(`เพิ่มรายจ่ายล่วงหน้า "${title}" เรียบร้อยแล้ว`, '⏰');
    });

    document.getElementById('scheduledExpensesList').addEventListener('click', e => {
      const payBtn = e.target.closest('[data-pay-scheduled]');
      if (payBtn) {
        const item = state.store.scheduledExpenses.find(s => s.id === payBtn.dataset.payScheduled);
        if (item && !item.isPaid) {
          const now = Date.now();
          item.isPaid = true;
          item.updatedAt = now;

          const instSuffix = item.recurrence === 'installment'
            ? ` (งวดที่ ${item.installmentCurrent}/${item.installmentTotal})`
            : '';

          state.store.transactions.push({
            id: `tx-paid-${now}`,
            type: 'expense',
            amount: item.amount,
            category: item.category,
            title: `${item.title}${instSuffix}`,
            note: item.note || 'ชำระจากรายการล่วงหน้า',
            date: getTodayStr(0),
            createdAt: now,
            updatedAt: now,
            device: deviceProfile.name,
            deleted: false
          });

          let autoNextMsg = '';
          if (item.recurrence === 'monthly') {
            const nextDue = addMonthsToDateStr(item.dueDate, 1);
            state.store.scheduledExpenses.push({
              ...item,
              id: `sch-recur-${now}`,
              dueDate: nextDue,
              isPaid: false,
              updatedAt: now + 1
            });
            autoNextMsg = ` และสร้างงวดเดือนถัดไป (${formatThaiDate(nextDue, false)}) อัตโนมัติแล้ว!`;
          } else if (item.recurrence === 'weekly') {
            const nextDue = addDaysToDateStr(item.dueDate, 7);
            state.store.scheduledExpenses.push({
              ...item,
              id: `sch-recur-${now}`,
              dueDate: nextDue,
              isPaid: false,
              updatedAt: now + 1
            });
            autoNextMsg = ` และสร้างงวดสัปดาห์ถัดไปอัตโนมัติแล้ว!`;
          } else if (item.recurrence === 'installment' && Number(item.installmentCurrent) < Number(item.installmentTotal)) {
            const nextDue = addMonthsToDateStr(item.dueDate, 1);
            const nextInst = Number(item.installmentCurrent) + 1;
            state.store.scheduledExpenses.push({
              ...item,
              id: `sch-inst-${now}`,
              dueDate: nextDue,
              installmentCurrent: nextInst,
              isPaid: false,
              updatedAt: now + 1
            });
            autoNextMsg = ` และตั้งงวดถัดไป (${nextInst}/${item.installmentTotal}) อัตโนมัติแล้ว!`;
          }

          saveLocalStore();
          syncWithWifiServer(false);
          renderAll();
          showToast(`บันทึกจ่ายจริง "${item.title}"${autoNextMsg}`, '✅');
        }
        return;
      }

      const delBtn = e.target.closest('[data-del-scheduled]');
      if (delBtn) {
        const item = state.store.scheduledExpenses.find(s => s.id === delBtn.dataset.delScheduled);
        if (item) {
          item.deleted = true;
          item.updatedAt = Date.now();
          saveLocalStore();
          syncWithWifiServer(false);
          renderAll();
          showToast('ลบรายการรายจ่ายล่วงหน้าแล้ว', '🗑️');
        }
        return;
      }

      const setTarget = e.target.closest('[data-set-target-date]');
      if (setTarget) {
        const d = setTarget.dataset.setTargetDate;
        state.store.settings = { ...state.store.settings, targetDate: d, updatedAt: Date.now() };
        saveLocalStore();
        syncWithWifiServer(false);
        switchView('dashboard');
        showToast(`ตั้งวันที่เป้าหมายบนแดชบอร์ดเป็น ${formatThaiDate(d, false)} แล้ว`, '🎯');
      }
    });

    document.getElementById('btnViewDaily').addEventListener('click', () => {
      state.periodView = 'daily';
      renderAll();
    });

    document.getElementById('btnViewMonthly').addEventListener('click', () => {
      state.periodView = 'monthly';
      renderAll();
    });

    document.getElementById('monthPickerInput').addEventListener('change', e => {
      if (e.target.value) {
        state.selectedMonth = e.target.value;
        state.periodView = 'monthly';
        renderAll();
      }
    });

    document.querySelectorAll('[data-type-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.typeFilter = btn.dataset.typeFilter;
        renderAll();
      });
    });

    document.getElementById('categoryFilterSelect').addEventListener('change', e => {
      state.categoryFilter = e.target.value;
      renderAll();
    });

    document.getElementById('searchTxInput').addEventListener('input', e => {
      state.searchQuery = e.target.value;
      renderTransactionsView();
    });

    document.getElementById('btnSaveSyncHubUrl').addEventListener('click', async () => {
      const roomCode = document.getElementById('syncRoomCodeInput').value.trim() || 'KP-8899';
      state.store.settings = {
        ...state.store.settings,
        syncRoomCode: roomCode,
        updatedAt: Date.now()
      };
      saveLocalStore();
      currentP2pTopic = null;
      await initSameWifiP2pChannel();
      await autoDiscoverWifiHub();
      syncWithWifiServer(true);
      connectRealtimeStream();
    });

    document.getElementById('btnCopyLanUrl').addEventListener('click', () => {
      const url = isHttpsCloud ? window.location.href : CLOUD_APP_URL;
      navigator.clipboard.writeText(url).then(() => {
        showToast(`คัดลอกลิงก์ถาวร ${url} เรียบร้อยแล้ว`, '📋');
      });
    });

    document.getElementById('btnForceSyncNow').addEventListener('click', () => {
      initSameWifiP2pChannel();
      syncWithWifiServer(true);
    });

    document.getElementById('btnExportJsonBackup').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.store, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `krapaoflow-backup-${getTodayStr(0)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลดไฟล์สำรองข้อมูล .JSON เรียบร้อย', '💾');
    });

    document.getElementById('btnResetAllToZero').addEventListener('click', async () => {
      state.store.transactions = [];
      state.store.scheduledExpenses = [];
      state.store.resetEpoch = Date.now();
      saveLocalStore();
      pushToSameWifiP2pChannel('HARD_RESET').catch(() => {});
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/reset-zero`, { method: 'POST' });
        const data = await res.json();
        if (data.ok && data.store) {
          mergeIncomingStore(data.store, true);
        }
      } catch (e) {}
      renderAll();
      showToast('รีเซ็ตยอดเงินและรายการทั้งหมดเป็น 0 เรียบร้อยแล้ว!', '🔄');
    });

    window.addEventListener('online', () => {
      initSameWifiP2pChannel();
      syncWithWifiServer(true);
      connectRealtimeStream();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        initSameWifiP2pChannel();
        syncWithWifiServer(false, false);
      }
    });

    // Krungthai Connext & LINE Smart Import Event Handlers
    const btnOpenLineModal = document.getElementById('btnOpenLineImportModal');
    if (btnOpenLineModal) {
      btnOpenLineModal.addEventListener('click', () => {
        document.getElementById('lineImportModalBackdrop').classList.add('open');
      });
    }

    const btnCloseLineModal = document.getElementById('btnCloseLineImportModal');
    if (btnCloseLineModal) {
      btnCloseLineModal.addEventListener('click', () => {
        document.getElementById('lineImportModalBackdrop').classList.remove('open');
      });
    }

    // LINE Chat File Drag & Drop + File Selection
    const lineDropZone = document.getElementById('lineFileDropZone');
    const lineFileInput = document.getElementById('lineChatFileInput');

    if (lineDropZone && lineFileInput) {
      lineDropZone.addEventListener('click', () => {
        lineFileInput.click();
      });

      lineFileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          handleLineChatFile(e.target.files[0]);
        }
      });

      lineDropZone.addEventListener('dragover', e => {
        e.preventDefault();
        lineDropZone.style.background = '#ECFDF5';
        lineDropZone.style.borderColor = '#059669';
      });

      lineDropZone.addEventListener('dragleave', e => {
        e.preventDefault();
        lineDropZone.style.background = '#F8FAFC';
        lineDropZone.style.borderColor = '#06C755';
      });

      lineDropZone.addEventListener('drop', e => {
        e.preventDefault();
        lineDropZone.style.background = '#F8FAFC';
        lineDropZone.style.borderColor = '#06C755';
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleLineChatFile(e.dataTransfer.files[0]);
        }
      });
    }

    function handleLineChatFile(file) {
      if (!file) return;
      const titleEl = document.getElementById('lineDropZoneTitle');
      if (titleEl) titleEl.textContent = `📂 ไฟล์: ${file.name}`;

      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target.result || '';
        document.getElementById('lineImportTextarea').value = text;
        doParseAndRenderLineText();
        showToast(`อ่านไฟล์ "${file.name}" เรียบร้อยแล้ว!`, '📄');
      };
      reader.readAsText(file);
    }

    const btnPasteLine = document.getElementById('btnPasteClipboardLine');
    if (btnPasteLine) {
      btnPasteLine.addEventListener('click', async () => {
        const textarea = document.getElementById('lineImportTextarea');
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const clipText = await navigator.clipboard.readText();
            if (clipText && clipText.trim()) {
              textarea.value = clipText.trim();
              doParseAndRenderLineText();
              showToast('วางข้อความจากคลิปบอร์ดเรียบร้อยแล้ว!', '📋');
              return;
            }
          }
        } catch (e) {}
        textarea.focus();
        showToast('แตะค้างในช่องข้อความแล้วกด "วาง" (Paste) ได้เลยครับ', '👆');
      });
    }

    // Date Range Filter Controls inside LINE Import Modal
    const btnOpenLineStart = document.getElementById('btnOpenLineStartCal');
    if (btnOpenLineStart) btnOpenLineStart.addEventListener('click', () => openCustomCalendarModal('lineStart'));

    const btnOpenLineEnd = document.getElementById('btnOpenLineEndCal');
    if (btnOpenLineEnd) btnOpenLineEnd.addEventListener('click', () => openCustomCalendarModal('lineEnd'));

    document.querySelectorAll('[data-line-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-line-range]').forEach(b => {
          b.style.background = '';
          b.style.color = '';
          b.style.borderColor = '';
        });
        btn.style.background = '#0F172A';
        btn.style.color = '#FFF';
        btn.style.borderColor = '#0F172A';

        const mode = btn.dataset.lineRange;
        const startIn = document.getElementById('lineFilterStartInput');
        const endIn = document.getElementById('lineFilterEndInput');
        const startTxt = document.getElementById('lineFilterStartText');
        const endTxt = document.getElementById('lineFilterEndText');

        if (mode === 'all') {
          startIn.value = '';
          endIn.value = '';
          if (startTxt) startTxt.textContent = 'ตั้งแต่: ทั้งหมด';
          if (endTxt) endTxt.textContent = 'ถึง: ทั้งหมด';
        } else if (mode === 'today') {
          const t = getTodayStr(0);
          startIn.value = t;
          endIn.value = t;
          if (startTxt) startTxt.textContent = 'ตั้งแต่: ' + formatThaiDate(t, false);
          if (endTxt) endTxt.textContent = 'ถึง: ' + formatThaiDate(t, false);
        } else if (mode === '7d') {
          const s = getTodayStr(-6);
          const e = getTodayStr(0);
          startIn.value = s;
          endIn.value = e;
          if (startTxt) startTxt.textContent = 'ตั้งแต่: ' + formatThaiDate(s, false);
          if (endTxt) endTxt.textContent = 'ถึง: ' + formatThaiDate(e, false);
        } else if (mode === 'month') {
          const t = getTodayStr(0);
          const s = t.slice(0, 7) + '-01';
          startIn.value = s;
          endIn.value = t;
          if (startTxt) startTxt.textContent = 'ตั้งแต่: ' + formatThaiDate(s, false);
          if (endTxt) endTxt.textContent = 'ถึง: ' + formatThaiDate(t, false);
        }

        if ((document.getElementById('lineImportTextarea').value || '').trim()) {
          doParseAndRenderLineText();
        }
      });
    });

    const btnParseLine = document.getElementById('btnParseLineText');
    if (btnParseLine) {
      btnParseLine.addEventListener('click', () => {
        doParseAndRenderLineText();
      });
    }

    const btnClearLine = document.getElementById('btnClearLineText');
    if (btnClearLine) {
      btnClearLine.addEventListener('click', () => {
        document.getElementById('lineImportTextarea').value = '';
        document.getElementById('lineImportPreviewWrap').style.display = 'none';
        const titleEl = document.getElementById('lineDropZoneTitle');
        if (titleEl) titleEl.textContent = 'แตะที่นี่เพื่อเลือกไฟล์แชท LINE (.txt)';
        parsedLineItems = [];
      });
    }

    const btnConfirmLine = document.getElementById('btnConfirmSaveLineItems');
    if (btnConfirmLine) {
      btnConfirmLine.addEventListener('click', () => {
        const checkedItems = parsedLineItems.filter(item => item.checked);
        if (checkedItems.length === 0) {
          showToast('ไม่มีรายการใหม่ที่เลือกไว้สำหรับบันทึกครับ', '⚠️');
          return;
        }

        const now = Date.now();
        const todayStr = getTodayStr(0);

        checkedItems.forEach((item, idx) => {
          const noteParts = ['นำเข้าจาก Krungthai / LINE'];
          if (item.txTime) noteParts.push(`เวลา ${item.txTime}`);
          if (item.balanceAfter !== null && item.balanceAfter !== undefined) {
            noteParts.push(`ยอดคงเหลือ ${formatCurrency(item.balanceAfter)}`);
          }
          const noteStr = noteParts.join(' • ');

          if (item.date > todayStr) {
            state.store.scheduledExpenses.push({
              id: `sch-line-${now}-${idx}`,
              title: item.title,
              amount: item.amount,
              category: item.category || 'exp_bills',
              dueDate: item.date,
              recurrence: 'none',
              installmentCurrent: 0,
              installmentTotal: 0,
              note: noteStr,
              txTime: item.txTime || '',
              balanceAfter: item.balanceAfter !== undefined ? item.balanceAfter : null,
              importFingerprint: item.fingerprint,
              isPaid: false,
              updatedAt: now + idx,
              device: deviceProfile.name,
              deleted: false
            });
          } else {
            state.store.transactions.push({
              id: `tx-line-${now}-${idx}`,
              type: item.type,
              amount: item.amount,
              category: item.category || (item.type === 'income' ? 'inc_salary' : 'exp_bills'),
              title: item.title,
              note: noteStr,
              date: item.date,
              txTime: item.txTime || '',
              balanceAfter: item.balanceAfter !== undefined ? item.balanceAfter : null,
              importFingerprint: item.fingerprint,
              slipDataUrl: null,
              createdAt: now + idx,
              updatedAt: now + idx,
              device: deviceProfile.name,
              deleted: false
            });
          }
        });

        saveLocalStore();
        syncWithWifiServer(false);
        renderAll();
        document.getElementById('lineImportModalBackdrop').classList.remove('open');
        document.getElementById('lineImportTextarea').value = '';
        document.getElementById('lineImportPreviewWrap').style.display = 'none';
        const titleEl = document.getElementById('lineDropZoneTitle');
        if (titleEl) titleEl.textContent = 'แตะที่นี่เพื่อเลือกไฟล์แชท LINE (.txt)';
        parsedLineItems = [];
        showToast(`บันทึก ${checkedItems.length} รายการใหม่จาก LINE เรียบร้อยแล้ว!`, '🎉');
      });
    }
  }

  let parsedLineItems = [];

  function isDuplicateLineItem(item, seenInBatch) {
    // 1. Check within the same uploaded file
    if (seenInBatch.has(item.fingerprint)) return true;

    // 2. Check against existing active transactions & scheduled expenses
    const existingList = [
      ...activeTransactions(),
      ...activeScheduledExpenses().map(s => ({ ...s, date: s.dueDate, type: 'expense' }))
    ];

    for (const ex of existingList) {
      // Exact fingerprint match
      if (ex.importFingerprint && ex.importFingerprint === item.fingerprint) {
        return true;
      }

      // Composite match: Date + Time + Amount + Available Balance
      const sameDate = ex.date === item.date;
      const sameAmt = Math.abs(Number(ex.amount || 0) - Number(item.amount || 0)) < 0.005;
      if (!sameDate || !sameAmt) continue;

      const exTime = ex.txTime || '';
      const exBal = ex.balanceAfter !== undefined && ex.balanceAfter !== null ? Number(ex.balanceAfter) : null;

      if (item.txTime && exTime && item.balanceAfter !== null && exBal !== null) {
        if (item.txTime === exTime && Math.abs(item.balanceAfter - exBal) < 0.005) {
          return true;
        }
      } else if (item.txTime && exTime && item.txTime === exTime) {
        return true;
      } else if (item.balanceAfter !== null && exBal !== null && Math.abs(item.balanceAfter - exBal) < 0.005) {
        return true;
      }
    }
    return false;
  }

  function doParseAndRenderLineText() {
    const rawText = document.getElementById('lineImportTextarea').value || '';
    if (!rawText.trim()) {
      showToast('กรุณาเลือกไฟล์หรือวางข้อความจาก LINE ก่อนครับ', '⚠️');
      return;
    }

    const allParsed = parseLineOrBankText(rawText);
    const startDate = (document.getElementById('lineFilterStartInput') && document.getElementById('lineFilterStartInput').value) || '';
    const endDate = (document.getElementById('lineFilterEndInput') && document.getElementById('lineFilterEndInput').value) || '';

    const filteredByDate = allParsed.filter(item => {
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });

    const seenInBatch = new Set();
    parsedLineItems = filteredByDate.map(item => {
      const dup = isDuplicateLineItem(item, seenInBatch);
      seenInBatch.add(item.fingerprint);
      return {
        ...item,
        isDuplicate: dup,
        checked: !dup
      };
    });

    const wrap = document.getElementById('lineImportPreviewWrap');
    const countEl = document.getElementById('lineDetectedCount');
    const listEl = document.getElementById('lineParsedList');
    const incSumEl = document.getElementById('lineTotalIncomeSummary');
    const expSumEl = document.getElementById('lineTotalExpenseSummary');

    if (allParsed.length === 0) {
      showToast('ไม่พบรายการยอดเงินในไฟล์ กรุณาตรวจสอบไฟล์ที่เลือกครับ', '⚠️');
      wrap.style.display = 'none';
      return;
    }

    const newCount = parsedLineItems.filter(p => !p.isDuplicate).length;
    const dupCount = parsedLineItems.filter(p => p.isDuplicate).length;
    countEl.textContent = `${parsedLineItems.length} (ใหม่ ${newCount} • ซ้ำ ${dupCount})`;
    wrap.style.display = 'block';

    const updateSummaries = () => {
      const active = parsedLineItems.filter(p => p.checked);
      const inc = active.filter(p => p.type === 'income').reduce((s, p) => s + p.amount, 0);
      const exp = active.filter(p => p.type === 'expense').reduce((s, p) => s + p.amount, 0);
      if (incSumEl) incSumEl.textContent = `เลือกเพิ่ม รับ: +${formatCurrency(inc)}`;
      if (expSumEl) expSumEl.textContent = `จ่าย: -${formatCurrency(exp)}`;
    };

    updateSummaries();

    if (parsedLineItems.length === 0) {
      listEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.85rem;">ไม่มีรายการในช่วงวันที่ที่เลือก (พบทั้งหมดในไฟล์ ${allParsed.length} รายการ)</div>`;
      return;
    }

    listEl.innerHTML = parsedLineItems.map((item, idx) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:${item.isDuplicate ? '#F8FAFC' : '#FFFFFF'};border:1px solid ${item.isDuplicate ? '#E2E8F0' : 'var(--border-color)'};border-radius:10px;gap:10px;opacity:${item.isDuplicate ? '0.68' : '1'};">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;min-width:0;">
          <input type="checkbox" data-line-chk="${idx}" ${item.checked ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;" />
          <div style="min-width:0;">
            <div style="font-weight:700;font-size:0.86rem;color:var(--text-main);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span>${escapeHtml(item.title)}</span>
              ${item.isDuplicate ? '<span style="font-size:0.7rem;background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:999px;font-weight:700;">🔁 ซ้ำ (ข้ามอัตโนมัติ)</span>' : '<span style="font-size:0.7rem;background:#DCFCE7;color:#166534;padding:1px 6px;border-radius:999px;font-weight:700;">✨ ใหม่</span>'}
            </div>
            <div style="font-size:0.74rem;color:var(--text-secondary);">
              📅 ${formatThaiDate(item.date, false)}${item.txTime ? ` ⏰ ${item.txTime}` : ''} • <span style="font-weight:700;color:${item.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'};">${item.type === 'income' ? '📈 รายรับ' : '📉 รายจ่าย'}</span>${item.balanceAfter !== null ? ` • คงเหลือ ${formatCurrency(item.balanceAfter)}` : ''}
            </div>
          </div>
        </label>
        <div style="font-weight:800;font-size:1rem;color:${item.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'};white-space:nowrap;">
          ${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount)}
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-line-chk]').forEach(chk => {
      chk.addEventListener('change', () => {
        const i = Number(chk.dataset.lineChk);
        if (parsedLineItems[i]) parsedLineItems[i].checked = chk.checked;
        updateSummaries();
      });
    });
  }

  function parseLineOrBankText(text) {
    if (!text || !text.trim()) return [];

    const thaiMonths = {
      'ม.ค.': 1, 'มค': 1, 'ก.พ.': 2, 'กพ': 2, 'มี.ค.': 3, 'มีค': 3,
      'เม.ย.': 4, 'เมย': 4, 'พ.ค.': 5, 'พค': 5, 'มิ.ย.': 6, 'มิย': 6,
      'ก.ค.': 7, 'กค': 7, 'ส.ค.': 8, 'สค': 8, 'ก.ย.': 9, 'กย': 9,
      'ต.ค.': 10, 'ตค': 10, 'พ.ย.': 11, 'พย': 11, 'ธ.ค.': 12, 'ธค': 12
    };

    const currentYear = new Date().getFullYear();
    const todayStr = getTodayStr(0);

    const rawLines = text.split(/\r?\n/);
    const results = [];
    let currentDate = todayStr;
    let currentBlock = [];

    function processBlock(blockLines, fallbackDate) {
      if (!blockLines || blockLines.length === 0) return;
      const blockText = blockLines.join('\n');

      const hasMoney = /(?:เงินเข้า|เงินออก|จำนวนเงิน|จำนวน|ยอดเงิน|ยอดเงินที่ใช้ได้|ยอด|บาท|฿|โอนออก|โอนเข้า|ชำระ|ถอนเงิน|จ่ายเงิน)/.test(blockText);
      if (!hasMoney) return;

      let type = 'expense';
      if (/เงินเข้า|โอนเข้า|รับเงิน|ฝากเงิน|เงินโอนเข้า|รับโอน/i.test(blockText)) {
        type = 'income';
      }

      // 1. Separate available balance ("ยอดเงินที่ใช้ได้ X,XXX.XX บาท") FIRST so it never collides with transaction amount
      let balanceAfter = null;
      const balMatch = blockText.match(/ยอดเงินที่ใช้ได้\s*[:：]?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:บาท)?/);
      if (balMatch) {
        balanceAfter = parseFloat(balMatch[1].replace(/,/g, ''));
      }
      const textWithoutBalance = blockText.replace(/ยอดเงินที่ใช้ได้\s*[:：]?\s*[0-9,]+(?:\.[0-9]{1,2})?\s*(?:บาท)?/g, '');

      // 2. Extract transaction amount
      let amount = 0;
      const ktAmt = textWithoutBalance.match(/(?:เงินเข้า|เงินออก|โอนออก|โอนเข้า|โอนเงิน|ชำระเงิน|ถอนเงิน|จ่ายเงิน|จำนวนเงิน|จำนวน|ยอดเงิน|ยอด|฿)\s*[:：]?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:บาท)?/);
      if (ktAmt) {
        amount = parseFloat(ktAmt[1].replace(/,/g, ''));
      } else {
        const bahtMatch = textWithoutBalance.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*บาท/);
        if (bahtMatch) {
          amount = parseFloat(bahtMatch[1].replace(/,/g, ''));
        } else {
          const numbers = textWithoutBalance.match(/\b\d+(?:,\d{3})*(?:\.\d{2})?\b/g);
          if (numbers) {
            amount = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
          }
        }
      }

      if (!amount || isNaN(amount) || amount <= 0) return;

      // 3. Extract date & time
      let dateStr = fallbackDate || todayStr;
      let txTime = '';

      const lineTimeMatch = blockLines[0].match(/^(\d{1,2}:\d{2})(?:\t|\s)/);
      if (lineTimeMatch) {
        txTime = lineTimeMatch[1].padStart(5, '0');
      }

      const slashDateTime = blockText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}:\d{2}))?/);
      const thaiDateMatch = blockText.match(/(\d{1,2})\s*(ม\.ค\.|มค|ก\.พ\.|กพ|มี\.ค\.|มีค|เม\.ย\.|เมย|พ\.ค\.|พค|มิ\.ย\.|มิย|ก\.ค\.|กค|ส\.ค\.|สค|ก\.ย\.|กย|ต\.ค\.|ตค|พ\.ย\.|พย|ธ\.ค\.|ธค)(?:\s*(\d{2,4}))?(?:\s+(?:เวลา\s*)?(\d{1,2}:\d{2}))?/);

      if (slashDateTime) {
        const d = parseInt(slashDateTime[1], 10);
        const m = parseInt(slashDateTime[2], 10);
        let yr = parseInt(slashDateTime[3], 10);
        if (yr > 2500) yr -= 543;
        else if (yr >= 50 && yr <= 99) yr = (2500 + yr) - 543;
        else if (yr < 50) yr += 2000;
        dateStr = `${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (slashDateTime[4]) txTime = slashDateTime[4].padStart(5, '0');
      } else if (thaiDateMatch) {
        const d = parseInt(thaiDateMatch[1], 10);
        const m = thaiMonths[thaiDateMatch[2]];
        let y = currentYear;
        if (thaiDateMatch[3]) {
          let yr = parseInt(thaiDateMatch[3], 10);
          if (yr > 2500) yr -= 543;
          else if (yr >= 50 && yr <= 99) yr = (2500 + yr) - 543;
          else if (yr < 50) yr += 2000;
          y = yr;
        }
        dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (thaiDateMatch[4]) txTime = thaiDateMatch[4].padStart(5, '0');
      }

      // 4. Extract title
      let title = '';
      const toMatch = blockText.match(/(?:ไปยัง|โอนให้|ชำระให้|จ่ายให้)\s*([^\n\r]+)/);
      const fromMatch = blockText.match(/(?:รับจาก)\s*([^\n\r]+)/);
      const acctMatch = blockText.match(/(?:เข้าบัญชี|จากบัญชี|บัญชี)\s*([X\d\-]+)/i);

      if (toMatch) {
        title = `โอนไป ${toMatch[1].trim()}`;
      } else if (fromMatch && type === 'income') {
        title = `รับจาก ${fromMatch[1].trim()}`;
      } else if (acctMatch) {
        title = `${type === 'income' ? 'เงินเข้าบัญชี' : 'เงินออกบัญชี'} ${acctMatch[1]}`;
      } else {
        const cleanFirstLine = blockLines[0].replace(/^\d{1,2}:\d{2}\s*(?:[^\t]+\t)?/, '').trim();
        title = cleanFirstLine || (type === 'income' ? 'เงินเข้า Krungthai' : 'เงินออก Krungthai');
      }

      let category = type === 'income' ? 'inc_salary' : 'exp_bills';
      if (/อาหาร|ข้าว|ก๋วยเตี๋ยว|ขนม|กาแฟ|7-eleven|food/i.test(title)) category = 'exp_food';
      else if (/น้ำมัน|รถ|ทางด่วน|ptt|bcp|shell/i.test(title)) category = 'exp_transport';

      const fingerprint = `${dateStr}|${txTime}|${type}|${amount.toFixed(2)}|${balanceAfter !== null ? balanceAfter.toFixed(2) : ''}`;

      results.push({
        id: `import-${Date.now()}-${results.length}`,
        type,
        amount,
        date: dateStr,
        txTime,
        balanceAfter,
        fingerprint,
        title,
        category,
        checked: true
      });
    }

    const isLineChatExport = text.includes('[LINE]') || text.includes('ประวัติการแชท') || /^\d{1,2}:\d{2}\t/m.test(text);

    if (isLineChatExport) {
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;

        const dHeader = line.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/);
        if (dHeader) {
          if (currentBlock.length > 0) {
            processBlock(currentBlock, currentDate);
            currentBlock = [];
          }
          currentDate = `${dHeader[1]}-${String(dHeader[2]).padStart(2, '0')}-${String(dHeader[3]).padStart(2, '0')}`;
          continue;
        }

        const isNewMsg = /^\d{1,2}:\d{2}(?:\t|\s{2,})/.test(line);
        if (isNewMsg) {
          if (currentBlock.length > 0) {
            processBlock(currentBlock, currentDate);
            currentBlock = [];
          }
        }
        currentBlock.push(line);
      }

      if (currentBlock.length > 0) {
        processBlock(currentBlock, currentDate);
      }
    } else {
      let rawBlocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
      if (rawBlocks.length === 1 && text.includes('\n')) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.every(l => /\d+/.test(l))) rawBlocks = lines;
      }
      for (const block of rawBlocks) {
        processBlock(block.split('\n'), todayStr);
      }
    }

    return results;
  }

  function shiftSelectedDate(deltaDays) {
    const [y, m, d] = state.selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    state.selectedDate = `${ny}-${nm}-${nd}`;
    state.selectedMonth = `${ny}-${nm}`;
    document.getElementById('entryDateInput').value = state.selectedDate;
    renderAll();
  }

  function init() {
    loadLocalStore();
    document.getElementById('entryDateInput').value = state.selectedDate;
    renderAll();
    initEvents();

    // Unregister any stuck Service Workers & clear stale caches so iPad always runs the latest code
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister().catch(() => {}));
      }).catch(() => {});

      if ('caches' in window) {
        caches.keys().then(keys => {
          keys.forEach(k => caches.delete(k).catch(() => {}));
        }).catch(() => {});
      }
    }

    initSameWifiP2pChannel();
    syncWithWifiServer(false, false);
    connectRealtimeStream();

    setInterval(() => {
      syncWithWifiServer(false, false);
    }, 6000);

    // Check if Wi-Fi network changed every 15 seconds
    setInterval(() => {
      initSameWifiP2pChannel();
    }, 15000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
