
// ======================================
// D SMART ERP v1.3
// 창고 및 건설현장 자재 이동관리
// ======================================

(function () {

    // 가상 창고 및 현장
    const warehouses = [
        ["W001", "본사 자재창고", "중앙창고"],
        ["W002", "A건설현장", "건설현장"],
        ["W003", "B건설현장", "건설현장"],
        ["W004", "C건설현장", "건설현장"],
        ["W005", "물류센터", "물류창고"]
    ];

    const panel = document.querySelector("#otherPage .panel");

    const box = document.createElement("div");
    box.id = "warehouseBox";
    box.style.display = "none";

    box.innerHTML = `
        <h2>🏬 창고 및 건설현장 관리</h2>

        <p class="notice">
            
        </p>

        <h3>① 등록된 창고 및 현장</h3>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>코드</th>
                        <th>창고·현장명</th>
                        <th>구분</th>
                    </tr>
                </thead>
                <tbody id="warehouseList"></tbody>
            </table>
        </div>

        <hr style="margin:30px 0;border:1px solid #e2e8f0">

        <h3>② 현장별 자재 이동</h3>

        <form id="transferForm">

            <p>이동 날짜</p>
            <input
                type="date"
                id="transferDate"
                value="2024-10-18"
                min="2023-01-01"
                max="2024-10-31"
                required
            >

            <p>이동할 자재</p>
            <select id="transferProduct" required></select>

            <p>출발 창고</p>
            <select id="transferFrom" required></select>

            <p>도착 창고</p>
            <select id="transferTo" required></select>

            <p>이동 수량</p>
            <input
                type="number"
                id="transferQty"
                min="1"
                step="1"
                placeholder="이동 수량"
                required
            >

            <br><br>

            <button class="action" type="submit">
                🚚 자재 이동 처리
            </button>

        </form>

        <hr style="margin:30px 0;border:1px solid #e2e8f0">

        <h3>③ 창고별 자재 재고</h3>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>창고·현장</th>
                        <th>제품명</th>
                        <th>재고</th>
                        <th>단위</th>
                    </tr>
                </thead>
                <tbody id="warehouseStockTable"></tbody>
            </table>
        </div>

        <h3 style="margin-top:35px">④ 최근 자재 이동 내역</h3>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>제품명</th>
                        <th>출발</th>
                        <th>도착</th>
                        <th>수량</th>
                    </tr>
                </thead>
                <tbody id="transferHistory"></tbody>
            </table>
        </div>
    `;

    panel.appendChild(box);

    function warehouseName(code) {
        const w = warehouses.find(w => w[0] === code);
        return w ? w[1] : code;
    }

    // 기존 재고를 최초에 본사 창고에 배정
    // 이후 일반 입출고 수량 변경은 본사 창고에 반영
    function syncStocks() {

        const next = JSON.parse(JSON.stringify(data));

        if (!next.locationStocks) {
            next.locationStocks = {};
        }

        if (!Array.isArray(next.locationTransfers)) {
            next.locationTransfers = [];
        }

        let changed = false;

        next.products.forEach(p => {

            if (!next.locationStocks[p.code]) {

                next.locationStocks[p.code] = {
                    W001: p.stock,
                    W002: 0,
                    W003: 0,
                    W004: 0,
                    W005: 0
                };

                changed = true;
                return;
            }

            const stocks = next.locationStocks[p.code];

            const allocated = warehouses.reduce(
                (sum, w) => sum + (stocks[w[0]] || 0),
                0
            );

            const difference = p.stock - allocated;

            // 일반 입출고는 본사 창고 기준으로 반영
            if (
                difference !== 0 &&
                (stocks.W001 || 0) + difference >= 0
            ) {
                stocks.W001 = (stocks.W001 || 0) + difference;
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(
                storageKey,
                JSON.stringify(next)
            );
        }

        data = next;
    }

    // 창고 및 제품 선택 목록
    warehouses.forEach(w => {

        const row = document
            .getElementById("warehouseList")
            .insertRow();

        w.forEach(value => addCell(row, value));

        ["transferFrom", "transferTo"].forEach(id => {

            const option = document.createElement("option");

            option.value = w[0];
            option.textContent = w[1];

            document.getElementById(id).appendChild(option);
        });
    });

    document.getElementById("transferTo").value = "W002";

    function renderWarehouse() {

        syncStocks();

        const productSelect =
            document.getElementById("transferProduct");

        productSelect.replaceChildren();

        data.products.forEach(p => {

            const option = document.createElement("option");

            option.value = p.code;
            option.textContent = p.name + " (" + p.unit + ")";

            productSelect.appendChild(option);
        });

        const stockTable =
            document.getElementById("warehouseStockTable");

        stockTable.replaceChildren();

        data.products.forEach(p => {

            const stocks = data.locationStocks[p.code] || {};

            warehouses.forEach(w => {

                const qty = stocks[w[0]] || 0;

                if (qty <= 0) return;

                const row = stockTable.insertRow();

                addCell(row, w[1]);
                addCell(row, p.name);
                addCell(row, qty);
                addCell(row, p.unit);
            });
        });

        const historyTable =
            document.getElementById("transferHistory");

        historyTable.replaceChildren();

        [...data.locationTransfers]
            .reverse()
            .slice(0, 20)
            .forEach(t => {

                const row = historyTable.insertRow();

                addCell(row, t.date);
                addCell(row, t.name);
                addCell(row, warehouseName(t.from));
                addCell(row, warehouseName(t.to));
                addCell(row, t.qty);
            });
    }

    // 실제 창고 간 자재 이동
    document.getElementById("transferForm")
        .addEventListener("submit", function(e) {

            e.preventDefault();

            try {

                syncStocks();

                const code =
                    document.getElementById("transferProduct").value;

                const from =
                    document.getElementById("transferFrom").value;

                const to =
                    document.getElementById("transferTo").value;

                const qty = Number(
                    document.getElementById("transferQty").value
                );

                const date =
                    document.getElementById("transferDate").value;

                const product = data.products.find(
                    p => p.code === code
                );

                if (!product) {
                    alert("제품을 선택하세요.");
                    return;
                }

                if (from === to) {
                    alert("출발 창고와 도착 창고가 같습니다.");
                    return;
                }

                if (!Number.isSafeInteger(qty) || qty <= 0) {
                    alert("올바른 수량을 입력하세요.");
                    return;
                }

                if (
                    date < "2023-01-01" ||
                    date > "2024-10-31"
                ) {
                    alert("2023~2024년 날짜를 선택하세요.");
                    return;
                }

                const stocks = data.locationStocks[code];

                const allocated = warehouses.reduce(
                    (sum, w) => sum + (stocks[w[0]] || 0),
                    0
                );

                if (allocated !== product.stock) {
                    alert(
                        "창고별 재고와 전체 재고가 일치하지 않습니다.\n" +
                        "데이터를 확인한 후 다시 처리하세요."
                    );
                    return;
                }

                if ((stocks[from] || 0) < qty) {
                    alert("출발 창고의 재고가 부족합니다.");
                    return;
                }

                // 복사본에서 이동 처리
                const next = JSON.parse(JSON.stringify(data));

                next.locationStocks[code][from] -= qty;

                next.locationStocks[code][to] =
                    (next.locationStocks[code][to] || 0) + qty;

                next.locationTransfers.push({
                    date,
                    code,
                    name: product.name,
                    from,
                    to,
                    qty
                });

                // 저장에 성공한 경우에만 현재 데이터 교체
                localStorage.setItem(
                    storageKey,
                    JSON.stringify(next)
                );

                data = next;

                renderWarehouse();
                render();

                document.getElementById("transferQty").value = "";

                alert("자재 이동이 완료되었습니다.");

            } catch (error) {

                alert("자재 이동 실패: " + error.message);
            }
        });

    // 기존 메뉴 기능 유지
    const previousShowPage = window.showPage;

    window.showPage = function(page, button) {

        previousShowPage(page, button);

        box.style.display =
            page === "warehouse" ? "block" : "none";

        if (page === "warehouse") {

            const notice = panel.querySelector(":scope > p");

            if (notice) {
                notice.style.display = "none";
            }

            try {
                renderWarehouse();
            } catch (error) {
                alert("창고 데이터 오류: " + error.message);
            }
        }
    };

})();
