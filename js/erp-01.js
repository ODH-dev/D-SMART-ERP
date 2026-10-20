
const menuNames = {
    dashboard: "대시보드",
    inventory: "재고관리",
    movement: "입출고관리",
    production: "생산관리",
    materials: "원자재관리",
    warehouse: "창고관리",
    purchase: "구매·발주관리",
    partners: "거래처관리",
    sales: "매입·매출관리",
    business: "영업관리",
    employees: "인사관리",
    tasks: "업무관리",
    documents: "문서관리",
    settings: "시스템관리"
};

const storageKey = "d-smart-erp-v1";

let data;

try {
    data = JSON.parse(localStorage.getItem(storageKey)) || {
        products: [],
        movements: []
    };
} catch {
    data = { products: [], movements: [] };
}

function save() {
    localStorage.setItem(storageKey, JSON.stringify(data));
}

function showPage(page, button) {
    document.querySelectorAll(".page").forEach(el => {
        el.classList.remove("active");
    });

    document.querySelectorAll(".sidebar button").forEach(el => {
        el.classList.remove("active");
    });

    button.classList.add("active");

    const target = ["dashboard", "inventory", "movement"]
        .includes(page) ? page : "otherPage";

    document.getElementById(target).classList.add("active");
    document.getElementById("pageTitle").textContent = menuNames[page];

    if (target === "otherPage") {
        document.getElementById("otherTitle").textContent = menuNames[page];
    }

    render();
}

function addCell(row, value) {
    const cell = row.insertCell();
    cell.textContent = value;
}

function render() {
    const inventoryTable = document.getElementById("inventoryTable");
    const movementTable = document.getElementById("movementTable");
    const recentTable = document.getElementById("recentTable");
    const productSelect = document.getElementById("movementProduct");

    inventoryTable.replaceChildren();
    movementTable.replaceChildren();
    recentTable.replaceChildren();
    productSelect.replaceChildren();

    const search = document.getElementById("searchProduct")
        .value.toLowerCase();

    data.products
        .filter(p =>
            p.code.toLowerCase().includes(search) ||
            p.name.toLowerCase().includes(search)
        )
        .forEach(p => {
            const row = inventoryTable.insertRow();
            addCell(row, p.code);
            addCell(row, p.name);
            addCell(row, p.unit);
            addCell(row, p.stock);
        });

    data.products.forEach(p => {
        const option = document.createElement("option");
        option.value = p.code;
        option.textContent = `${p.code} - ${p.name}`;
        productSelect.appendChild(option);
    });

    const history = [...data.movements].reverse();

    history.forEach((m, index) => {
        const row = movementTable.insertRow();
        addCell(row, m.date);
        addCell(row, m.code);
        addCell(row, m.name);
        addCell(row, m.type);
        addCell(row, m.qty);

        if (index < 5) {
            const recentRow = recentTable.insertRow();
            addCell(recentRow, m.date);
            addCell(recentRow, m.name);
            addCell(recentRow, m.type);
            addCell(recentRow, m.qty);
        }
    });

    document.getElementById("totalProducts").textContent =
        data.products.length.toLocaleString();

    document.getElementById("totalStock").textContent =
        data.products.reduce((sum, p) => sum + p.stock, 0).toLocaleString();

    document.getElementById("totalIn").textContent =
        data.movements
            .filter(m => m.type === "입고")
            .reduce((sum, m) => sum + m.qty, 0)
            .toLocaleString();

    document.getElementById("totalOut").textContent =
        data.movements
            .filter(m => m.type === "출고")
            .reduce((sum, m) => sum + m.qty, 0)
            .toLocaleString();
}

document.getElementById("productForm").addEventListener("submit", e => {
    e.preventDefault();

    const code = document.getElementById("productCode").value.trim();
    const name = document.getElementById("productName").value.trim();
    const unit = document.getElementById("productUnit").value.trim();

    if (!code || !name || !unit) {
        alert("모든 항목을 입력하세요.");
        return;
    }

    if (data.products.some(p => p.code === code)) {
        alert("이미 등록된 제품코드입니다.");
        return;
    }

    data.products.push({
        code,
        name,
        unit,
        stock: 0
    });

    save();
    render();
    e.target.reset();

    alert("제품이 등록되었습니다.");
});

document.getElementById("movementForm").addEventListener("submit", e => {
    e.preventDefault();

    const code = document.getElementById("movementProduct").value;
    const type = document.getElementById("movementType").value;
    const qty = Number(document.getElementById("movementQty").value);

    const product = data.products.find(p => p.code === code);

    if (!product) {
        alert("제품을 먼저 등록하세요.");
        return;
    }

    if (!Number.isSafeInteger(qty) || qty <= 0) {
        alert("올바른 수량을 입력하세요.");
        return;
    }

    if (type === "출고" && product.stock < qty) {
        alert("재고가 부족하여 출고할 수 없습니다.");
        return;
    }

    const nextStock = product.stock + (type === "입고" ? qty : -qty);

    if (!Number.isSafeInteger(nextStock)) {
        alert("처리할 수 없는 수량입니다.");
        return;
    }

    product.stock = nextStock;

    data.movements.push({
        date: new Date().toLocaleString("ko-KR"),
        code: product.code,
        name: product.name,
        type,
        qty
    });

    save();
    render();
    e.target.reset();

    alert(type + " 처리가 완료되었습니다.");
});

document.getElementById("searchProduct").addEventListener("input", render);
// 건설현장 샘플 자재 25종

const sampleMaterials = [
    ["C001", "안전모", "EA", 60],
    ["C002", "안전조끼", "EA", 80],
    ["C003", "안전화", "켤레", 40],
    ["C004", "작업장갑", "켤레", 250],
    ["C005", "보안경", "EA", 70],
    ["C006", "안전대", "SET", 25],
    ["C007", "방진마스크", "EA", 300],
    ["C008", "철근 D10", "본", 400],
    ["C009", "철근 D13", "본", 350],
    ["C010", "시멘트", "포", 180],
    ["C011", "건축용 모래", "㎥", 25],
    ["C012", "자갈", "㎥", 20],
    ["C013", "구조용 각재", "본", 120],
    ["C014", "합판 12mm", "장", 140],
    ["C015", "거푸집 패널", "장", 90],
    ["C016", "석고보드", "장", 150],
    ["C017", "단열재", "장", 100],
    ["C018", "방수시트", "롤", 45],
    ["C019", "PVC 배관", "본", 100],
    ["C020", "PVC 엘보", "EA", 180],
    ["C021", "CD 전선관", "롤", 70],
    ["C022", "전선 2.5SQ", "롤", 35],
    ["C023", "콘센트", "EA", 100],
    ["C024", "실리콘 실란트", "개", 120],
    ["C025", "앙카볼트 M12", "EA", 250]
];

// 이미 등록된 품목은 중복 등록하지 않음

sampleMaterials.forEach(item => {

    const [code, name, unit, stock] = item;

    const exists = data.products.some(
        p => p.code === code
    );

    if (!exists) {

        data.products.push({
            code,
            name,
            unit,
            stock
        });

        data.movements.push({
            date: new Date().toLocaleString("ko-KR"),
            code,
            name,
            type: "입고",
            qty: stock
        });
    }
});

save();
render();
