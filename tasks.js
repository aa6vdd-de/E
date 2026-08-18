let parsedRows=[];

function normalizePhone(v){
  let digits = String(v || "").replace(/\D/g, "");
  if(digits.startsWith("00966")) digits = digits.slice(2);
  if(digits.startsWith("966")) return digits;
  if(digits.startsWith("05")) return "966" + digits.slice(1);
  if(digits.startsWith("5") && digits.length === 9) return "966" + digits;
  return digits;
}

async function getExistingPhoneSet(){
  const snap = await db.ref("tasks").once("value");
  const all = snap.val() || {};
  const set = new Set();

  Object.values(all).forEach(employeeTasks => {
    tasksArray(employeeTasks).forEach(task => {
      const key = normalizePhone(task.phone);
      if(key) set.add(key);
    });
  });

  return set;
}

function validPhone(v){return String(v||"").replace(/\D/g,"").length>=7}
function normalizeRow(row){
 const obj={}; Object.keys(row||{}).forEach(k=>obj[String(k).trim().toLowerCase()]=row[k]);
 const name=obj["الاسم"]??obj["اسم العميل"]??obj["name"]??obj["client"]??obj["client name"]??"";
 const phone=obj["رقم التواصل"]??obj["الجوال"]??obj["رقم الجوال"]??obj["phone"]??obj["mobile"]??obj["number"]??"";
 return {clientName:String(name||"").trim(),phone:String(phone||"").trim()};
}
async function addSingleTask(){
 const employeeNumber=singleEmployee.value,clientName=singleName.value.trim(),phone=singlePhone.value.trim(),note=singleNote.value.trim(),deadline=singleDeadline.value;
 if(!clientName||!validPhone(phone)){alert("أدخل اسم العميل ورقم تواصل صحيح");return}
 if(!deadline){alert("حدد تاريخ انتهاء المهمة");return}

 const existingPhones = await getExistingPhoneSet();
 const phoneKey = normalizePhone(phone);
 if(existingPhones.has(phoneKey)){
   alert("هذا الرقم موجود مسبقًا في النظام ولن تتم إضافته مرة ثانية.");
   return;
 }

 await db.ref("tasks/"+employeeNumber).push().set({clientName,phone,status:"جديد",note,deadline,createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"});
 singleName.value="";singlePhone.value="";singleNote.value="";singleDeadline.value="";showToast("تم إرسال المهمة");
}
async function readSelectedFile(){
 const f=bulkFile.files[0]; if(!f)return [];
 const data=await f.arrayBuffer();
 const wb=XLSX.read(data,{type:"array"}); const ws=wb.Sheets[wb.SheetNames[0]];
 const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
 return rows.map(normalizeRow).filter(r=>r.clientName&&validPhone(r.phone));
}
function readPaste(){
 return bulkPaste.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const parts=line.split(/[;,\t]/);return {clientName:(parts[0]||"").trim(),phone:(parts[1]||"").trim()}}).filter(r=>r.clientName&&validPhone(r.phone));
}
async function previewBulk(){
 try{parsedRows=[...(await readSelectedFile()),...readPaste()];
 const uniq=[];const seen=new Set(); for(const r of parsedRows){const k=normalizePhone(r.phone);if(!seen.has(k)){seen.add(k);uniq.push(r)}} parsedRows=uniq;
 importPreview.innerHTML=parsedRows.length?`<strong>جاهز للاستيراد: ${parsedRows.length} عميل</strong><div style="margin-top:8px;color:var(--muted)">${parsedRows.slice(0,5).map(r=>esc(r.clientName)+" — "+esc(r.phone)).join("<br>")}${parsedRows.length>5?"<br>...":""}</div>`:"لم أجد صفوفًا صالحة. تأكد أن الملف يحتوي الاسم والرقم.";
 }catch(e){console.error(e);alert("تعذر قراءة الملف. تأكد أنه Excel أو CSV صحيح.")}
}
async function importBulk(){
 if(!parsedRows.length) await previewBulk();
 if(!parsedRows.length)return;

 const employeeNumber=bulkEmployee.value;
 const deadline=bulkDeadline.value;
 if(!deadline){alert("حدد تاريخ انتهاء المهام المستوردة");return}

 const existingPhones = await getExistingPhoneSet();
 const uniqueRows = [];
 const skipped = [];
 const batchSeen = new Set();

 parsedRows.forEach(r => {
   const key = normalizePhone(r.phone);
   if(!key || existingPhones.has(key) || batchSeen.has(key)){
     skipped.push(r);
     return;
   }
   batchSeen.add(key);
   uniqueRows.push(r);
 });

 if(!uniqueRows.length){
   alert(`لم تتم إضافة أي رقم. جميع الأرقام (${skipped.length}) موجودة مسبقًا أو مكررة.`);
   return;
 }

 const base=db.ref("tasks/"+employeeNumber);
 const updates={};
 uniqueRows.forEach(r=>{
   const key=base.push().key;
   updates[key]={clientName:r.clientName,phone:r.phone,status:"جديد",note:"",deadline,createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"};
 });

 await base.update(updates);

 const count=uniqueRows.length;
 const skippedCount=skipped.length;
 parsedRows=[];
 bulkFile.value="";
 bulkPaste.value="";
 bulkDeadline.value="";
 importPreview.textContent="لم يتم تحميل بيانات بعد.";

 showToast(skippedCount
   ? `تم استيراد ${count} عميل وتجاهل ${skippedCount} رقم مكرر`
   : `تم استيراد ${count} عميل`);
}
db.ref("tasks").on("value",snap=>{const all=snap.val()||{};taskCounts.innerHTML=employees.map(e=>{const s=calc(tasksArray(all[e.number]));return `<div class="card"><small>${esc(e.name)}</small><strong>${s.total}</strong><small>مهمة</small></div>`}).join("")});


function isTaskOverdue(task){
  if(!task || !task.deadline) return false;
  const finished = task.status === "تم التحويل إلى عميل" || task.status === "مكتمل";
  if(finished) return false;

  const end = new Date(task.deadline + "T23:59:59");
  return end.getTime() < Date.now();
}

function employeeByNumber(number){
  return employees.find(e => e.number === String(number));
}

db.ref("tasks").on("value", snap => {
  const all = snap.val() || {};
  const overdue = [];

  employees.forEach(emp => {
    tasksArray(all[emp.number]).forEach(task => {
      if(isTaskOverdue(task)){
        overdue.push({ employee: emp, task });
      }
    });
  });

  overdue.sort((a,b) => String(a.task.deadline).localeCompare(String(b.task.deadline)));

  const empty = overdue.length === 0;
  overdueEmpty.classList.toggle("hidden", !empty);
  overdueWrap.classList.toggle("hidden", empty);

  overdueBody.innerHTML = overdue.map(({employee,task}) => `
    <tr>
      <td><strong>${esc(employee.name)}</strong><br><small style="color:var(--muted)">#${employee.number}</small></td>
      <td>${esc(task.clientName || "—")}</td>
      <td><strong style="color:var(--red)">${esc(task.deadline || "—")}</strong></td>
      <td>${esc(task.status || "جديد")}</td>
      <td>
        <button class="action warning-action" onclick="openEmailModal('${employee.number}','${task.id}')">
          ✉️ إرسال تنبيه
        </button>
      </td>
    </tr>
  `).join("");
});

function openEmailModal(employeeNumber, taskId){
  const emp = employeeByNumber(employeeNumber);
  if(!emp) return;

  db.ref("tasks/" + employeeNumber + "/" + taskId).once("value").then(snap => {
    const task = snap.val() || {};

    emailEmployeeNumber.value = employeeNumber;
    emailTaskId.value = taskId;
    emailEmployeeName.value = emp.name;

    // Remember a previously entered email for this employee on this browser.
    employeeEmail.value = localStorage.getItem("employeeEmail_" + employeeNumber) || "";

    emailSubject.value = "تنبيه بخصوص تأخر تسليم المهمة";

    const deadlineText = task.deadline ? ` بتاريخ ${task.deadline}` : "";
    emailMessage.value =
`مرحبًا ${emp.name}،

نود تنبيهك بأن المهمة الخاصة بالعميل "${task.clientName || "المهمة المسندة إليك"}" كان موعد تسليمها${deadlineText} ولم يتم إكمالها حتى الآن.

يرجى إكمال وتسليم العمل خلال 24 ساعة من استلام هذا التنبيه.
في حال عدم التسليم خلال هذه المدة، قد تتأثر نسبة الأداء والإنجاز المسجلة في النظام.

شكرًا لك،
إدارة الريادة البصرية`;

    emailModal.classList.add("show");
  });
}

function closeEmailModal(){
  emailModal.classList.remove("show");
}

function sendWarningEmail(){
  const email = employeeEmail.value.trim();
  const subject = emailSubject.value.trim();
  const message = emailMessage.value.trim();
  const employeeNumber = emailEmployeeNumber.value;

  if(!email){
    alert("أدخل البريد الإلكتروني للموظف");
    return;
  }

  localStorage.setItem("employeeEmail_" + employeeNumber, email);

  const mailto =
    "mailto:" + encodeURIComponent(email) +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(message);

  window.location.href = mailto;
  closeEmailModal();
  showToast("تم تجهيز رسالة التنبيه");
}
