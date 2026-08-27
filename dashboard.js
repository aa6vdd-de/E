db.ref().on("value",snap=>{
  try{
    const root=snap.val()||{};
    const marketing=root.tasks||{};
    const projects=root.projectTasks||{};

    let totalTasks=0,totalDone=0,totalWon=0,totalPct=0;

    const employeeContainer=document.getElementById("dashboardEmployees");
    if(employeeContainer){
      employeeContainer.innerHTML=employees.map(e=>{
        if(isMarketingEmployee(e)){
          const s=calc(tasksArray(marketing[e.number]));
          totalTasks+=s.total;
          totalDone+=s.contacted;
          totalWon+=s.won;
          totalPct+=s.pct;
          return card(e,s.total,s.contacted,s.won,s.pct,"تم التواصل","عملاء مكتسبون");
        }

        const s=projectStats(projectTasksArray(projects[e.number]));
        totalTasks+=s.total;
        totalDone+=s.completed;
        totalPct+=s.pct;
        return card(e,s.total,s.completed,s.overdue,s.pct,"مكتملة","متأخرة");
      }).join("");
    }

    const empCount=document.getElementById("mgrEmpCount");
    const taskCount=document.getElementById("mgrTaskCount");
    const contacted=document.getElementById("mgrContacted");
    const won=document.getElementById("mgrWon");
    const avg=document.getElementById("mgrAvg");

    if(empCount) empCount.textContent=employees.length;
    if(taskCount) taskCount.textContent=totalTasks;
    if(contacted) contacted.textContent=totalDone;
    if(won) won.textContent=totalWon;
    if(avg) avg.textContent=Math.round(totalPct/employees.length||0)+"%";

    try{
      renderManagerContactNotes(marketing);
    }catch(notesError){
      console.error("Contact notes render failed:",notesError);
    }
  }catch(error){
    console.error("Manager dashboard render failed:",error);
  }
},error=>{
  console.error("Firebase root read failed:",error);
  const notesEmpty=document.getElementById("managerContactNotesEmpty");
  if(notesEmpty){
    notesEmpty.textContent="تعذر تحميل البيانات من Firebase. تحقق من قواعد Realtime Database.";
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
  const email=warningEmployeeEmail.value.trim();
  const subject=warningSubject.value.trim();
  const message=warningMessage.value.trim();
  const employeeNumber=warningEmployeeNumber.value;
  if(!subject){alert("اكتبي عنوان الرسالة.");return}
  if(!message){alert("اكتبي نص التحذير.");return}
  if(email)await saveEmployeeEmailToFirebase(employeeNumber,email);
  await createInternalNotification(employeeNumber,{title:subject,message,type:"warning"});
  const queued=await queueEmployeeEmail(employeeNumber,subject,message,{type:"warning"});
  closeManagerWarning();
  showToast(queued.queued?"تم إرسال الإشعار والبريد للموظف":"تم إرسال الإشعار الداخلي، ولا يوجد بريد محفوظ للموظف");
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
  const body = document.getElementById("managerContactNotesBody");
  const empty = document.getElementById("managerContactNotesEmpty");
  const wrap = document.getElementById("managerContactNotesWrap");
  if(!body || !empty || !wrap) return;

  const rows = [];

  employees
    .filter(e => isMarketingEmployee(e))
    .forEach(emp => {
      tasksArray(marketingData?.[emp.number]).forEach(task => {
        rows.push({
          employee: emp,
          clientName: task.clientName || "—",
          phone: task.phone || "—",
          status: task.status || "جديد",
          note: task.note || "—",
          updatedAt: task.updatedAt || task.createdAt || 0
        });
      });
    });

  rows.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));

  const isEmpty = rows.length === 0;
  empty.classList.toggle("hidden", !isEmpty);
  wrap.classList.toggle("hidden", isEmpty);

  body.innerHTML = rows.map(r => `
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
