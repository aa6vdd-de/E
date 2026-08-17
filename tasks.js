let parsedRows=[];
function validPhone(v){return String(v||"").replace(/\D/g,"").length>=7}
function normalizeRow(row){
 const obj={}; Object.keys(row||{}).forEach(k=>obj[String(k).trim().toLowerCase()]=row[k]);
 const name=obj["الاسم"]??obj["اسم العميل"]??obj["name"]??obj["client"]??obj["client name"]??"";
 const phone=obj["رقم التواصل"]??obj["الجوال"]??obj["رقم الجوال"]??obj["phone"]??obj["mobile"]??obj["number"]??"";
 return {clientName:String(name||"").trim(),phone:String(phone||"").trim()};
}
async function addSingleTask(){
 const employeeNumber=singleEmployee.value,clientName=singleName.value.trim(),phone=singlePhone.value.trim(),note=singleNote.value.trim();
 if(!clientName||!validPhone(phone)){alert("أدخل اسم العميل ورقم تواصل صحيح");return}
 await db.ref("tasks/"+employeeNumber).push().set({clientName,phone,status:"جديد",note,createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"});
 singleName.value="";singlePhone.value="";singleNote.value="";showToast("تم إرسال المهمة");
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
 const uniq=[];const seen=new Set(); for(const r of parsedRows){const k=r.phone.replace(/\D/g,"");if(!seen.has(k)){seen.add(k);uniq.push(r)}} parsedRows=uniq;
 importPreview.innerHTML=parsedRows.length?`<strong>جاهز للاستيراد: ${parsedRows.length} عميل</strong><div style="margin-top:8px;color:var(--muted)">${parsedRows.slice(0,5).map(r=>esc(r.clientName)+" — "+esc(r.phone)).join("<br>")}${parsedRows.length>5?"<br>...":""}</div>`:"لم أجد صفوفًا صالحة. تأكد أن الملف يحتوي الاسم والرقم.";
 }catch(e){console.error(e);alert("تعذر قراءة الملف. تأكد أنه Excel أو CSV صحيح.")}
}
async function importBulk(){
 if(!parsedRows.length) await previewBulk(); if(!parsedRows.length)return;
 const employeeNumber=bulkEmployee.value; const base=db.ref("tasks/"+employeeNumber); const updates={};
 parsedRows.forEach(r=>{const key=base.push().key;updates[key]={clientName:r.clientName,phone:r.phone,status:"جديد",note:"",createdAt:firebase.database.ServerValue.TIMESTAMP,createdBy:"2000"}});
 await base.update(updates); const count=parsedRows.length; parsedRows=[]; bulkFile.value="";bulkPaste.value="";importPreview.textContent="لم يتم تحميل بيانات بعد.";showToast(`تم استيراد ${count} عميل`);
}
db.ref("tasks").on("value",snap=>{const all=snap.val()||{};taskCounts.innerHTML=employees.map(e=>{const s=calc(tasksArray(all[e.number]));return `<div class="card"><small>${esc(e.name)}</small><strong>${s.total}</strong><small>مهمة</small></div>`}).join("")});
