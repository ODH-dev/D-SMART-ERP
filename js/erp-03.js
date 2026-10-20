
// ======================================
// D SMART ERP v1.1 데이터 백업 및 복원
// ======================================

(function () {

    const panel = document.querySelector("#otherPage .panel");

    const backupBox = document.createElement("div");
    backupBox.id = "backupBox";
    backupBox.style.display = "none";

    backupBox.innerHTML = `
        <hr style="margin:25px 0;border:1px solid #e2e8f0">

        <h2>💾 데이터 백업 및 복원</h2>

        <p class="notice">
            제품, 재고, 입출고 기록을 백업하고 복원합니다.
        </p>

        <div style="margin-top:25px">
            <h3>① 데이터 백업</h3>
            <p>현재 ERP 데이터를 JSON 파일로 저장합니다.</p>

            <button class="action" id="backupBtn">
                💾 데이터 백업하기
            </button>
        </div>

        <div style="margin-top:35px">
            <h3>② 데이터 복원</h3>
            <p>이전에 저장한 백업 파일을 선택하세요.</p>

            <input
                type="file"
                id="restoreFile"
                accept=".json,application/json"
            >

            <br><br>

            <button class="action" id="restoreBtn">
                📂 데이터 복원하기
            </button>

            <p class="notice">
                주의: 복원하면 현재 재고와 입출고 기록이
                백업 파일의 데이터로 변경됩니다.
            </p>
        </div>
    `;

    panel.appendChild(backupBox);

    // 기존 메뉴 기능 유지
    const previousShowPage = window.showPage;

    window.showPage = function (page, button) {

        previousShowPage(page, button);

        backupBox.style.display =
            page === "settings" ? "block" : "none";

        const notice = panel.querySelector("p");

        if (notice) {
            notice.style.display =
                page === "settings" ? "none" :
                (page === "partners" || page === "employees")
                    ? "none" : "";
        }
    };

    // 데이터 백업
    document.getElementById("backupBtn")
        .addEventListener("click", function () {

            try {
                const backup = {
                    app: "D SMART ERP",
                    version: 1,
                    backupDate: new Date().toISOString(),
                    data: data
                };

                const json = JSON.stringify(backup, null, 2);

                const blob = new Blob([json], {
                    type: "application/json;charset=utf-8"
                });

                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");

                link.href = url;

                const today = new Date()
                    .toISOString()
                    .slice(0, 10);

                link.download =
                    "D_SMART_ERP_BACKUP_" + today + ".json";

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(function () {
                    URL.revokeObjectURL(url);
                }, 1000);

                alert("백업 파일 저장을 요청했습니다. 다운로드 폴더를 확인하세요.");

            } catch (error) {
                alert("백업 중 오류가 발생했습니다: " + error.message);
            }
        });

    // 데이터 복원
    document.getElementById("restoreBtn")
        .addEventListener("click", async function () {

            const fileInput =
                document.getElementById("restoreFile");

            const file = fileInput.files[0];

            if (!file) {
                alert("백업 파일을 먼저 선택하세요.");
                return;
            }

            try {

                if (file.size > 5 * 1024 * 1024) {
                    throw new Error("파일 크기가 5MB를 초과합니다.");
                }

                const text = await file.text();
                const backup = JSON.parse(text);

                if (
                    backup.app !== "D SMART ERP" ||
                    backup.version !== 1 ||
                    !backup.data ||
                    !Array.isArray(backup.data.products) ||
                    !Array.isArray(backup.data.movements)
                ) {
                    throw new Error("올바른 ERP 백업 파일이 아닙니다.");
                }

                const restored = backup.data;

                const validProducts = restored.products.every(p =>
                    p &&
                    typeof p.code === "string" &&
                    p.code.trim() !== "" &&
                    typeof p.name === "string" &&
                    typeof p.unit === "string" &&
                    Number.isSafeInteger(p.stock) &&
                    p.stock >= 0
                );

                const validMovements = restored.movements.every(m =>
                    m &&
                    typeof m.date === "string" &&
                    typeof m.code === "string" &&
                    typeof m.name === "string" &&
                    ["입고", "출고"].includes(m.type) &&
                    Number.isSafeInteger(m.qty) &&
                    m.qty > 0
                );

                const codes = restored.products.map(p => p.code);

                if (
                    !validProducts ||
                    !validMovements ||
                    new Set(codes).size !== codes.length
                ) {
                    throw new Error("백업 데이터 형식에 오류가 있습니다.");
                }

                const message =
                    "현재 데이터를 백업 파일로 교체할까요?\n\n" +
                    "복원할 품목: " + restored.products.length + "개\n" +
                    "입출고 기록: " + restored.movements.length + "건\n\n" +
                    "기존 데이터가 덮어써집니다.";

                if (!confirm(message)) {
                    return;
                }

                // 저장에 성공한 경우에만 현재 데이터 변경
                localStorage.setItem(
                    storageKey,
                    JSON.stringify(restored)
                );

                data = restored;

                render();

                alert("데이터 복원이 완료되었습니다.");

            } catch (error) {
                alert("복원 실패: " + error.message);
            } finally {
                fileInput.value = "";
            }
        });

})();
