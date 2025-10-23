const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameInfoCanvas = document.getElementById("gameInfo");
const gameInfoCtx = gameInfoCanvas.getContext("2d");

// 원 객체 생성
let circle = {
    x: Math.random() *350+25,
    y: 0,
    r: 30,
    speed: 2,
    color: getRandomColor()
};

// 우주선 객체 생성
let spaceship = {
    x: 250, // 화면 중앙
    y: 350, // 화면 하단
    width: 40,
    height: 30,
    speed: 5
};

let score = 0; // 점수 변수 생성
let lives = 3; // 생명 변수 생성
let gameRunning = false; // 게임 실행 상태
let gameLoop; // 게임 루프 변수
let fuel = []; // 연료 배열
let fuelBoost = false; // 연료 부스트 상태
let fuelBoostTime = 0; // 연료 부스트 남은 시간
let lastFuelSpawn = 0; // 마지막 연료 생성 시간

// 랜덤 색상 함수 생성 (소행성용 회색 계열)
function getRandomColor(){
    const colors =["#696969", "#808080", "#A9A9A9", "#778899", "#708090", "#2F4F4F"];
    return colors[Math.floor(Math.random() * colors.length)];   // 랜덤 회색 반환
}

// 소행성 리셋 함수 생성
function resetAsteroid() {
    circle.x = Math.random()*(canvas.width - 50) + 25;
    circle.y = 0;
    circle.color = getRandomColor();    // 랜덤 색상 할당
    circle.rotation = 0;                // 회전 초기화
}


// 소행성 그리기 함수 생성
function drawAsteroid(){
    ctx.save();
    ctx.translate(circle.x, circle.y);
    ctx.rotate(circle.rotation || 0);
    
    // 소행성 몸체 (불규칙한 모양)
    ctx.beginPath();
    ctx.arc(0, 0, circle.r, 0, Math.PI * 2);
    ctx.fillStyle = circle.color;
    ctx.fill();
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 소행성 표면 크레이터
    ctx.beginPath();
    ctx.arc(-8, -5, 5, 0, Math.PI * 2);
    ctx.arc(10, 8, 3, 0, Math.PI * 2);
    ctx.arc(-5, 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#4A4A4A";
    ctx.fill();
    
    ctx.restore();
}

// 연료 그리기 함수
function drawFuel() {
    // 연료 업데이트 및 그리기
    for (let i = fuel.length - 1; i >= 0; i--) {
        const fuelItem = fuel[i];
        fuelItem.y += 2; // 연료가 아래로 떨어짐
        
        // 화면 아래로 사라진 연료 제거
        if (fuelItem.y > canvas.height + 20) {
            fuel.splice(i, 1);
            continue;
        }
        
        // 연료 그리기 (작은 초록색 네모)
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(fuelItem.x - fuelItem.size, fuelItem.y - fuelItem.size, fuelItem.size * 2, fuelItem.size * 2);
        ctx.strokeStyle = "#00CC00";
        ctx.lineWidth = 1;
        ctx.strokeRect(fuelItem.x - fuelItem.size, fuelItem.y - fuelItem.size, fuelItem.size * 2, fuelItem.size * 2);
    }
    
    // 새로운 연료 생성 (10초에 한번 10% 확률)
    const currentTime = Date.now();
    if (currentTime - lastFuelSpawn > 10000 && Math.random() < 0.1 && fuel.length < 1) { // 10초 간격, 10% 확률, 최대 1개
        fuel.push({
            x: Math.random() * canvas.width,
            y: -20,
            size: 8
        });
        lastFuelSpawn = currentTime;
    }
}

// 우주선 그리기 함수
function drawSpaceship() {
    // 우주선 몸체
    ctx.beginPath();
    ctx.moveTo(spaceship.x, spaceship.y - 15);
    ctx.lineTo(spaceship.x - 20, spaceship.y + 15);
    ctx.lineTo(spaceship.x - 5, spaceship.y + 10);
    ctx.lineTo(spaceship.x + 5, spaceship.y + 10);
    ctx.lineTo(spaceship.x + 20, spaceship.y + 15);
    ctx.closePath();
    ctx.fillStyle = "#C0C0C0";
    ctx.fill();
    ctx.strokeStyle = "#808080";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 우주선 엔진 불꽃
    ctx.beginPath();
    ctx.moveTo(spaceship.x - 5, spaceship.y + 10);
    ctx.lineTo(spaceship.x - 8, spaceship.y + 20);
    ctx.lineTo(spaceship.x - 2, spaceship.y + 15);
    ctx.lineTo(spaceship.x + 2, spaceship.y + 15);
    ctx.lineTo(spaceship.x + 8, spaceship.y + 20);
    ctx.lineTo(spaceship.x + 5, spaceship.y + 10);
    ctx.closePath();
    ctx.fillStyle = "#FF4500";
    ctx.fill();
    
    // 우주선 조종석
    ctx.beginPath();
    ctx.arc(spaceship.x, spaceship.y - 5, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#87CEEB";
    ctx.fill();
    ctx.strokeStyle = "#4682B4";
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 게임 정보 그리기 함수
function drawGameInfo() {
    gameInfoCtx.clearRect(0, 0, gameInfoCanvas.width, gameInfoCanvas.height);
    
    // 배경
    gameInfoCtx.fillStyle = "#2c3e50";
    gameInfoCtx.fillRect(0, 0, gameInfoCanvas.width, gameInfoCanvas.height);
    
    // 생명 표시 (하트 이모티콘)
    gameInfoCtx.fillStyle = "#ecf0f1";
    gameInfoCtx.font = "20px Arial";
    let hearts = "❤️".repeat(lives);
    gameInfoCtx.fillText(hearts, 20, 40);
    
    // 점수 표시
    gameInfoCtx.fillText("점수: " + score, 200, 40);
    
    // 속도 표시
    gameInfoCtx.fillText("속도: " + circle.speed.toFixed(1), 350, 40);
    
    // 연료 부스트 상태 표시
    if (fuelBoost) {
        gameInfoCtx.fillStyle = "#00FF00";
        gameInfoCtx.fillText("⚡ 부스트!", 20, 20);
        gameInfoCtx.fillStyle = "#ecf0f1";
    }
}

// 게임 시작 함수
function startGame() {
    if (!gameRunning) {
        // 시작 오버레이 숨기기
        document.getElementById("startOverlay").style.display = "none";
        // 튜토리얼 오버레이 보이기
        document.getElementById("tutorialOverlay").style.display = "flex";
    }
}

// 튜토리얼 닫기 함수
function closeTutorial() {
    document.getElementById("tutorialOverlay").style.display = "none";
    gameRunning = true;
    gameLoop = requestAnimationFrame(updateGame);
}

// 게임 업데이트 함수 생성
function updateGame(){
    if (!gameRunning) return;
    
    // 스크롤링 우주 배경
    ctx.fillStyle = "#000022";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    
    
    // 연료 부스트 시간 감소
    if (fuelBoostTime > 0) {
        fuelBoostTime--;
        if (fuelBoostTime <= 0) {
            fuelBoost = false;
        }
    }
    
    // 우주선이 앞으로 전진하는 효과 (연료 부스트에 따라 속도 조절)
    const speedMultiplier = fuelBoost ? 0.3 : 1; // 연료 부스트 시 30% 느리게

    // 연료 그리기 및 업데이트
    drawFuel();
    
    // 우주선 이동 처리
    updateSpaceship();
    
    drawAsteroid();
    drawSpaceship();
    drawGameInfo();
    circle.y += circle.speed * speedMultiplier;   // 소행성 이동 (연료 부스트 시 느리게)
    circle.rotation += 0.05;    // 소행성 회전

    // 소행성이 화면 아래로 떨어지면 피한 것으로 점수 10점
    if (circle.y - circle.r > canvas.height) {
        score += 10;  // 피한 것으로 10점
        resetAsteroid();
    }
    
    // 우주선과 연료의 충돌 검사
    for (let i = fuel.length - 1; i >= 0; i--) {
        const fuelItem = fuel[i];
        const dx = fuelItem.x - spaceship.x;
        const dy = fuelItem.y - spaceship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < fuelItem.size + spaceship.width/2) {
            // 연료 획득
            fuel.splice(i, 1);
            fuelBoost = true;
            fuelBoostTime = 600; // 10초간 부스트 (60fps 기준)
            score += 50; // 연료 획득 시 50점
        }
    }
    
    // 우주선과 원의 충돌 검사
    const dx = circle.x - spaceship.x;
    const dy = circle.y - spaceship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < circle.r + spaceship.width/2) {
        // 우주선에 닿으면 생명 감소
        lives--;
        if (lives <= 0) {
            // 생명이 0이 되면 게임 오버
            gameRunning = false;
            cancelAnimationFrame(gameLoop);
            alert("게임 오버! 최종 점수: " + score);
            score = 0;
            lives = 3;
            fuelBoost = false;
            fuelBoostTime = 0;
            // 시작 오버레이 다시 보이기
            document.getElementById("startOverlay").style.display = "flex";
        }
        resetAsteroid();
    }

    gameLoop = requestAnimationFrame(updateGame);
}

// 원 클릭 이벤트 함수 생성
canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();    // 캔버스 크기 가져오기 (좌표값)
    const mouseX = e.clientX - rect.left;    // 마우스 x좌표
    const mouseY = e.clientY - rect.top;    // 마우스 y좌표

    const dx = mouseX - circle.x;       // x축 거리 계산
    const dy = mouseY - circle.y; // y축 거리 계산
    const distance = Math.sqrt(dx * dx + dy*dy); // 거리 계산

    if (distance < circle.r){   // 성공적으로 소행성을 격추했을 경우
        score += 100;  // 격추로 100점
        resetAsteroid();
    }
});

