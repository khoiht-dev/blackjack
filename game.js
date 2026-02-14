// Blackjack Game Logic
let currentPlayer = {
    id: null,
    name: null,
    chips: 1000
};

let currentRoom = {
    id: null,
    ref: null
};

let unsubscribeRoom = null;
const MAX_PLAYERS = 10;
let autoStandTimeout = null; // Timeout để tự động Stand khi bust

// Helper function để kiểm tra và xóa room nếu trống
async function cleanupRoomIfEmpty(roomRef) {
    try {
        const roomDoc = await roomRef.get();
        if (roomDoc.exists) {
            const roomData = roomDoc.data();
            const remainingPlayers = Object.keys(roomData.players || {}).length;
            
            if (remainingPlayers === 0) {
                await roomRef.delete();
                console.log('Room đã được xóa vì không còn người chơi');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Lỗi khi cleanup room:', error);
        return false;
    }
}

// Load settings từ localStorage khi trang load
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Lưu settings khi input thay đổi
    document.getElementById('playerName')?.addEventListener('input', saveSettings);
    document.getElementById('playerChips')?.addEventListener('change', saveSettings);
    document.getElementById('dealerRounds')?.addEventListener('change', saveSettings);
    document.getElementById('baseBet')?.addEventListener('change', saveSettings);
});

function loadSettings() {
    const savedName = localStorage.getItem('blackjack_playerName');
    const savedChips = localStorage.getItem('blackjack_playerChips');
    const savedDealerRounds = localStorage.getItem('blackjack_dealerRounds');
    const savedBaseBet = localStorage.getItem('blackjack_baseBet');
    
    if (savedName) document.getElementById('playerName').value = savedName;
    if (savedChips) document.getElementById('playerChips').value = savedChips;
    if (savedDealerRounds) document.getElementById('dealerRounds').value = savedDealerRounds;
    if (savedBaseBet) document.getElementById('baseBet').value = savedBaseBet;
}

function saveSettings() {
    localStorage.setItem('blackjack_playerName', document.getElementById('playerName').value);
    localStorage.setItem('blackjack_playerChips', document.getElementById('playerChips').value);
    localStorage.setItem('blackjack_dealerRounds', document.getElementById('dealerRounds').value);
    localStorage.setItem('blackjack_baseBet', document.getElementById('baseBet').value);
}

// Card deck
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Tạo bộ bài
function createDeck() {
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({
                suit: suit,
                rank: rank,
                value: getCardValue(rank)
            });
        }
    }
    return deck;
}

