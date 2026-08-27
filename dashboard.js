
let managerDashboardRoot = {};
let managerSelectedMonth = (() => {
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
})();

function itemMonth(item){
  const dateText=String(item?.deadline||item?.date||item?.createdDate||"").trim();
  const m=dateText.match(/^(\d{4})-(\d{2})/);
  if(m) return m[1]+"-"+m[2];

  const ts=Number(item?.createdAt||item?.updatedAt||0);
  if(ts){
    const d=new Date(ts);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  }
  return "";
}

function financeMonth(row){
  const explicit=String(row?.month||"").match(/^(\d{4})-(\d{2})/);
  if(explicit) return explicit[1]+"-"+explicit[2];

  const ts=Number(row?.createdAt||0);
  if(ts){
    const d=new Date(ts);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  }
  return "";
}

function arabicMonthLabel(ym){
  if(!ym) return "—";
  const [y,m]=ym.split("-").map(Number);
  return new Date(y,m-1,1).toLocaleDateString("ar-SA",{year:"numeric",month:"long"});
}

function filterBySelectedMonth(items){
  return items.filter(item=>itemMonth(item)===managerSelectedMonth);
}

function contactLogMonth(item){
  // 1) Best source: when the employee actually saved the communication update.
  const updated=Number(item?.updatedAt||0);
  if(updated){
    const d=new Date(updated);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  }

  // 2) Old records: use creation time.
  const created=Number(item?.createdAt||0);
  if(created){
    const d=new Date(created);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  }

  // 3) Very old data: use task date/deadline so it never disappears.
  const dateText=String(item?.date||item?.deadline||"").trim();
  const m=dateText.match(/^(\d{4})-(\d{2})/);
  if(m) return m[1]+"-"+m[2];

  return "";
}

function renderManagerDashboardForMonth(){
  const root=managerDashboardRoot||{};
  const marketing=root.tasks||{};
  const projects=root.projectTasks||{};
  const distributions=root.profitDistributions||{};

  let totalTasks=0,totalDone=0,totalWon=0,totalPct=0;

  const employeeContainer=document.getElementById("dashboardEmployees");
  if(employeeContainer){
    employeeContainer.innerHTML=employees.map(e=>{
      if(isMarketingEmployee(e)){
        const monthTasks=filterBySelectedMonth(tasksArray(marketing[e.number]));
        const s=calc(monthTasks);
        totalTasks+=s.total;
        totalDone+=s.contacted;
        totalWon+=s.won;
        totalPct+=s.pct;
        return card(e,s.total,s.contacted,s.won,s.pct,"تم التواصل","عملاء مكتسبون");
      }

      const monthProjects=filterBySelectedMonth(projectTasksArray(projects[e.number]));
      const s=projectStats(monthProjects);
      totalTasks+=s.total;
      totalDone+=s.completed;
      totalPct+=s.pct;
      return card(e,s.total,s.completed,s.overdue,s.pct,"مكتملة","متأخرة");
    }).join("");
  }

  if(document.getElementById("mgrEmpCount")) mgrEmpCount.textContent=employees.length;
  if(document.getElementById("mgrTaskCount")) mgrTaskCount.textContent=totalTasks;
  if(document.getElementById("mgrContacted")) mgrContacted.textContent=totalDone;
  if(document.getElementById("mgrWon")) mgrWon.textContent=totalWon;
  if(document.getElementById("mgrAvg")) mgrAvg.textContent=Math.round(totalPct/employees.length||0)+"%";

  // Communication log follows the selected month.
  const monthlyContactLog={};

  employees.filter(e=>isMarketingEmployee(e)).forEach(e=>{
    const rows=tasksArray(marketing[e.number]).filter(t=>{
      const note=String(t.note||"").trim();
      const status=String(t.status||"جديد").trim();
      const hasActivity=Boolean(note || status!=="جديد" || t.updatedAt);

      if(!hasActivity) return false;

      const month=contactLogMonth(t);

      // Keep undated legacy communication visible instead of losing it.
      if(!month) return true;

      return month===managerSelectedMonth;
    });

    monthlyContactLog[e.number]={};
    rows.forEach(t=>{
      monthlyContactLog[e.number][t.id]=t;
    });
  });

  try{
    renderManagerContactNotes(monthlyContactLog);
  }catch(err){
    console.error("Contact notes render failed:",err);

    const empty=document.getElementById("managerContactNotesEmpty");
    const wrap=document.getElementById("managerContactNotesWrap");

    if(empty){
      empty.textContent="تعذر تحميل سجل التواصل والملاحظات.";
      empty.classList.remove("hidden");
    }

    if(wrap){
      wrap.classList.add("hidden");
    }
  }

  // Monthly finance summary.
  const monthFinance=Object.values(distributions).filter(r=>financeMonth(r)===managerSelectedMonth);
  const totalRevenue=monthFinance.reduce((s,r)=>s+Number(r.total||0),0);
  const totalNet=monthFinance.reduce((s,r)=>s+Number(r.netProfit||0),0);
  const margin=totalRevenue?totalNet/totalRevenue*100:0;

  const picker=document.getElementById("managerMonthPicker");
  if(picker) picker.value=managerSelectedMonth;
  const monthLabel=document.getElementById("managerSelectedMonthLabel");
  if(monthLabel) monthLabel.textContent=arabicMonthLabel(managerSelectedMonth);
  const mt=document.getElementById("managerMonthTasks");
  if(mt) mt.textContent=totalTasks;
  const mc=document.getElementById("managerMonthCompleted");
  if(mc) mc.textContent=totalDone;
  const mn=document.getElementById("managerMonthNet");
  if(mn) mn.textContent=new Intl.NumberFormat("ar-SA",{maximumFractionDigits:2}).format(totalNet)+" ر.س";
  const mm=document.getElementById("managerMonthMargin");
  if(mm) mm.textContent=(Math.round(margin*100)/100)+"%";

  // Update headings so manager always knows which month is being viewed.
  const head=document.querySelector(".head h2");
  if(head) head.textContent="الصفحة العامة — "+arabicMonthLabel(managerSelectedMonth);
}

