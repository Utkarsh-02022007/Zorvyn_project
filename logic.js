
// ------------------------------
// Application state (global variables)
// ------------------------------
// `role` controls whether the user is admin or viewer;
// admin can add/edit transactions while viewer can only browse.
let role = 'admin';

// `currentSection` tracks which dashboard tab is active.
let currentSection = 'overview';

// `editingId` holds an ID when the modal is in edit mode; null for add mode.
let editingId = null;

// Sorting state for transaction table.
let sortCol = 'date', sortDir = -1;

// Filter/search state for transaction list.
let filterType = '', filterCat = '', searchQ = '';

// Color palette for categories used by charts.
const COLORS = {
  Food: '#378ADD', Transport: '#1D9E75', Housing: '#D85A30',
  Entertainment: '#7F77DD', Health: '#D4537E', Shopping: '#BA7517',
  Salary: '#639922', Freelance: '#0F6E56', Other: '#888780'
};

let txns = [
  {id:1,desc:'Monthly Salary',amount:5200,cat:'Salary',type:'income',date:'2025-03-01'},
  {id:2,desc:'Apartment Rent',amount:1400,cat:'Housing',type:'expense',date:'2025-03-02'},
  {id:3,desc:'Grocery Store',amount:185,cat:'Food',type:'expense',date:'2025-03-04'},
  {id:4,desc:'Freelance Project',amount:950,cat:'Freelance',type:'income',date:'2025-03-06'},
  {id:5,desc:'Netflix',amount:18,cat:'Entertainment',type:'expense',date:'2025-03-07'},
  {id:6,desc:'Gym Membership',amount:45,cat:'Health',type:'expense',date:'2025-03-09'},
  {id:7,desc:'Uber Rides',amount:62,cat:'Transport',type:'expense',date:'2025-03-11'},
  {id:8,desc:'Dinner Out',amount:94,cat:'Food',type:'expense',date:'2025-03-13'},
  {id:9,desc:'Amazon Shopping',amount:137,cat:'Shopping',type:'expense',date:'2025-03-15'},
  {id:10,desc:'Monthly Salary',amount:5200,cat:'Salary',type:'income',date:'2025-02-01'},
  {id:11,desc:'Apartment Rent',amount:1400,cat:'Housing',type:'expense',date:'2025-02-02'},
  {id:12,desc:'Grocery Store',amount:210,cat:'Food',type:'expense',date:'2025-02-05'},
  {id:13,desc:'Cinema Tickets',amount:32,cat:'Entertainment',type:'expense',date:'2025-02-08'},
  {id:14,desc:'Doctor Visit',amount:120,cat:'Health',type:'expense',date:'2025-02-12'},
  {id:15,desc:'Bus Pass',amount:40,cat:'Transport',type:'expense',date:'2025-02-14'},
  {id:16,desc:'Bonus Payment',amount:700,cat:'Salary',type:'income',date:'2025-02-18'},
  {id:17,desc:'Clothes Shopping',amount:180,cat:'Shopping',type:'expense',date:'2025-02-21'},
  {id:18,desc:'Monthly Salary',amount:5200,cat:'Salary',type:'income',date:'2025-01-01'},
  {id:19,desc:'Apartment Rent',amount:1400,cat:'Housing',type:'expense',date:'2025-01-02'},
  {id:20,desc:'Grocery Store',amount:165,cat:'Food',type:'expense',date:'2025-01-07'},
  {id:21,desc:'Spotify',amount:10,cat:'Entertainment',type:'expense',date:'2025-01-09'},
  {id:22,desc:'Freelance Project',amount:600,cat:'Freelance',type:'income',date:'2025-01-15'},
  {id:23,desc:'Pharmacy',amount:35,cat:'Health',type:'expense',date:'2025-01-20'},
];

let nextId = 24;
let trendChart = null, catChart = null, insightCatChart = null;

// Aggregate totals across all transactions.
// Returns income, expense, and net balance.
function totals() {
  let income = 0, expense = 0;
  txns.forEach(t => t.type === 'income' ? income += t.amount : expense += t.amount);
  return { income, expense, balance: income - expense };
}

