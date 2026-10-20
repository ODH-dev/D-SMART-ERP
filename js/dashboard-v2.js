/* ==========================================
   D SMART ERP v2.0
   Integrated Dashboard
   기존 ERP 데이터 읽기 전용
========================================== */

(function () {
    "use strict";

    const dashboard = document.getElementById("dashboard");

    if (!dashboard || document.getElementById("v2Dashboard")) {
        return;
    }

    const box = document.createElement("div");
    box.id = "v2Dashboard";

    box.innerHTML = `
        <div class="v2-heading">
            <span class="eyebrow">BUSINESS OVERVIEW</span><h2>업무의 흐름을 한눈에</h2>
            <p>재고부터 현장 예산까지, 등록된 데이터를 바탕으로 운영 현황을 확인하세요.</p><div class="dashboard-shortcuts"><button data-open="inventory">재고 현황 보기 ↗</button><button data-open="erp19-approval">전자결재 확인 ↗</button></div>
        </div>

        <div class="v2-grid">
            <div class="v2-card">
                <span>전체 재고 수량</span>
                <strong id="v2Stock">0</strong>
                <small>현재 보유 수량</small>
            </div>

            <div class="v2-card">
                <span>처리 대기 구매</span>
                <strong id="v2Purchase">0</strong>
                <small>구매요청 및 발주</small>
            </div>

            <div class="v2-card">
                <span>누적 등록 매출</span>
                <strong id="v2Sales">0</strong>
                <small>등록된 매출 거래금액</small>
            </div>

            <div class="v2-card">
                <span>진행 중 생산</span>
                <strong id="v2Production">0</strong>
                <small>미완료 생산 작업</small>
            </div>
        </div>

        <div class="panel">
            <h2>월별 매출·매입 분석</h2>
            <p class="notice">
                등록된 거래 기록 기준
            </p>
            <div id="v2Chart"></div>
        </div>

        <div class="v2-columns">
            <div class="panel">
                <h2>재고 보충 필요</h2>
                <div id="v2Warnings"></div>
            </div>

            <div class="panel">
                <h2>최근 구매·발주</h2>
                <div id="v2Orders"></div>
            </div>
        </div>

        <div class="panel">
            <h2>현장별 예산 집행</h2>
            <div id="v2Budgets"></div>
            <p class="notice">
                
            </p>
        </div>
    `;

    dashboard.querySelector(".cards")
        .insertAdjacentElement("afterend", box);

    const $ = id => document.getElementById(id);

    const number = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const format = value =>
        number(value).toLocaleString("ko-KR");

    const won = value => format(value) + "원";

    const array = value =>
        Array.isArray(value) ? value : [];

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function table(headers, rows) {
        const head = headers.map(h =>
            `<th>${escapeHTML(h)}</th>`
        ).join("");

        const body = rows.length
            ? rows.map(row => `
                <tr>
                    ${row.map(cell =>
                        `<td>${escapeHTML(cell)}</td>`
                    ).join("")}
                </tr>
            `).join("")
            : `<tr><td colspan="${headers.length}">
                표시할 기록이 없습니다.
               </td></tr>`;

        return `
            <div class="table-wrap">
                <table>
                    <thead><tr>${head}</tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        `;
    }

    const safetyDefaults = {
        C001: 80,
        C008: 100,
        C010: 200,
        C011: 30,
        C022: 20
    };

    const siteNames = {
        W002: "A건설현장",
        W003: "B건설현장",
        W004: "C건설현장"
    };

    function monthlyChart(purchases, sales) {
        const records = [
            ...purchases.filter(p => !["취소", "반려"].includes(p.status)).map(p => ({
                date: p.date,
                amount: number(p.quantity) * number(p.price),
                type: "purchase"
            })),
            ...sales.filter(s => !["취소", "반려"].includes(s.status)).map(s => ({
                date: s.date,
                amount: number(s.quantity) * number(s.price),
                type: "sales"
            }))
        ].filter(r =>
            /^\d{4}-(0[1-9]|1[0-2])/.test(r.date || "")
        );

        if (!records.length) {
            $("v2Chart").textContent =
                "월별 거래 데이터가 없습니다.";
            return;
        }

        const latest = records
            .map(r => r.date.slice(0, 7))
            .sort()
            .at(-1);

        const [year, month] = latest.split("-").map(Number);

        const months = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(year, month - 1 - i, 1);

            months.push(
                d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0")
            );
        }

        const totals = months.map(month => {
            const matching = records.filter(r =>
                r.date.startsWith(month)
            );

            return {
                month,
                purchase: matching
                    .filter(r => r.type === "purchase")
                    .reduce((s, r) => s + r.amount, 0),
                sales: matching
                    .filter(r => r.type === "sales")
                    .reduce((s, r) => s + r.amount, 0)
            };
        });

        const max = Math.max(
            1,
            ...totals.flatMap(r => [r.purchase, r.sales])
        );

        $("v2Chart").innerHTML = totals.map(r => `
            <div class="v2-month">
                <strong>${r.month}</strong>

                <div class="v2-bar-row">
                    <span>매출</span>
                    <div class="v2-track">
                        <div class="v2-bar sales"
                             style="width:${r.sales / max * 100}%">
                        </div>
                    </div>
                    <small>${won(r.sales)}</small>
                </div>

                <div class="v2-bar-row">
                    <span>매입</span>
                    <div class="v2-track">
                        <div class="v2-bar purchase"
                             style="width:${r.purchase / max * 100}%">
                        </div>
                    </div>
                    <small>${won(r.purchase)}</small>
                </div>
            </div>
        `).join("");
    }

    function updateDashboard() {
        if (typeof data === "undefined" || !data) return;

        const products = array(data.products);
        const modules = data.portfolioModules || {};
        const state = data.erp19 || {};

        const purchases = array(modules.purchase);
        const sales = array(modules.sales);
        const production = array(modules.production);
        const requests = array(state.requests);

        // ① 통합 현황 카드
        const stock = products.reduce(
            (sum, p) => sum + number(p.stock), 0
        );

        const pendingPurchase =
            purchases.filter(p =>
                !["입고완료", "취소", "반려"].includes(p.status)
            ).length +
            requests.filter(r =>
                !["입고완료", "취소", "반려"].includes(r.status)
            ).length;

        const salesAmount = sales.filter(s => !["취소", "반려"].includes(s.status)).reduce(
            (sum, s) =>
                sum + number(s.quantity) * number(s.price),
            0
        );

        const activeProduction = production.filter(
            p => !["완료", "취소"].includes(p.status)
        ).length;

        $("v2Stock").textContent = format(stock);
        $("v2Purchase").textContent = format(pendingPurchase);
        $("v2Sales").textContent = won(salesAmount);
        $("v2Production").textContent =
            format(activeProduction) + "건";

        // ② 월별 매출·매입 차트
        monthlyChart(purchases, sales);

        // ③ 재고 부족 알림
        const warnings = products.filter(p => {
            const min = Number.isSafeInteger(p.minStock)
                ? p.minStock
                : (safetyDefaults[p.code] || 0);

            return min > 0 && number(p.stock) < min;
        });

        $("v2Warnings").innerHTML = table(
            ["품목", "현재", "안전재고", "상태"],
            warnings.map(p => {
                const min = Number.isSafeInteger(p.minStock)
                    ? p.minStock
                    : safetyDefaults[p.code];

                return [
                    p.name,
                    format(p.stock),
                    format(min),
                    number(p.stock) === 0 ? "품절" : "부족"
                ];
            })
        );

        // ④ 최근 구매·발주 내역
        const orders = [
            ...purchases.filter(p => !["취소", "반려"].includes(p.status)).map(p => ({
                date: p.date,
                id: p.number,
                partner: p.partner,
                amount: number(p.quantity) * number(p.price),
                status: p.status,
                type: "발주"
            })),
            ...requests.map(r => ({
                date: r.date,
                id: r.id,
                partner: r.partner,
                amount: number(r.qty) * number(r.price),
                status: r.status,
                type: "구매요청"
            }))
        ].sort((a, b) =>
            String(b.date || "").localeCompare(String(a.date || ""))
        ).slice(0, 7);

        $("v2Orders").innerHTML = table(
            ["번호", "구분", "거래처", "금액", "상태"],
            orders.map(o => [
                o.id,
                o.type,
                o.partner,
                won(o.amount),
                o.status
            ])
        );

        // ⑤ 현장별 예산 사용 현황
        const budgets = state.budgets || {};
        const expenses = array(state.expenses);

        const budgetRows = Object.entries(budgets).map(
            ([site, info]) => {
                const budget = number(info.budget);
                const baseline = number(info.baseline);

                const extra = expenses
                    .filter(e => e.site === site)
                    .reduce(
                        (sum, e) => sum + number(e.amount),
                        0
                    );

                const spent = baseline + extra;
                const rate = budget > 0
                    ? spent / budget * 100
                    : 0;

                return [
                    siteNames[site] || site,
                    won(budget),
                    won(spent),
                    rate.toFixed(1) + "%",
                    rate > 100 ? "예산초과" : "정상"
                ];
            }
        );

        $("v2Budgets").innerHTML = table(
            ["현장", "총예산", "집행금액", "사용률", "상태"],
            budgetRows
        );
    }

    // 기존 ERP 렌더링 유지
    if (typeof render === "function") {
        const previousRender = render;

        render = function (...args) {
            const result = previousRender.apply(this, args);
            updateDashboard();
            return result;
        };
    }

    // 다른 메뉴에서 대시보드로 돌아올 때 갱신
    document.querySelectorAll(".sidebar button")
        .forEach(button => {
            button.addEventListener("click", () => {
                setTimeout(updateDashboard, 0);
            });
        });

    updateDashboard();

})();