// Xáo bài
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Lấy giá trị của bài
function getCardValue(rank) {
    if (rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
}

// Tính tổng điểm của tay bài
function calculateHand(cards) {
    let sum = 0;
    let aces = 0;
    
    for (let card of cards) {
        sum += card.value;
        if (card.rank === 'A') aces++;
    }
    
    // Xử lý Ace
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    
    return sum;
}

// Kiểm tra Blackjack
function isBlackjack(cards) {
    return cards.length === 2 && calculateHand(cards) === 21;
}

// Hàm tạo room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Hiển thị màn hình
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

// Tạo room mới
async function createRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const chips = parseInt(document.getElementById('playerChips').value) || 1000;
    const dealerRounds = parseInt(document.getElementById('dealerRounds').value) || 3;
    const baseBet = parseInt(document.getElementById('baseBet').value) || 100;
    
    if (!playerName) {
        alert('Vui lòng nhập tên của bạn!');
        return;
    }

    try {
        const roomId = generateRoomId();
        currentPlayer.id = Date.now().toString();
        currentPlayer.name = playerName;
        currentPlayer.chips = chips;

        const roomData = {
            id: roomId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'waiting', // waiting, betting, playing, showdown, finished
            dealerRounds: dealerRounds, // Số vòng mỗi người làm dealer
            baseBet: baseBet, // Mức cược mặc định
            dealerPlayerId: null, // ID của người đang làm dealer
            dealerRoundsRemaining: 0, // Số vòng còn lại của dealer hiện tại
            dealerRotationOrder: [], // Thứ tự rotation
            players: {
                [currentPlayer.id]: {
                    name: playerName,
                    chips: chips,
                    bet: 0,
                    hand: [],
                    handValue: 0,
                    isDealer: false,
                    status: 'waiting', // waiting, betting, playing, stood, bust, blackjack
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            },
            deck: [],
            currentPlayerTurn: null,
            roundNumber: 0,
            revealedPlayers: [] // Danh sách player ID đã được dealer reveal
        };

        await db.collection('rooms').doc(roomId).set(roomData);
        
        currentRoom.id = roomId;
        currentRoom.ref = db.collection('rooms').doc(roomId);
        
        document.getElementById('currentRoomId').textContent = roomId;
        showScreen('waitingScreen');
        
        listenToRoom();
    } catch (error) {
        console.error('Lỗi tạo room:', error);
        alert('Không thể tạo room. Vui lòng kiểm tra cấu hình Firebase!');
    }
}

// Hiển thị phần join
function showJoinRoom() {
    document.getElementById('joinRoomSection').style.display = 'block';
}

// Tham gia room
async function joinRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const roomId = document.getElementById('roomId').value.trim().toUpperCase();
    const chips = parseInt(document.getElementById('playerChips').value) || 1000;
    
    if (!playerName) {
        alert('Vui lòng nhập tên của bạn!');
        return;
    }
    
    if (!roomId) {
        alert('Vui lòng nhập mã room!');
        return;
    }

    try {
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();
        
        if (!roomDoc.exists) {
            alert('Room không tồn tại!');
            return;
        }

        const roomData = roomDoc.data();
        const playerCount = Object.keys(roomData.players || {}).length;

        if (playerCount >= MAX_PLAYERS) {
            alert(`Room đã đầy! (Tối đa ${MAX_PLAYERS} người chơi)`);
            return;
        }

        if (roomData.status === 'playing') {
            alert('Room này đang trong game!');
            return;
        }

        currentPlayer.id = Date.now().toString();
        currentPlayer.name = playerName;
        currentPlayer.chips = chips;
        currentRoom.id = roomId;
        currentRoom.ref = roomRef;

        await roomRef.update({
            [`players.${currentPlayer.id}`]: {
                name: playerName,
                chips: chips,
                bet: 0,
                hand: [],
                handValue: 0,
                status: 'waiting',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        });

        document.getElementById('currentRoomId').textContent = roomId;
        showScreen('waitingScreen');
        
        listenToRoom();
    } catch (error) {
        console.error('Lỗi tham gia room:', error);
        alert('Không thể tham gia room!');
    }
}

// Lắng nghe thay đổi room
function listenToRoom() {
    if (unsubscribeRoom) {
        unsubscribeRoom();
    }

    unsubscribeRoom = currentRoom.ref.onSnapshot((doc) => {
        if (!doc.exists) {
            alert('Room đã bị xóa!');
            returnToWelcome();
            return;
        }

        const roomData = doc.data();
        const players = roomData.players || {};

        // Cập nhật danh sách người chơi trong waiting screen
        if (roomData.status === 'waiting') {
            updatePlayersList(players, roomData.dealerPlayerId);
        }

        // Chuyển màn hình theo trạng thái
        if (roomData.status === 'betting' || roomData.status === 'playing' || roomData.status === 'showdown' || roomData.status === 'dealer-checking') {
            showScreen('gameScreen');
            updateGameScreen(roomData);
        }

        if (roomData.status === 'finished') {
            showResultScreen(roomData);
        }
    });
}

// Cập nhật danh sách người chơi
function updatePlayersList(players, dealerPlayerId) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';

    Object.entries(players).forEach(([id, player]) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        const isCurrentPlayer = id === currentPlayer.id;
        const isDealer = id === dealerPlayerId;
        const playerTag = isCurrentPlayer ? ' (Bạn)' : '';
        const dealerTag = isDealer ? ' 🎩 Dealer' : '';
        
        playerItem.innerHTML = `
            <span>${player.name}${playerTag}${dealerTag}</span>
            <span class="player-status status-ready">
                💰 ${player.chips} chips
            </span>
        `;
        playersList.appendChild(playerItem);
    });
}

// Bắt đầu game
async function startGame() {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        const players = roomData.players;
        const playerIds = Object.keys(players);
        
        if (playerIds.length < 2) {
            alert('Cần ít nhất 2 người chơi!');
            return;
        }
        
        // Tạo và xáo bài
        const deck = shuffleDeck(createDeck());
        
        // Chọn dealer đầu tiên hoặc rotate
        let dealerPlayerId;
        let dealerRoundsRemaining;
        
        if (!roomData.dealerPlayerId || roomData.dealerRoundsRemaining <= 0) {
            // Cần chọn dealer mới
            const rotationOrder = roomData.dealerRotationOrder || [];
            
            if (rotationOrder.length === 0) {
                // Lần đầu tiên, tạo rotation order
                const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);
                await currentRoom.ref.update({
                    dealerRotationOrder: shuffledPlayers
                });
                dealerPlayerId = shuffledPlayers[0];
            } else {
                // Tìm dealer tiếp theo trong rotation
                const currentDealerIndex = rotationOrder.indexOf(roomData.dealerPlayerId);
                const nextIndex = (currentDealerIndex + 1) % rotationOrder.length;
                dealerPlayerId = rotationOrder[nextIndex];
            }
            
            dealerRoundsRemaining = roomData.dealerRounds;
        } else {
            // Giữ nguyên dealer hiện tại
            dealerPlayerId = roomData.dealerPlayerId;
            dealerRoundsRemaining = roomData.dealerRoundsRemaining;
        }
        
        await currentRoom.ref.update({
            status: 'betting',
            deck: deck,
            roundNumber: firebase.firestore.FieldValue.increment(1),
            dealerPlayerId: dealerPlayerId,
            dealerRoundsRemaining: dealerRoundsRemaining,
            currentPlayerTurn: null
        });

        // Reset tất cả người chơi và đặt cược mặc định
        const baseBet = roomData.baseBet || 100;
        
        for (let playerId in players) {
            const isDealer = playerId === dealerPlayerId;
            // Dealer không cược, player khác cược baseBet
            const bet = isDealer ? 0 : baseBet;
            const status = isDealer ? 'ready' : 'ready'; // Mọi người ready luôn vì cược đã fix
            
            await currentRoom.ref.update({
                [`players.${playerId}.hand`]: [],
                [`players.${playerId}.handValue`]: 0,
                [`players.${playerId}.bet`]: bet,
                [`players.${playerId}.isDealer`]: isDealer,
                [`players.${playerId}.status`]: status,
                [`players.${playerId}.result`]: null,
                [`players.${playerId}.chipsChange`]: null
                // Không reset chips - giữ nguyên chips từ ván trước
            });
        }
        
        // Chia bài luôn vì không cần chờ betting phase nữa
        setTimeout(dealInitialCards, 1000); // Đợi 1s để UI update
        
    } catch (error) {
        console.error('Lỗi khi bắt đầu game:', error);
        alert('Không thể bắt đầu game!');
    }
}

