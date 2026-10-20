

(function () {

    // =====================================
    // 1. 안전재고 기준
    // =====================================

    const safetyDefaults = {
        C001: 80,
        C008: 100,
        C010: 200,
        C011: 30,
        C022: 20
    };

    function getSafetyStock(product) {

        if (
            Number.isSafeInteger(product.minStock) &&
            product.minStock >= 0
        ) {
            return product.minStock;
        }

        return safetyDefaults[product.code] || 0;
    }

    function getStockStatus(product) {

        if (product.stock === 0) {
            return "품절";
        }

        if (product.stock < getSafetyStock(product)) {
            return "부족";
        }

        return "정상";
    }

    // =====================================
    // 2. 재고관리 필터 추가
    // =====================================

    const inventoryTable =
        document.getElementById("inventoryTable");

    const searchInput =
        document.getElementById("searchProduct");

    const filterArea =
        document.createElement("div");

    filterArea.className = "erp-inventory-filter";

    filterArea.innerHTML = `
        <label for="erpStockFilter">
            재고 상태
        </label>

        <select id="erpStockFilter">
            <option value="all">전체 자재</option>
            <option value="attention">관리 필요 (부족·품절)</option>
            <option value="low">재고 부족</option>
            <option value="out">품절</option>
            <option value="normal">정상</option>
        </select>

        <span
            id="erpFilterCount"
            class="erp-filter-count"
        ></span>
    `;

    searchInput.insertAdjacentElement(
        "afterend",
        filterArea
    );

    const stockFilter =
        document.getElementById("erpStockFilter");

    const filterCount =
        document.getElementById("erpFilterCount");

    // =====================================
    // 3. 대시보드 경고 카드 추가
    // =====================================

    const dashboardCards =
        document.querySelector("#dashboard .cards");

    const warningCard =
        document.createElement("div");

    warningCard.className = "card";

    warningCard.innerHTML = `
        <h3>🚨 재고 관리 필요 품목</h3>

        <strong
            id="erpWarningCount"
            class="erp-warning-count"
        >0</strong>
    `;

    dashboardCards.appendChild(warningCard);

    // =====================================
    // 4. 부족 자재 목록 추가
    // =====================================

    const warningPanel =
        document.createElement("div");

    warningPanel.className = "panel";

    warningPanel.innerHTML = `
        <h2>🚨 재고 부족 및 품절 현황</h2>

        <p class="notice">
            안전재고 기준으로 관리가 필요한 자재입니다.
        </p>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>제품코드</th>
                        <th>제품명</th>
                        <th>현재 재고</th>
                        <th>안전재고</th>
                        <th>상태</th>
                    </tr>
                </thead>

                <tbody id="erpWarningTable"></tbody>
            </table>
        </div>
    `;

    const recentPanel =
        document.querySelector("#dashboard .panel");

    recentPanel.before(warningPanel);

    const warningTable =
        document.getElementById("erpWarningTable");

    // =====================================
    // 5. 기존 화면 출력 기능 확장
    // =====================================

    const previousRender = render;

    render = function () {

        // 기존 ERP 출력 기능 유지
        previousRender();

        const selectedFilter = stockFilter.value;

        let visibleCount = 0;

        // 재고관리 필터 및 버튼 정렬
        Array.from(inventoryTable.rows).forEach(row => {

            const code = row.cells[0]?.textContent;

            const product = data.products.find(
                p => p.code === code
            );

            if (!product) return;

            const status = getStockStatus(product);

            let visible = true;

            if (selectedFilter === "attention") {
                visible = status !== "정상";
            }

            if (selectedFilter === "low") {
                visible = status === "부족";
            }

            if (selectedFilter === "out") {
                visible = status === "품절";
            }

            if (selectedFilter === "normal") {
                visible = status === "정상";
            }

            if (!visible) {
                row.remove();
                return;
            }

            visibleCount++;

            // 상태 줄바꿈 방지
            const statusCell = row.cells[5];

            if (statusCell) {
                statusCell.classList.add(
                    "erp-stock-status"
                );
            }

            // 수정·삭제 버튼 가로 정렬
            const actionCell = row.cells[6];

            if (actionCell) {

                const wrapper =
                    document.createElement("div");

                wrapper.className =
                    "inventory-action-buttons";

                while (actionCell.firstChild) {
                    wrapper.appendChild(
                        actionCell.firstChild
                    );
                }

                actionCell.appendChild(wrapper);
            }
        });

        filterCount.textContent =
            "조회 결과: " + visibleCount + "개";

        // =====================================
        // 6. 대시보드 재고 경고 계산
        // =====================================

        const warningProducts =
            data.products.filter(product => {

                return getStockStatus(product) !== "정상";

            });

        document.getElementById(
            "erpWarningCount"
        ).textContent =
            warningProducts.length.toLocaleString();

        warningTable.replaceChildren();

        warningProducts.forEach(product => {

            const row = warningTable.insertRow();

            addCell(row, product.code);
            addCell(row, product.name);
            addCell(row, product.stock);
            addCell(row, getSafetyStock(product));

            const statusCell = row.insertCell();

            const status = getStockStatus(product);

            if (status === "품절") {

                statusCell.textContent = "⚫ 품절";
                statusCell.className = "erp-status-out";

            } else {

                statusCell.textContent = "🔴 부족";
                statusCell.className = "erp-status-low";

            }

        });

        if (warningProducts.length === 0) {

            const row = warningTable.insertRow();

            const cell = row.insertCell();

            cell.colSpan = 5;

            cell.textContent =
                "현재 재고 부족 또는 품절 자재가 없습니다.";

            cell.style.color = "#16a34a";
        }

    };

    // =====================================
    // 7. 필터 변경 시 화면 갱신
    // =====================================

    stockFilter.addEventListener(
        "change",
        render
    );

    // 최초 화면 출력
    render();

})();

