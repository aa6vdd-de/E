const firebaseConfig = {
  apiKey: "AIzaSyCj7qvCOYlmVaSr42iwjwnXgRBJ2ThRkGo",
  authDomain: "yyyy-903f7.firebaseapp.com",
  databaseURL: "https://yyyy-903f7-default-rtdb.firebaseio.com",
  projectId: "yyyy-903f7",
  storageBucket: "yyyy-903f7.firebasestorage.app",
  messagingSenderId: "468867906649",
  appId: "1:468867906649:web:d77daacbc7c53a57468548",
  measurementId: "G-2BGN5DX35R"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const accounts = [
  {name:"نورة", aliases:["نورة","نوره"], number:"2000", role:"manager", email:"1@visulallead1.com"},
  {name:"أريام", aliases:["أريام","اريام"], number:"1890", role:"employee", department:"التسويق"},
  {name:"طيف", aliases:["طيف"], number:"1818", role:"employee", department:"التسويق"},
  {name:"دلال", aliases:["دلال"], number:"1018", role:"employee", department:"التسويق"},
  {name:"أحمد", aliases:["أحمد","احمد"], number:"1970", role:"employee", department:"التصميم"},
  {name:"يوسف", aliases:["يوسف"], number:"2003", role:"employee", department:"تصميم المواقع", email:"aa6vdd@gmail.com"},
  {name:"يوسف", aliases:["يوسف"], number:"2004", role:"employee", department:"تحليل البيانات", email:"aa6vdd@gmail.com"}
];

const employees = accounts.filter(a => a.role === "employee");
const departments = ["التسويق","التصميم","تحليل البيانات","تصميم المواقع"];
const additionalDepartmentMembers = [];
const monthlyTarget = 5;

function normalizeArabic(v){
  return String(v || "").trim().replace(/[إأآ]/g,"ا").replace(/\s+/g," ");
}

function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

function tasksArray(value){
  if(!value) return [];
  return Object.entries(value).map(([id,t]) => ({id,...t}));
}

function calc(tasks){
  const total = tasks.length;
  const contacted = tasks.filter(t => t.status === "تم التواصل" || t.status === "تم التحويل إلى عميل").length;
  const won = tasks.filter(t => t.status === "تم التحويل إلى عميل").length;
  const postponed = tasks.filter(t => t.status === "مؤجل").length;
  const pct = total ? Math.round(contacted / total * 100) : 0;
  return {total, contacted, won, postponed, pct};
}

function showToast(message){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

async function ensureProfiles(){
  const updates = {};
  accounts.forEach(a => {
    updates["profiles/"+a.number+"/name"] = a.name;
    updates["profiles/"+a.number+"/role"] = a.role;
    updates["profiles/"+a.number+"/employeeNumber"] = a.number;
    if(a.email) updates["profiles/"+a.number+"/email"] = a.email;
    if(a.role === "employee"){
      updates["profiles/"+a.number+"/monthlyTarget"] = monthlyTarget;
      updates["profiles/"+a.number+"/department"] = a.department || "";
      if(Array.isArray(a.departments)){
        updates["profiles/"+a.number+"/departments"] = a.departments;
      }
    }
  });
  await db.ref().update(updates);
}
ensureProfiles().catch(console.error);

function departmentLink(department){
  return "department-details.html?department=" + encodeURIComponent(department || "");
}

function employeeInDepartment(employee, department){
  if(Array.isArray(employee.departments)){
    return employee.departments.includes(department);
  }
  return employee.department === department;
}

function employeeDepartmentsText(employee){
  if(Array.isArray(employee.departments) && employee.departments.length){
    return employee.departments.join(" + ");
  }
  return employee.department || "غير محدد";
}

function isMarketingEmployee(employee){
  return employeeInDepartment(employee, "التسويق");
}
function projectTasksArray(value){
  if(!value) return [];
  return Object.entries(value).map(([id,t]) => ({id,...t}));
}
function projectStats(tasks){
  const total=tasks.length;
  const completed=tasks.filter(t=>t.status==="مكتملة").length;
  const inProgress=tasks.filter(t=>t.status==="قيد التنفيذ").length;
  const overdue=tasks.filter(t=>t.status==="متأخرة").length;
  const pct=total?Math.round(completed/total*100):0;
  return {total,completed,inProgress,overdue,pct};
}

function accountEmail(number){
  const account = accounts.find(a => a.number === String(number));
  return account?.email || "";
}
