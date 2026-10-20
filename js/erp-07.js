
// ==========================================
// D SMART ERP v1.5
// 재고관리 고도화
// ==========================================

(function () {

    const table = document.getElementById("inventoryTable");
    const panel = table.closest(".panel");

    // 가상 안전재고 기준
    const defaultSafety = {
        C001: 80,
        C008: 100,
        C010: 200,
        C011: 30,
        C022: 20
    };

    function safetyStock(p) {
        return Number.isSafeInteger(p.minStock) && p.minStock >= 0
            ? p.minStock
            : (defaultSafety[p.code] || 0);
    }

    // 재고 목록에 추가 열 생성
    const header = table.closest("table")
        .querySelector("thead tr");

    ["안전재고", "재고상태", "관리"].forEach(title => {
        const th = document.createElement("th");
        th.textContent = title;
        header.appendChild(th);
    });

    // 수정 화면 생성
    const editArea = document.createElement("div");

    editArea.style.display = "none";
    editArea.style.marginTop = "30px";
    editArea.style.padding = "20px";
    editArea.style.background = "#f8fafc";
    editArea.style.borderRadius = "10px";

    editArea.innerHTML = `
        <h3>✏️ 자재 정보 수정</h3>

        <form id="inventoryEditForm">

            <p>제품코드</p>
            <input id="editCode" readonly>

            <p>제품명</p>
            <input id="editName" required maxlength="100">

            <p>단위</p>
            <input id="editUnit" required maxlength="30">

            <p>안전재고</p>
            <input
                id="editSafety"
                type="number"
                min="0"
                step="1"
                required
            >

            <br><br>

            <button class="action" type="submit">
                💾 수정 내용 저장
            </button>

            <button
                type="button"
                class="action"
                id="cancelEdit"
                style="background:#64748b"
            >
                취소
            </button>

        </form>
    `;

    panel.appendChild(editArea);

    const editForm =
        document.getElementById("inventoryEditForm");

    // 기존 재고 목록 출력 기능 확장
    const previousRender = render;

    render = function () {

        previousRender();

        Array.from(table.rows).forEach(row => {

            const code = row.cells[0].textContent;

            const p = data.products.find(
                item => item.code === code
            );

            if (!p) return;

            const min = safetyStock(p);

            addCell(row, min);

            const status = row.insertCell();

            if (p.stock === 0) {

                status.textContent = "⚫ 품절";
                status.style.color = "#64748b";

            } else if (p.stock < min) {

                status.textContent = "🔴 부족";
                status.style.color = "#dc2626";

            } else {

                status.textContent = "🟢 정상";
                status.style.color = "#16a34a";
            }

            const actions = row.insertCell();

            const editBtn = document.createElement("button");

            editBtn.textContent = "✏️ 수정";
            editBtn.type = "button";
            editBtn.className = "action";
            editBtn.style.marginRight = "5px";

            editBtn.addEventListener("click", function () {

                document.getElementById("editCode").value =
                    p.code;

                document.getElementById("editName").value =
                    p.name;

                document.getElementById("editUnit").value =
                    p.unit;

                document.getElementById("editSafety").value =
                    safetyStock(p);

                editArea.style.display = "block";

                editArea.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });

            const deleteBtn = document.createElement("button");

            deleteBtn.textContent = "🗑️ 삭제";
            deleteBtn.type = "button";
            deleteBtn.className = "action";
            deleteBtn.style.background = "#dc2626";

            deleteBtn.addEventListener("click", function () {

                const hasHistory = data.movements.some(
                    m => m.code === p.code
                );

                const hasTransfer =
                    (data.locationTransfers || []).some(
                        t => t.code === p.code
                    );

                const locationStock =
                    data.locationStocks?.[p.code] || {};

                const hasLocationStock =
                    Object.values(locationStock).some(
                        qty => qty !== 0
                    );

                if (
                    p.stock !== 0 ||
                    hasHistory ||
                    hasTransfer ||
                    hasLocationStock
                ) {

                    alert(
                        "재고 또는 입출고 이력이 있는 자재는\n" +
                        "삭제할 수 없습니다."
                    );

                    return;
                }

                if (!confirm(p.name + " 자재를 삭제할까요?")) {
                    return;
                }

                try {

                    const next = JSON.parse(
                        JSON.stringify(data)
                    );

                    next.products = next.products.filter(
                        item => item.code !== p.code
                    );

                    if (next.locationStocks) {
                        delete next.locationStocks[p.code];
                    }

                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(next)
                    );

                    data = next;

                    editArea.style.display = "none";

                    render();

                    alert("자재가 삭제되었습니다.");

                } catch (error) {

                    alert("삭제 실패: " + error.message);
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
        });
    };

    // 수정 내용 저장
    editForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const code =
            document.getElementById("editCode").value;

        const name =
            document.getElementById("editName").value.trim();

        const unit =
            document.getElementById("editUnit").value.trim();

        const min = Number(
            document.getElementById("editSafety").value
        );

        if (
            !name ||
            !unit ||
            !Number.isSafeInteger(min) ||
            min < 0
        ) {

            alert("올바른 정보를 입력하세요.");
            return;
        }

        try {

            const next = JSON.parse(
                JSON.stringify(data)
            );

            const p = next.products.find(
                item => item.code === code
            );

            if (!p) {
                alert("제품을 찾을 수 없습니다.");
                return;
            }

            p.name = name;
            p.unit = unit;
            p.minStock = min;

            localStorage.setItem(
                storageKey,
                JSON.stringify(next)
            );

            data = next;

            editArea.style.display = "none";

            render();

            alert("자재 정보가 수정되었습니다.");

        } catch (error) {

            alert("수정 실패: " + error.message);
        }
    });

    document.getElementById("cancelEdit")
        .addEventListener("click", function () {

            editArea.style.display = "none";
        });

    render();

})();