// Group transactions by month and aggregate income/expenses per month.
function byMonth() {
  const months = {};
  txns.forEach(t => {
    const m = t.date.slice(0,7);
    if(!months[m]) months[m] = {income:0,expense:0};
    months[m][t.type] += t.amount;
  });
  return months;
}

// Aggregate expense totals by category for insights and charts.
function byCat() {
  const cats = {};
  txns.filter(t=>t.type==='expense').forEach(t => {
    cats[t.cat] = (cats[t.cat]||0) + t.amount;
  });
  return cats;
}

// Switch user role dynamically (admin/viewer) and re-render.
function changeRole(v) { role = v; render(); }

// Switch between dashboard tabs and update active nav styling.
function showSection(s) {
  currentSection = s;
  document.querySelectorAll('.nav-item').forEach((el,i) => {
    el.classList.toggle('active', ['overview','transactions','insights'][i]===s);
  });
  document.getElementById('page-title').textContent = {overview:'Overview',transactions:'Transactions',insights:'Insights'}[s];
  render();
}

// Main render routine. Rebuilds the page content for the current section and redraws charts.
function render() {
  if(trendChart) { trendChart.destroy(); trendChart = null; }
  if(catChart) { catChart.destroy(); catChart = null; }
  if(insightCatChart) { insightCatChart.destroy(); insightCatChart = null; }
  const c = document.getElementById('content');
  if(currentSection==='overview') c.innerHTML = overviewHTML();
  else if(currentSection==='transactions') c.innerHTML = transactionsHTML();
  else c.innerHTML = insightsHTML();
  if(currentSection==='overview') renderCharts();
  else if(currentSection==='insights') renderInsightCharts();
}

// Build HTML for the Overview panel with summary metrics and chart containers.
function overviewHTML() {
  const {income,expense,balance} = totals();
  const savingsRate = income > 0 ? ((income-expense)/income*100).toFixed(1) : 0;
  return `
    <div class="cards-row">
      <div class="metric-card"><div class="metric-label">Total Balance</div><div class="metric-value">$${balance.toLocaleString()}</div><div class="metric-sub up">Available funds</div></div>
      <div class="metric-card"><div class="metric-label">Total Income</div><div class="metric-value">$${income.toLocaleString()}</div><div class="metric-sub up">All time</div></div>
      <div class="metric-card"><div class="metric-label">Total Expenses</div><div class="metric-value">$${expense.toLocaleString()}</div><div class="metric-sub down">All time</div></div>
      <div class="metric-card"><div class="metric-label">Savings Rate</div><div class="metric-value">${savingsRate}%</div><div class="metric-sub up">Income saved</div></div>
    </div>
    <div class="charts-row">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Monthly cash flow</span><span class="panel-sub">Jan – Mar 2025</span></div>
        <div class="chart-wrap" style="height:220px;"><canvas id="trendChart"></canvas></div>
        <div class="legend">
          <div class="leg-item"><div class="leg-dot" style="background:#1D9E75"></div>Income</div>
          <div class="leg-item"><div class="leg-dot" style="background:#D85A30"></div>Expenses</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Spending by category</span></div>
        <div class="chart-wrap" style="height:180px;"><canvas id="catChart"></canvas></div>
      </div>
    </div>`;
}

