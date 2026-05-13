// ── AUTH CHECK ──
const currentUser = sessionStorage.getItem("currentUser");
if (!currentUser) window.location.href = "error.html";

const userData = JSON.parse(localStorage.getItem("user_" + currentUser)) || {};
document.getElementById("nav-username").textContent = currentUser;
document.getElementById("disp-name").textContent = currentUser;

function logout() {
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

function saveUserData() {
    localStorage.setItem("user_" + currentUser, JSON.stringify(userData));
}

// ── STATE ──
let solution = [], puzzle = [], userGrid = [];
let selected = null, mistakes = 0, timerSec = 0, timerInt = null;
let currentDiff = 35, gameOver = false;

function setDiff(btn, remove) {
    document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDiff = remove;
    updateRecordDisplay();
    startNewGame();
}

function updateRecordDisplay() {
    if (!userData.records) userData.records = {};
    const r = userData.records[currentDiff];
    document.getElementById("disp-record").textContent = r ? "Ennätys: " + formatTime(r) : "Ei ennätystä";
}

// ── GENERATOR ──
function generateSolution() {
    const g = Array.from({length:9}, () => Array(9).fill(0));
    fillGrid(g); return g;
}

function fillGrid(g) {
    const nums = shuffle([1,2,3,4,5,6,7,8,9]);
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
        if (g[r][c]===0) {
            for (const n of nums) {
                if (isValid(g,r,c,n)) {
                    g[r][c]=n;
                    if (fillGrid(g)) return true;
                    g[r][c]=0;
                }
            }
            return false;
        }
    }
    return true;
}

function isValid(g,row,col,num) {
    for (let i=0;i<9;i++) {
        if (g[row][i]===num || g[i][col]===num) return false;
    }
    const br=Math.floor(row/3)*3, bc=Math.floor(col/3)*3;
    for (let r=br;r<br+3;r++) for (let c=bc;c<bc+3;c++) if (g[r][c]===num) return false;
    return true;
}

function makePuzzle(sol, remove) {
    const p = sol.map(r=>[...r]);
    let cells = [];
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) cells.push([r,c]);
    shuffle(cells);
    let removed=0;
    for (const [r,c] of cells) {
        if (removed>=remove) break;
        const bak=p[r][c]; p[r][c]=0; removed++;
        if (!hasUniqueSolution(p.map(x=>[...x]))) { p[r][c]=bak; removed--; }
    }
    return p;
}

function hasUniqueSolution(g) {
    let count=0;
    function solve(g) {
        for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
            if (g[r][c]===0) {
                for (let n=1;n<=9;n++) {
                    if (isValid(g,r,c,n)) {
                        g[r][c]=n; solve(g); g[r][c]=0;
                        if (count>1) return;
                    }
                }
                return;
            }
        }
        count++;
    }
    solve(g); return count===1;
}

function shuffle(a) {
    for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
}

// ── RENDER ──
function startNewGame() {
    stopTimer();
    solution=generateSolution(); puzzle=makePuzzle(solution,currentDiff);
    userGrid=puzzle.map(r=>[...r]);
    selected=null; mistakes=0; gameOver=false;
    document.getElementById("mistakes-disp").textContent="0";
    renderGrid(); buildNumpad(); resetTimer(); startTimer(); updateRecordDisplay();
}

function renderGrid() {
    const tbl=document.getElementById("sudoku-table"); tbl.innerHTML="";
    for (let r=0;r<9;r++) {
        const tr=document.createElement("tr");
        for (let c=0;c<9;c++) {
            const td=document.createElement("td");
            const inp=document.createElement("input");
            inp.type="text"; inp.maxLength=1; inp.readOnly=true;
            if (puzzle[r][c]!==0) { inp.value=puzzle[r][c]; td.classList.add("given"); }
            else inp.value=userGrid[r][c]||"";
            td.dataset.r=r; td.dataset.c=c;
            td.appendChild(inp);
            td.addEventListener("click",()=>selectCell(r,c));
            tr.appendChild(td);
        }
        tbl.appendChild(tr);
    }
}