function changeManagerMonth(delta){
  const [y,m]=managerSelectedMonth.split("-").map(Number);
  const d=new Date(y,m-1+delta,1);
  managerSelectedMonth=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  renderManagerDashboardForMonth();
}

document.addEventListener("DOMContentLoaded",()=>{
  const picker=document.getElementById("managerMonthPicker");
  if(picker){
    picker.value=managerSelectedMonth;
    picker.addEventListener("change",()=>{
      if(picker.value) managerSelectedMonth=picker.value;
      renderManagerDashboardForMonth();
    });
  }
  document.getElementById("managerPrevMonth")?.addEventListener("click",()=>changeManagerMonth(-1));
  document.getElementById("managerNextMonth")?.addEventListener("click",()=>changeManagerMonth(1));
});

db.ref().on("value",snap=>{
  managerDashboardRoot=snap.val()||{};
  renderManagerDashboardForMonth();
},error=>{
  console.error("Firebase root read failed:",error);
  const notesEmpty=document.getElementById("managerContactNotesEmpty");
  if(notesEmpty){
    notesEmpty.textContent="تعذر تحميل البيانات من Firebase.";
    notesEmpty.classList.remove("hidden");
  }
});

function card(e,total,a,b,pct,labelA,labelB){
  return `<article class="dashboard-employee-card">
    <div class="dashboard-employee-top"><div class="employee-name"><div class="avatar">${esc(e.name[0])}</div><div><strong>${esc(e.name)}</strong><small>#${e.number}</small></div></div><button class="action warning-action" onclick="openManagerWarning('${e.number}')">✉️ تحذير</button></div>
    <a class="department-link dashboard-department" href="${departmentLink(e.department)}">${esc(employeeDepartmentsText(e))}</a>
    <div class="dashboard-mini-stats"><div><small>المهام</small><strong>${total}</strong></div><div><small>${labelA}</small><strong>${a}</strong></div><div><small>${labelB}</small><strong>${b}</strong></div></div>
    <div class="dashboard-performance"><div><small>نسبة الإنجاز</small><strong>${pct}%</strong></div><div class="progress"><span style="width:${pct}%"></span></div></div>
  </article>`;
}

function openManagerWarning(employeeNumber){
  const emp=employees.find(e=>e.number===String(employeeNumber));
  if(!emp)return;

  warningEmployeeNumber.value=emp.number;
  warningEmployeeName.value=emp.name;
  warningEmployeeEmail.value=accountEmail(emp.number)||"";
  warningSubject.value="";
  warningMessage.value="";
  warningSubject.placeholder="اكتب عنوان الرسالة";
  warningMessage.placeholder="اكتب نص التحذير أو الرسالة هنا...";
  managerWarningModal.classList.add("show");
}

function closeManagerWarning(){
  managerWarningModal.classList.remove("show");
}

function saveEmployeeEmail(){
  const email=warningEmployeeEmail.value.trim();
  if(!email){alert("أدخل البريد الإلكتروني أولًا");return}
  localStorage.setItem("employeeEmail_"+warningEmployeeNumber.value,email);
  showToast("تم حفظ بريد الموظف");
}