function renderCharts() {
  const months = byMonth();
  const labels = Object.keys(months).sort();
  const incomeData = labels.map(m => months[m].income);
  const expenseData = labels.map(m => months[m].expense);
  const prettyLabels = labels.map(m => { const d=new Date(m+'-01'); return d.toLocaleString('default',{month:'short'})+' '+d.getFullYear(); });

  trendChart = new Chart(document.getElementById('trendChart'), {
    type: 'bar',
    data: {
      labels: prettyLabels,
      datasets: [
        { label:'Income', data: incomeData, backgroundColor:'#1D9E75', borderRadius:4, barPercentage:0.5 },
        { label:'Expenses', data: expenseData, backgroundColor:'#D85A30', borderRadius:4, barPercentage:0.5 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false} },
      scales:{
        x:{ ticks:{font:{size:11}}, grid:{display:false} },
        y:{ ticks:{font:{size:11}, callback:v=>'$'+v.toLocaleString()}, grid:{color:'rgba(120,120,120,0.1)'} }
      }
    }
  });

  const cats = byCat();
  const catLabels = Object.keys(cats);
  const catData = catLabels.map(c=>cats[c]);
  const catColors = catLabels.map(c=>COLORS[c]||'#888780');

  catChart = new Chart(document.getElementById('catChart'), {
    type: 'doughnut',
    data: { labels: catLabels, datasets:[{ data: catData, backgroundColor: catColors, borderWidth:0, hoverOffset:4 }] },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:'68%',
      plugins:{
        legend:{display:true, position:'right', labels:{font:{size:10}, boxWidth:10, padding:8}}
      }
    }
  });
}

// Compute filtered and sorted transactions for the Transactions table view.
function filteredTxns() {
  let list = [...txns];
  if(searchQ) list = list.filter(t=>t.desc.toLowerCase().includes(searchQ.toLowerCase())||t.cat.toLowerCase().includes(searchQ.toLowerCase()));
  if(filterType) list = list.filter(t=>t.type===filterType);
  if(filterCat) list = list.filter(t=>t.cat===filterCat);
  list.sort((a,b)=>{
    let av=a[sortCol], bv=b[sortCol];
    if(sortCol==='amount'){av=+av;bv=+bv;}
    return av<bv?-sortDir:av>bv?sortDir:0;
  });
  return list;
}

