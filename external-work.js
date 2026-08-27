const marketingEmployees=employees.filter(e=>isMarketingEmployee(e));
const employeeFilter=document.getElementById("externalWorkEmployeeFilter");
const monthFilter=document.getElementById("externalWorkMonthFilter");

marketingEmployees.forEach(e=>{
  const o=document.createElement("option");
  o.value=e.number;
  o.textContent=`${e.name} #${e.number}`;
  employeeFilter.appendChild(o);
});

monthFilter.value=new Date().toISOString().slice(0,7);
let externalWorksRoot={};

function externalWorkMonth(r){
  return /^\d{4}-\d{2}/.test(String(r.date||"")) ? String(r.date).slice(0,7) : "";
}

function renderExternalWorks(){
  const emp=employeeFilter.value;
  const month=monthFilter.value;
  const all=[];

  marketingEmployees.forEach(e=>{
    Object.entries(externalWorksRoot[e.number]||{}).forEach(([id,v])=>all.push({id,employee:e,...v}));
  });

  const filtered=all
    .filter(r=>!emp||String(r.employee.number)===emp)
    .filter(r=>!month||externalWorkMonth(r)===month)
    .sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  externalWorkTotal.textContent=all.length;
  externalWorkMonthCount.textContent=month?all.filter(r=>externalWorkMonth(r)===month).length:all.length;
  externalWorkEmployees.textContent=new Set(filtered.map(r=>r.employee.number)).size;
  externalWorkManagerEmpty.classList.toggle("hidden",filtered.length>0);
  externalWorkManagerWrap.classList.toggle("hidden",filtered.length===0);

  externalWorkManagerBody.innerHTML=filtered.map(r=>`
    <tr>
      <td><strong>${esc(r.employee.name)}</strong><small style="display:block">#${r.employee.number}</small></td>
      <td><strong>${esc(r.title||"—")}</strong></td>
      <td>${esc(r.details||"—")}</td>
      <td>${esc(r.date||"—")}</td>
      <td>${esc(r.department||"التسويق")}</td>
    </tr>`).join("");
}

employeeFilter.addEventListener("change",renderExternalWorks);
monthFilter.addEventListener("change",renderExternalWorks);
db.ref("externalWorks").on("value",snap=>{
  externalWorksRoot=snap.val()||{};
  renderExternalWorks();
});