async function sendManagerWarning(){
  const subject=warningSubject.value.trim();
  const message=warningMessage.value.trim();
  const employeeNumber=warningEmployeeNumber.value;

  if(!accountEmail(employeeNumber)){alert("لا يوجد بريد ثابت لهذا الموظف.");return}
  if(!subject){alert("اكتبي عنوان الرسالة.");return}
  if(!message){alert("اكتبي نص التحذير.");return}

  try{
    await createInternalNotification(employeeNumber,{
      title:subject,
      message,
      type:"warning"
    });

    await queueEmployeeEmail(employeeNumber,subject,message,{
      type:"warning",
      taskTitle:"تنبيه إداري",
      department:"الإدارة"
    });

    closeManagerWarning();
    showToast("تم إرسال التحذير للموظف عبر البريد والإشعارات");
  }catch(error){
    console.error("Warning send failed:",error);
    alert("تعذر إرسال التحذير. حاولي مرة أخرى.");
  }
}

function formatManagerDate(timestamp){
  if(!timestamp) return "—";
  try{
    return new Date(timestamp).toLocaleString("ar-SA",{
      year:"numeric",
      month:"2-digit",
      day:"2-digit",
      hour:"2-digit",
      minute:"2-digit"
    });
  }catch(error){
    return "—";
  }
}

function renderManagerContactNotes(marketingData){
  const body=document.getElementById("managerContactNotesBody");
  const empty=document.getElementById("managerContactNotesEmpty");
  const wrap=document.getElementById("managerContactNotesWrap");

  if(!body || !empty || !wrap) return;

  const rows=[];

  employees
    .filter(e=>isMarketingEmployee(e))
    .forEach(emp=>{
      tasksArray(marketingData?.[emp.number]).forEach(task=>{
        const note=String(task.note||"").trim();
        const status=String(task.status||"جديد").trim();

        if(!note && status==="جديد" && !task.updatedAt) return;

        rows.push({
          employee:emp,
          clientName:task.clientName||"—",
          phone:task.phone||"—",
          status:status||"جديد",
          note:note||"—",
          updatedAt:task.updatedAt||task.createdAt||0
        });
      });
    });

  rows.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));

  body.innerHTML="";

  if(rows.length===0){
    wrap.classList.add("hidden");
    empty.textContent="لا توجد ملاحظات تواصل في "+arabicMonthLabel(managerSelectedMonth)+".";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  wrap.classList.remove("hidden");

  body.innerHTML=rows.map(r=>`
    <tr>
      <td>
        <div class="employee-name">
          <div class="avatar">${esc(r.employee.name[0])}</div>
          <div>
            <strong>${esc(r.employee.name)}</strong>
            <small>#${r.employee.number}</small>
          </div>
        </div>
      </td>
      <td><strong>${esc(r.clientName)}</strong></td>
      <td><span class="phone-number" dir="ltr">${esc(r.phone)}</span></td>
      <td><span class="contact-status-badge">${esc(r.status)}</span></td>
      <td><div class="manager-note-text">${esc(r.note)}</div></td>
      <td>${formatManagerDate(r.updatedAt)}</td>
    </tr>
  `).join("");
}

function renderEmailQueueStatus(){
  const box=document.getElementById("emailQueueStatus"); if(!box)return;
  db.ref("emailQueue").limitToLast(20).on("value",snap=>{
    const rows=snap.val()?Object.entries(snap.val()).map(([id,v])=>({id,...v})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)):[];
    box.innerHTML=rows.length?rows.map(r=>{
      const emp=employees.find(e=>e.number===String(r.employeeNumber));
      const date=r.createdAt?new Date(r.createdAt).toLocaleString("ar-SA"):"";
      return `<div class="email-queue-item"><div><strong>${esc(emp?.name||r.employeeNumber||"موظف")}</strong><small>${esc(r.to||"بدون بريد")}</small></div><div><strong>${esc(r.subject||"")}</strong><small>${date}</small></div><span class="queue-status ${esc(r.status||"pending")}">${r.status==="sent"?"تم الإرسال":r.status==="failed"?"فشل الإرسال":r.status==="sending"?"جاري الإرسال":"بانتظار الإرسال"}</span></div>`;
    }).join(""):'<div class="empty" style="padding:20px">لا توجد رسائل بعد.</div>';
  },error=>{
    console.error("Failed to load email queue:",error);
    box.innerHTML='<div class="empty" style="padding:20px">تعذر تحميل سجل البريد فقط، وباقي بيانات الصفحة تعمل بشكل طبيعي.</div>';
  });
}
renderEmailQueueStatus();