// Cập nhật màn hình game
function updateGameScreen(roomData) {
    document.getElementById('gameRoomCode').textContent = currentRoom.id;
    
    // Cập nhật players (bao gồm cả dealer)
    updatePlayersDisplay(
        roomData.players, 
        roomData.currentPlayerTurn, 
        roomData.status, 
        roomData.dealerPlayerId,
        roomData.revealedPlayers || []
    );
    
    // Cập nhật betting area và action buttons
    const myPlayer = roomData.players[currentPlayer.id];
    if (myPlayer) {
        updatePlayerControls(myPlayer, roomData.status, roomData.currentPlayerTurn, roomData.dealerPlayerId);
    }
    
    // Hiển thị dealer checking controls nếu là dealer và đang ở trạng thái checking
    if (roomData.status === 'dealer-checking' && currentPlayer.id === roomData.dealerPlayerId) {
        showDealerCheckingControls(roomData);
    } else {
        document.getElementById('dealerCheckingArea').style.display = 'none';
    }
    
    // Cập nhật game status
    updateGameStatus(roomData);
}

// Cập nhật hiển thị dealer
// Cập nhật hiển thị players
function updatePlayersDisplay(players, currentTurn, gameStatus, dealerPlayerId, revealedPlayers) {
    const playersArea = document.getElementById('playersArea');
    playersArea.innerHTML = '';
    
    Object.entries(players).forEach(([playerId, player]) => {
        const playerBox = document.createElement('div');
        playerBox.className = 'player-box';
        
        // Đánh dấu dealer
        const isDealer = playerId === dealerPlayerId;
        if (isDealer) {
            playerBox.classList.add('dealer');
        }
        
        if (playerId === currentPlayer.id) {
            playerBox.classList.add('current-player');
        }
        
        // Logic hiển thị bài & status:
        // - Luôn thấy của mình
        // - Thấy nếu đang showdown/finished
        // - Thấy nếu đang dealer-checking và đã được reveal
        let canSeeHand = false;
        if (playerId === currentPlayer.id) {
            canSeeHand = true;
        } else if (gameStatus === 'showdown' || gameStatus === 'finished') {
            canSeeHand = true;
        } else if (gameStatus === 'dealer-checking' && revealedPlayers && revealedPlayers.includes(playerId)) {
            canSeeHand = true;
        }

        // Chỉ hiển thị Bust/Blackjack nếu được phép xem bài
        // Nếu không được xem -> Hiển thị là "Đã dừng" (stood) để giấu kín
        let visibleStatus = player.status;
        if (!canSeeHand && (visibleStatus === 'bust' || visibleStatus === 'blackjack')) {
            visibleStatus = 'stood';
        }
        
        if (visibleStatus === 'bust') {
            playerBox.classList.add('bust');
        }
        
        if (visibleStatus === 'blackjack') {
            playerBox.classList.add('blackjack');
        }
        
        const handValue = canSeeHand && player.hand && player.hand.length > 0 ? calculateHand(player.hand) : 0;
        
        playerBox.innerHTML = `
            <div class="player-info">
                <div>
                    <span class="player-name-badge">${isDealer ? '🎩 ' : ''}${player.name}</span>
                    ${player.bet > 0 ? `<span class="player-bet">Cược: ${player.bet}</span>` : ''}
                </div>
                <span class="player-chips">💰 ${player.chips}</span>
            </div>
            <div class="hand-value">${canSeeHand && handValue > 0 ? handValue : '?'}</div>
            <div class="cards" id="player-${playerId}-cards"></div>
            <div class="player-status ${visibleStatus}">${getStatusText(visibleStatus, currentTurn === playerId)}</div>
        `;
        
        playersArea.appendChild(playerBox);
        
        // Thêm các lá bài - Ẩn nếu không phải mình hoặc showdown
        if (player.hand && player.hand.length > 0) {
            const playerCardsEl = document.getElementById(`player-${playerId}-cards`);
            player.hand.forEach(card => {
                playerCardsEl.appendChild(createCardElement(card, !canSeeHand));
            });
        }
    });
}

