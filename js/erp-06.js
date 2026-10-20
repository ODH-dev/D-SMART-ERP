
// D SMART ERP v1.4
// 공개 포트폴리오 시연 데이터 자동 설정

(function () {

    const demoDates = [
        "2023-02-07", "2023-03-03", "2023-03-28",
        "2023-04-21", "2023-05-16", "2023-06-10",
        "2023-07-04", "2023-07-29", "2023-08-23",
        "2023-09-16", "2023-10-11", "2023-11-04",
        "2023-11-29", "2023-12-24", "2024-01-17",
        "2024-02-11", "2024-03-07", "2024-03-31",
        "2024-04-25", "2024-05-19", "2024-06-13",
        "2024-07-08", "2024-08-01", "2024-08-26",
        "2024-09-20"
    ];

    function createDemoData() {

        const products = [{
            code: "P001",
            name: "테스트 제품",
            unit: "EA",
            stock: 70
        }];

        const movements = [{
            date: "2023-01-16 09:15:00",
            code: "P001",
            name: "테스트 제품",
            type: "입고",
            qty: 100
        }];

        sampleMaterials.forEach((item, i) => {

            const [code, name, unit, stock] = item;

            products.push({ code, name, unit, stock });

            movements.push({
                date: demoDates[i] + " 09:00:00",
                code,
                name,
                type: "입고",
                qty: stock
            });
        });

        movements.push({
            date: "2024-10-18 15:40:00",
            code: "P001",
            name: "테스트 제품",
            type: "출고",
            qty: 30
        });

        movements.sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        const locationStocks = {};

        products.forEach(p => {
            locationStocks[p.code] = {
                W001: p.stock,
                W002: 0,
                W003: 0,
                W004: 0,
                W005: 0
            };
        });

        // 철근 D10 100본을 A건설현장에 배정
        locationStocks.C008.W001 = 300;
        locationStocks.C008.W002 = 100;

        return {
            products,
            movements,
            locationStocks,
            locationTransfers: [{
                date: "2024-10-18",
                code: "C008",
                name: "철근 D10",
                from: "W001",
                to: "W002",
                qty: 100
            }]
        };
    }

    function resetDemoData() {

        const fresh = createDemoData();

        localStorage.setItem(
            storageKey,
            JSON.stringify(fresh)
        );

        localStorage.setItem(
            "d-smart-erp-demo-dates-2024-v1",
            "1"
        );

        data = fresh;
        render();
    }

    // 기존 데이터가 변경되지 않은 기본 샘플인지 확인
    const isDefaultSample =
        data.products.length === 25 &&
        data.movements.length === 25 &&
        data.products.every((p, i) =>
            p.code === sampleMaterials[i][0] &&
            p.stock === sampleMaterials[i][3]
        ) &&
        data.movements.every((m, i) =>
            m.code === sampleMaterials[i][0] &&
            m.type === "입고" &&
            m.qty === sampleMaterials[i][3]
        ) &&
        (!data.locationTransfers ||
         data.locationTransfers.length === 0);

    // 최초 접속자의 기본 샘플만 자동 교체
    if (isDefaultSample) {
        resetDemoData();
    }

    // 시스템관리 화면에 초기화 기능 추가
    const backupBox = document.getElementById("backupBox");

    const resetArea = document.createElement("div");

    resetArea.innerHTML = `
        <hr style="margin:30px 0;border:1px solid #e2e8f0">

        <h3>③ 포트폴리오 시연 데이터 초기화</h3>

        <p class="notice">
            자재 26종, 입출고 기록 및 창고별 재고를
            최초 시연 상태로 복원합니다.
        </p>

        <button class="action" id="demoResetBtn">
            🔄 시연 데이터 초기화
        </button>

        <p class="notice">
            이 기능은 현재 브라우저의 데이터만 초기화합니다.
        </p>
    `;

    backupBox.appendChild(resetArea);

    document.getElementById("demoResetBtn")
        .addEventListener("click", function () {

            const ok = confirm(
                "시연 데이터를 초기 상태로 복원할까요?\n\n" +
                "현재 브라우저의 변경된 데이터는 사라집니다."
            );

            if (!ok) return;

            try {
                resetDemoData();
                alert("시연 데이터 초기화가 완료되었습니다.");
            } catch (error) {
                alert("초기화 실패: " + error.message);
            }
        });

})();
