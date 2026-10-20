
(function () {
    "use strict";

    const DEMO_DATE = "2024-10-18";

    document.title = "D SMART ERP v1.7";

    const version = document.querySelector(".sidebar .notice");
    if (version) version.textContent = "D SMART ERP v1.7";

    // 카테고리별 입력 항목
    const modules = {
        production: {
            title: "🏭 생산관리",
            fields: [
                ["number", "작업지시번호"],
                ["item", "생산품목"],
                ["quantity", "계획수량", "number"],
                ["date", "작업일", "date"],
                ["status", "진행상태"]
            ],
            sample: [
                ["WO-2401", "거푸집 패널", 60, "2024-07-15", "완료"],
                ["WO-2402", "철근 가공", 120, "2024-09-12", "진행중"]
            ]
        },
        partners: {
            title: "🤝 거래처관리",
            fields: [
                ["code", "거래처코드"],
                ["name", "거래처명"],
                ["type", "거래구분"],
                ["items", "취급품목"],
                ["status", "상태"]
            ],
            sample: demoPartners
        },
        employees: {
            title: "👥 인사관리",
            fields: [
                ["code", "사번"],
                ["name", "이름"],
                ["department", "부서"],
                ["position", "직급"],
                ["location", "근무지"]
            ],
            sample: demoEmployees
        },
        business: {
            title: "📊 영업관리",
            fields: [
                ["number", "견적번호"],
                ["client", "거래처"],
                ["amount", "견적금액", "number"],
                ["date", "견적일", "date"],
                ["status", "진행상태"]
            ],
            sample: [
                ["Q-2401", "대성종합건설", 4500000, "2024-08-12", "수주"],
                ["Q-2402", "스마트건설", 2800000, "2024-09-20", "협의중"]
            ]
        },
        tasks: {
            title: "📅 업무관리",
            fields: [
                ["title", "업무명"],
                ["owner", "담당자"],
                ["date", "마감일", "date"],
                ["status", "진행상태"]
            ],
            sample: [
                ["A현장 자재 재고조사", "박지훈", "2024-10-17", "완료"],
                ["10월 발주계획 검토", "최유진", "2024-10-18", "진행중"]
            ]
        },
        documents: {
            title: "📁 문서관리",
            fields: [
                ["number", "문서번호"],
                ["title", "문서명"],
                ["category", "문서분류"],
                ["date", "등록일", "date"],
                ["status", "상태"]
            ],
            sample: [
                ["DOC-001", "자재 입고검수서", "자재관리", "2024-09-20", "승인"],
                ["DOC-002", "현장 안전점검표", "안전관리", "2024-10-10", "승인"]
            ]
        },
        field: {
            title: "🏗️ 건설현장관리",
            fields: [
                ["code", "현장코드"],
                ["name", "현장명"],
                ["manager", "현장담당자"],
                ["date", "등록일", "date"],
                ["status", "진행상태"]
            ],
            sample: [
                ["SITE-A", "A건설현장", "윤도현", "2023-03-02", "진행중"],
                ["SITE-B", "B건설현장", "한지우", "2024-02-15", "진행중"]
            ]
        },
        safety: {
            title: "🦺 안전·품질관리",
            fields: [
                ["number", "점검번호"],
                ["site", "점검현장"],
                ["item", "점검항목"],
                ["date", "점검일", "date"],
                ["status", "점검결과"]
            ],
            sample: [
                ["SAFE-001", "A건설현장", "보호구 착용", "2024-09-12", "적합"],
                ["SAFE-002", "B건설현장", "자재 적재상태", "2024-10-11", "개선필요"]
            ]
        },
        purchase: {
            title: "📋 구매·발주관리",
            fields: [
                ["number", "발주번호"],
                ["partner", "매입처"],
                ["code", "제품", "product"],
                ["quantity", "발주수량", "number"],
                ["price", "단가", "number"],
                ["date", "발주일", "date"]
            ],
            sample: [
                ["PO-2401", "한빛건설자재", "C008", 100, 8500, "2024-10-15"],
                ["PO-2402", "대한안전산업", "C001", 50, 12000, "2024-10-16"]
            ]
        },
        sales: {
            title: "💰 매입·매출관리",
            fields: [
                ["number", "주문번호"],
                ["partner", "매출처"],
                ["code", "제품", "product"],
                ["quantity", "판매수량", "number"],
                ["price", "단가", "number"],
                ["date", "주문일", "date"]
            ],
            sample: [
                ["SO-2401", "스마트건설", "C023", 20, 15000, "2024-10-15"]
            ]
        }
    };

    const titles = {
        field: "🏗️ 건설현장관리",
        safety: "🦺 안전·품질관리",
        reports: "📈 분석 리포트"
    };

    Object.entries(titles).forEach(([key, title]) => {
        menuNames[key] = title.replace(/^[^\s]+\s/, "");

        const button = document.createElement("button");
        button.textContent = title;
        button.addEventListener("click", () => {
            window.showPage(key, button);
        });

        const footer = document.querySelector(".sidebar .notice");
        document.querySelector(".sidebar").insertBefore(button, footer);
    });

    // 기존 브라우저 데이터 유지
    function initializeModules() {
        let changed = false;

        if (!data.portfolioModules) {
            data.portfolioModules = {};
            changed = true;
        }

        Object.entries(modules).forEach(([key, config]) => {
            if (!Array.isArray(data.portfolioModules[key])) {
                data.portfolioModules[key] = config.sample.map(values => {
                    const row = {};
                    config.fields.forEach((field, i) => {
                        row[field[0]] = values[i];
                    });

                    if (key === "purchase") row.status = "발주완료";
                    if (key === "sales") row.status = "접수";

                    return row;
                });

                changed = true;
            }
        });

        if (changed) save();
    }

    initializeModules();

    const page = document.createElement("div");
    page.id = "erpV17Page";
    page.className = "page";

    document.querySelector(".main").appendChild(page);

    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function createTable(headers, rows, actionBuilder) {
        const wrap = element("div", undefined, "table-wrap");
        const table = element("table");
        const thead = element("thead");
        const tr = element("tr");

        headers.forEach(h => tr.appendChild(element("th", h)));
        if (actionBuilder) tr.appendChild(element("th", "관리"));

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = element("tbody");

        rows.forEach((values, index) => {
            const row = element("tr");

            values.forEach(value => {
                row.appendChild(element("td", String(value ?? "")));
            });

            if (actionBuilder) {
                const cell = element("td");
                cell.appendChild(actionBuilder(index));
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function makeButton(text, handler, className) {
        const button = element("button", text, className);
        button.type = "button";
        button.addEventListener("click", handler);
        return button;
    }

    function productName(code) {
        const product = data.products.find(p => p.code === code);
        return product ? product.name : code;
    }

    function renderModule(key, editing = -1) {
        initializeModules();
        page.replaceChildren();

        if (key === "reports") {
            renderReports();
            return;
        }

        if (key === "materials") {
            renderMaterials();
            return;
        }

        const config = modules[key];
        if (!config) return;

        const records = data.portfolioModules[key];
        const panel = element("div", undefined, "panel");

        panel.appendChild(element("h2", config.title));
        panel.appendChild(element(
            "p",
            "",
            "erp-v17-note"
        ));

        const form = element("form", undefined, "erp-v17-form");
        const selected = editing >= 0 ? records[editing] : null;

        config.fields.forEach(field => {
            const [name, label, type] = field;
            const wrapper = element("label");
            wrapper.appendChild(element("span", label));

            let input;

            if (type === "product") {
                input = element("select");

                data.products.forEach(p => {
                    const option = element("option", p.code + " - " + p.name);
                    option.value = p.code;
                    input.appendChild(option);
                });
            } else {
                input = element("input");
                input.type = type || "text";

                if (type === "number") {
                    input.min = "0";
                    input.step = "1";
                }

                if (type === "date") {
                    input.min = "2023-01-01";
                    input.max = "2024-10-31";
                }
            }

            input.name = name;
            input.required = true;

            if (selected) {
                input.value = selected[name];
            } else if (type === "date") {
                input.value = DEMO_DATE;
            }

            wrapper.appendChild(input);
            form.appendChild(wrapper);
        });

        const submit = element(
            "button",
            editing >= 0 ? "💾 수정 저장" : "➕ 신규 등록",
            "action"
        );
        submit.type = "submit";
        form.appendChild(submit);

        if (editing >= 0) {
            form.appendChild(makeButton(
                "취소",
                () => renderModule(key),
                "erp-v17-edit"
            ));
        }

        form.addEventListener("submit", e => {
            e.preventDefault();

            const formData = new FormData(form);
            const record = {};

            for (const [name, label, type] of config.fields) {
                let value = String(formData.get(name) || "").trim();

                if (!value) {
                    alert(label + " 항목을 입력하세요.");
                    return;
                }

                if (type === "number") {
                    value = Number(value);

                    if (!Number.isSafeInteger(value) || value < 0) {
                        alert(label + "에 올바른 정수를 입력하세요.");
                        return;
                    }
                }

                if (type === "date" &&
                    (value < "2023-01-01" || value > "2024-10-31")) {
                    alert("등록 가능 기간(2023-01-01~2024-10-31) 내 날짜를 입력하세요.");
                    return;
                }

                record[name] = value;
            }

            if ((key === "purchase" || key === "sales") &&
                record.quantity <= 0) {
                alert("수량은 1 이상이어야 합니다.");
                return;
            }

            if (key === "purchase" || key === "sales") {
                const duplicate = records.some((r, i) =>
                    i !== editing && r.number === record.number
                );

                if (duplicate) {
                    alert("이미 등록된 번호입니다.");
                    return;
                }

                if (editing >= 0 &&
                    records[editing].status ===
                    (key === "purchase" ? "입고완료" : "출고완료")) {
                    alert("처리 완료된 기록은 수정할 수 없습니다.");
                    return;
                }

                record.status = editing >= 0
                    ? records[editing].status
                    : (key === "purchase" ? "발주완료" : "접수");
            }

            if (editing >= 0) {
                records[editing] = record;
            } else {
                records.push(record);
            }

            save();
            render();
            renderModule(key);

            alert("저장되었습니다.");
        });

        panel.appendChild(form);

        panel.appendChild(element(
            "h3",
            "등록 내역 (" + records.length + "건)"
        ));

        const headers = config.fields.map(f => f[1]);

        if (key === "purchase" || key === "sales") {
            headers.push("처리상태");
        }

        const rows = records.map(record => {
            const values = config.fields.map(field => {
                const value = record[field[0]];

                if (field[2] === "product") {
                    return productName(value);
                }

                if (field[2] === "number") {
                    return Number(value).toLocaleString();
                }

                return value;
            });

            if (key === "purchase" || key === "sales") {
                values.push(record.status);
            }

            return values;
        });

        const table = createTable(headers, rows, index => {
            const actions = element("div", undefined, "erp-v17-actions");
            const record = records[index];

            const completed =
                (key === "purchase" && record.status === "입고완료") ||
                (key === "sales" && record.status === "출고완료");

            if (!completed) {
                actions.appendChild(makeButton(
                    "✏️ 수정",
                    () => renderModule(key, index),
                    "erp-v17-edit"
                ));

                if (key === "purchase" || key === "sales") {
                    actions.appendChild(makeButton(
                        key === "purchase" ? "📦 입고처리" : "🚚 출고처리",
                        () => processTransaction(key, index),
                        "action"
                    ));
                }

                actions.appendChild(makeButton(
                    "🗑️ 삭제",
                    () => {
                        if (!confirm("해당 기록을 삭제할까요?")) return;
                        records.splice(index, 1);
                        save();
                        render();
                        renderModule(key);
                    },
                    "erp-v17-delete"
                ));
            } else {
                actions.appendChild(element("span", "✅ 처리완료"));
            }

            return actions;
        });

        panel.appendChild(table);
        page.appendChild(panel);
    }

    // 발주 입고 및 매출 출고를 실제 재고에 반영
    function processTransaction(key, index) {
        const record = data.portfolioModules[key][index];
        const isPurchase = key === "purchase";

        if (record.status === (isPurchase ? "입고완료" : "출고완료")) {
            alert("이미 처리된 기록입니다.");
            return;
        }

        const message = isPurchase
            ? "발주 수량을 입고 처리할까요?\n재고가 증가합니다."
            : "판매 수량을 출고 처리할까요?\n재고가 감소합니다.";

        if (!confirm(message)) return;

        try {
            const next = JSON.parse(JSON.stringify(data));
            const order = next.portfolioModules[key][index];
            const product = next.products.find(p => p.code === order.code);
            const qty = Number(order.quantity);

            if (!product || !Number.isSafeInteger(qty) || qty <= 0) {
                throw new Error("제품 또는 수량 정보가 올바르지 않습니다.");
            }

            if (!next.locationStocks) next.locationStocks = {};

            if (!next.locationStocks[product.code]) {
                next.locationStocks[product.code] = {
                    W001: product.stock,
                    W002: 0,
                    W003: 0,
                    W004: 0,
                    W005: 0
                };
            }

            const stocks = next.locationStocks[product.code];

            if (!isPurchase) {
                if (product.stock < qty || stocks.W001 < qty) {
                    throw new Error(
                        "본사 창고 재고가 부족합니다.\n" +
                        "창고관리에서 재고를 확인하세요."
                    );
                }
            }

            const nextStock = product.stock + (isPurchase ? qty : -qty);

            if (!Number.isSafeInteger(nextStock) || nextStock < 0) {
                throw new Error("처리 가능한 재고 수량을 초과했습니다.");
            }

            product.stock = nextStock;
            stocks.W001 += isPurchase ? qty : -qty;

            next.movements.push({
                date: order.date + " 09:00:00",
                code: product.code,
                name: product.name,
                type: isPurchase ? "입고" : "출고",
                qty: qty
            });

            next.movements.sort((a, b) =>
                a.date.localeCompare(b.date)
            );

            order.status = isPurchase ? "입고완료" : "출고완료";

            localStorage.setItem(storageKey, JSON.stringify(next));
            data = next;

            render();
            renderModule(key);

            alert(isPurchase
                ? "입고 완료! 재고와 대시보드에 반영되었습니다."
                : "출고 완료! 재고와 대시보드에 반영되었습니다."
            );

        } catch (error) {
            alert("처리 실패: " + error.message);
        }
    }

    // 원자재 현황은 실제 재고 데이터와 연결
    function renderMaterials() {
        const panel = element("div", undefined, "panel");
        panel.appendChild(element("h2", "🧱 원자재관리"));

        panel.appendChild(element(
            "p",
            "재고관리와 연결된 원자재 현황입니다. 수량 변경은 입출고관리에서 처리합니다.",
            "erp-v17-note"
        ));

        const products = data.products.filter(p =>
            /^C\d+$/.test(p.code) && Number(p.code.slice(1)) >= 8
        );

        const rows = products.map(p => {
            const n = Number(p.code.slice(1));

            const category = n <= 15
                ? "구조·토목"
                : n <= 18
                    ? "건축·마감"
                    : "설비·전기";

            return [p.code, p.name, category, p.stock, p.unit];
        });

        panel.appendChild(createTable(
            ["제품코드", "자재명", "자재분류", "현재재고", "단위"],
            rows
        ));

        page.appendChild(panel);
    }

    // 분석 리포트
    function renderReports() {
        const panel = element("div", undefined, "panel");

        panel.appendChild(element("h2", "📈 ERP 운영 분석 리포트"));

        const totalStock = data.products.reduce(
            (sum, p) => sum + p.stock, 0
        );

        const totalIn = data.movements
            .filter(m => m.type === "입고")
            .reduce((sum, m) => sum + m.qty, 0);

        const totalOut = data.movements
            .filter(m => m.type === "출고")
            .reduce((sum, m) => sum + m.qty, 0);

        const purchases = data.portfolioModules.purchase;
        const sales = data.portfolioModules.sales;

        const purchaseAmount = purchases.reduce(
            (sum, p) => sum + p.quantity * p.price, 0
        );

        const salesAmount = sales.reduce(
            (sum, s) => sum + s.quantity * s.price, 0
        );

        const rows = [
            ["등록 품목", data.products.length + "종"],
            ["전체 재고", totalStock.toLocaleString()],
            ["누적 입고", totalIn.toLocaleString()],
            ["누적 출고", totalOut.toLocaleString()],
            ["등록 발주", purchases.length + "건"],
            ["발주 총액", purchaseAmount.toLocaleString() + "원"],
            ["등록 판매", sales.length + "건"],
            ["판매 총액", salesAmount.toLocaleString() + "원"],
            ["거래처", data.portfolioModules.partners.length + "곳"],
            ["직원", data.portfolioModules.employees.length + "명"]
        ];

        panel.appendChild(createTable(["분석 항목", "집계 결과"], rows));

        panel.appendChild(element(
            "p",
            "발주·판매 금액은 등록 기록 기준입니다.",
            "erp-v17-note"
        ));

        page.appendChild(panel);
    }

    // 대시보드 확장
    const cards = document.querySelector("#dashboard .cards");

    function addDashboardCard(title, id) {
        const card = element("div", undefined, "card");
        card.appendChild(element("h3", title));

        const value = element("strong", "0");
        value.id = id;

        card.appendChild(value);
        cards.appendChild(card);
    }

    addDashboardCard("📋 미입고 발주", "erpPendingPurchase");
    addDashboardCard("📅 진행중 업무", "erpPendingTasks");

    function updateDashboard() {
        initializeModules();

        const purchases = data.portfolioModules.purchase;
        const tasks = data.portfolioModules.tasks;

        document.getElementById("erpPendingPurchase").textContent =
            purchases.filter(p => p.status !== "입고완료").length;

        document.getElementById("erpPendingTasks").textContent =
            tasks.filter(t => t.status !== "완료").length;
    }

    const previousRender = render;

    render = function () {
        previousRender();
        updateDashboard();
    };

    // 기존 메뉴 기능과 연결
    const previousShowPage = window.showPage;

    window.showPage = function (key, button) {
        previousShowPage(key, button);

        if (modules[key] || key === "materials" || key === "reports") {
            document.querySelectorAll(".page").forEach(el => {
                el.classList.remove("active");
            });

            page.classList.add("active");

            document.getElementById("pageTitle").textContent =
                modules[key]?.title || titles[key] || "원자재관리";

            renderModule(key);
        }
    };

    render();

})();