// Tạo element cho một lá bài
function createCardElement(card, hidden) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    if (hidden) {
        cardEl.classList.add('hidden');
        cardEl.innerHTML = '<div class="back-design"></div>';
    } else {
        const isRed = ['♥', '♦'].includes(card.suit);
        cardEl.classList.add(isRed ? 'red' : 'black');
        
        cardEl.innerHTML = `
            <div class="card-corner top-left">
                <div class="card-value">${card.rank}</div>
                <div class="card-suit">${card.suit}</div>
            </div>
            <div class="card-center-suit">${card.suit}</div>
            <div class="card-corner bottom-right">
                <div class="card-value">${card.rank}</div>
                <div class="card-suit">${card.suit}</div>
            </div>
        `;
    }
    
    return cardEl;
}

// Lấy text trạng thái
function getStatusText(status, isCurrentTurn) {
    if (isCurrentTurn) return '▶️ Đang chơi...';
    
    const statusMap = {
        'waiting': 'Chờ...',
        'betting': 'Đang đặt cược...',
        'playing': 'Chờ tới lượt',
        'stood': '✋ Đã dừng',
        'bust': '💥 Quá 21!',
        'blackjack': '⭐ Blackjack!'
    };
    
    return statusMap[status] || status;
}

// Cập nhật controls của người chơi
function updatePlayerControls(myPlayer, gameStatus, currentTurn, dealerPlayerId) {
    const bettingArea = document.getElementById('bettingArea');
    const actionButtons = document.getElementById('actionButtons');
    const currentChips = document.getElementById('currentChips');
    
    currentChips.textContent = myPlayer.chips;
    
    // Nếu là dealer, không cần đặt cược
    const isDealer = currentPlayer.id === dealerPlayerId;
    
    // Ẩn betting area - không cần hiển nữa vì đã auto bet
    bettingArea.style.display = 'none';
    
    // Hiện action buttons nếu đến lượt (kể cả khi đã bust)
    // Khi bust, người chơi cần tự ấn Stand để chuyển lượt (tránh lộ bài)
    if (gameStatus === 'playing' && currentTurn === currentPlayer.id) {
        actionButtons.style.display = 'flex';
        
        const hitBtn = document.getElementById('hitBtn');
        const standBtn = document.getElementById('standBtn');
        
        // Nếu đã bust hoặc đủ 5 lá, chỉ hiển thị nút Stand
        if (myPlayer.status === 'bust' || (myPlayer.hand && myPlayer.hand.length >= 5)) {
            hitBtn.style.display = 'none';
            standBtn.style.display = 'block';
        } else {
            hitBtn.style.display = 'block';
            standBtn.style.display = 'block';
        }
    } else {
        actionButtons.style.display = 'none';
    }
}

// Cập nhật trạng thái game
function updateGameStatus(roomData) {
    const gameStatus = document.getElementById('gameStatus');
    const status = roomData.status;
    const currentTurn = roomData.currentPlayerTurn;
    const players = roomData.players;
    
    if (status === 'betting') {
        const waitingCount = Object.values(players).filter(p => p.status === 'betting').length;
        gameStatus.textContent = `Chờ ${waitingCount} người chơi đặt cược...`;
    } else if (status === 'playing') {
        if (currentTurn && players[currentTurn]) {
            const playerName = players[currentTurn].name;
            gameStatus.textContent = `Lượt của ${playerName}`;
        }
    } else if (status === 'showdown') {
        gameStatus.textContent = 'Dealer đang rút bài...';
    } else if (status === 'dealer-checking') {
        const dealerName = players[roomData.dealerPlayerId]?.name || 'Dealer';
        if (currentPlayer.id === roomData.dealerPlayerId) {
            const dealerValue = calculateHand(players[roomData.dealerPlayerId].hand);
            if (dealerValue >= 15) {
                gameStatus.textContent = `Bạn có ${dealerValue} điểm. Hãy kiểm tra từng người hoặc lật hết!`;
            } else {
                gameStatus.textContent = `Bạn có ${dealerValue} điểm. Hãy lật hết bài!`;
            }
        } else {
            gameStatus.textContent = `Chờ ${dealerName} kiểm tra bài...`;
        }
    } else {
        gameStatus.textContent = 'Chờ bắt đầu ván mới...';
    }
}

// Quick bet
function quickBet(amount) {
    document.getElementById('betAmount').value = amount;
}

