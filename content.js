console.log("[content.js] loaded");
let navigationMode = false;
let currentLinkIndex = -1;
let currentGroupIndex = 0;
let linkGroups = [];
let flatLinks = [];
// スタイル追加
const style = document.createElement("style");
style.textContent = `
.sidebar-nav-highlight {
  background-color: white;  /* ハイライト背景色 */
  color: black;             /* ハイライト文字色 */
}
`;
document.head.appendChild(style);
// 初期化
function initializeLinks() {
    try {
        linkGroups = Array.from(document.querySelectorAll(
            "#starlight__sidebar > div > sl-sidebar-state-persist > ul > li > details > ul"
        )).map(ul => Array.from(ul.querySelectorAll("a")));
        flatLinks = linkGroups.flat();
        console.log(`[init] Found ${flatLinks.length} links in ${linkGroups.length} groups`);
    } catch (e) {
        console.error("[initializeLinks] failed:", e);
    }
    restoreCurrentLink();    

}
function clearHighLightLink(){
    flatLinks.forEach(l => l.classList.remove("sidebar-nav-highlight"));    
}
function highlightLink() {
    console.log("highlightLink");
    const link = flatLinks[currentLinkIndex];
    clearHighLightLink();
    if (link) {
        link.classList.add("sidebar-nav-highlight");
        link.scrollIntoView({ block: "center" });
    }
}

function saveCurrentLink() {
    console.log("saveCurrentLink");
    try {
        sessionStorage.setItem("sidebar-nav-index", currentLinkIndex);
        sessionStorage.setItem("sidebar-group-index", currentGroupIndex);
        console.log(`[save] index=${currentLinkIndex}, group=${currentGroupIndex}`);
    } catch (e) {
        console.warn("[save] Failed to store navigation state:", e);
    }
}

function restoreCurrentLink() {
    console.log("restoreCurrentLink");
    const savedIndex = parseInt(sessionStorage.getItem("sidebar-nav-index"));
    const savedGroup = parseInt(sessionStorage.getItem("sidebar-group-index"));
    console.log(`restored savedIndex=${savedIndex} savedGroup=${savedGroup}`);
    if (isNaN(savedIndex)) {
        console.log('initial state');
        currentLinkIndex = savedIndex;
    }
    else {
        if (savedIndex >=0 && savedIndex < flatLinks.length){
            console.log('transition state');            
            currentLinkIndex = savedIndex;
            console.log(`incremented flatLinks.length=${flatLinks.length}`);            
        }
        else {
            console.log('abnormal state');
            currentLinkIndex = 0;
        }
    }
            
    if (!isNaN(savedGroup) && savedGroup >= 0 && savedGroup < linkGroups.length) {
        currentGroupIndex = savedGroup;
    }
    else {
        currentGroupIndex=0;
    }
    console.log(`restored currentLinkIndex=${currentLinkIndex} currentGroupIndex=${currentGroupIndex}`);    
}

function incLink() {
    console.log("incLink");

    if (isNaN(currentLinkIndex) || currentLinkIndex < 0) {
        currentLinkIndex = 0;
    }
    else {
        if (currentLinkIndex + 1 >= flatLinks.length) {
            console.warn("[incLink] index out of bounds");
            return;
        }
        else {
            currentLinkIndex += 1;
        }
    }
    console.log(`incLink; currentLinkIndex=${currentLinkIndex}`);
    saveCurrentLink();
}

function decLink() {
    console.log("decLink");

    if (isNaN(currentLinkIndex) || currentLinkIndex < 0) {
        currentLinkIndex = 0;
    }
    else {
        if (currentLinkIndex -1 < 0) {
            console.warn("[decLink] index out of bounds");
            return;
        }
        else {
            currentLinkIndex -= 1;
        }
    }
    console.log(`decLink: currentLinkIndex=${currentLinkIndex}`);
    saveCurrentLink();
}


function moveToGroup(delta) {
    console.log(`[moveToGroup] delta=${delta}`);
    const newGroupIndex = currentGroupIndex + delta;
    if (newGroupIndex < 0 || newGroupIndex >= linkGroups.length) {
        console.warn("[moveToGroup] group index out of bounds");
        return;
    }
    currentGroupIndex = newGroupIndex;
    const group = linkGroups[currentGroupIndex];
    if (group.length > 0) {
        const newLinkIndex = flatLinks.indexOf(group[0]);
        if (newLinkIndex === -1) {
            console.error("[moveToGroup] failed to find link in flatLinks");
            return;
        }
        console.log(`newLinkIndex=${newLinkIndex}`);
        currentLinkIndex = newLinkIndex;

    } else {
        console.warn("[moveToGroup] group empty");
    }
    saveCurrentLink();    
}

function removeSessionStorage(){
    sessionStorage.removeItem("sidebar-nav-index");
    sessionStorage.removeItem("sidebar-group-index");
}

function handleKeyNavigation(event) {
    console.log(`handleKeyNavigation: key=${event.key} navigationMode=${navigationMode}`);
    if (!navigationMode && ["n","p"].includes(event.key)) {
        console.log(`handleKeyNavigation: check key=${event.key} navigationMode=${navigationMode}`);        
        navigationMode = true;
        console.log("[mode] navigation mode gets ON");
        initializeLinks();        
    }

    if (!navigationMode) return;
    switch (event.key) {
    case "e":
        console.log("push e");
        navigationMode = false;
        clearHighLightLink();
        console.log("[mode] navigation mode OFF");
        break;
    case "t":
        navigationMode = false;
        clearHighLightLink();
        location.href="http://localhost:4321/";
        removeSessionStorage();
        break;
    case "n":
        incLink();
        highlightLink();
        break;
    case "p":
        decLink();
        highlightLink();
        break;
    case "N":
        moveToGroup(1);
        highlightLink();
        break;
    case "P":
        moveToGroup(-1);
        highlightLink();
        break;
    case "Enter":
        console.log("Enter");
        if (flatLinks[currentLinkIndex]) {
            console.log(`[navigate] navigating to ${flatLinks[currentLinkIndex].href}`);
            flatLinks[currentLinkIndex].click();
        }
        navigationMode=false;
        break;
    }
}
document.addEventListener("keydown", handleKeyNavigation);
// ユーザのマウスクリックで位置を更新
document.addEventListener("click", (event) => {
    const target = event.target.closest("a");
    if (!target) return;
    initializeLinks(); // 必ずflatLinksを最新化
    const index = flatLinks.indexOf(target);
    if (index !== -1) {
        currentLinkIndex = index;
        currentGroupIndex = linkGroups.findIndex(group => group.includes(target));
        console.log(`[click] Updated index to ${currentLinkIndex}, group to ${currentGroupIndex}`);
        saveCurrentLink();                
    } else {
        console.log("[click] target not in flatLinks, ignored");
    }
});