function transactionsHTML() {
  const list = filteredTxns();
  const adminBtns = role==='admin' ? `<button class="add-btn" onclick="openModal()">+ Add transaction</button>` : '';
  const allCats = [...new Set(txns.map(t=>t.cat))].sort();
  const rows = list.length===0 ? `<tr><td colspan="6" class="empty">No transactions found</td></tr>` :
    list.map(t=>`
      <tr>
        <td>${t.date}</td>
        <td>${t.desc}</td>
        <td>${t.cat}</td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td class="amt-${t.type}">${t.type==='income'?'+':'-'}$${t.amount.toLocaleString()}</td>
        ${role==='admin'?`<td><button onclick="openEdit(${t.id})" style="font-size:11px;padding:3px 8px;border-radius:var(--border-radius-md);cursor:pointer;background:none;border:0.5px solid var(--color-border-secondary);color:var(--color-text-secondary);">Edit</button></td>`:'<td></td>'}
      </tr>`).join('');

  const arrow = col => sortCol===col?(sortDir===1?'↑':'↓'):'';

  return `
    <div class="panel">
      <div class="panel-header"><span class="panel-title">All Transactions</span>${adminBtns}</div>
      <div class="txn-controls">
        <input placeholder="Search..." oninput="searchQ=this.value;render()" value="${searchQ}" />
        <select onchange="filterType=this.value;render()">
          <option value="">All types</option>
          <option value="income" ${filterType==='income'?'selected':''}>Income</option>
          <option value="expense" ${filterType==='expense'?'selected':''}>Expense</option>
        </select>
        <select onchange="filterCat=this.value;render()">
          <option value="">All categories</option>
          ${allCats.map(c=>`<option ${filterCat===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <table>
        <thead><tr>
          <th onclick="setSort('date')">Date ${arrow('date')}</th>
          <th onclick="setSort('desc')">Description ${arrow('desc')}</th>
          <th onclick="setSort('cat')">Category ${arrow('cat')}</th>
          <th onclick="setSort('type')">Type ${arrow('type')}</th>
          <th onclick="setSort('amount')">Amount ${arrow('amount')}</th>
          <th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Set sorting column and direction for transaction table and redraw.
function setSort(col) {
  if(sortCol===col) sortDir*=-1; else { sortCol=col; sortDir=1; }
  render();
}

// Build HTML for the Insights panel with top category metrics and progress bars.
function insightsHTML() {
  const cats = byCat();
  const topCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]||['—',0];
  const months = byMonth();
  const mkeys = Object.keys(months).sort();
  const last = months[mkeys[mkeys.length-1]]||{expense:0};
  const prev = months[mkeys[mkeys.length-2]]||{expense:0};
  const diff = last.expense - prev.expense;
  const {income,expense} = totals();
  const savePct = income > 0 ? ((income-expense)/income*100).toFixed(1) : 0;

  return `
    <div class="insights-row">
      <div class="insight-card"><div class="insight-label">Top spending category</div><div class="insight-val">${topCat[0]}</div><div class="insight-note">$${topCat[1].toLocaleString()} total</div></div>
      <div class="insight-card"><div class="insight-label">Month-over-month expenses</div><div class="insight-val" style="color:${diff>0?'#D85A30':'#1D9E75'}">${diff>=0?'+':''} $${Math.abs(diff).toLocaleString()}</div><div class="insight-note">vs previous month</div></div>
      <div class="insight-card"><div class="insight-label">Savings rate</div><div class="insight-val">${savePct}%</div><div class="insight-note">of total income saved</div></div>
    </div>
    <div class="charts-row">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Spending breakdown</span></div>
        <div class="chart-wrap" style="height:${Math.max(200, Object.keys(cats).length*38)}px;"><canvas id="insightCatChart"></canvas></div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Category details</span></div>
        ${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>{
          const pct = Math.round(val/Object.values(cats).reduce((a,b)=>a+b,0)*100);
          return `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
              <span style="color:var(--color-text-primary)">${cat}</span>
              <span style="color:var(--color-text-secondary)">$${val.toLocaleString()} (${pct}%)</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${COLORS[cat]||'#888'}"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// Render horizontal bar chart for category spending on Insights tab.
function renderInsightCharts() {
  const cats = byCat();
  const labels = Object.keys(cats).sort((a,b)=>cats[b]-cats[a]);
  const data = labels.map(c=>cats[c]);
  const colors = labels.map(c=>COLORS[c]||'#888780');
  insightCatChart = new Chart(document.getElementById('insightCatChart'), {
    type: 'bar',
    data: { labels, datasets:[{ data, backgroundColor:colors, borderRadius:4, barPercentage:0.6 }] },
    options: {
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{font:{size:11},callback:v=>'$'+v},grid:{color:'rgba(120,120,120,0.1)'}},
        y:{ticks:{font:{size:11}},grid:{display:false}}
      }
    }
  });
}

// Open transaction modal in add mode (clears inputs).
function openModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add transaction';
  document.getElementById('m-desc').value='';
  document.getElementById('m-amount').value='';
  document.getElementById('m-cat').value='Food';
  document.getElementById('m-type').value='expense';
  document.getElementById('m-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('modal').classList.add('open');
}

// Open transaction modal in edit mode and prefill fields from existing data.
function openEdit(id) {
  const t = txns.find(x=>x.id===id);
  if(!t) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit transaction';
  document.getElementById('m-desc').value=t.desc;
  document.getElementById('m-amount').value=t.amount;
  document.getElementById('m-cat').value=t.cat;
  document.getElementById('m-type').value=t.type;
  document.getElementById('m-date').value=t.date;
  document.getElementById('modal').classList.add('open');
}

// Close transaction modal overlay.
function closeModal() { document.getElementById('modal').classList.remove('open'); }

// Validate and save transaction data from modal, either creating or updating record.
function saveTransaction() {
  const desc = document.getElementById('m-desc').value.trim();
  const amount = parseFloat(document.getElementById('m-amount').value);
  const cat = document.getElementById('m-cat').value;
  const type = document.getElementById('m-type').value;
  const date = document.getElementById('m-date').value;
  if(!desc||!amount||!date) return;
  if(editingId) {
    const idx = txns.findIndex(t=>t.id===editingId);
    if(idx>=0) txns[idx]={id:editingId,desc,amount,cat,type,date};
  } else {
    txns.push({id:nextId++,desc,amount,cat,type,date});
  }
  closeModal();
  render();
}

render();