// Đặt cược
async function placeBet() {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    const roomDoc = await currentRoom.ref.get();
    const roomData = roomDoc.data();
    const myPlayer = roomData.players[currentPlayer.id];
    
    if (!betAmount || betAmount < 10) {
        alert('Số cược tối thiểu là 10 chips!');
        return;
    }
    
    if (betAmount > myPlayer.chips) {
        alert('Bạn không đủ chips!');
        return;
    }
    
    try {
        await currentRoom.ref.update({
            [`players.${currentPlayer.id}.bet`]: betAmount,
            [`players.${currentPlayer.id}.status`]: 'ready'
        });
        
        // Kiểm tra xem tất cả người chơi đã đặt cược chưa (trừ dealer)
        const updatedDoc = await currentRoom.ref.get();
        const updatedData = updatedDoc.data();
        const players = updatedData.players;
        const dealerPlayerId = updatedData.dealerPlayerId;
        
        // Dealer tự động ready
        if (players[dealerPlayerId] && players[dealerPlayerId].status === 'betting') {
            await currentRoom.ref.update({
                [`players.${dealerPlayerId}.bet`]: 0,
                [`players.${dealerPlayerId}.status`]: 'ready'
            });
        }
        
        // Kiểm tra lại
        const finalDoc = await currentRoom.ref.get();
        const finalPlayers = finalDoc.data().players;
        const allReady = Object.values(finalPlayers).every(p => p.status === 'ready');
        
        if (allReady) {
            await dealInitialCards();
        }
    } catch (error) {
        console.error('Lỗi đặt cược:', error);
        alert('Không thể đặt cược!');
    }
}

// Chia bài ban đầu
async function dealInitialCards() {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        let deck = roomData.deck;
        const players = roomData.players;
        
        // Chia 2 lá cho mỗi người chơi (kể cả dealer)
        for (let playerId in players) {
            const card1 = deck.pop();
            const card2 = deck.pop();
            const hand = [card1, card2];
            const handValue = calculateHand(hand);
            
            let status = 'playing';
            if (isBlackjack(hand)) {
                status = 'blackjack';
            }
            
            await currentRoom.ref.update({
                [`players.${playerId}.hand`]: hand,
                [`players.${playerId}.handValue`]: handValue,
                [`players.${playerId}.status`]: status
            });
        }
        
        await currentRoom.ref.update({
            deck: deck,
            status: 'playing'
        });
        
        // Bắt đầu lượt đầu tiên (không phải dealer)
        await startNextPlayerTurn();
    } catch (error) {
        console.error('Lỗi chia bài:', error);
    }
}

// Bắt đầu lượt người chơi tiếp theo
async function startNextPlayerTurn() {
    const roomDoc = await currentRoom.ref.get();
    const roomData = roomDoc.data();
    const players = roomData.players;
    const currentTurn = roomData.currentPlayerTurn;
    const dealerPlayerId = roomData.dealerPlayerId;
    
    // Tìm người chơi tiếp theo cần chơi (không phải dealer)
    const playerIds = Object.keys(players).filter(id => id !== dealerPlayerId);
    let nextPlayerId = null;
    
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        const player = players[playerId];
        
        // Bỏ qua người chơi hiện tại nếu có
        if (playerId === currentTurn) continue;
        
        // Tìm người chơi cần chơi (không phải blackjack, bust, stood)
        if (player.status === 'playing') {
            nextPlayerId = playerId;
            break;
        }
    }
    
    if (nextPlayerId) {
        await currentRoom.ref.update({
            currentPlayerTurn: nextPlayerId
        });
    } else {
        // Tất cả players đã chơi xong, đến lượt dealer
        await dealerPlay();
    }
}

// Người chơi rút bài
async function playerHit() {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        let deck = roomData.deck;
        const myPlayer = roomData.players[currentPlayer.id];
        
        // Rút 1 lá
        const newCard = deck.pop();
        const newHand = [...myPlayer.hand, newCard];
        const newValue = calculateHand(newHand);
        
        let newStatus = 'playing';
        if (newValue > 21) {
            newStatus = 'bust';
        } else if (newHand.length >= 5) {
            // Five Card Charlie - tự động dừng nếu có 5 lá
            newStatus = 'stood';
        }
        
        await currentRoom.ref.update({
            [`players.${currentPlayer.id}.hand`]: newHand,
            [`players.${currentPlayer.id}.handValue`]: newValue,
            [`players.${currentPlayer.id}.status`]: newStatus,
            deck: deck
        });
        
        // Chỉ chuyển lượt nếu:
        // 1. Đủ 5 lá (Five Card Charlie) → stood
        // 2. KHÔNG tự động chuyển khi bust để tránh lộ bài
        //    Người chơi phải tự ấn Stand hoặc đợi timeout
        if (newStatus === 'stood' && newHand.length >= 5) {
            await startNextPlayerTurn();
        } else if (newStatus === 'bust' && newHand.length < 5) {
            // Nếu bust nhưng chưa đủ 5 lá, set timeout tự động Stand sau 15s
            if (autoStandTimeout) clearTimeout(autoStandTimeout);
            autoStandTimeout = setTimeout(async () => {
                // Kiểm tra lại xem người chơi vẫn đang là turn hiện tại không
                const checkDoc = await currentRoom.ref.get();
                if (checkDoc.data().currentPlayerTurn === currentPlayer.id) {
                    await playerStand();
                }
            }, 15000); // 15 giây
        }
    } catch (error) {
        console.error('Lỗi hit:', error);
    }
}

