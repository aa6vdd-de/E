
const current=JSON.parse(sessionStorage.getItem("currentAccount")||"null");
if(!current||current.role!=="employee")location.href="index.html";

empSideName.textContent=current.name;
empSideNumber.textContent="الرقم الوظيفي: "+current.number;
empTopName.textContent=current.name;
welcomeName.textContent=current.name;

if(isMarketingEmployee(current)){
  marketingArea.classList.remove("hidden");
  employeePageDescription.textContent="كل عميل ترسلها المديرةة يظهر هنا كمهمة تواصل مستقلة.";
  scoreLabel.textContent="نسبة التواصل";
  db.ref("tasks/"+current.number).on("value",s=>renderMarketing(tasksArray(s.val())));
}else{
  projectArea.classList.remove("hidden");
  employeePageDescription.textContent="بيانات العميل للمرجعية فقط. مهمتك تنفيذ العمل وتسليمه في الموعد المحدد.";
  scoreLabel.textContent="نسبة إنجاز المشاريع";
  db.ref("projectTasks/"+current.number).on("value",s=>renderProjects(projectTasksArray(s.val())));
}

function renderMarketing(tasks){
  const s=calc(tasks);
  empTotal.textContent=s.total;empContacted.textContent=s.contacted;empWon.textContent=s.won;empWon2.textContent=s.won;empPostponed.textContent=s.postponed;empRemaining.textContent=Math.max(monthlyTarget-s.won,0);empScore.textContent=s.pct+"%";targetBar.style.width=Math.min(s.won/monthlyTarget*100,100)+"%";
  const empty=!tasks.length;
  employeeEmpty.classList.toggle("hidden", !empty);
  employeeTableWrap.classList.toggle("hidden", empty);
  if(empty){
    employeeEmpty.innerHTML='<div class="emoji">📭</div><strong>لا توجد مهام حاليًا</strong><div style="margin-top:8px;color:var(--muted)">ستظهر المهمة هنا عند إضافتها من المديرةةة.</div>';
  }
  employeeTasksBody.innerHTML=tasks.map((t,i)=>`<tr><td>${i+1}</td><td><strong>${esc(t.clientName)}</strong></td><td><span class="phone-number" dir="ltr">${esc(t.phone)}</span></td><td>${esc(t.deadline||"—")}</td><td><select class="status-select" id="status-${t.id}">${["جديد","تم التواصل","تم التحويل إلى عميل","مؤجل","لا يرد"].map(st=>`<option ${t.status===st?"selected":""}>${st}</option>`).join("")}</select></td><td><input class="note-input" id="note-${t.id}" value="${esc(t.note||"")}"></td><td><button class="action" onclick="saveMarketing('${t.id}')">حفظ</button></td></tr>`).join("");
}
async function saveMarketing(id){
  await db.ref("tasks/"+current.number+"/"+id).update({status:document.getElementById("status-"+id).value,note:document.getElementById("note-"+id).value.trim(),updatedAt:firebase.database.ServerValue.TIMESTAMP});
  showToast("تم حفظ التحديث");
}

function renderProjects(tasks){
  const now=Date.now();
  tasks.forEach(t=>{if(t.deadline&&t.status!=="مكتملة"&&new Date(t.deadline+"T23:59:59").getTime()<now&&t.status!=="متأخرة"){db.ref("projectTasks/"+current.number+"/"+t.id+"/status").set("متأخرة");t.status="متأخرة"}});
  const s=projectStats(tasks);
  projectTotal.textContent=s.total;projectInProgress.textContent=s.inProgress;projectCompleted.textContent=s.completed;projectOverdue.textContent=s.overdue;projectPct.textContent=s.pct+"%";empScore.textContent=s.pct+"%";
  const empty=!tasks.length;
  projectEmpty.classList.toggle("hidden", !empty);
  projectTableWrap.classList.toggle("hidden", empty);
  if(empty){
    projectEmpty.innerHTML='<div class="emoji">📭</div><strong>لا توجد مهام حاليًا</strong><div style="margin-top:8px;color:var(--muted)">ستظهر المهمة هنا عند إضافتها من المديرةةة.</div>';
  }
  projectTasksBody.innerHTML=tasks.map((t,i)=>`<tr><td>${i+1}</td><td><strong>${esc(t.title||"—")}</strong></td><td>${esc(t.clientName||"—")}</td><td><span class="phone-number" dir="ltr">${esc(t.clientPhone||"—")}</span></td><td>${esc(t.department||"—")}</td><td><div class="task-description">${esc(t.description||"—")}</div></td><td>${esc(t.deadline||"—")}</td><td><select class="status-select" id="project-status-${t.id}">${["قيد التنفيذ","مكتملة","متأخرة"].map(st=>`<option ${t.status===st?"selected":""}>${st}</option>`).join("")}</select></td><td><button class="action" onclick="saveProject('${t.id}')">حفظ</button></td></tr>`).join("");
}
async function saveProject(id){
  await db.ref("projectTasks/"+current.number+"/"+id).update({status:document.getElementById("project-status-"+id).value,updatedAt:firebase.database.ServerValue.TIMESTAMP});
  showToast("تم تحديث حالة المهمة");
}
function logout(){sessionStorage.removeItem("currentAccount");location.href="index.html"}

function startEmployeeNotifications(){
  db.ref("notifications/"+current.number).on("value",snap=>{
    const data=snap.val()||{};
    const rows=Object.entries(data).map(([id,v])=>({id,...v})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const empty=document.getElementById("employeeNotificationsEmpty");
    const list=document.getElementById("employeeNotifications");
    const count=document.getElementById("unreadNotificationCount");
    if(!empty||!list||!count)return;
    const unread=rows.filter(n=>!n.read).length;
    count.textContent=unread;
    count.classList.toggle("has-unread",unread>0);
    empty.classList.toggle("hidden",rows.length>0);
    list.innerHTML=rows.map(n=>{
      const cls=n.type==="warning"?"warning":n.type==="project"?"project":"task";
      const date=n.createdAt?new Date(n.createdAt).toLocaleString("ar-SA"):"";
      return `<article class="notification-item ${cls} ${n.read?"read":""}">
        <div class="notification-main"><strong>${esc(n.title||"إشعار")}</strong><p>${esc(n.message||"")}</p><small>${date}</small></div>
        ${n.read?"<span class='read-mark'>مقروء</span>":`<button class="action" onclick="markNotificationRead('${n.id}')">تحديد كمقروء</button>`}
      </article>`;
    }).join("");
  });
}
async function markNotificationRead(id){
  await db.ref("notifications/"+current.number+"/"+id+"/read").set(true);
}
startEmployeeNotifications();