function buildNumpad() {
    const np=document.getElementById("numpad"); np.innerHTML="";
    for (let n=1;n<=9;n++) {
        const b=document.createElement("button"); b.className="btn-num";
        b.textContent=n; b.onclick=()=>inputNumber(n); np.appendChild(b);
    }
    const er=document.createElement("button"); er.className="btn-num erase";
    er.textContent="✕"; er.onclick=()=>inputNumber(0); np.appendChild(er);
}

function selectCell(r,c) {
    if (gameOver) return;
    selected={r,c}; highlight(r,c);
}

function highlight(r,c) {
    document.querySelectorAll("#sudoku-table td").forEach(td=>{
        td.classList.remove("selected","highlight");
        const tr2=+td.dataset.r, tc2=+td.dataset.c;
        const sameBox=Math.floor(tr2/3)===Math.floor(r/3)&&Math.floor(tc2/3)===Math.floor(c/3);
        if (tr2===r&&tc2===c) td.classList.add("selected");
        else if (tr2===r||tc2===c||sameBox) td.classList.add("highlight");
    });
}

function getCell(r,c) { return document.querySelector(`#sudoku-table td[data-r="${r}"][data-c="${c}"]`); }

function inputNumber(n) {
    if (!selected||gameOver) return;
    const {r,c}=selected;
    if (puzzle[r][c]!==0) return;
    const td=getCell(r,c); const inp=td.querySelector("input");
    if (n===0) { userGrid[r][c]=0; inp.value=""; td.classList.remove("error","correct"); return; }
    userGrid[r][c]=n; inp.value=n;
    if (n===solution[r][c]) {
        td.classList.remove("error"); td.classList.add("correct"); checkWin();
    } else {
        td.classList.add("error"); td.classList.remove("correct");
        mistakes++; document.getElementById("mistakes-disp").textContent=mistakes;
        const gw=document.getElementById("grid-wrap");
        gw.classList.remove("shake"); void gw.offsetWidth; gw.classList.add("shake");
        if (mistakes>=3) endGame(false);
    }
}

function checkWin() {
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (userGrid[r][c]!==solution[r][c]) return;
    endGame(true);
}

function endGame(won) {
    gameOver=true; stopTimer();
    if (!won) {
        for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
            const td=getCell(r,c); td.querySelector("input").value=solution[r][c]; td.classList.remove("error");
        }
        return;
    }
    if (!userData.records) userData.records={};
    const prev=userData.records[currentDiff];
    const isRecord=!prev||timerSec<prev;
    if (isRecord) { userData.records[currentDiff]=timerSec; saveUserData(); }
    document.getElementById("win-time-disp").textContent="Aika: "+formatTime(timerSec);
    document.getElementById("win-rec-disp").textContent=isRecord?"🌟 Uusi ennätys!":"Ennätys: "+formatTime(userData.records[currentDiff]);
    document.getElementById("win-overlay").classList.add("show");
    updateRecordDisplay();
}

function closeWin() { document.getElementById("win-overlay").classList.remove("show"); startNewGame(); }

// ── TIMER ──
function startTimer() { timerInt=setInterval(()=>{ timerSec++; document.getElementById("timer-disp").textContent=formatTime(timerSec); },1000); }
function stopTimer()  { clearInterval(timerInt); }
function resetTimer() { timerSec=0; document.getElementById("timer-disp").textContent="00:00"; }
function formatTime(s) { return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }

// ── KEYBOARD ──
document.addEventListener("keydown", e=>{
    if (!selected||gameOver) return;
    const n=parseInt(e.key);
    if (n>=1&&n<=9) inputNumber(n);
    if (e.key==="Backspace"||e.key==="Delete"||e.key==="0") inputNumber(0);
    const {r,c}=selected;
    if (e.key==="ArrowUp"   &&r>0) selectCell(r-1,c);
    if (e.key==="ArrowDown" &&r<8) selectCell(r+1,c);
    if (e.key==="ArrowLeft" &&c>0) selectCell(r,c-1);
    if (e.key==="ArrowRight"&&c<8) selectCell(r,c+1);
});

// ── START ──
startNewGame();