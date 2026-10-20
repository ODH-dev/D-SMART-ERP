/* Operational workflow layer. Existing storage and source records remain intact. */
(function () {
    'use strict';
    const KEY = storageKey;
    const clone = value => JSON.parse(JSON.stringify(value));
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const fmt = value => Number(value || 0).toLocaleString('ko-KR');
    const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul'}).format(new Date());
    const timestamp = () => new Date().toISOString();
    const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    const labels = {draft:'작성중',requested:'승인대기',approved:'승인완료',rejected:'반려',received:'입고완료',shipped:'출고완료',closed:'마감',cancelled:'취소'};
    const kinds = {purchase:'발주',request:'구매요청',sales:'판매'};
    const sites = {W001:'본사 자재창고',W002:'A건설현장',W003:'B건설현장',W004:'C건설현장',W005:'물류센터'};
    let selected = null, mode = 'inbox', filter = '', auditAction = null;
    const page = document.createElement('section');
    page.id = 'operationsPage'; page.className = 'page';
    document.querySelector('.main').append(page);
    const panel = (title, body) => `<section class="panel"><h2>${escape(title)}</h2>${body}</section>`;
    const badge = status => `<span class="ops-badge ${escape(status)}">${escape(labels[status] || status)}</span>`;
    const button = (label, action, id = '', extra = '') => `<button type="button" class="action" data-ops-action="${action}" data-id="${escape(id)}" ${extra}>${escape(label)}</button>`;
    const table = (heads, rows) => `<div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}" class="ops-empty">등록된 내역이 없습니다.</td></tr>`}</tbody></table></div>`;
    function normalize(target) {
        if (target.operations?.version === 1) return target.operations;
        const docs = [];
        const migrate = (type, records) => (records || []).forEach((r, i) => {
            const status = r.status === '입고완료' ? 'received' : r.status === '출고완료' ? 'shipped' : r.status === '반려' ? 'rejected' : r.status === '취소' ? 'cancelled' : type === 'request' && r.status === '대기' ? 'requested' : 'approved';
            docs.push({id:`legacy-${type}-${i}`,number:r.number || r.id || `LEG-${i+1}`,type,partner:r.partner || '',code:r.code,qty:Number(r.quantity ?? r.qty),price:Number(r.price || 0),date:r.date || today(),due:r.due || r.date || today(),site:r.site || 'W001',owner:'관리자',status,sourceIndex:i,sourceType:type,attachments:[],notes:'',revision:1,imported:true});
        });
        migrate('purchase', target.portfolioModules?.purchase);
        migrate('sales', target.portfolioModules?.sales);
        migrate('request', target.erp19?.requests);
        target.operations = {version:1,seq:1,documents:docs,audit:[],stockEntries:[],actor:{name:'관리자',role:'관리자'},period:'all'};
        return target.operations;
    }
    const ops = () => normalize(data);
    function roleAllows(action, role) {
        const rules = {create:['관리자','구매담당','영업담당'],edit:['관리자','구매담당','영업담당'],submit:['관리자','구매담당','영업담당'],approve:['관리자','승인담당'],reject:['관리자','승인담당'],receive:['관리자','창고담당'],ship:['관리자','창고담당'],transfer:['관리자','창고담당'],usage:['관리자','창고담당'],close:['관리자','승인담당'],reverse:['관리자'],correct:['관리자','구매담당','영업담당']};
        return (rules[action] || []).includes(role);
    }
    function requireRole(state, action) {
        if (!roleAllows(action, state.actor.role)) throw new Error('현재 업무 역할로 처리할 수 없습니다.');
    }
    function positive(value, name) {
        const n = Number(value); if (!Number.isSafeInteger(n) || n <= 0) throw new Error(name+'은 1 이상의 정수여야 합니다.'); return n;
    }
    function amount(value) {
        const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new Error('단가는 0 이상의 정수여야 합니다.');return n;
    }
    function validateDoc(target, doc) {
        if(!target.products.some(p=>p.code===doc.code))throw new Error('등록된 품목을 선택하세요.');
        if(doc.type==='sales'&&target.operations.actor.role==='구매담당'||doc.type!=='sales'&&target.operations.actor.role==='영업담당')throw new Error('담당 업무에 맞는 전표 유형을 선택하세요.');
        doc.qty=positive(doc.qty,'수량');doc.price=amount(doc.price);
        if(!Number.isSafeInteger(doc.qty*doc.price))throw new Error('거래금액이 허용 범위를 초과합니다.');
        if(!doc.partner.trim()||!doc.owner.trim())throw new Error('거래처와 담당자를 입력하세요.');
        if(!sites[doc.site])throw new Error('등록된 창고·현장을 선택하세요.');
        for(const v of [doc.date,doc.due])if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw new Error('올바른 날짜를 입력하세요.');
        if(doc.due<doc.date)throw new Error('납기일은 작성일 이후여야 합니다.');
        if(!['purchase','request','sales'].includes(doc.type))throw new Error('올바른 전표 유형을 선택하세요.');
        if(doc.attachments.length>5||doc.attachments.some(a=>a.size>512000))throw new Error('첨부파일은 최대 5개, 파일당 500KB까지 가능합니다.');
    }
    function stocks(target, code) {
        const product=target.products.find(p=>p.code===code);if(!product)throw new Error('품목을 찾을 수 없습니다.');
        target.locationStocks ||= {};
        target.locationStocks[code] ||= {W001:product.stock,W002:0,W003:0,W004:0,W005:0};
        const locations=target.locationStocks[code];
        if(Object.values(locations).some(q=>!Number.isSafeInteger(q)||q<0)||Object.values(locations).reduce((s,q)=>s+q,0)!==product.stock)throw new Error('전체 재고와 창고별 재고가 일치하지 않습니다.');
        return {product,locations};
    }
    function move(target, doc, qty, site, reason) {
        const {product,locations}=stocks(target,doc.code);
        const next=product.stock+qty, local=(locations[site]||0)+qty;
        if(!Number.isSafeInteger(next)||!Number.isSafeInteger(local)||next<0||local<0)throw new Error('처리할 창고·현장의 재고가 부족하거나 수량 범위를 초과했습니다.');
        product.stock=next;locations[site]=local;
        const entry={id:uid(),documentId:doc.id,number:doc.number,date:timestamp(),code:doc.code,site,qty,reason,actor:target.operations.actor.name};
        target.operations.stockEntries.push(entry);
        target.movements.push({date:today()+' '+new Date().toTimeString().slice(0,8),code:doc.code,name:product.name,type:qty>0?'입고':'출고',qty:Math.abs(qty),operationId:entry.id,documentId:doc.id});
        return entry;
    }
    function mirror(target,doc) {
        const list=doc.sourceType==='request'?target.erp19?.requests:target.portfolioModules?.[doc.sourceType];
        const r=list?.[doc.sourceIndex];if(!r)return;
        r.status=doc.status==='closed'?(doc.type==='sales'?'출고완료':'입고완료'):doc.status==='approved'?(doc.type==='request'?'승인':doc.type==='sales'?'접수':'발주완료'):doc.status==='requested'?'대기':labels[doc.status];
        r.partner=doc.partner;r.code=doc.code;r.price=doc.price;r.date=doc.date;
        if(doc.sourceType==='request'){r.qty=doc.qty;r.due=doc.due;r.site=doc.site;}else r.quantity=doc.qty;
    }
    function auditRecord(next, before, context) {
        const s=normalize(next), previous=before?.operations;
        if(!context && JSON.stringify({...next,operations:undefined})===JSON.stringify({...before,operations:undefined}))return;
        const oldProducts=new Map((before?.products||[]).map(p=>[p.code,p]));
        const changes=(next.products||[]).filter(p=>JSON.stringify(oldProducts.get(p.code))!==JSON.stringify(p)).map(p=>({code:p.code,before:oldProducts.get(p.code)||null,after:clone(p)}));
        for(const p of before?.products||[])if(!next.products.some(n=>n.code===p.code))changes.push({code:p.code,before:clone(p),after:null});
        const record={id:uid(),date:timestamp(),actor:s.actor.name,role:s.actor.role,action:context?.action || '기존 업무 데이터 변경',documentId:context?.documentId || '',reason:context?.reason || '',changes};
        if(context?.documentId){record.before=clone(previous?.documents?.find(d=>d.id===context.documentId)||null);record.after=clone(s.documents.find(d=>d.id===context.documentId)||null);}
        s.audit.push(record);
    }
    // Record successful writes made by both the original modules and this layer.
    const originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
        if(this!==localStorage||key!==KEY)return originalSetItem.call(this,key,value);
        let next;try{next=JSON.parse(value);}catch{return originalSetItem.call(this,key,value);}
        if(!next || !Array.isArray(next.products)||!Array.isArray(next.movements))return originalSetItem.call(this,key,value);
        let previous;try{previous=JSON.parse(this.getItem(key));}catch{previous=null;}
        // A restore replaces workflow data, but retain a record that the replacement occurred.
        if(!next.operations && previous?.operations){normalize(next);next.operations.audit=clone(previous.operations.audit);}
        auditRecord(next,previous,auditAction);
        return originalSetItem.call(this,key,JSON.stringify(next));
    };
    function syncPersisted() {
        try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.operations)data.operations=saved.operations;}catch{/* Original app reports storage errors. */}
    }
    function commit(action,documentId,reason,mutate) {
        const beforeStored=localStorage.getItem(KEY),next=clone(data);normalize(next);
        mutate(next);
        if(localStorage.getItem(KEY)!==beforeStored)throw new Error('다른 작업에서 데이터가 변경되었습니다. 다시 시도하세요.');
        auditAction={action,documentId,reason};
        try{localStorage.setItem(KEY,JSON.stringify(next));}finally{auditAction=null;}
        data=JSON.parse(localStorage.getItem(KEY));render();
    }
    function transition(id,action,reason='') {
        let name={submit:'승인 요청',approve:'승인',reject:'반려',receive:'입고 처리',ship:'출고 처리',close:'전표 마감',reverse:'전표 취소'}[action];
        if(!name)throw new Error('지원하지 않는 처리입니다.');
        commit(name,id,reason,next=>{
            const state=next.operations;requireRole(state,action);
            const doc=state.documents.find(d=>d.id===id);if(!doc)throw new Error('전표를 찾을 수 없습니다.');
            if(action==='submit'){if(!['draft','rejected'].includes(doc.status))throw new Error('작성중 또는 반려 전표만 승인 요청할 수 있습니다.');validateDoc(next,doc);doc.status='requested';}
            if(action==='approve'||action==='reject'){if(doc.status!=='requested')throw new Error('승인대기 전표만 처리할 수 있습니다.');if(action==='reject'&&!reason.trim())throw new Error('반려 사유를 입력하세요.');doc.status=action==='approve'?'approved':'rejected';doc.approver=state.actor.name;}
            if(action==='receive'||action==='ship'){
                if(doc.status!=='approved')throw new Error('승인된 전표만 입출고할 수 있습니다.');
                if((action==='ship')!==(doc.type==='sales'))throw new Error('전표 유형과 처리 방식이 다릅니다.');
                validateDoc(next,doc);const entry=move(next,doc,(action==='ship'?-1:1)*doc.qty,'W001',name);doc.stockEntryId=entry.id;doc.status=action==='ship'?'shipped':'received';
            }
            if(action==='close'){if(!['received','shipped'].includes(doc.status))throw new Error('입출고 완료 전표만 마감할 수 있습니다.');doc.status='closed';}
            if(action==='reverse'){
                if(!reason.trim())throw new Error('취소 사유를 입력하세요.');
                if(doc.status==='cancelled')throw new Error('이미 취소된 전표입니다.');
                const entry=state.stockEntries.find(e=>e.id===doc.stockEntryId);
                if(['received','shipped','closed'].includes(doc.status)){
                    if(!entry)throw new Error('기존 완료 전표는 원장 추적 정보가 없어 자동 취소할 수 없습니다.');
                    if(entry.reversedBy)throw new Error('이미 취소 전표가 생성되었습니다.');
                    const reversing=move(next,doc,-entry.qty,entry.site,'취소: '+reason);entry.reversedBy=reversing.id;reversing.reverses=entry.id;
                }
                doc.status='cancelled';doc.cancelReason=reason;
            }
            doc.updatedAt=timestamp();doc.revision++;mirror(next,doc);
        });
    }
    function createDoc(values,attachments=[],corrects='') {
        let id=uid();
        commit(corrects?'정정 전표 작성':'전표 작성',id,values.reason||'',next=>{
            const state=next.operations;requireRole(state,corrects?'correct':'create');
            if(corrects){const old=state.documents.find(d=>d.id===corrects);if(!old||old.status!=='cancelled')throw new Error('취소 후 정정 전표를 작성하세요.');if(old.correctedBy)throw new Error('정정 전표가 이미 존재합니다.');old.correctedBy=id;}
            const number=(values.type==='sales'?'SO':'PO')+'-'+today().replaceAll('-','')+'-'+String(state.seq++).padStart(4,'0');
            const doc={id,number,type:values.type,partner:values.partner.trim(),code:values.code,qty:Number(values.qty),price:Number(values.price),date:values.date,due:values.due,site:values.site,owner:values.owner.trim(),notes:values.notes||'',status:'draft',attachments,revision:1,createdAt:timestamp(),corrects};
            validateDoc(next,doc);
            const key=doc.type==='request'?'request':doc.type;
            let list;if(key==='request'){next.erp19 ||= {};next.erp19.requests ||= [];list=next.erp19.requests;}else{next.portfolioModules ||= {};next.portfolioModules[key] ||= [];list=next.portfolioModules[key];}
            doc.sourceIndex=list.length;doc.sourceType=key;
            list.push(key==='request'?{id:number,site:doc.site,due:doc.due,qty:doc.qty}:{number,quantity:doc.qty});
            state.documents.push(doc);mirror(next,doc);
        });
        return id;
    }
    function stockAction(type,values) {
        commit(type==='usage'?'현장 자재 사용':'현장 자재 이동','',values.reason||'',next=>{
            const state=next.operations;requireRole(state,type);
            if(!['W002','W003','W004'].includes(values.site))throw new Error('도착 현장을 선택하세요.');
            const qty=positive(values.qty,'수량'),{product,locations}=stocks(next,values.code);
            if(type==='transfer'){
                if(locations.W001<qty)throw new Error('본사 창고 재고가 부족합니다.');
                if(!Number.isSafeInteger(locations[values.site]+qty))throw new Error('수량 범위를 초과했습니다.');
                locations.W001-=qty;locations[values.site]+=qty;
                next.locationTransfers ||= [];next.locationTransfers.push({date:today(),code:product.code,name:product.name,from:'W001',to:values.site,qty});
            }else{
                const price=amount(values.price);if(!Number.isSafeInteger(price*qty))throw new Error('원가 범위를 초과했습니다.');
                move(next,{id:'usage-'+uid(),number:'현장사용',code:values.code},-qty,values.site,'현장 사용');
                next.erp19.expenses.push({site:values.site,category:'자재비',amount:qty*price,date:today()});
            }
        });
    }
    const productName=code=>data.products.find(p=>p.code===code)?.name||code;
    function documentRows(docs) {return docs.map(d=>`<tr><td>${button(d.number,'detail',d.id)}</td><td>${escape(kinds[d.type])}</td><td>${escape(d.partner)}</td><td>${escape(productName(d.code))}</td><td>${fmt(d.qty)}</td><td>${fmt(d.qty*d.price)}원</td><td>${escape(d.due)}</td><td>${escape(d.owner)}</td><td>${badge(d.status)}</td></tr>`);}
    function grid(items){return `<div class="ops-kpis">${items.map(([label,value])=>`<div class="card"><h3>${escape(label)}</h3><strong>${escape(value)}</strong></div>`).join('')}</div>`;}
    function worklist() {
        const state=ops(),docs=state.documents;
        const pending=docs.filter(d=>d.status==='requested');
        const ready=docs.filter(d=>d.status==='approved');
        const late=docs.filter(d=>['requested','approved'].includes(d.status)&&d.due<today());
        const mine=docs.filter(d=>d.owner===state.actor.name&&!['closed','cancelled','rejected'].includes(d.status));
        return grid([['승인 대기',pending.length+'건'],['입출고 대기',ready.length+'건'],['납기 지연',late.length+'건'],['내 진행 업무',mine.length+'건']])+`<div class="ops-toolbar">${button('승인 대기 보기','filter-requested')}${button('입출고 대기 보기','filter-approved')}${button('지연 전표 보기','filter-late')}${button('내 전표 보기','filter-mine')}${button('새 전표 작성','new')}</div>`+panel('처리할 업무',table(['전표번호','유형','거래처','품목','수량','금액','납기일','담당자','상태'],documentRows(docs.filter(d=>['requested','approved'].includes(d.status)).sort((a,b)=>a.due.localeCompare(b.due)))));
    }
    function listView() {
        const state=ops();let docs=state.documents;
        if(mode==='purchase')docs=docs.filter(d=>d.type!=='sales');if(mode==='sales')docs=docs.filter(d=>d.type==='sales');
        if(mode==='approval')docs=docs.filter(d=>['requested','rejected','approved'].includes(d.status));
        if(filter==='late')docs=docs.filter(d=>['requested','approved'].includes(d.status)&&d.due<today());else if(filter==='mine')docs=docs.filter(d=>d.owner===state.actor.name);else if(filter)docs=docs.filter(d=>d.status===filter);
        return `<div class="ops-toolbar">${button('새 전표 작성','new')}<label>상태 <select id="opsStatusFilter"><option value="">전체</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${filter===k?'selected':''}>${v}</option>`).join('')}</select></label><label>검색 <input id="opsSearch" type="search" placeholder="전표번호·거래처·품목·담당자"></label></div>`+panel('전표 목록',table(['전표번호','유형','거래처','품목','수량','금액','납기일','담당자','상태'],documentRows(docs)))+`<p class="notice">${docs.length}건 · 처리 완료 전표는 상세 화면에서 취소·정정할 수 있습니다.</p>`;
    }
    function options(map,value){return Object.entries(map).map(([k,v])=>`<option value="${escape(k)}" ${k===value?'selected':''}>${escape(v)}</option>`).join('');}
    function formView(doc=null,corrects='') {
        const state=ops(),v=doc||{type:mode==='sales'?'sales':'purchase',code:data.products[0]?.code,qty:1,price:0,date:today(),due:today(),site:'W001',partner:'',owner:state.actor.name,notes:''};
        return panel(corrects?'정정 전표 작성':doc?'전표 수정':'신규 전표',`<form id="opsDocumentForm" class="erp19-form" data-edit="${doc&&!corrects?escape(doc.id):''}" data-corrects="${escape(corrects)}"><label>전표 유형<select name="type">${options(kinds,v.type)}</select></label><label>거래처<input name="partner" required maxlength="100" value="${escape(v.partner)}" list="opsPartners"></label><datalist id="opsPartners">${(data.portfolioModules?.partners||[]).map(p=>`<option value="${escape(p.name)}"></option>`).join('')}</datalist><label>품목<select name="code" required>${options(Object.fromEntries(data.products.map(p=>[p.code,p.code+' · '+p.name])),v.code)}</select></label><label>수량<input name="qty" type="number" min="1" step="1" required value="${v.qty}"></label><label>단가 (원)<input name="price" type="number" min="0" step="1" required value="${v.price}"></label><label>작성일<input name="date" type="date" required value="${escape(v.date)}"></label><label>납기일<input name="due" type="date" required value="${escape(v.due)}"></label><label>창고·현장<select name="site">${options(sites,v.site)}</select></label><label>담당자<input name="owner" required maxlength="80" value="${escape(v.owner)}"></label><label class="ops-wide">비고<textarea name="notes" maxlength="2000">${escape(v.notes)}</textarea></label><label class="ops-wide">첨부파일 (최대 5개, 각각 500KB)<input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.xlsx,.docx"></label><button class="action" type="submit">작성 내용 저장</button>${button('목록으로','list')}</form>`);
    }
    function detailView(id) {
        const state=ops(),doc=state.documents.find(d=>d.id===id);if(!doc)return panel('전표','전표를 찾을 수 없습니다.');
        const actions=[];const can=a=>roleAllows(a,state.actor.role);
        if(['draft','rejected'].includes(doc.status)){if(can('edit'))actions.push(button('내용 수정','edit',id));if(can('submit'))actions.push(button('승인 요청','submit',id));}
        if(doc.status==='requested'){if(can('approve'))actions.push(button('승인','approve',id));if(can('reject'))actions.push(button('반려','reason-reject',id));}
        if(doc.status==='approved'){const a=doc.type==='sales'?'ship':'receive';if(can(a))actions.push(button(doc.type==='sales'?'출고 처리':'입고 처리',a,id));}
        if(['received','shipped'].includes(doc.status)&&can('close'))actions.push(button('마감','close',id));
        if(doc.status!=='cancelled'&&can('reverse'))actions.push(button('취소 전표 작성','reason-reverse',id));
        if(doc.status==='cancelled'&&!doc.correctedBy&&can('correct'))actions.push(button('정정 전표 작성','correct',id));
        const timeline=state.audit.filter(a=>a.documentId===id).map(a=>`<li><b>${escape(a.action)}</b> <time>${escape(new Date(a.date).toLocaleString('ko-KR'))}</time><span>${escape(a.actor)} · ${escape(a.role)}${a.reason?' · '+escape(a.reason):''}</span></li>`).join('');
        return `<div class="ops-toolbar">${button('목록으로','list')}${actions.join('')}${button('전표 인쇄','print',id)}</div>`+panel(doc.number,`${badge(doc.status)}<div class="ops-flow">${['draft','requested','approved',doc.type==='sales'?'shipped':'received','closed'].map(s=>`<span class="${doc.status===s?'current':''}">${labels[s]}</span>`).join('<span>→</span>')}</div><dl class="ops-detail">${[['유형',kinds[doc.type]],['거래처',doc.partner],['품목',productName(doc.code)],['수량',fmt(doc.qty)],['단가',fmt(doc.price)+'원'],['합계',fmt(doc.qty*doc.price)+'원'],['작성일',doc.date],['납기일',doc.due],['창고·현장',sites[doc.site]],['담당자',doc.owner],['승인자',doc.approver||'—'],['수정 버전',doc.revision]].map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl><p>${escape(doc.notes)}</p>${doc.corrects?`<p>원본 전표 ${button(state.documents.find(d=>d.id===doc.corrects)?.number||doc.corrects,'detail',doc.corrects)}</p>`:''}${doc.correctedBy?`<p>정정 전표 ${button(state.documents.find(d=>d.id===doc.correctedBy)?.number||doc.correctedBy,'detail',doc.correctedBy)}</p>`:''}${doc.attachments.length?'<h3>첨부파일</h3>'+doc.attachments.map((a,i)=>button(a.name,'attachment',id,`data-index="${i}"`)).join(''):''}`)+panel('처리 이력',`<ol class="ops-timeline">${timeline||'<li>이관 이후의 처리 이력이 없습니다.</li>'}</ol>`)+`<div id="opsReasonArea"></div>`;
    }
    function analysisView() {
        const period=ops().period||'all';const months=[...new Set((data.erp19?.expenses||[]).map(e=>(e.date||'').slice(0,7)).filter(Boolean))].sort().reverse();
        const expenses=(data.erp19?.expenses||[]).filter(e=>period==='all'||e.date.startsWith(period));
        const transfers=data.locationTransfers||[];
        const rows=Object.entries(data.erp19?.budgets||{}).map(([site,info])=>{
            const extra=expenses.filter(e=>e.site===site).reduce((s,e)=>s+Number(e.amount||0),0),opening=Number(info.baseline||0),budget=Number(info.budget||0),spent=opening+extra,rate=budget?spent/budget*100:0;
            const stock=data.products.reduce((s,p)=>s+Number(data.locationStocks?.[p.code]?.[site]||0),0);
            return `<tr><td>${escape(sites[site]||site)}</td><td>${fmt(budget)}</td><td>${fmt(opening)}</td><td>${fmt(extra)}</td><td>${fmt(spent)}</td><td>${fmt(budget-spent)}</td><td><progress max="100" value="${Math.min(100,rate)}"></progress> ${rate.toFixed(1)}%</td><td>${fmt(stock)}</td></tr>`;
        });
        const shortages=data.products.filter(p=>p.stock<(p.minStock??({C001:80,C008:100,C010:200,C011:30,C022:20}[p.code]||0)));
        return `<div class="ops-toolbar"><label>집행 기간<select id="opsPeriod"><option value="all">전체</option>${months.map(m=>`<option ${m===period?'selected':''}>${m}</option>`).join('')}</select></label></div>`+grid([['등록 비용',fmt(expenses.reduce((s,e)=>s+Number(e.amount||0),0))+'원'],['재고 보충 필요',shortages.length+'품목'],['현장 이동 기록',transfers.length+'건'],['전체 재고',fmt(data.products.reduce((s,p)=>s+p.stock,0))]])+panel('현장별 예산·원가',table(['현장','총예산 (원)','기초 집행 (원)','선택 기간 등록 비용 (원)','기초+등록 비용 (원)','잔액 (원)','집행률','현재 재고'],rows))+`<p class="notice">기초 집행은 기존 예산의 이월금액이며, 기간 필터는 등록 비용에 적용됩니다. 재고는 현재 보유 수량입니다.</p>`+panel('현장별 자재 보유',table(['현장','품목코드','품목','수량','단위'],data.products.flatMap(p=>Object.entries(data.locationStocks?.[p.code]||{}).filter(([site,q])=>site!=='W001'&&q>0).map(([site,q])=>`<tr><td>${escape(sites[site]||site)}</td><td>${escape(p.code)}</td><td>${escape(p.name)}</td><td>${fmt(q)}</td><td>${escape(p.unit)}</td></tr>`))));
    }
    function logisticsView(){return panel('전표 입출고',`<p>승인된 전표를 선택해 본사 창고 입출고를 처리합니다.</p>`+table(['전표번호','유형','거래처','품목','수량','금액','납기일','담당자','상태'],documentRows(ops().documents.filter(d=>d.status==='approved'))))+['transfer','usage'].map(type=>panel(type==='transfer'?'본사 → 현장 이동':'현장 자재 사용',`<form class="erp19-form" data-ops-stock="${type}"><label>현장<select name="site">${options(Object.fromEntries(Object.entries(sites).filter(([k])=>['W002','W003','W004'].includes(k))),'W002')}</select></label><label>품목<select name="code">${options(Object.fromEntries(data.products.map(p=>[p.code,p.name])),data.products[0]?.code)}</select></label><label>수량<input name="qty" type="number" min="1" step="1" required></label>${type==='usage'?'<label>원가 단가 (원)<input name="price" type="number" min="0" step="1" required></label>':''}<button class="action" type="submit">${type==='transfer'?'자재 이동':'사용·원가 반영'}</button></form>`)).join('');}
    function auditView(){return panel('업무 변경 이력',table(['처리일시','담당자','역할','처리','전표','사유','재고 변경'],[...ops().audit].reverse().map(a=>`<tr><td>${escape(new Date(a.date).toLocaleString('ko-KR'))}</td><td>${escape(a.actor)}</td><td>${escape(a.role)}</td><td>${escape(a.action)}</td><td>${a.documentId?button(ops().documents.find(d=>d.id===a.documentId)?.number||a.documentId,'detail',a.documentId):'—'}</td><td>${escape(a.reason)}</td><td>${a.changes.map(c=>escape(c.code)+': '+escape(c.before?.stock??'신규')+' → '+escape(c.after?.stock??'삭제')).join('<br>')||'—'}</td></tr>`)))+`<p class="notice">이력은 이 기능 적용 이후 저장된 업무부터 기록합니다.</p>`;}
    function paint(){
        const actor=ops().actor;
        page.innerHTML=`<div class="ops-context"><span>담당자: ${escape(actor.name)} · ${escape(actor.role)}</span>${button('업무 역할 설정','actor')}</div><div id="opsMessage" role="status" aria-live="polite"></div>`+(selected?detailView(selected):mode==='new'?formView():mode==='analysis'?analysisView():mode==='logistics'?logisticsView():mode==='audit'?auditView():mode==='inbox'?worklist():listView());
        const search=document.getElementById('opsSearch');if(search)search.addEventListener('input',()=>{const q=search.value.toLowerCase();page.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q));});
        document.getElementById('opsStatusFilter')?.addEventListener('change',e=>{filter=e.target.value;paint();});
        document.getElementById('opsPeriod')?.addEventListener('change',e=>{data.operations.period=e.target.value;paint();});
    }
    function message(error){const box=document.getElementById('opsMessage');if(box){box.textContent=error.message||String(error);box.className='ops-error';}}
    function open(nextMode,buttonEl){mode=nextMode;selected=null;filter='';document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));page.classList.add('active');document.querySelectorAll('.sidebar button').forEach(b=>b.classList.toggle('active',b===buttonEl));document.getElementById('pageTitle').textContent=({inbox:'내 업무',purchase:'구매·발주관리',sales:'매입·매출관리',approval:'전자결재관리',analysis:'현장별 재고·원가',logistics:'통합 물류관리',audit:'업무 변경 이력'})[mode]||'전표 관리';paint();}
    const routes={purchase:'purchase',sales:'sales','erp19-approval':'approval','erp19-flow':'logistics','erp19-analysis':'analysis','erp19-budget':'analysis',reports:'analysis'};
    const previousShowPage=window.showPage;
    window.showPage=function(key,buttonEl){if(routes[key]){render();open(routes[key],buttonEl);return;}return previousShowPage(key,buttonEl);};
    const sidebar=document.querySelector('.sidebar');
    for(const [title,nextMode] of [['내 업무','inbox'],['전표·변경 이력','audit']]){const b=document.createElement('button');b.textContent=title;b.addEventListener('click',()=>open(nextMode,b));sidebar.insertBefore(b,sidebar.querySelector('.notice'));}
    document.querySelector('.menu-search')?.addEventListener('input',event=>{const q=event.target.value.trim().toLowerCase();sidebar.querySelectorAll('button').forEach(b=>{b.hidden=!b.textContent.toLowerCase().includes(q);});});
    const box=document.createElement('div');box.id='operationsInbox';box.className='panel';
    document.getElementById('v2Dashboard').querySelector('.v2-heading').after(box);
    box.addEventListener('click',event=>{const b=event.target.closest('[data-ops-action]');if(!b)return;open('inbox');if(b.dataset.opsAction==='detail'){selected=b.dataset.id;paint();}else if(b.dataset.opsAction.startsWith('filter-')){filter=b.dataset.opsAction.slice(7);mode='documents';paint();}else if(b.dataset.opsAction==='new'){mode='new';paint();}});
    function updateInbox(){const state=ops(),docs=state.documents;box.innerHTML='<h2>오늘 확인할 업무</h2>'+grid([['승인 대기',docs.filter(d=>d.status==='requested').length+'건'],['입출고 대기',docs.filter(d=>d.status==='approved').length+'건'],['납기 지연',docs.filter(d=>['requested','approved'].includes(d.status)&&d.due<today()).length+'건'],['내 진행 업무',docs.filter(d=>d.owner===state.actor.name&&!['closed','cancelled','rejected'].includes(d.status)).length+'건']])+`<div class="ops-toolbar">${button('승인 대기','filter-requested')}${button('입출고 대기','filter-approved')}${button('납기 지연','filter-late')}${button('내 전표','filter-mine')}</div>`;}
    const previousRender=render;
    render=function(...args){syncPersisted();normalize(data);const result=previousRender.apply(this,args);updateInbox();if(page.classList.contains('active'))paint();return result;};
    page.addEventListener('click',event=>{
        const b=event.target.closest('[data-ops-action]');if(!b)return;const action=b.dataset.opsAction,id=b.dataset.id;
        try{
            if(action==='detail'){selected=id;paint();}
            else if(action==='new'){selected=null;mode='new';paint();}
            else if(action==='list'){selected=null;if(['new','inbox'].includes(mode))mode='documents';paint();}
            else if(action.startsWith('filter-')){selected=null;mode='documents';filter=action.slice(7);paint();}
            else if(action==='edit'){const d=ops().documents.find(d=>d.id===id);requireRole(ops(),'edit');if(!d||!['draft','rejected'].includes(d.status))throw new Error('작성중·반려 전표만 수정할 수 있습니다.');page.innerHTML='<div id="opsMessage" role="status"></div>'+formView(d);}
            else if(action==='correct'){const d=ops().documents.find(d=>d.id===id);requireRole(ops(),'correct');if(d.status!=='cancelled')throw new Error('취소 전표만 정정할 수 있습니다.');page.innerHTML='<div id="opsMessage" role="status"></div>'+formView(d,id);}
            else if(action.startsWith('reason-')){document.getElementById('opsReasonArea').innerHTML=panel('처리 사유',`<form id="opsReasonForm" data-action="${escape(action.slice(7))}" data-id="${escape(id)}"><label>사유 <input name="reason" required maxlength="500"></label><button class="action" type="submit">처리 확정</button></form>`);}
            else if(action==='actor'){page.insertAdjacentHTML('afterbegin',panel('업무 역할 설정',`<form id="opsActorForm" class="erp19-form"><label>담당자<input name="name" required maxlength="80" value="${escape(ops().actor.name)}"></label><label>업무 역할<select name="role">${options(Object.fromEntries(['관리자','구매담당','영업담당','승인담당','창고담당'].map(r=>[r,r])),ops().actor.role)}</select></label><button class="action" type="submit">적용</button></form><p class="notice">현재 브라우저의 업무 처리 역할을 선택합니다. 계정 로그인과 서버 권한 검증은 연결되어 있지 않습니다.</p>`));}
            else if(action==='attachment'){const a=ops().documents.find(d=>d.id===id)?.attachments[Number(b.dataset.index)];if(!a||!/^data:/.test(a.content))throw new Error('첨부파일을 찾을 수 없습니다.');const link=document.createElement('a');link.href=a.content;link.download=a.name;link.click();}
            else if(action==='print'){window.print();}
            else{if(!confirm('선택한 전표를 '+({approve:'승인',submit:'승인 요청',receive:'입고',ship:'출고',close:'마감'}[action]||'처리')+'하시겠습니까?'))return;transition(id,action);}
        }catch(error){message(error);}
    });
    page.addEventListener('submit',async event=>{
        const form=event.target;if(!form.matches('#opsDocumentForm,#opsReasonForm,#opsActorForm,[data-ops-stock]'))return;event.preventDefault();
        const values=Object.fromEntries(new FormData(form));const submitButton=form.querySelector('[type=submit]');submitButton.disabled=true;
        try{
            if(form.id==='opsDocumentForm'){
                const files=[...form.querySelector('[name=files]').files];if(files.length>5||files.some(f=>f.size>512000))throw new Error('첨부파일은 최대 5개, 파일당 500KB까지 가능합니다.');
                const attachments=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({id:uid(),name:file.name,size:file.size,type:file.type,content:reader.result});reader.onerror=()=>reject(new Error('첨부파일을 읽지 못했습니다.'));reader.readAsDataURL(file);})));
                if(form.dataset.edit){const id=form.dataset.edit;commit('전표 수정',id,'',next=>{requireRole(next.operations,'edit');const d=next.operations.documents.find(d=>d.id===id);if(!d||!['draft','rejected'].includes(d.status))throw new Error('수정 가능한 상태가 아닙니다.');if(values.type!==d.type)throw new Error('전표 유형 변경은 취소 후 신규 전표로 작성하세요.');Object.assign(d,{type:values.type,partner:values.partner.trim(),code:values.code,qty:Number(values.qty),price:Number(values.price),date:values.date,due:values.due,site:values.site,owner:values.owner.trim(),notes:values.notes});if(attachments.length)d.attachments=attachments;d.revision++;validateDoc(next,d);mirror(next,d);});selected=id;}
                else selected=createDoc(values,attachments,form.dataset.corrects);
                paint();
            }else if(form.id==='opsReasonForm'){transition(form.dataset.id,form.dataset.action,values.reason);}
            else if(form.id==='opsActorForm'){if(!values.name.trim())throw new Error('담당자를 입력하세요.');if(!['관리자','구매담당','영업담당','승인담당','창고담당'].includes(values.role))throw new Error('등록된 업무 역할을 선택하세요.');commit('업무 역할 변경','','',next=>{next.operations.actor={name:values.name.trim(),role:values.role};});paint();}
            else stockAction(form.dataset.opsStock,values);
        }catch(error){message(error);}finally{if(submitButton.isConnected)submitButton.disabled=false;}
    });
    // Preserve existing records and write the migration only once.
    if(!data.operations){normalize(data);originalSetItem.call(localStorage,KEY,JSON.stringify(data));}
    render();
})();
