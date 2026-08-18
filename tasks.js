
let parsedRows=[];
let marketingAll={};
let projectAll={};

function validPhone(v){return String(v||"").replace(/\D/g,"").length>=7}
function normalizePhone(v){
  let d=String(v||"").replace(/\D/g,"");
  if(d.startsWith("00966"))d=d.slice(2);
  if(d.startsWith("966"))return d;
  if(d.startsWith("05"))return "966"+d.slice(1);
  if(d.startsWith("5")&&d.length===9)return "966"+d;
  return d;
}
function normalizeRow(row){
  const o={};Object.keys(row||{}).forEach(k=>o[String(k).trim().toLowerCase()]=row[k]);
  return {
    clientName:String(o["الاسم"]??o["اسم العميل"]??o["name"]??o["client"]??"").trim(),
    phone:String(o["رقم التواصل"]??o["الجوال"]??o["رقم الجوال"]??o["phone"]??o["mobile"]??"").trim()
  };
}
async function getExistingPhoneSet(){
  const snap=await db.ref("tasks").once("value"), all=snap.val()||{}, set=new Set();
  Object.values(all).forEach(v=>tasksArray(v).forEach(t=>{const k=normalizePhone(t.phone);if(k)set.add(k)}));
  return set;
}
async function addSingleTask(){
  const employeeNumber=singleEmployee.value,clientName=singleName.value.trim(),phone=singlePhone.value.trim(),note=singleNote.value.trim(),deadline=singleDeadline.value;
  if(!clientName||!validPhone(phone)){alert("أدخل اسم العميل ورقم تواصل صحيح");return}
  if(!deadline){alert("حدد تاريخ انتهاء المهمة");return}
  if((await getExistingPhoneSet()).has(normalizePhone(phone))){alert("هذا الرقم موجود مسبقًا في النظام.");return}
  await db.ref("tasks/"+employeeNumber).push().set({clientName,phone,status:"جديد",note,deadline,workType:"marketing",createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"});
  singleName.value="";singlePhone.value="";singleNote.value="";singleDeadline.value="";showToast("تم إرسال مهمة التواصل");
}
async function readSelectedFile(){
  const f=bulkFile.files[0];if(!f)return[];
  const data=await f.arrayBuffer(),wb=XLSX.read(data,{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws,{defval:""}).map(normalizeRow).filter(r=>r.clientName&&validPhone(r.phone));
}
function readPaste(){
  return bulkPaste.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
    const p=line.split(/[;,\t]/);return{clientName:(p[0]||"").trim(),phone:(p[1]||"").trim()}
  }).filter(r=>r.clientName&&validPhone(r.phone));
}
async function previewBulk(){
  parsedRows=[...(await readSelectedFile()),...readPaste()];
  const seen=new Set();parsedRows=parsedRows.filter(r=>{const k=normalizePhone(r.phone);if(seen.has(k))return false;seen.add(k);return true});
  importPreview.innerHTML=parsedRows.length?`<strong>جاهز للاستيراد: ${parsedRows.length} عميل</strong>`:"لم أجد بيانات صالحة.";
}
async function importBulk(){
  if(!parsedRows.length)await previewBulk();if(!parsedRows.length)return;
  const employeeNumber=bulkEmployee.value,deadline=bulkDeadline.value;if(!deadline){alert("حدد تاريخ انتهاء المهام");return}
  const existing=await getExistingPhoneSet(),seen=new Set(),valid=[],skipped=[];
  parsedRows.forEach(r=>{const k=normalizePhone(r.phone);if(existing.has(k)||seen.has(k)){skipped.push(r)}else{seen.add(k);valid.push(r)}});
  if(!valid.length){alert("كل الأرقام مكررة.");return}
  const ref=db.ref("tasks/"+employeeNumber),updates={};
  valid.forEach(r=>{updates[ref.push().key]={clientName:r.clientName,phone:r.phone,status:"جديد",note:"",deadline,workType:"marketing",createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"}});
  await ref.update(updates);parsedRows=[];bulkFile.value="";bulkPaste.value="";bulkDeadline.value="";importPreview.textContent="لم يتم تحميل بيانات بعد.";
  showToast(skipped.length?`تم استيراد ${valid.length} وتجاهل ${skipped.length} مكرر`:`تم استيراد ${valid.length} عميل`);
}
async function addProjectTask(){
  const employeeNumber=projectEmployee.value,title=projectTitle.value.trim(),clientName=projectClientName.value.trim(),clientPhone=projectClientPhone.value.trim(),deadline=projectDeadline.value,department=projectDepartment.value,description=projectDescription.value.trim();
  if(!title||!clientName||!clientPhone||!deadline||!description){alert("أكمل بيانات المهمة والعميل والتفاصيل وتاريخ التسليم.");return}
  if(employeeNumber==="1970"&&department!=="التصميم"){alert("أحمد تابع لقسم التصميم.");return}
  if(employeeNumber==="2003"&&department!=="تصميم المواقع"){alert("يوسف 2003 تابع لتصميم المواقع.");return}
  if(employeeNumber==="2004"&&department!=="تحليل البيانات"){alert("يوسف 2004 تابع لتحليل البيانات.");return}
  await db.ref("projectTasks/"+employeeNumber).push().set({title,clientName,clientPhone,deadline,department,description,status:"قيد التنفيذ",workType:"project",createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"});
  projectTitle.value="";projectClientName.value="";projectClientPhone.value="";projectDeadline.value="";projectDescription.value="";showToast("تم إرسال مهمة المشروع");
}
function past(d){return d&&new Date(d+"T23:59:59").getTime()<Date.now()}
function renderAll(){
  taskCounts.innerHTML=employees.map(e=>{
    const m=calc(tasksArray(marketingAll[e.number])),p=projectStats(projectTasksArray(projectAll[e.number]));
    return `<div class="card"><small>${esc(e.name)}</small><strong>${m.total+p.total}</strong><small>${isMarketingEmployee(e)?"مهام تواصل":"مهام مشاريع"}</small></div>`;
  }).join("");

  const rows=[];
  employees.forEach(e=>{
    tasksArray(marketingAll[e.number]).forEach(t=>{if(past(t.deadline)&&t.status!=="تم التحويل إلى عميل")rows.push({e,type:"تواصل",label:t.clientName,date:t.deadline,status:t.status,id:t.id,source:"tasks"})});
    projectTasksArray(projectAll[e.number]).forEach(t=>{
      if(past(t.deadline)&&t.status!=="مكتملة"){
        if(t.status!=="متأخرة")db.ref("projectTasks/"+e.number+"/"+t.id+"/status").set("متأخرة");
        rows.push({e,type:"مشروع",label:t.title,date:t.deadline,status:"متأخرة",id:t.id,source:"projectTasks"});
      }
    });
  });
  overdueEmpty.classList.toggle("hidden",rows.length>0);overdueWrap.classList.toggle("hidden",rows.length===0);
  const allRows=[];
  employees.forEach(e=>{
    tasksArray(marketingAll[e.number]).forEach(t=>allRows.push({
      e,type:"تواصل",label:t.clientName,date:t.deadline,status:t.status,id:t.id,source:"tasks",department:"التسويق"
    }));
    projectTasksArray(projectAll[e.number]).forEach(t=>allRows.push({
      e,type:"مشروع",label:t.title,date:t.deadline,status:t.status,id:t.id,source:"projectTasks",department:t.department||employeeDepartmentsText(e)
    }));
  });
  managerAllTasksEmpty.classList.toggle("hidden",allRows.length>0);
  managerAllTasksWrap.classList.toggle("hidden",allRows.length===0);
  managerAllTasksBody.innerHTML=allRows.map(r=>`<tr><td><strong>${esc(r.e.name)}</strong></td><td>${esc(r.department||"—")}</td><td>${r.type}</td><td>${esc(r.label||"—")}</td><td>${esc(r.date||"—")}</td><td>${esc(r.status||"—")}</td><td><button class="action delete-action" onclick="deleteTask('${r.e.number}','${r.id}','${r.source}')">🗑️ حذف</button></td></tr>`).join("");

  overdueBody.innerHTML=rows.map(r=>`<tr><td><strong>${esc(r.e.name)}</strong></td><td>${r.type}</td><td>${esc(r.label||"—")}</td><td>${esc(r.date||"—")}</td><td>${esc(r.status||"—")}</td><td><button class="action warning-action" onclick="openEmailModal('${r.e.number}','${r.id}','${r.source}')">✉️ إرسال تنبيه</button> <button class="action delete-action" onclick="deleteTask('${r.e.number}','${r.id}','${r.source}')">🗑️ حذف</button></td></tr>`).join("");
}
db.ref("tasks").on("value",s=>{marketingAll=s.val()||{};renderAll()});
db.ref("projectTasks").on("value",s=>{projectAll=s.val()||{};renderAll()});

function openEmailModal(employeeNumber,taskId,source){
  const emp=employees.find(e=>e.number===String(employeeNumber));if(!emp)return;
  db.ref(source+"/"+employeeNumber+"/"+taskId).once("value").then(s=>{
    const task=s.val()||{};
    emailEmployeeNumber.value=employeeNumber;emailTaskId.value=taskId;emailEmployeeName.value=emp.name;
    employeeEmail.value=localStorage.getItem("employeeEmail_"+employeeNumber)||accountEmail(employeeNumber)||"";
    emailSubject.value="تنبيه بخصوص تأخر تسليم المهمة";
    emailMessage.value=`مرحبًا ${emp.name}،

نود تنبيهك بأن المهمة "${task.title||task.clientName||"المهمة المسندة إليك"}" تجاوزت موعد التسليم (${task.deadline||"غير محدد"}).

يرجى إكمال وتسليم العمل خلال 24 ساعة من استلام هذا التنبيه.
في حال عدم التسليم خلال هذه المدة، قد تتأثر نسبة الأداء والإنجاز المسجلة في النظام.

شكرًا لك،
إدارة الريادة البصرية`;
    emailModal.classList.add("show");
  });
}
function closeEmailModal(){emailModal.classList.remove("show")}
function sendWarningEmail(){
  const email=employeeEmail.value.trim();if(!email){alert("أدخل البريد الإلكتروني للموظف");return}
  localStorage.setItem("employeeEmail_"+emailEmployeeNumber.value,email);
  location.href="mailto:"+encodeURIComponent(email)+"?subject="+encodeURIComponent(emailSubject.value.trim())+"&body="+encodeURIComponent(emailMessage.value.trim());
  closeEmailModal();
}

async function deleteTask(employeeNumber, taskId, source){
  if(!confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
  try{
    await db.ref(source+"/"+employeeNumber+"/"+taskId).remove();
    showToast("تم حذف المهمة");
  }catch(err){
    console.error(err);
    alert("تعذر حذف المهمة. حاول مرة أخرى.");
  }
}