// Người chơi dừng
async function playerStand() {
    try {
        // Clear timeout tự động nếu có
        if (autoStandTimeout) {
            clearTimeout(autoStandTimeout);
            autoStandTimeout = null;
        }
        
        await currentRoom.ref.update({
            [`players.${currentPlayer.id}.status`]: 'stood'
        });
        
        await startNextPlayerTurn();
    } catch (error) {
        console.error('Lỗi stand:', error);
    }
}

// Hiển thị dealer checking controls
function showDealerCheckingControls(roomData) {
    const dealerCheckingArea = document.getElementById('dealerCheckingArea');
    const checkPlayersButtons = document.getElementById('checkPlayersButtons');
    const dealerPlayerId = roomData.dealerPlayerId;
    const dealerPlayer = roomData.players[dealerPlayerId];
    const dealerValue = calculateHand(dealerPlayer.hand);
    const revealedPlayers = roomData.revealedPlayers || [];
    
    dealerCheckingArea.style.display = 'block';
    checkPlayersButtons.innerHTML = '';
    
    // Nút Rút bài cho Dealer (luôn hiển thị nếu < 21, hoặc có thể rút tiếp kể cả khi đã check)
    // Theo yêu cầu: dealer có thể rút tiếp. Nếu > 21 thì bust.
    if (dealerValue <= 21) {
        const hitBtn = document.createElement('button');
        hitBtn.className = 'btn btn-success';
        hitBtn.textContent = '🃏 Rút bài';
        hitBtn.onclick = dealerHit;
        checkPlayersButtons.appendChild(hitBtn);
    }
    
    // Nếu dealer >= 15 điểm, hiển thị buttons check từng người
    if (dealerValue >= 15 && dealerValue <= 21) {
        Object.entries(roomData.players).forEach(([playerId, player]) => {
            // Bỏ qua dealer
            if (playerId === dealerPlayerId) return;
            
            // Kiểm tra đã revealed chưa
            const isRevealed = revealedPlayers.includes(playerId);
            
            const btn = document.createElement('button');
            btn.className = `btn ${isRevealed ? 'btn-secondary' : 'btn-info'}`;
            btn.textContent = isRevealed ? `✓ ${player.name}` : `🔍 Check ${player.name}`;
            btn.disabled = isRevealed;
            btn.onclick = () => revealPlayer(playerId);
            checkPlayersButtons.appendChild(btn);
        });
    }
    
    // Button lật hết / Dừng
    const revealAllBtn = document.createElement('button');
    revealAllBtn.className = 'btn btn-primary';
    revealAllBtn.textContent = dealerValue > 21 ? '🃏 Lật bài (Bust)' : '🛑 Dừng & Lật bài';
    revealAllBtn.onclick = revealAll;
    checkPlayersButtons.appendChild(revealAllBtn);
}

// Dealer rút thêm bài
async function dealerHit() {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        let deck = roomData.deck;
        const dealerPlayerId = roomData.dealerPlayerId;
        const dealerPlayer = roomData.players[dealerPlayerId];
        
        // Rút 1 lá
        const newCard = deck.pop();
        const newHand = [...dealerPlayer.hand, newCard];
        const newValue = calculateHand(newHand);
        
        // Cập nhật bài
        await currentRoom.ref.update({
            [`players.${dealerPlayerId}.hand`]: newHand,
            [`players.${dealerPlayerId}.handValue`]: newValue,
            deck: deck
        });
        
        // Nếu quá 21 điểm (22 trở lên) -> Tự động lật bài luôn
        if (newValue > 21) {
             await currentRoom.ref.update({
                [`players.${dealerPlayerId}.status`]: 'bust'
            });
            // Tự động lật bài sau 1s để người chơi kịp nhìn bài vừa rút
            setTimeout(revealAll, 1000);
        }
        
    } catch (error) {
        console.error('Lỗi dealer hit:', error);
    }
}
// Reveal bài của một player
async function revealPlayer(playerId) {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        const revealedPlayers = roomData.revealedPlayers || [];
        const player = roomData.players[playerId];
        const dealerPlayerId = roomData.dealerPlayerId;
        const dealerPlayer = roomData.players[dealerPlayerId];
        
        // Thêm player vào danh sách revealed
        if (!revealedPlayers.includes(playerId)) {
            revealedPlayers.push(playerId);
            await currentRoom.ref.update({
                revealedPlayers: revealedPlayers
            });
            
            const playerValue = calculateHand(player.hand);
            
            // Nếu player > 21 điểm (Bust) -> Dealer ăn ngay
            if (playerValue > 21) {
                const bet = player.bet;
                
                // Cập nhật player thua và trừ tiền NGAY
                await currentRoom.ref.update({
                    [`players.${playerId}.result`]: 'lose',
                    [`players.${playerId}.chipsChange`]: -bet,
                    [`players.${playerId}.chips`]: player.chips - bet,
                    [`players.${dealerPlayerId}.chips`]: dealerPlayer.chips + bet
                });
                
                alert(`Người chơi ${player.name} đã quá 21 điểm! Bạn thắng ${bet} chips.`);
            } else {
                alert(`Người chơi ${player.name} có ${playerValue} điểm.`);
            }
        }
    } catch (error) {
        console.error('Lỗi reveal player:', error);
    }
}

