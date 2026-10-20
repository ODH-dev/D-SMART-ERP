

// ========================================
// D SMART ERP 가상 거래처 및 직원 데이터
// ========================================

// 가상 거래처 8곳
const demoPartners = [
    ["T001", "한빛건설자재", "매입처", "철근, 시멘트", "정상"],
    ["T002", "대한안전산업", "매입처", "안전모, 안전화", "정상"],
    ["T003", "미래전기자재", "매입처", "전선, 전선관", "정상"],
    ["T004", "동양배관산업", "매입처", "PVC 배관", "정상"],
    ["T005", "중앙목재상사", "매입처", "합판, 각재", "정상"],
    ["T006", "대성종합건설", "매출처", "건설자재", "정상"],
    ["T007", "스마트건설", "매출처", "건축자재", "정상"],
    ["T008", "태양종합상사", "매입·매출처", "종합자재", "정상"]
];

// 가상 직원 10명
const demoEmployees = [
    ["E001", "김민준", "경영지원팀", "부장", "본사"],
    ["E002", "이서연", "인사총무팀", "과장", "본사"],
    ["E003", "박지훈", "자재관리팀", "대리", "본사 창고"],
    ["E004", "최유진", "구매관리팀", "대리", "본사"],
    ["E005", "정현우", "물류관리팀", "과장", "물류센터"],
    ["E006", "강민서", "생산관리팀", "대리", "생산공장"],
    ["E007", "윤도현", "현장관리팀", "차장", "A건설현장"],
    ["E008", "한지우", "현장관리팀", "대리", "B건설현장"],
    ["E009", "오세훈", "영업관리팀", "과장", "본사"],
    ["E010", "송하린", "회계관리팀", "사원", "본사"]
];

// 표 생성 함수
function createDemoTable(headers, rows) {

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrap";

    const table = document.createElement("table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    headers.forEach(title => {
        const th = document.createElement("th");
        th.textContent = title;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach(item => {
        const tr = document.createElement("tr");

        item.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    return wrapper;
}

// 기존 ERP 메뉴 기능 유지
const originalShowPage = window.showPage;

window.showPage = function(page, button) {

    originalShowPage(page, button);

    const panel = document.querySelector("#otherPage .panel");
    const notice = panel.querySelector("p");

    let demoArea = document.getElementById("demoArea");

    if (!demoArea) {
        demoArea = document.createElement("div");
        demoArea.id = "demoArea";
        panel.appendChild(demoArea);
    }

    demoArea.replaceChildren();

    if (page === "partners" || page === "employees") {

        notice.style.display = "none";

        const info = document.createElement("p");
        info.className = "notice";
        info.textContent = "※ 화면 확인용 가상 데이터입니다.";
        demoArea.appendChild(info);

        if (page === "partners") {

            demoArea.appendChild(
                createDemoTable(
                    ["거래처코드", "거래처명", "구분", "취급품목", "상태"],
                    demoPartners
                )
            );

        }

        if (page === "employees") {

            demoArea.appendChild(
                createDemoTable(
                    ["사번", "이름", "부서", "직급", "근무지"],
                    demoEmployees
                )
            );

        }

    } else {
        notice.style.display = "";
    }

};

