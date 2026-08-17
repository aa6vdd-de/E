const currentManager = JSON.parse(sessionStorage.getItem("currentAccount") || "null");
if(!currentManager || currentManager.role !== "manager") location.href = "index.html";

function managerLogout(){
  sessionStorage.removeItem("currentAccount");
  location.href = "index.html";
}