// 속도 조절 함수들
function increaseSpeed() {
    circle.speed += 0.5;
}

function decreaseSpeed() {
    if (circle.speed > 0.5) {
        circle.speed -= 0.5;
    }
}

// 키보드 상태 추적
let keys = {};

// 키보드 입력 처리
document.addEventListener("keydown", function(e) {
    keys[e.key] = true;
});

document.addEventListener("keyup", function(e) {
    keys[e.key] = false;
});

// 우주선 이동 처리 (게임 루프에서 호출)
function updateSpaceship() {
    if (!gameRunning) return;
    
    // 부스터에 따른 속도 조절
    const speedMultiplier = fuelBoost ? 0.3 : 1; // 부스트 시 30% 느리게, 일반 시 100%
    const currentSpeed = spaceship.speed * speedMultiplier;
    
    // 왼쪽 이동
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        spaceship.x -= currentSpeed;
        if (spaceship.x < spaceship.width/2) spaceship.x = spaceship.width/2;
    }
    
    // 오른쪽 이동
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        spaceship.x += currentSpeed;
        if (spaceship.x > canvas.width - spaceship.width/2) spaceship.x = canvas.width - spaceship.width/2;
    }
    
    // 위쪽 이동
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
        spaceship.y -= currentSpeed;
        if (spaceship.y < spaceship.height/2) spaceship.y = spaceship.height/2;
    }
    
    // 아래쪽 이동
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
        spaceship.y += currentSpeed;
        if (spaceship.y > canvas.height - spaceship.height/2) spaceship.y = canvas.height - spaceship.height/2;
    }
}

// 초기 게임 정보 표시
drawGameInfo();
