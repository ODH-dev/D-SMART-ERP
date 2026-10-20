
// ==========================================
// D SMART ERP 2023~2024 시연용 날짜 설정
// ==========================================

(function () {

    const migrationKey = "d-smart-erp-demo-dates-2024-v1";
    const demoToday = "2024-10-18";

    // ERP 화면 기준일
    document.querySelector(".header span").textContent =
        "관리자 · 2024.10.18 기준 (시연 데이터)";

    // 기존 입출고 기록 날짜 변경 (최초 1회)
    if (!localStorage.getItem(migrationKey)) {

        const updated = JSON.parse(JSON.stringify(data));

        const others = updated.movements.filter(
            m => m.name !== "테스트 제품"
        );

        const start = Date.UTC(2023, 1, 7);
        const end = Date.UTC(2024, 8, 20);

        others.forEach((m, i) => {

            const ratio = others.length > 1
                ? i / (others.length - 1)
                : 0;

            const time = start + (end - start) * ratio;

            const date = new Date(time)
                .toISOString()
                .slice(0, 10);

            m.date = date + " 09:00:00";
        });

        updated.movements.forEach(m => {

            if (m.name === "테스트 제품") {

                if (m.type === "입고") {
                    m.date = "2023-01-16 09:15:00";
                }

                if (m.type === "출고") {
                    m.date = "2024-10-18 15:40:00";
                }
            }
        });

        // 날짜순 정렬
        updated.movements.sort(
            (a, b) => a.date.localeCompare(b.date)
        );

        // 저장 성공 후 현재 데이터 변경
        localStorage.setItem(
            storageKey,
            JSON.stringify(updated)
        );

        localStorage.setItem(migrationKey, "1");

        data = updated;

        render();
    }

    // =====================================
    // 신규 입출고 날짜 선택 기능
    // =====================================

    const form = document.getElementById("movementForm");

    const dateInput = document.createElement("input");

    dateInput.type = "date";
    dateInput.id = "movementDate";
    dateInput.min = "2023-01-01";
    dateInput.max = "2024-10-31";
    dateInput.value = demoToday;
    dateInput.defaultValue = demoToday;
    dateInput.required = true;
    dateInput.title = "입출고 처리 날짜";

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    form.insertBefore(dateInput, submitButton);

    // 기존 입출고 처리 대신 시연 날짜 적용
    form.addEventListener("submit", function (e) {

        e.preventDefault();
        e.stopImmediatePropagation();

        const code = document.getElementById(
            "movementProduct"
        ).value;

        const type = document.getElementById(
            "movementType"
        ).value;

        const qty = Number(document.getElementById(
            "movementQty"
        ).value);

        const selectedDate = dateInput.value;

        const product = data.products.find(
            p => p.code === code
        );

        if (!product) {
            alert("제품을 선택하세요.");
            return;
        }

        if (!Number.isSafeInteger(qty) || qty <= 0) {
            alert("올바른 수량을 입력하세요.");
            return;
        }

        if (
            selectedDate < "2023-01-01" ||
            selectedDate > "2024-10-31"
        ) {
            alert("2023~2024년 날짜를 선택하세요.");
            return;
        }

        if (type === "출고" && product.stock < qty) {
            alert("재고가 부족합니다.");
            return;
        }

        const nextStock = product.stock +
            (type === "입고" ? qty : -qty);

        if (!Number.isSafeInteger(nextStock)) {
            alert("처리할 수 없는 수량입니다.");
            return;
        }

        product.stock = nextStock;

        data.movements.push({
            date: selectedDate + " 09:00:00",
            code: product.code,
            name: product.name,
            type,
            qty
        });

        data.movements.sort(
            (a, b) => a.date.localeCompare(b.date)
        );

        save();
        render();

        form.reset();
        dateInput.value = demoToday;

        alert(type + " 처리가 완료되었습니다.");

    }, true);

})();