// Lật hết bài và tính kết quả
async function revealAll() {
    try {
        // Chuyển sang showdown
        await currentRoom.ref.update({
            status: 'showdown'
        });
        
        // Tính kết quả
        await calculateResults();
    } catch (error) {
        console.error('Lỗi reveal all:', error);
    }
}

// Dealer chuyển lượt sang "dealer-checking" để dealer tự thao tác
async function dealerPlay() {
    // Không tự động rút bài nữa
    try {
        await currentRoom.ref.update({
            status: 'dealer-checking',
            currentPlayerTurn: null,
            revealedPlayers: []
        });
    } catch (error) {
        console.error('Lỗi dealer play:', error);
    }
}

// Tính toán kết quả
async function calculateResults() {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        const players = roomData.players;
        const dealerPlayerId = roomData.dealerPlayerId;
        const dealerPlayer = players[dealerPlayerId];
        const dealerValue = calculateHand(dealerPlayer.hand);
        const dealerBust = dealerValue > 21;
        const dealerBlackjack = isBlackjack(dealerPlayer.hand);
        
        const results = {};
        
        for (let playerId in players) {
            // Bỏ qua dealer
            if (playerId === dealerPlayerId) {
                results[playerId] = {
                    result: 'dealer',
                    chipsChange: 0 // Sẽ tính tổng sau
                };
                continue;
            }
            
            const player = players[playerId];
            const playerValue = calculateHand(player.hand);
            const bet = player.bet;
            let result = '';
            let chipsChange = 0;
            
            // Check nếu player đã bị settle trước (dealer đã check và ăn tiền SỚM)
            const wasSettledEarly = player.result === 'lose' && player.chipsChange !== null && player.chipsChange < 0;
            
            if (playerValue > 21 && dealerBust) {
                // Cả hai cùng bust
                if (wasSettledEarly) {
                    // Dealer ĐÃ CHECK và ăn tiền TRƯỚC KHI dealer bust
                    // → Player vẫn THUA, KHÔNG hoàn lại tiền
                    results[playerId] = {
                        result: 'lose',
                        chipsChange: player.chipsChange
                    };
                    continue; // Giữ nguyên kết quả thua
                } else {
                    // Dealer CHƯA CHECK, cả hai cùng bust → HÒA
                    result = 'push';
                    chipsChange = 0;
                }
            } else if (wasSettledEarly) {
                // Player đã bị settle trước và dealer không bust -> giữ nguyên kết quả thua
                results[playerId] = {
                    result: 'lose',
                    chipsChange: player.chipsChange
                };
                continue; // Đã xử lý rồi, không tính lại
            } else if (player.status === 'bust') {
                // Chỉ player bust (dealer không bust) = thua
                result = 'lose';
                chipsChange = -bet;
            } else if (player.status === 'blackjack' && !dealerBlackjack) {
                // Blackjack thắng 3:2 (nếu dealer không blackjack)
                result = 'blackjack';
                chipsChange = Math.floor(bet * 1.5);
            } else if (player.status === 'blackjack' && dealerBlackjack) {
                // Cả hai blackjack = hòa
                result = 'push';
                chipsChange = 0;
            } else if (dealerBust) {
                // Dealer bust, người chơi thắng
                // Luật: Nếu dealer quá 22 thì thua những người 21 điểm trở xuống
                result = 'win';
                chipsChange = bet;
            } else if (playerValue > dealerValue) {
                // Người chơi điểm cao hơn
                result = 'win';
                chipsChange = bet;
            } else if (playerValue < dealerValue) {
                // Dealer điểm cao hơn
                result = 'lose';
                chipsChange = -bet;
            } else {
                // Hòa
                result = 'push';
                chipsChange = 0;
            }
            
            results[playerId] = {
                result: result,
                chipsChange: chipsChange
            };
            
            // Cập nhật chips
            const newChips = player.chips + chipsChange;
            await currentRoom.ref.update({
                [`players.${playerId}.chips`]: newChips,
                [`players.${playerId}.result`]: result,
                [`players.${playerId}.chipsChange`]: chipsChange
            });
            
            // Dealer nhận chips từ người thua, mất chips cho người thắng
            const currentDealerChips = (await currentRoom.ref.get()).data().players[dealerPlayerId].chips;
            const dealerNewChips = currentDealerChips - chipsChange;
            
            await currentRoom.ref.update({
                [`players.${dealerPlayerId}.chips`]: dealerNewChips
            });
        }
        
        // Chuyển sang màn hình kết quả
        await currentRoom.ref.update({
            status: 'finished',
            results: results
        });
        
    } catch (error) {
        console.error('Lỗi tính kết quả:', error);
    }
}

