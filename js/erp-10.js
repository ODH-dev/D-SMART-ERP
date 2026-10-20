
(function () {
    "use strict";

    document.title = "D SMART ERP v1.8";

    const version = document.querySelector(".sidebar .notice");
    if (version) version.textContent = "D SMART ERP v1.8";

    const config = {

        production: {
            title: "생산관리",
            desc: "생산계획부터 작업지시, 공정 진행 및 생산실적까지 통합 관리합니다.",
            metrics: [
                ["생산계획", "12건"],
                ["진행중 작업", "4건"],
                ["생산 완료", "8건"],
                ["평균 공정률", "78%"]
            ],
            flow: ["생산계획", "작업지시", "자재 준비", "생산 진행", "품질검사", "생산 완료"],
            headers: ["작업지시번호","생산품목","계획수량","실적수량","공정률","상태"],
            rows: [
                ["WO-2401","거푸집 패널","200장","200장","100%","완료"],
                ["WO-2402","철근 D10 가공","350본","280본","80%","진행중"],
                ["WO-2403","철근 D13 가공","250본","175본","70%","진행중"],
                ["WO-2404","구조용 각재","180본","180본","100%","완료"],
                ["WO-2405","합판 재단","300장","195장","65%","진행중"],
                ["WO-2406","배관 조립","120SET","54SET","45%","진행중"]
            ],
            checks: [
                ["생산계획 승인","생산관리팀","완료"],
                ["원자재 수급 확인","자재관리팀","완료"],
                ["공정별 작업실적 검토","생산관리팀","진행중"],
                ["완제품 품질검사","품질관리팀","진행중"]
            ]
        },

        purchase: {
            title: "구매·발주관리",
            desc: "자재 구매 요청부터 발주, 납기 확인, 입고 처리까지 관리합니다.",
            metrics: [
                ["월간 발주", "18건"],
                ["발주 총액", "₩24,850,000"],
                ["입고 완료", "13건"],
                ["납기 확인 필요", "5건"]
            ],
            flow: ["구매 요청", "업체 견적", "발주 승인", "발주서 발행", "납품 확인", "입고 처리"],
            headers: ["발주번호","공급업체","발주품목","발주금액","납기일","상태"],
            rows: [
                ["PO-2401","한빛건설자재","철근 D10","₩4,250,000","2024-10-17","입고완료"],
                ["PO-2402","대한안전산업","안전모","₩600,000","2024-10-20","발주완료"],
                ["PO-2403","중앙목재상사","합판 12mm","₩2,100,000","2024-10-21","납품대기"],
                ["PO-2404","미래전기자재","전선 2.5SQ","₩1,750,000","2024-10-22","발주완료"],
                ["PO-2405","동양배관산업","PVC 배관","₩1,320,000","2024-10-15","입고완료"],
                ["PO-2406","태양종합상사","시멘트","₩3,600,000","2024-10-24","승인대기"]
            ],
            checks: [
                ["구매요청서 검토","구매관리팀","완료"],
                ["협력업체 견적 비교","구매관리팀","완료"],
                ["미입고 발주 납기 확인","물류관리팀","진행중"],
                ["월간 구매금액 정산","회계관리팀","예정"]
            ]
        },

        sales: {
            title: "매입·매출관리",
            desc: "거래처별 매입·매출, 정산 및 미수금 현황을 관리합니다.",
            metrics: [
                ["월간 매입", "₩32,500,000"],
                ["월간 매출", "₩48,700,000"],
                ["매출·매입 차액", "₩16,200,000"],
                ["미수금", "₩5,400,000"]
            ],
            flow: ["거래 등록", "거래명세서", "세금계산서", "입금·지급 확인", "월말 정산"],
            headers: ["거래번호","거래처","거래구분","거래금액","거래일","정산상태"],
            rows: [
                ["TR-2401","한빛건설자재","매입","₩8,500,000","2024-10-04","지급완료"],
                ["TR-2402","대성종합건설","매출","₩15,200,000","2024-10-07","수금완료"],
                ["TR-2403","대한안전산업","매입","₩3,400,000","2024-10-09","지급완료"],
                ["TR-2404","스마트건설","매출","₩9,800,000","2024-10-11","일부수금"],
                ["TR-2405","중앙목재상사","매입","₩6,700,000","2024-10-14","지급예정"],
                ["TR-2406","태양종합상사","매출","₩7,500,000","2024-10-17","수금대기"]
            ],
            checks: [
                ["매입 세금계산서 확인","회계관리팀","완료"],
                ["매출 거래명세서 발행","영업관리팀","완료"],
                ["미수금 회수 일정 확인","회계관리팀","진행중"],
                ["월말 거래처별 정산","회계관리팀","예정"]
            ]
        },

        business: {
            title: "영업관리",
            desc: "견적 요청, 영업기회, 계약 및 수주 실적을 관리합니다.",
            metrics: [
                ["견적 진행", "14건"],
                ["수주 완료", "8건"],
                ["수주금액", "₩86,400,000"],
                ["수주 전환율", "57%"]
            ],
            flow: ["고객 문의", "견적 작성", "가격 협의", "계약 체결", "수주 등록", "납품 관리"],
            headers: ["견적번호","고객사","프로젝트","견적금액","담당자","상태"],
            rows: [
                ["QT-2401","대성종합건설","A현장 자재 공급","₩24,000,000","오세훈","수주"],
                ["QT-2402","스마트건설","B현장 안전용품","₩8,500,000","오세훈","협의중"],
                ["QT-2403","태양종합상사","건축자재 납품","₩15,800,000","김민준","수주"],
                ["QT-2404","대성종합건설","철근 추가 공급","₩12,300,000","오세훈","견적제출"],
                ["QT-2405","스마트건설","배관자재 공급","₩6,700,000","김민준","수주"],
                ["QT-2406","태양종합상사","전기자재 공급","₩9,200,000","오세훈","협의중"]
            ],
            checks: [
                ["신규 견적 요청 검토","영업관리팀","완료"],
                ["고객사 가격 협의","영업관리팀","진행중"],
                ["계약서 검토","경영지원팀","진행중"],
                ["월간 수주실적 보고","영업관리팀","예정"]
            ]
        },

        tasks: {
            title: "업무관리",
            desc: "부서별 업무 배정, 일정, 우선순위 및 진행상황을 관리합니다.",
            metrics: [
                ["전체 업무", "28건"],
                ["완료 업무", "18건"],
                ["진행중 업무", "8건"],
                ["지연 업무", "2건"]
            ],
            flow: ["업무 등록", "담당자 지정", "일정 설정", "업무 수행", "결과 검토", "완료 처리"],
            headers: ["업무번호","업무명","담당자","마감일","우선순위","상태"],
            rows: [
                ["TASK-001","A현장 자재 재고조사","박지훈","2024-10-17","높음","완료"],
                ["TASK-002","10월 발주계획 검토","최유진","2024-10-18","높음","진행중"],
                ["TASK-003","B현장 안전점검","한지우","2024-10-18","긴급","진행중"],
                ["TASK-004","월간 매출보고서 작성","송하린","2024-10-21","보통","진행중"],
                ["TASK-005","거래처 계약 갱신","오세훈","2024-10-22","보통","대기"],
                ["TASK-006","생산실적 마감","강민서","2024-10-16","높음","완료"]
            ],
            checks: [
                ["일일 업무현황 확인","경영지원팀","완료"],
                ["긴급 업무 우선 처리","현장관리팀","진행중"],
                ["지연 업무 원인 분석","부서별 담당자","진행중"],
                ["주간 업무보고 취합","경영지원팀","예정"]
            ]
        },

        documents: {
            title: "문서관리",
            desc: "업무 문서의 등록, 분류, 검토, 승인 및 보관현황을 관리합니다.",
            metrics: [
                ["등록 문서", "126건"],
                ["승인 완료", "102건"],
                ["승인 대기", "18건"],
                ["반려 문서", "6건"]
            ],
            flow: ["문서 작성", "문서 등록", "검토 요청", "결재 승인", "문서 보관", "이력 관리"],
            headers: ["문서번호","문서명","분류","작성부서","등록일","상태"],
            rows: [
                ["DOC-001","자재 입고검수서","검수","자재관리팀","2024-10-11","승인"],
                ["DOC-002","현장 안전점검표","안전","현장관리팀","2024-10-12","승인"],
                ["DOC-003","10월 구매발주서","구매","구매관리팀","2024-10-14","검토중"],
                ["DOC-004","A현장 공정 보고서","현장","현장관리팀","2024-10-15","승인"],
                ["DOC-005","거래처 공급계약서","계약","영업관리팀","2024-10-16","승인대기"],
                ["DOC-006","월간 품질검사 보고서","품질","생산관리팀","2024-10-17","검토중"]
            ],
            checks: [
                ["문서번호 및 분류 확인","문서 담당자","완료"],
                ["결재권자 검토","부서장","진행중"],
                ["승인 대기 문서 확인","경영지원팀","진행중"],
                ["문서 보존기간 관리","인사총무팀","예정"]
            ]
        },

        field: {
            title: "건설현장관리",
            desc: "현장별 공사 진행률, 투입 인원, 공정 및 자재 사용현황을 관리합니다.",
            metrics: [
                ["운영 현장", "3곳"],
                ["총 투입 인원", "84명"],
                ["평균 공정률", "68%"],
                ["관리 필요 현장", "1곳"]
            ],
            flow: ["현장 개설", "공정계획", "인력 배치", "자재 투입", "공정 점검", "준공 관리"],
            headers: ["현장코드","현장명","현장소장","투입인원","공정률","상태"],
            rows: [
                ["SITE-A","A건설현장","윤도현","32명","85%","정상"],
                ["SITE-B","B건설현장","한지우","28명","68%","정상"],
                ["SITE-C","C건설현장","정현우","24명","51%","일정점검"],
                ["SITE-A-01","A현장 골조공사","윤도현","12명","100%","완료"],
                ["SITE-B-02","B현장 전기공사","한지우","8명","72%","진행중"],
                ["SITE-C-03","C현장 배관공사","정현우","10명","45%","진행중"]
            ],
            checks: [
                ["현장별 일일 공정보고","현장관리팀","완료"],
                ["자재 반입 및 사용량 확인","자재관리팀","진행중"],
                ["공정 지연 현장 점검","현장소장","진행중"],
                ["월간 기성실적 검토","경영지원팀","예정"]
            ]
        },

        safety: {
            title: "안전·품질관리",
            desc: "건설현장 안전점검, 위험요인, 품질검사 및 개선조치를 관리합니다.",
            metrics: [
                ["월간 안전점검", "24건"],
                ["점검 적합", "19건"],
                ["개선 필요", "5건"],
                ["조치 완료", "3건"]
            ],
            flow: ["점검계획", "현장점검", "위험요인 확인", "개선 요청", "조치 확인", "점검 완료"],
            headers: ["점검번호","현장","점검항목","점검일","담당자","결과"],
            rows: [
                ["SAFE-001","A건설현장","안전모 착용","2024-10-10","윤도현","적합"],
                ["SAFE-002","B건설현장","자재 적재상태","2024-10-11","한지우","개선필요"],
                ["SAFE-003","C건설현장","추락방지시설","2024-10-12","정현우","적합"],
                ["SAFE-004","A건설현장","전기설비 안전","2024-10-14","윤도현","적합"],
                ["SAFE-005","B건설현장","작업통로 확보","2024-10-16","한지우","조치완료"],
                ["SAFE-006","C건설현장","콘크리트 품질검사","2024-10-17","정현우","개선필요"]
            ],
            checks: [
                ["작업 전 안전교육 실시","현장관리팀","완료"],
                ["위험성 평가표 확인","안전관리팀","완료"],
                ["미조치 위험요인 개선","현장관리팀","진행중"],
                ["품질검사 결과 검토","품질관리팀","진행중"]
            ]
        }
    };

    function make(tag, text, className) {
        const el = document.createElement(tag);
        if (text !== undefined) el.textContent = text;
        if (className) el.className = className;
        return el;
    }

    function makeTable(headers, rows) {
        const wrap = make("div", undefined, "table-wrap");
        const table = make("table");
        const thead = make("thead");
        const headRow = make("tr");

        headers.forEach(h => {
            headRow.appendChild(make("th", h));
        });

        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = make("tbody");

        rows.forEach(values => {
            const tr = make("tr");

            values.forEach(value => {
                const td = make("td");

                if (typeof value === "string" &&
                    /^(완료|정상|적합|수주|승인|입고완료)$/.test(value)) {
                    const badge = make("span", value, "erp18-badge");
                    td.appendChild(badge);
                } else {
                    td.textContent = String(value);
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrap.appendChild(table);

        return { wrap, tbody };
    }

    function renderExpansion(key) {
        const c = config[key];
        if (!c) return;

        const target = document.getElementById("erpV17Page");
        if (!target) return;

        const old = document.getElementById("erp18Expansion");
        if (old) old.remove();

        const root = make("section");
        root.id = "erp18Expansion";

        const intro = make("div", undefined, "erp18-intro");
        intro.appendChild(make("h2", "📊 " + c.title + " 상세 운영현황"));
        intro.appendChild(make("p", c.desc));
        intro.appendChild(make(
            "p",
            "",
            "erp18-note"
        ));
        root.appendChild(intro);

        const grid = make("div", undefined, "erp18-grid");

        c.metrics.forEach(([label, value]) => {
            const card = make("div", undefined, "erp18-card");
            card.appendChild(make("span", label));
            card.appendChild(make("strong", value));
            grid.appendChild(card);
        });

        root.appendChild(grid);

        const processPanel = make("div", undefined, "erp18-panel");
        processPanel.appendChild(make("h2", "① 업무 처리 프로세스"));
        processPanel.appendChild(make(
            "p",
            "실무에서 사용하는 업무 흐름을 단계별로 구성했습니다.",
            "erp18-note"
        ));

        const flow = make("div", undefined, "erp18-flow");

        c.flow.forEach((step, i) => {
            flow.appendChild(make(
                "div",
                (i + 1) + ". " + step,
                "erp18-step"
            ));
        });

        processPanel.appendChild(flow);
        root.appendChild(processPanel);

        const detailPanel = make("div", undefined, "erp18-panel");
        detailPanel.appendChild(make("h2", "② 상세 업무현황"));

        const search = make("input");
        search.className = "erp18-search";
        search.placeholder = "번호, 거래처, 담당자, 상태 검색";
        search.setAttribute("aria-label", "상세 업무현황 검색");

        detailPanel.appendChild(search);

        const detailTable = makeTable(c.headers, c.rows);
        detailPanel.appendChild(detailTable.wrap);

        const count = make(
            "p",
            "조회 결과: " + c.rows.length + "건",
            "erp18-note"
        );

        detailPanel.appendChild(count);

        search.addEventListener("input", () => {
            const keyword = search.value.trim().toLowerCase();
            let visible = 0;

            Array.from(detailTable.tbody.rows).forEach(row => {
                const match = row.textContent
                    .toLowerCase()
                    .includes(keyword);

                row.style.display = match ? "" : "none";
                if (match) visible++;
            });

            count.textContent = "조회 결과: " + visible + "건";
        });

        root.appendChild(detailPanel);

        const checkPanel = make("div", undefined, "erp18-panel");
        checkPanel.appendChild(make("h2", "③ 주요 관리항목 및 점검현황"));

        const checks = makeTable(
            ["관리항목", "담당부서", "처리상태"],
            c.checks
        );

        checkPanel.appendChild(checks.wrap);
        root.appendChild(checkPanel);

        const summary = make("div", undefined, "erp18-panel");
        summary.appendChild(make("h2", "④ 운영현황 요약"));

        const moduleRows =
            Array.isArray(data.portfolioModules?.[key])
                ? data.portfolioModules[key]
                : [];

        summary.appendChild(make(
            "p",
            "기존 ERP에 등록된 업무 기록: " +
            moduleRows.length + "건"
        ));

        summary.appendChild(make(
            "p",
            "",
            "erp18-note"
        ));

        root.appendChild(summary);
        target.appendChild(root);
    }

    const previousShowPage = window.showPage;

    window.showPage = function (key, button) {
        previousShowPage(key, button);

        if (config[key]) {
            renderExpansion(key);
        }
    };

})();
