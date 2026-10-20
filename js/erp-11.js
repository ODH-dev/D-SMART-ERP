
(function () {
    "use strict";

    const DEMO_DATE = "2024-10-18";

    const sites = {
        W002: "A건설현장",
        W003: "B건설현장",
        W004: "C건설현장"
    };

    const safetyDefaults = {
        C001: 80,
        C008: 100,
        C010: 200,
        C011: 30,
        C022: 20
    };

    const money = value =>
        Number(value || 0).toLocaleString("ko-KR") + "원";

    const number = value =>
        Number(value || 0).toLocaleString("ko-KR");

    const escapeHTML = value =>
        String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

    function demoState() {
        return {
            seq: 2403,

            budgets: {
                W002: {
                    budget: 500000000,
                    baseline: 320000000
                },
                W003: {
                    budget: 300000000,
                    baseline: 270000000
                },
                W004: {
                    budget: 200000000,
                    baseline: 210000000
                }
            },

            requests: [
                {
                    id: "REQ-2401",
                    site: "W002",
                    code: "C010",
                    qty: 100,
                    price: 8500,
                    partner: "한빛건설자재",
                    date: "2024-10-15",
                    due: "2024-10-20",
                    status: "대기"
                },
                {
                    id: "REQ-2402",
                    site: "W003",
                    code: "C001",
                    qty: 50,
                    price: 12000,
                    partner: "대한안전산업",
                    date: "2024-10-14",
                    due: "2024-10-17",
                    status: "승인"
                }
            ],

            expenses: [
                {
                    site: "W002",
                    category: "자재비",
                    amount: 2400000,
                    date: "2024-10-15"
                },
                {
                    site: "W003",
                    category: "인건비",
                    amount: 1800000,
                    date: "2024-10-16"
                },
                {
                    site: "W004",
                    category: "장비비",
                    amount: 950000,
                    date: "2024-10-17"
                }
            ],

            audit: [
                {
                    id: "REQ-2402",
                    action: "승인",
                    actor: "관리자",
                    date: "2024-10-16"
                }
            ]
        };
    }

    function ensureState(target) {
        if (!target.erp19) {
            target.erp19 = demoState();
        }

        return target.erp19;
    }

    ensureState(data);
    save();

    document.title = "D SMART ERP v1.9";

    const version =
        document.querySelector(".sidebar .notice");

    if (version) {
        version.textContent = "D SMART ERP v1.9";
    }

    // =====================================
    // 공통 데이터 처리
    // =====================================

    function productName(code) {
        return data.products.find(p => p.code === code)?.name
            || code;
    }

    function productOptions() {
        return data.products.map(p => `
            <option value="${escapeHTML(p.code)}">
                ${escapeHTML(p.code)} - ${escapeHTML(p.name)}
            </option>
        `).join("");
    }

    function siteOptions() {
        return Object.entries(sites).map(([code, name]) => `
            <option value="${code}">
                ${escapeHTML(name)}
            </option>
        `).join("");
    }

    function getStocks(target, code) {
        const product = target.products.find(
            p => p.code === code
        );

        if (!product) {
            throw new Error("제품을 찾을 수 없습니다.");
        }

        target.locationStocks ||= {};

        if (!target.locationStocks[code]) {
            target.locationStocks[code] = {
                W001: product.stock,
                W002: 0,
                W003: 0,
                W004: 0,
                W005: 0
            };
        }

        const stocks = target.locationStocks[code];

        const total = Object.values(stocks).reduce(
            (sum, qty) => sum + Number(qty || 0), 0
        );

        if (total !== product.stock) {
            throw new Error(
                "창고별 재고와 전체 재고가 일치하지 않습니다. " +
                "데이터를 확인해 주세요."
            );
        }

        return { product, stocks };
    }

    function commitTransaction(handler) {
        try {
            const next = JSON.parse(JSON.stringify(data));

            ensureState(next);
            handler(next);

            localStorage.setItem(
                storageKey,
                JSON.stringify(next)
            );

            data = next;

            render();
            renderPage(activePage);

        } catch (error) {
            alert("처리 실패: " + error.message);
        }
    }

    function validQty(value) {
        const qty = Number(value);

        if (!Number.isSafeInteger(qty) || qty <= 0) {
            throw new Error("수량은 1 이상의 정수여야 합니다.");
        }

        return qty;
    }

    function validAmount(value) {
        const amount = Number(value);

        if (!Number.isSafeInteger(amount) || amount < 0) {
            throw new Error("금액은 0 이상의 정수여야 합니다.");
        }

        return amount;
    }

    function validDate(value) {
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            value < "2023-01-01" ||
            value > "2024-10-31"
        ) {
            throw new Error("등록 가능 기간(2023-01-01~2024-10-31) 내 날짜를 선택하세요.");
        }

        return value;
    }

    function table(headers, rows) {
        return `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h =>
                                `<th>${escapeHTML(h)}</th>`
                            ).join("")}
                        </tr>
                    </thead>
                    <tbody>${rows.join("")}</tbody>
                </table>
            </div>
        `;
    }

    function cards(items) {
        return `
            <div class="erp19-grid">
                ${items.map(([label, value]) => `
                    <div class="erp19-card">
                        <span>${escapeHTML(label)}</span>
                        <strong>${escapeHTML(value)}</strong>
                    </div>
                `).join("")}
            </div>
        `;
    }

    function panel(title, content) {
        return `
            <section class="erp19-panel">
                <h2>${title}</h2>
                ${content}
            </section>
        `;
    }

    function button(label, action, id, disabled = false) {
        return `
            <button
                class="erp19-btn"
                data-action="${action}"
                data-id="${escapeHTML(id)}"
                ${disabled ? "disabled" : ""}
            >${label}</button>
        `;
    }

    // =====================================
    // 메뉴 생성
    // =====================================

    const menuList = [
        ["erp19-flow", "🚚 통합 물류관리"],
        ["erp19-budget", "💵 현장 원가·예산관리"],
        ["erp19-approval", "📋 전자결재관리"],
        ["erp19-analysis", "📈 경영분석"],
        ["erp19-alerts", "🔔 통합 알림센터"]
    ];

    const sidebar = document.querySelector(".sidebar");

    const menuButtons = {};

    menuList.forEach(([key, title]) => {
        const btn = document.createElement("button");

        btn.textContent = title;

        btn.addEventListener("click", () => {
            window.showPage(key, btn);
        });

        sidebar.insertBefore(btn, version);

        menuButtons[key] = btn;
    });

    const page = document.createElement("div");

    page.id = "erp19Page";
    page.className = "page";

    document.querySelector(".main").appendChild(page);

    let activePage = "erp19-flow";

    // =====================================
    // 1. 통합 물류관리
    // =====================================

    function renderFlow() {
        const state = ensureState(data);

        const pending = state.requests.filter(
            r => r.status === "대기"
        ).length;

        const approved = state.requests.filter(
            r => r.status === "승인"
        ).length;

        const received = state.requests.filter(
            r => r.status === "입고완료"
        ).length;

        const rows = state.requests.map(r => `
            <tr>
                <td>${escapeHTML(r.id)}</td>
                <td>${escapeHTML(sites[r.site])}</td>
                <td>${escapeHTML(productName(r.code))}</td>
                <td>${number(r.qty)}</td>
                <td>${money(r.qty * r.price)}</td>
                <td>${escapeHTML(r.partner)}</td>
                <td>${escapeHTML(r.due)}</td>
                <td>${escapeHTML(r.status)}</td>
                <td>
                    ${button(
                        "📦 입고처리",
                        "receive",
                        r.id,
                        r.status !== "승인"
                    )}
                </td>
            </tr>
        `);

        return `
            ${cards([
                ["구매요청", state.requests.length + "건"],
                ["승인대기", pending + "건"],
                ["입고대기", approved + "건"],
                ["입고완료", received + "건"]
            ])}

            ${panel("① 통합 업무 프로세스", `
                <div class="erp19-flow">
                    <span>구매요청</span>
                    <span>→ 전자결재</span>
                    <span>→ 입고</span>
                    <span>→ 현장 이동</span>
                    <span>→ 자재 사용</span>
                    <span>→ 원가 반영</span>
                </div>
            `)}

            ${panel("② 신규 구매요청 등록", `
                <form class="erp19-form" data-form="request">
                    <label>현장
                        <select name="site" required>
                            ${siteOptions()}
                        </select>
                    </label>

                    <label>자재
                        <select name="code" required>
                            ${productOptions()}
                        </select>
                    </label>

                    <label>공급업체
                        <input name="partner"
                               value="한빛건설자재"
                               required maxlength="80">
                    </label>

                    <label>수량
                        <input name="qty" type="number"
                               min="1" step="1" required>
                    </label>

                    <label>단가
                        <input name="price" type="number"
                               min="0" step="1" required>
                    </label>

                    <label>요청일
                        <input name="date" type="date"
                               value="${DEMO_DATE}"
                               min="2023-01-01"
                               max="2024-10-31" required>
                    </label>

                    <label>납기일
                        <input name="due" type="date"
                               value="2024-10-25"
                               min="2023-01-01"
                               max="2024-10-31" required>
                    </label>

                    <button class="erp19-btn" type="submit">
                        구매요청 등록
                    </button>
                </form>
            `)}

            ${panel("③ 구매·입고 현황", `
                ${table(
                    ["요청번호","현장","품목","수량",
                     "금액","공급업체","납기일","상태","처리"],
                    rows
                )}
            `)}

            ${panel("④ 본사 → 건설현장 자재 이동", `
                <form class="erp19-form" data-form="transfer">
                    <label>도착 현장
                        <select name="site">${siteOptions()}</select>
                    </label>

                    <label>자재
                        <select name="code">${productOptions()}</select>
                    </label>

                    <label>이동수량
                        <input name="qty" type="number"
                               min="1" step="1" required>
                    </label>

                    <button class="erp19-btn" type="submit">
                        자재 이동
                    </button>
                </form>

                <p class="erp19-note">
                    본사 창고(W001)의 재고를 선택한 현장으로 이동합니다.
                    전체 재고 수량은 변경되지 않습니다.
                </p>
            `)}

            ${panel("⑤ 현장 자재 사용 처리", `
                <form class="erp19-form" data-form="usage">
                    <label>사용 현장
                        <select name="site">${siteOptions()}</select>
                    </label>

                    <label>자재
                        <select name="code">${productOptions()}</select>
                    </label>

                    <label>사용수량
                        <input name="qty" type="number"
                               min="1" step="1" required>
                    </label>

                    <label>원가 단가
                        <input name="price" type="number"
                               min="0" step="1" required>
                    </label>

                    <button class="erp19-btn" type="submit">
                        사용 처리 및 원가 반영
                    </button>
                </form>

                <p class="erp19-note">
                    현장에서 실제 사용한 수량만큼 전체 재고가 감소하고,
                    입력한 단가를 기준으로 현장 자재비가 기록됩니다.
                </p>
            `)}
        `;
    }

    // =====================================
    // 2. 현장 원가·예산관리
    // =====================================

    function spent(site) {
        const state = ensureState(data);

        const baseline = state.budgets[site].baseline;

        const extra = state.expenses
            .filter(e => e.site === site)
            .reduce((sum, e) => sum + e.amount, 0);

        return baseline + extra;
    }

    function renderBudget() {
        const state = ensureState(data);

        const rows = Object.entries(sites).map(([code, name]) => {
            const budget = state.budgets[code].budget;
            const cost = spent(code);
            const rate = budget > 0
                ? cost / budget * 100
                : 0;

            return `
                <tr>
                    <td>${escapeHTML(name)}</td>
                    <td>${money(budget)}</td>
                    <td>${money(cost)}</td>
                    <td>${rate.toFixed(1)}%</td>
                    <td>
                        <div class="erp19-progress">
                            <div style="width:${Math.min(rate,100)}%;
                                background:${rate > 100
                                    ? "#dc2626"
                                    : "#2563eb"}">
                            </div>
                        </div>
                    </td>
                    <td class="${rate > 100 ? "erp19-warning" : ""}">
                        ${rate > 100 ? "예산초과" : "정상"}
                    </td>
                </tr>
            `;
        });

        const totalBudget = Object.values(state.budgets)
            .reduce((s, b) => s + b.budget, 0);

        const totalSpent = Object.keys(sites)
            .reduce((s, code) => s + spent(code), 0);

        const expenseRows = state.expenses.map(e => `
            <tr>
                <td>${escapeHTML(e.date)}</td>
                <td>${escapeHTML(sites[e.site])}</td>
                <td>${escapeHTML(e.category)}</td>
                <td>${money(e.amount)}</td>
            </tr>
        `);

        return `
            ${cards([
                ["전체 현장예산", money(totalBudget)],
                ["누적 집행금액", money(totalSpent)],
                ["잔여 예산", money(totalBudget - totalSpent)],
                ["예산초과 현장",
                    Object.keys(sites).filter(code =>
                        spent(code) > state.budgets[code].budget
                    ).length + "곳"]
            ])}

            ${panel("① 현장별 예산 집행현황", `
                ${table(
                    ["현장명","총예산","집행금액",
                     "집행률","진행률","상태"],
                    rows
                )}

                <p class="erp19-note">
                    
                </p>
            `)}

            ${panel("② 현장 비용 등록", `
                <form class="erp19-form" data-form="expense">
                    <label>현장
                        <select name="site">${siteOptions()}</select>
                    </label>

                    <label>비용구분
                        <select name="category">
                            <option>자재비</option>
                            <option>인건비</option>
                            <option>장비비</option>
                            <option>기타비용</option>
                        </select>
                    </label>

                    <label>금액
                        <input name="amount" type="number"
                               min="1" step="1" required>
                    </label>

                    <label>발생일
                        <input name="date" type="date"
                               value="${DEMO_DATE}"
                               min="2023-01-01"
                               max="2024-10-31" required>
                    </label>

                    <button class="erp19-btn" type="submit">
                        비용 등록
                    </button>
                </form>
            `)}

            ${panel("③ 비용 집행내역", `
                ${table(
                    ["발생일","현장","비용구분","금액"],
                    expenseRows
                )}
            `)}
        `;
    }

    // =====================================
    // 3. 전자결재관리
    // =====================================

    function renderApproval() {
        const state = ensureState(data);

        const rows = state.requests.map(r => `
            <tr>
                <td>${escapeHTML(r.id)}</td>
                <td>${escapeHTML(sites[r.site])}</td>
                <td>${escapeHTML(productName(r.code))}</td>
                <td>${money(r.qty * r.price)}</td>
                <td>${escapeHTML(r.status)}</td>
                <td>
                    ${button(
                        "승인",
                        "approve",
                        r.id,
                        r.status !== "대기"
                    )}
                    ${button(
                        "반려",
                        "reject",
                        r.id,
                        r.status !== "대기"
                    )}
                </td>
            </tr>
        `);

        const auditRows = state.audit.map(a => `
            <tr>
                <td>${escapeHTML(a.date)}</td>
                <td>${escapeHTML(a.id)}</td>
                <td>${escapeHTML(a.actor)}</td>
                <td>${escapeHTML(a.action)}</td>
            </tr>
        `);

        return `
            ${cards([
                ["전체 결재", state.requests.length + "건"],
                ["승인대기", state.requests.filter(
                    r => r.status === "대기"
                ).length + "건"],
                ["승인완료", state.requests.filter(
                    r => ["승인","입고완료"].includes(r.status)
                ).length + "건"],
                ["반려", state.requests.filter(
                    r => r.status === "반려"
                ).length + "건"]
            ])}

            ${panel("① 구매요청 결재현황", `
                ${table(
                    ["결재번호","요청현장","품목",
                     "요청금액","상태","결재처리"],
                    rows
                )}
            `)}

            ${panel("② 결재 처리이력", `
                ${table(
                    ["처리일","결재번호","처리자","결과"],
                    auditRows
                )}
            `)}

            ${panel("③ 전자결재 안내", `
                <p class="erp19-note">
                    구매요청을 검토하고 승인 또는 반려할 수 있습니다.
                </p>

                <p class="erp19-note">
                    v1.9 통합 물류관리에서 생성한 구매요청은
                    승인된 경우에만 입고 처리할 수 있습니다.
                </p>
            `)}
        `;
    }

    // =====================================
    // 4. 경영분석
    // =====================================

    function renderAnalysis() {
        const state = ensureState(data);
        const modules = data.portfolioModules || {};

        const purchases = [
            ...(modules.purchase || []),
            ...state.requests.filter(r =>
                ["승인","입고완료"].includes(r.status)
            )
        ];

        const sales = modules.sales || [];

        const purchaseTotal = purchases.reduce(
            (s, r) => s + Number(r.quantity ?? r.qty ?? 0)
                * Number(r.price || 0), 0
        );

        const salesTotal = sales.reduce(
            (s, r) => s + Number(r.quantity || 0)
                * Number(r.price || 0), 0
        );

        const months = Array.from(
            { length: 10 },
            (_, i) => `2024-${String(i + 1).padStart(2,"0")}`
        );

        const monthly = months.map(month => {
            const p = purchases
                .filter(r => String(r.date).startsWith(month))
                .reduce((s, r) =>
                    s + Number(r.quantity ?? r.qty ?? 0)
                    * Number(r.price || 0), 0);

            const s = sales
                .filter(r => String(r.date).startsWith(month))
                .reduce((sum, r) =>
                    sum + Number(r.quantity || 0)
                    * Number(r.price || 0), 0);

            return { month, purchase: p, sales: s };
        });

        const max = Math.max(
            1,
            ...monthly.flatMap(m => [m.purchase, m.sales])
        );

        const chart = monthly.map(m => `
            <div class="erp19-chart-row">
                <strong>${m.month.slice(5)}월</strong>

                <div>
                    <div class="erp19-bar">
                        <div style="width:${m.purchase / max * 100}%"></div>
                    </div>

                    <small>매입 ${money(m.purchase)}</small>

                    <div class="erp19-bar sales">
                        <div style="width:${m.sales / max * 100}%"></div>
                    </div>

                    <small>매출 ${money(m.sales)}</small>
                </div>
            </div>
        `).join("");

        const budgetRows = Object.entries(sites).map(([code, name]) => {
            const budget = state.budgets[code].budget;
            const cost = spent(code);

            return `
                <tr>
                    <td>${escapeHTML(name)}</td>
                    <td>${money(budget)}</td>
                    <td>${money(cost)}</td>
                    <td>${(cost / budget * 100).toFixed(1)}%</td>
                </tr>
            `;
        });

        return `
            ${cards([
                ["등록 발주금액", money(purchaseTotal)],
                ["등록 판매금액", money(salesTotal)],
                ["매출·매입 차액", money(salesTotal - purchaseTotal)],
                ["전체 재고수량",
                    number(data.products.reduce(
                        (s, p) => s + p.stock, 0
                    ))]
            ])}

            ${panel("① 월별 매입·매출 분석", `
                <p class="erp19-note">
                    파란색: 등록 발주금액 /
                    초록색: 등록 판매금액
                </p>

                ${chart}

                <p class="erp19-note">
                    등록된 발주·판매 기록 기준이며,
                    실제 회계상 매출이나 순이익과는 다릅니다.
                </p>
            `)}

            ${panel("② 현장별 예산 분석", `
                ${table(
                    ["현장명","예산","집행금액","집행률"],
                    budgetRows
                )}
            `)}

            ${panel("③ 경영분석 참고사항", `
                <p class="erp19-note">
                    기존 v1.7의 등록 발주·판매 데이터와
                    v1.9에서 승인한 구매요청을 집계합니다.
                    
                </p>
            `)}
        `;
    }

    // =====================================
    // 5. 통합 알림센터
    // =====================================

    function collectAlerts() {
        const state = ensureState(data);
        const alerts = [];

        data.products.forEach(p => {
            const safety =
                Number.isSafeInteger(p.minStock)
                    ? p.minStock
                    : (safetyDefaults[p.code] || 0);

            if (p.stock === 0) {
                alerts.push([
                    "재고",
                    p.name + " 품절",
                    "긴급"
                ]);
            } else if (p.stock < safety) {
                alerts.push([
                    "재고",
                    p.name + " 안전재고 부족",
                    "주의"
                ]);
            }
        });

        state.requests.forEach(r => {
            if (r.status === "대기") {
                alerts.push([
                    "결재",
                    r.id + " 승인 대기",
                    "대기"
                ]);
            }

            if (
                r.status === "승인" &&
                r.due < DEMO_DATE
            ) {
                alerts.push([
                    "납기",
                    r.id + " 납기 지연",
                    "긴급"
                ]);
            }
        });

        const tasks =
            data.portfolioModules?.tasks || [];

        tasks.forEach(t => {
            if (
                t.date < DEMO_DATE &&
                t.status !== "완료"
            ) {
                alerts.push([
                    "업무",
                    t.title + " 마감 지연",
                    "주의"
                ]);
            }
        });

        Object.keys(sites).forEach(code => {
            if (
                spent(code) >
                state.budgets[code].budget
            ) {
                alerts.push([
                    "예산",
                    sites[code] + " 예산 초과",
                    "긴급"
                ]);
            }
        });

        return alerts;
    }

    function renderAlerts() {
        const alerts = collectAlerts();

        const urgent = alerts.filter(
            a => a[2] === "긴급"
        ).length;

        const warning = alerts.filter(
            a => a[2] === "주의"
        ).length;

        const rows = alerts.map(a => `
            <tr>
                <td>${escapeHTML(a[0])}</td>
                <td>${escapeHTML(a[1])}</td>
                <td class="${a[2] === "긴급"
                    ? "erp19-warning" : ""}">
                    ${escapeHTML(a[2])}
                </td>
            </tr>
        `);

        return `
            ${cards([
                ["전체 알림", alerts.length + "건"],
                ["긴급 알림", urgent + "건"],
                ["주의 알림", warning + "건"],
                ["기타 알림",
                    (alerts.length - urgent - warning) + "건"]
            ])}

            ${panel("① 통합 업무 알림", `
                ${table(
                    ["알림구분","알림내용","중요도"],
                    rows
                )}

                ${alerts.length === 0
                    ? "<p>현재 관리할 알림이 없습니다.</p>"
                    : ""}
            `)}

            ${panel("② 알림 처리 안내", `
                <p class="erp19-note">
                    재고 부족은 재고관리에서,
                    결재 대기는 전자결재관리에서,
                    납기 지연은 통합 물류관리에서 확인하세요.
                </p>

                <p class="erp19-note">
                    
                    알림은 ERP 데이터가 변경될 때 다시 계산됩니다.
                </p>
            `)}
        `;
    }

    // =====================================
    // 화면 출력
    // =====================================

    const titles = {
        "erp19-flow": "🚚 통합 물류관리",
        "erp19-budget": "💵 현장 원가·예산관리",
        "erp19-approval": "📋 전자결재관리",
        "erp19-analysis": "📈 경영분석",
        "erp19-alerts": "🔔 통합 알림센터"
    };

    function refreshDashboard() {
        const alerts = collectAlerts();

        const count =
            document.getElementById("erp19AlertCount");

        if (count) {
            count.textContent = alerts.length;
        }

        menuButtons["erp19-alerts"].textContent =
            `🔔 통합 알림센터 (${alerts.length})`;
    }

    const dashboardCards =
        document.querySelector("#dashboard .cards");

    const alertCard = document.createElement("div");

    alertCard.className = "card";

    alertCard.innerHTML = `
        <h3>🔔 통합 업무 알림</h3>
        <strong id="erp19AlertCount">0</strong>
    `;

    dashboardCards.appendChild(alertCard);

    function renderPage(key) {
        activePage = key;

        refreshDashboard();

        const renderers = {
            "erp19-flow": renderFlow,
            "erp19-budget": renderBudget,
            "erp19-approval": renderApproval,
            "erp19-analysis": renderAnalysis,
            "erp19-alerts": renderAlerts
        };

        if (!renderers[key]) return;

        page.innerHTML = `
            <p class="erp19-note">
                
            </p>

            ${renderers[key]()}
        `;
    }

    // =====================================
    // 구매요청·비용·현장 이동 등록
    // =====================================

    page.addEventListener("submit", event => {
        const form = event.target.closest("form[data-form]");

        if (!form) return;

        event.preventDefault();

        const values = Object.fromEntries(
            new FormData(form).entries()
        );

        const type = form.dataset.form;

        commitTransaction(next => {
            const state = ensureState(next);

            if (type === "request") {
                const qty = validQty(values.qty);
                const price = validAmount(values.price);

                if (!sites[values.site]) {
                    throw new Error("현장이 올바르지 않습니다.");
                }

                if (!next.products.some(p => p.code === values.code)) {
                    throw new Error("등록되지 않은 제품입니다.");
                }

                if (!values.partner.trim()) {
                    throw new Error("공급업체를 입력하세요.");
                }

                const date = validDate(values.date);
                const due = validDate(values.due);

                if (due < date) {
                    throw new Error("납기일은 요청일 이후여야 합니다.");
                }

                const amount = qty * price;

                if (!Number.isSafeInteger(amount)) {
                    throw new Error("발주금액이 너무 큽니다.");
                }

                state.requests.push({
                    id: "REQ-" + state.seq++,
                    site: values.site,
                    code: values.code,
                    qty,
                    price,
                    partner: values.partner.trim(),
                    date,
                    due,
                    status: "대기"
                });
            }

            if (type === "expense") {
                const amount = validAmount(values.amount);

                if (amount === 0) {
                    throw new Error("비용은 1원 이상이어야 합니다.");
                }

                if (!sites[values.site]) {
                    throw new Error("현장이 올바르지 않습니다.");
                }

                state.expenses.push({
                    site: values.site,
                    category: values.category,
                    amount,
                    date: validDate(values.date)
                });
            }

            if (type === "transfer") {
                const qty = validQty(values.qty);

                if (!sites[values.site]) {
                    throw new Error("현장이 올바르지 않습니다.");
                }

                const { product, stocks } =
                    getStocks(next, values.code);

                if (stocks.W001 < qty) {
                    throw new Error("본사 창고 재고가 부족합니다.");
                }

                stocks.W001 -= qty;
                stocks[values.site] += qty;

                next.locationTransfers ||= [];

                next.locationTransfers.push({
                    date: DEMO_DATE,
                    code: product.code,
                    name: product.name,
                    from: "W001",
                    to: values.site,
                    qty
                });
            }

            if (type === "usage") {
                const qty = validQty(values.qty);
                const price = validAmount(values.price);

                if (!sites[values.site]) {
                    throw new Error("현장이 올바르지 않습니다.");
                }

                const { product, stocks } =
                    getStocks(next, values.code);

                if (stocks[values.site] < qty) {
                    throw new Error("현장 보유 재고가 부족합니다.");
                }

                const cost = qty * price;

                if (!Number.isSafeInteger(cost)) {
                    throw new Error("원가금액이 너무 큽니다.");
                }

                stocks[values.site] -= qty;
                product.stock -= qty;

                next.movements.push({
                    date: DEMO_DATE + " 09:00:00",
                    code: product.code,
                    name: product.name,
                    type: "출고",
                    qty
                });

                next.movements.sort((a,b) =>
                    a.date.localeCompare(b.date)
                );

                state.expenses.push({
                    site: values.site,
                    category: "자재비",
                    amount: cost,
                    date: DEMO_DATE
                });
            }
        });
    });

    // =====================================
    // 결재 및 입고처리
    // =====================================

    page.addEventListener("click", event => {
        const btn = event.target.closest(
            "button[data-action]"
        );

        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (!confirm("선택한 업무를 처리할까요?")) {
            return;
        }

        commitTransaction(next => {
            const state = ensureState(next);

            const request = state.requests.find(
                r => r.id === id
            );

            if (!request) {
                throw new Error("구매요청을 찾을 수 없습니다.");
            }

            if (action === "approve" ||
                action === "reject") {

                if (request.status !== "대기") {
                    throw new Error("이미 처리된 결재입니다.");
                }

                request.status =
                    action === "approve" ? "승인" : "반려";

                state.audit.push({
                    id,
                    action: request.status,
                    actor: "관리자",
                    date: DEMO_DATE
                });
            }

            if (action === "receive") {
                if (request.status !== "승인") {
                    throw new Error(
                        "승인된 구매요청만 입고할 수 있습니다."
                    );
                }

                const { product, stocks } =
                    getStocks(next, request.code);

                const newStock = product.stock + request.qty;

                if (!Number.isSafeInteger(newStock)) {
                    throw new Error("재고 수량이 허용 범위를 초과합니다.");
                }

                product.stock = newStock;
                stocks.W001 += request.qty;

                next.movements.push({
                    date: DEMO_DATE + " 09:00:00",
                    code: product.code,
                    name: product.name,
                    type: "입고",
                    qty: request.qty
                });

                next.movements.sort((a,b) =>
                    a.date.localeCompare(b.date)
                );

                request.status = "입고완료";
            }
        });
    });

    // =====================================
    // 기존 ERP 메뉴와 연결
    // =====================================

    const previousShowPage = window.showPage;

    window.showPage = function (key, button) {
        previousShowPage(key, button);

        if (titles[key]) {
            document.querySelectorAll(".page").forEach(el => {
                el.classList.remove("active");
            });

            page.classList.add("active");

            document.getElementById("pageTitle").textContent =
                titles[key];

            renderPage(key);
        } else {
            refreshDashboard();
        }
    };

    const previousRender = render;

    render = function () {
        previousRender();
        refreshDashboard();
    };

    refreshDashboard();

})();