// Hiển thị màn hình kết quả
function showResultScreen(roomData) {
    showScreen('resultScreen');
    
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    const players = roomData.players;
    const dealerPlayerId = roomData.dealerPlayerId;
    const dealerPlayer = players[dealerPlayerId];
    const dealerValue = calculateHand(dealerPlayer.hand);
    
    // Hiển thị kết quả dealer
    const dealerResult = document.createElement('div');
    dealerResult.className = 'result-item';
    dealerResult.innerHTML = `
        <div class="result-player-name">🎩 Dealer: ${dealerPlayer.name}</div>
        <div class="result-detail">Điểm: ${dealerValue} ${dealerValue > 21 ? '(Bust)' : ''}</div>
        <div class="result-detail">Tổng chips: ${dealerPlayer.chips}</div>
    `;
    resultsContainer.appendChild(dealerResult);
    
    // Hiển thị kết quả từng người chơi
    Object.entries(players).forEach(([playerId, player]) => {
        // Bỏ qua dealer
        if (playerId === dealerPlayerId) return;
        
        const resultItem = document.createElement('div');
        const playerValue = calculateHand(player.hand);
        
        let resultClass = '';
        let resultText = '';
        
        if (player.result === 'blackjack') {
            resultClass = 'blackjack';
            resultText = '⭐ BLACKJACK!';
        } else if (player.result === 'win') {
            resultClass = 'win';
            resultText = '🎉 THẮNG!';
        } else if (player.result === 'lose') {
            resultClass = 'lose';
            resultText = '😢 THUA';
        } else {
            resultClass = 'push';
            resultText = '🤝 HÒA';
        }
        
        resultItem.className = `result-item ${resultClass}`;
        resultItem.innerHTML = `
            <div class="result-player-name">${player.name} ${playerId === currentPlayer.id ? '(Bạn)' : ''}</div>
            <div class="result-detail">Điểm: ${playerValue}</div>
            <div class="result-detail">Cược: ${player.bet} chips</div>
            <div class="result-detail"><strong>${resultText}</strong></div>
            <div class="result-chips ${player.chipsChange >= 0 ? 'positive' : 'negative'}">
                ${player.chipsChange > 0 ? '+' : ''}${player.chipsChange} chips
            </div>
            <div class="result-detail">Tổng chips: ${player.chips}</div>
        `;
        resultsContainer.appendChild(resultItem);
    });
}

// Ván tiếp theo
async function nextRound() {
    try {
        const roomDoc = await currentRoom.ref.get();
        const roomData = roomDoc.data();
        const players = roomData.players;
        
        // Xóa người chơi nếu hết chips
        for (let playerId in players) {
            const player = players[playerId];
            
            if (player.chips < 10) {
                if (playerId === currentPlayer.id) {
                    alert('Bạn đã hết chips!');
                    await leaveRoom();
                    return;
                }
                await currentRoom.ref.update({
                    [`players.${playerId}`]: firebase.firestore.FieldValue.delete()
                });
            }
        }
        
        // Kiểm tra nếu không còn người chơi nào sau khi xóa
        const wasDeleted = await cleanupRoomIfEmpty(currentRoom.ref);
        if (wasDeleted) {
            returnToWelcome();
            return;
        }
        
        // Giảm số vòng còn lại của dealer hiện tại
        const dealerRoundsRemaining = roomData.dealerRoundsRemaining - 1;
        
        await currentRoom.ref.update({
            dealerRoundsRemaining: dealerRoundsRemaining
        });
        
        // Gọi startGame để xử lý rotation nếu cần và reset game
        await startGame();
        
    } catch (error) {
        console.error('Lỗi ván tiếp theo:', error);
    }
}

// Sao chép Room ID
function copyRoomId() {
    const roomId = currentRoom.id;
    navigator.clipboard.writeText(roomId).then(() => {
        alert('Đã sao chép mã room: ' + roomId);
    }).catch(err => {
        console.error('Lỗi sao chép:', err);
    });
}

// Rời phòng
async function leaveRoom() {
    if (!currentRoom.id) return;

    try {
        await currentRoom.ref.update({
            [`players.${currentPlayer.id}`]: firebase.firestore.FieldValue.delete()
        });

        // Xóa room nếu không còn người chơi
        await cleanupRoomIfEmpty(currentRoom.ref);

        returnToWelcome();
    } catch (error) {
        console.error('Lỗi khi rời phòng:', error);
        returnToWelcome();
    }
}

// Quay lại màn hình chào
function returnToWelcome() {
    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }

    currentRoom.id = null;
    currentRoom.ref = null;
    currentPlayer.id = null;
    
    document.getElementById('playerName').value = '';
    document.getElementById('roomId').value = '';
    document.getElementById('joinRoomSection').style.display = 'none';
    
    showScreen('welcomeScreen');
}

// Xử lý khi người dùng đóng tab
window.addEventListener('beforeunload', async () => {
    if (currentRoom.id && currentPlayer.id) {
        try {
            // Xóa player khỏi room
            await currentRoom.ref.update({
                [`players.${currentPlayer.id}`]: firebase.firestore.FieldValue.delete()
            });
            
            // Xóa room nếu không còn người chơi
            await cleanupRoomIfEmpty(currentRoom.ref);
        } catch (error) {
            console.error('Lỗi khi cleanup room:', error);
        }
    }
});

console.log('Blackjack game loaded!');
