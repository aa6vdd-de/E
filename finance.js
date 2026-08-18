
const financeEmployees = employees.map(e => ({
  name:e.name,
  number:e.number,
  department:employeeDepartmentsText(e)
}));

function money(v){
  return Number(v || 0).toLocaleString("ar-SA",{minimumFractionDigits:0,maximumFractionDigits:2}) + " ر.س";
}

function renderBeneficiaries(){
  beneficiaryList.innerHTML = financeEmployees.map(e => `
    <div class="beneficiary-row">
      <label class="beneficiary-person">
        <input type="checkbox" class="beneficiary-check" data-number="${e.number}">
        <span>
          <strong>${esc(e.name)}</strong>
          <small>${esc(e.department)} · #${e.number}</small>
        </span>
      </label>
      <div class="beneficiary-amount">
        <label>المبلغ</label>
        <input type="number" min="0" step="0.01" class="beneficiary-value" data-number="${e.number}" value="0" disabled>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".beneficiary-check").forEach(chk=>{
    chk.addEventListener("change",()=>{
      const input=document.querySelector(`.beneficiary-value[data-number="${chk.dataset.number}"]`);
      input.disabled=!chk.checked;
      if(!chk.checked) input.value=0;
      calculateFinance();
    });
  });

  document.querySelectorAll(".beneficiary-value").forEach(input=>{
    input.addEventListener("input",calculateFinance);
  });
}

function selectedBeneficiaries(){
  return [...document.querySelectorAll(".beneficiary-check:checked")].map(chk=>{
    const emp=financeEmployees.find(e=>e.number===chk.dataset.number);
    const amount=Number(document.querySelector(`.beneficiary-value[data-number="${chk.dataset.number}"]`).value||0);
    return {...emp,amount};
  });
}

function calculateFinance(){
  const total=Number(financeTotal.value||0);
  const base=Number(financeBaseCosts.value||0);
  const extra=Number(financeExtraCosts.value||0);
  const selected=selectedBeneficiaries();
  const employeesTotal=selected.reduce((sum,e)=>sum+e.amount,0);
  const totalCosts=base+extra;
  const net=total-totalCosts-employeesTotal;
  const margin=total>0?(net/total)*100:0;

  beneficiaryCount.textContent=selected.length;
  resultTotal.textContent=money(total);
  resultCosts.textContent=money(totalCosts);
  resultEmployees.textContent=money(employeesTotal);
  resultNet.textContent=money(net);
  resultMargin.textContent=(Math.round(margin*100)/100)+"%";

  profitStatus.className="profit-status";
  if(total<=0){
    profitStatus.classList.add("neutral");
    profitStatus.textContent="أدخلي المبلغ الإجمالي لعرض حالة هامش الربح.";
  }else if(margin>=30){
    profitStatus.classList.add("good");
    profitStatus.textContent=`✅ هامش الربح ${margin.toFixed(2)}% — أعلى من الحد المستهدف 30%.`;
  }else{
    profitStatus.classList.add("warning");
    profitStatus.textContent=`⚠️ هامش الربح ${margin.toFixed(2)}% — أقل من الحد المستهدف 30%.`;
  }

  return {total,base,extra,totalCosts,employeesTotal,net,margin,selected};
}

async function saveDistribution(){
  const projectName=financeProjectName.value.trim();
  const calc=calculateFinance();

  if(!projectName){
    alert("أدخلي اسم المشروع أو العملية.");
    return;
  }
  if(calc.total<=0){
    alert("أدخلي المبلغ الإجمالي.");
    return;
  }

  await db.ref("profitDistributions").push().set({
    projectName,
    total:calc.total,
    baseCosts:calc.base,
    extraCosts:calc.extra,
    employeesTotal:calc.employeesTotal,
    beneficiaries:calc.selected,
    netProfit:calc.net,
    margin:calc.margin,
    createdAt:firebase.database.ServerValue.TIMESTAMP,
    createdBy:"2000"
  });

  showToast("تم حفظ توزيع المبالغ والربحية");
}

function resetDistribution(){
  financeProjectName.value="";
  financeTotal.value="";
  financeBaseCosts.value=0;
  financeExtraCosts.value=0;
  document.querySelectorAll(".beneficiary-check").forEach(c=>c.checked=false);
  document.querySelectorAll(".beneficiary-value").forEach(i=>{i.value=0;i.disabled=true});
  calculateFinance();
}

[financeTotal,financeBaseCosts,financeExtraCosts].forEach(el=>el.addEventListener("input",calculateFinance));

db.ref("profitDistributions").on("value",snap=>{
  const rows = snap.val()
    ? Object.entries(snap.val()).map(([id,v])=>({id,...v})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))
    : [];

  financeHistoryEmpty.classList.toggle("hidden",rows.length>0);
  financeHistoryWrap.classList.toggle("hidden",rows.length===0);

  financeHistoryBody.innerHTML=rows.map(r=>{
    const names=(r.beneficiaries||[]).map(b=>`${esc(b.name)} (${money(b.amount)})`).join("، ")||"—";
    const date=r.createdAt?new Date(r.createdAt).toLocaleDateString("ar-SA"):"—";
    return `<tr>
      <td>${date}</td>
      <td><strong>${esc(r.projectName||"—")}</strong></td>
      <td>${money(r.total)}</td>
      <td>${money((r.baseCosts||0)+(r.extraCosts||0))}</td>
      <td>${names}</td>
      <td>${money(r.netProfit)}</td>
      <td><strong>${Number(r.margin||0).toFixed(2)}%</strong></td>
      <td><button class="action delete-action" onclick="deleteDistribution('${r.id}')">🗑️ حذف</button></td>
    </tr>`;
  }).join("");
});

async function deleteDistribution(id){
  if(!confirm("هل أنت متأكدة من حذف هذه العملية؟")) return;
  await db.ref("profitDistributions/"+id).remove();
  showToast("تم حذف العملية");
}

renderBeneficiaries();
calculateFinance();
