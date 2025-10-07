// Constantes del juego
const CELL_SIZE = 40;
const MOVE_DELAY = 500;

// Variables globales
let GRID_SIZE = 7;
let maze = [];
let goalPosition = [];
let playerPosition = [1, 1];
let movementSequence = [];
let displaySequence = [];
let timerRunning = false;
let timeElapsed = 0;
let timerInterval = null;
let editMode = false;
let keyboardEnabled = true;
let audioEnabled = false; // Cambiado a false por defecto
let lastCanvasSize = { width: 0, height: 0 }; // Para detectar cambios de tamaño

// Elementos del DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sequenceContainer = document.getElementById('sequenceContainer');
const timerDisplay = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty');
const characterSelect = document.getElementById('character');
const customCharacterInput = document.getElementById('customCharacter');
const uploadCharacterBtn = document.getElementById('uploadCharacterBtn');
const keyboardCheckbox = document.getElementById('keyboardEnabled');
const audioCheckbox = document.getElementById('audioEnabled');
const audioActivationMessage = document.getElementById('audioActivationMessage');

// Botones
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const startBtn = document.getElementById('startBtn');
const newBtn = document.getElementById('newBtn');
const clearBtn = document.getElementById('clearBtn');
const rankingBtn = document.getElementById('rankingBtn');
const generatePdfBtn = document.getElementById('generatePdfBtn');
const editModeBtn = document.getElementById('editModeBtn');
const loadBtn = document.getElementById('loadBtn');
const saveBtn = document.getElementById('saveBtn');

// Botones móviles
const upBtnMobile = document.getElementById('upBtnMobile');
const downBtnMobile = document.getElementById('downBtnMobile');
const leftBtnMobile = document.getElementById('leftBtnMobile');
const rightBtnMobile = document.getElementById('rightBtnMobile');
const jumpBtnMobile = document.getElementById('jumpBtnMobile');

// Modales
const rankingModal = document.getElementById('rankingModal');
const winnerModal = document.getElementById('winnerModal');
const winnerNameInput = document.getElementById('winnerName');
const submitNameBtn = document.getElementById('submitName');
const pdfModal = document.getElementById('pdfModal');
const confirmPdfBtn = document.getElementById('confirmPdfBtn');
const closePdfModal = document.getElementById('closePdfModal');

// Audio elements
const audioElements = {
    suspense: null,
    adventure: null,
    error: null,
    fanfare: null,
    jump: null
};

let currentMusic = null;

function initAudio() {
    audioElements.suspense = document.getElementById('suspenseAudio');
    audioElements.adventure = document.getElementById('adventureAudio');
    audioElements.error = document.getElementById('errorAudio');
    audioElements.fanfare = document.getElementById('fanfareAudio');
    audioElements.jump = document.getElementById('jumpAudio');
    
    // Configurar volumen
    if (audioElements.suspense) audioElements.suspense.volume = 0.5;
    if (audioElements.adventure) audioElements.adventure.volume = 0.5;
    if (audioElements.error) audioElements.error.volume = 0.7;
    if (audioElements.fanfare) audioElements.fanfare.volume = 0.8;
    if (audioElements.jump) audioElements.jump.volume = 0.6;
    
    // Configurar evento para reiniciar la música suspense cuando termine
    if (audioElements.suspense) {
        audioElements.suspense.addEventListener('ended', () => {
            if (audioEnabled && currentMusic === audioElements.suspense) {
                audioElements.suspense.currentTime = 0;
                audioElements.suspense.play().catch(e => console.log('Audio replay prevented:', e));
            }
        });
    }
}

function playSound(type) {
    if (!audioEnabled) return;
    
    try {
        if (type === 'suspense' || type === 'adventure') {
            stopMusic();
            currentMusic = audioElements[type];
            if (currentMusic) {
                currentMusic.currentTime = 0;
                currentMusic.play().catch(e => console.log('Audio play prevented:', e));
            }
        } else {
            const audio = audioElements[type];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Audio play prevented:', e));
            }
        }
    } catch (e) {
        console.log('Error playing sound:', e);
    }
}

function stopMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }
}

// Texturas (colores simulados como fallback)
const COLORS = {
    floor: '#e0e0e0',
    wall: '#333333',
    trap: '#ff6b6b',
    goal: '#50fa7b',
    player: '#4ecdc4',
    visited: '#cccccc'
};

// Imágenes del jugador (emoji como alternativa)
let PLAYER_EMOJI = '🧑‍🚒'; // Emoji de aventurero por defecto
const GOAL_EMOJI = '🎯';

// Variables para las texturas cargadas
let textureFloor = null;
let textureWall = null;
let textureTrap = null;
let texturePlayer = null;
let texturesLoaded = false;

// Variable para almacenar la imagen personalizada
let customCharacterImage = null;

// Función para cargar la textura del jugador
function loadPlayerTexture(imageName) {
    // Si es muñeco.png, usar emoji en lugar de cargar imagen
    if (imageName === 'muñeco.png') {
        PLAYER_EMOJI = '🧑‍🚒'; // Emoji de aventurero escalando
        texturePlayer = null; // No usar imagen, usar emoji
        console.log('✓ Usando emoji de aventurero 🧗');
        drawMaze();
        return;
    }
    
    // Si es custom, usar la imagen personalizada cargada
    if (imageName === 'custom') {
        if (customCharacterImage) {
            texturePlayer = customCharacterImage;
            console.log('✓ Usando imagen personalizada');
            drawMaze();
        } else {
            // Si no hay imagen personalizada, mostrar el botón de subida
            uploadCharacterBtn.style.display = 'inline-block';
            console.log('⚠ Selecciona una imagen personalizada');
        }
        return;
    }
    
    // Para otros personajes, cargar la imagen
    texturePlayer = new Image();
    texturePlayer.onload = () => {
        console.log(`✓ Imagen del jugador (${imageName}) cargada`);
        drawMaze(); // Redibujar el canvas con el nuevo personaje
    };
    texturePlayer.onerror = () => {
        console.warn(`✗ No se pudo cargar ${imageName}, usando emoji 🧗`);
        PLAYER_EMOJI = '🧗';
        texturePlayer = null;
        drawMaze(); // Redibujar aunque falle
    };
    texturePlayer.src = imageName;
}

// Cargar texturas
function loadTextures() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalTextures = 4;
        
        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalTextures) {
                texturesLoaded = true;
                console.log('Proceso de carga de texturas completado');
                resolve();
            }
        };
        
        // Cargar textura de suelo
        textureFloor = new Image();
        textureFloor.onload = () => {
            console.log('✓ Textura de suelo cargada');
            checkAllLoaded();
        };
        textureFloor.onerror = () => {
            console.warn('✗ No se pudo cargar textura_suelo.png, usando color de fallback');
            textureFloor = null;
            checkAllLoaded();
        };
        textureFloor.src = 'textura_suelo.png';
        
        // Cargar textura de muro
        textureWall = new Image();
        textureWall.onload = () => {
            console.log('✓ Textura de muro cargada');
            checkAllLoaded();
        };
        textureWall.onerror = () => {
            console.warn('✗ No se pudo cargar textura_muro.png, usando color de fallback');
            textureWall = null;
            checkAllLoaded();
        };
        textureWall.src = 'textura_muro.png';
        
        // Cargar textura de trampa
        textureTrap = new Image();
        textureTrap.onload = () => {
            console.log('✓ Textura de trampa cargada');
            checkAllLoaded();
        };
        textureTrap.onerror = () => {
            console.warn('✗ No se pudo cargar textura_trampa.png, usando color de fallback');
            textureTrap = null;
            checkAllLoaded();
        };
        textureTrap.src = 'textura_trampa.png';
        
        // Cargar imagen del jugador (usar el valor del selector)
        const initialCharacter = characterSelect ? characterSelect.value : 'muñeco.png';
        
        // Si es muñeco.png, usar emoji directamente
        if (initialCharacter === 'muñeco.png') {
            PLAYER_EMOJI = '🧗'; // Emoji de aventurero escalando
            texturePlayer = null;
            console.log('✓ Usando emoji de aventurero 🧗');
            checkAllLoaded();
        } else {
            // Cargar imagen para otros personajes
            texturePlayer = new Image();
            texturePlayer.onload = () => {
                console.log(`✓ Imagen del jugador (${initialCharacter}) cargada`);
                checkAllLoaded();
            };
            texturePlayer.onerror = () => {
                console.warn(`✗ No se pudo cargar ${initialCharacter}, usando emoji 🧗`);
                PLAYER_EMOJI = '🧗';
                texturePlayer = null;
                checkAllLoaded();
            };
            texturePlayer.src = initialCharacter;
        }
    });
}

// Inicialización
function init() {
    // Inicializar audio
    initAudio();
    
    // Mostrar mensaje de activación de audio
    if (audioActivationMessage) {
        audioActivationMessage.classList.add('show');
        
        // Hacer clic en el mensaje para activar audio
        audioActivationMessage.addEventListener('click', () => {
            audioEnabled = true;
            audioCheckbox.checked = true;
            audioActivationMessage.classList.remove('show');
            playSound('suspense');
        });
    }
    
    difficultySelect.addEventListener('change', () => {
        GRID_SIZE = parseInt(difficultySelect.value);
        resetGame(); // Generar nuevo laberinto automáticamente
    });

    characterSelect.addEventListener('change', () => {
        const selectedValue = characterSelect.value;
        
        // Mostrar/ocultar botón de subida según la selección
        if (selectedValue === 'custom') {
            uploadCharacterBtn.style.display = 'inline-block';
            // Si ya hay una imagen personalizada, usarla
            if (customCharacterImage) {
                loadPlayerTexture(selectedValue);
            }
        } else {
            uploadCharacterBtn.style.display = 'none';
            loadPlayerTexture(selectedValue);
        }
    });

    // Event listener para el botón de subir foto
    uploadCharacterBtn.addEventListener('click', () => {
        customCharacterInput.click();
    });

    // Event listener para cuando se selecciona un archivo
    customCharacterInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                customCharacterImage = new Image();
                customCharacterImage.onload = () => {
                    console.log('✓ Imagen personalizada cargada');
                    texturePlayer = customCharacterImage;
                    uploadCharacterBtn.textContent = '✅';
                    setTimeout(() => {
                        uploadCharacterBtn.textContent = '📷';
                    }, 2000);
                    drawMaze();
                };
                customCharacterImage.onerror = () => {
                    console.error('✗ Error al cargar la imagen personalizada');
                    alert('Error al cargar la imagen. Intenta con otra.');
                };
                customCharacterImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, etc.)');
        }
    });

    keyboardCheckbox.addEventListener('change', () => {
        keyboardEnabled = keyboardCheckbox.checked;
    });

    audioCheckbox.addEventListener('change', () => {
        audioEnabled = audioCheckbox.checked;
        if (!audioEnabled) {
            stopMusic();
        } else {
            playSound('suspense');
        }
    });

    // Event listeners para botones de movimiento (desktop)
    upBtn.addEventListener('click', () => addMovement('arriba'));
    downBtn.addEventListener('click', () => addMovement('abajo'));
    leftBtn.addEventListener('click', () => addMovement('izquierda'));
    rightBtn.addEventListener('click', () => addMovement('derecha'));
    jumpBtn.addEventListener('click', () => addJump());
    
    // Event listeners para botones de movimiento (móvil)
    if (upBtnMobile) upBtnMobile.addEventListener('click', () => addMovement('arriba'));
    if (downBtnMobile) downBtnMobile.addEventListener('click', () => addMovement('abajo'));
    if (leftBtnMobile) leftBtnMobile.addEventListener('click', () => addMovement('izquierda'));
    if (rightBtnMobile) rightBtnMobile.addEventListener('click', () => addMovement('derecha'));
    if (jumpBtnMobile) jumpBtnMobile.addEventListener('click', () => addJump());

    // Event listeners para botones de control
    startBtn.addEventListener('click', () => executeSequence());
    newBtn.addEventListener('click', () => resetGame());
    clearBtn.addEventListener('click', () => clearGame());
    rankingBtn.addEventListener('click', () => showRanking());

    // Event listeners para edición
    editModeBtn.addEventListener('click', () => toggleEditMode());
    loadBtn.addEventListener('click', () => loadMaze());
    saveBtn.addEventListener('click', () => saveMaze());

    // Event listeners para canvas
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('contextmenu', onCanvasRightClick);

    // Event listeners para teclado
    document.addEventListener('keydown', onKeyDown);

    // Event listeners para modales
    document.querySelector('#rankingModal .close').addEventListener('click', () => {
        rankingModal.classList.remove('show');
    });

    submitNameBtn.addEventListener('click', submitWinnerName);

    // Event listeners para modal PDF
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', () => {
            pdfModal.classList.add('show');
        });
    }

    if (closePdfModal) {
        closePdfModal.addEventListener('click', () => {
            pdfModal.classList.remove('show');
        });
    }

    if (confirmPdfBtn) {
        confirmPdfBtn.addEventListener('click', () => {
            const selectedDifficulty = document.querySelector('input[name="pdfDifficulty"]:checked').value;
            generatePDF(parseInt(selectedDifficulty));
            pdfModal.classList.remove('show');
        });
    }

    // Cerrar modal PDF al hacer clic fuera
    if (pdfModal) {
        pdfModal.addEventListener('click', (e) => {
            if (e.target === pdfModal) {
                pdfModal.classList.remove('show');
            }
        });
    }

    // Cargar texturas e iniciar juego
    loadTextures().then(() => {
        resetGame();
    });
}

// Generación del laberinto
function generateMaze() {
    // Inicializar laberinto con muros
    maze = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(1));
    
    // Algoritmo de generación recursiva
    function carve(x, y) {
        maze[y][x] = 0;
        const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
        shuffle(dirs);
        
        for (let [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1 && maze[ny][nx] === 1) {
                maze[ny][nx] = 0;
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }

    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        maze = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(1));
        maze[1][1] = 0;
        carve(1, 1);
        
        goalPosition = [GRID_SIZE - 2, GRID_SIZE - 2];
        maze[goalPosition[1]][goalPosition[0]] = 0;

        // Agregar trampas en niveles difíciles
        if (GRID_SIZE >= 15) {
            addTraps();
        }

        if (isSolvable()) {
            break;
        }
        attempts++;
    }

    if (attempts === maxAttempts) {
        console.warn('No se pudo generar un laberinto resoluble, usando el último intento');
    }
}

function addTraps() {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const candidates = [];
    
    for (let y = 1; y < GRID_SIZE - 1; y++) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
            if (maze[y][x] === 0 && !(x === 1 && y === 1) && 
                !(x === goalPosition[0] && y === goalPosition[1])) {
                candidates.push([x, y]);
            }
        }
    }
    
    shuffle(candidates);
    const maxTraps = Math.floor((GRID_SIZE * GRID_SIZE) / 10);
    let trapCount = 0;
    
    for (let [x, y] of candidates) {
        if (trapCount >= maxTraps) break;
        
        // Verificar que no haya trampas adyacentes
        let hasAdjacentTrap = false;
        for (let [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && maze[ny][nx] === 2) {
                hasAdjacentTrap = true;
                break;
            }
        }
        
        if (!hasAdjacentTrap) {
            maze[y][x] = 2;
            if (isSolvable()) {
                trapCount++;
            } else {
                maze[y][x] = 0;
            }
        }
    }
}

// Verificar si el laberinto es resoluble usando BFS
function isSolvable() {
    const dirs = {
        'arriba': [0, -1],
        'abajo': [0, 1],
        'izquierda': [-1, 0],
        'derecha': [1, 0]
    };
    
    const start = [1, 1, null];
    const target = goalPosition;
    const queue = [start];
    const visited = new Set();
    visited.add(`${start[0]},${start[1]},${start[2]}`);
    
    while (queue.length > 0) {
        const [x, y, lastDir] = queue.shift();
        
        if (x === target[0] && y === target[1]) {
            return true;
        }
        
        // Movimientos normales
        for (let [dir, [dx, dy]] of Object.entries(dirs)) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && maze[ny][nx] === 0) {
                const key = `${nx},${ny},${dir}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push([nx, ny, dir]);
                }
            }
        }
        
        // Saltos
        if (lastDir && dirs[lastDir]) {
            const [dx, dy] = dirs[lastDir];
            const mx = x + dx;
            const my = y + dy;
            const jx = x + 2 * dx;
            const jy = y + 2 * dy;
            
            if (mx >= 0 && mx < GRID_SIZE && my >= 0 && my < GRID_SIZE &&
                jx >= 0 && jx < GRID_SIZE && jy >= 0 && jy < GRID_SIZE &&
                (maze[my][mx] === 0 || maze[my][mx] === 2) && maze[jy][jx] === 0) {
                const key = `${jx},${jy},${lastDir}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push([jx, jy, lastDir]);
                }
            }
        }
    }
    
    return false;
}

// Dibujar el laberinto
function drawMaze() {
    const newWidth = GRID_SIZE * CELL_SIZE;
    const newHeight = GRID_SIZE * CELL_SIZE;
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Regenerar hojas SOLO si el tamaño del canvas cambió
    if (typeof leavesBorderInstance !== 'undefined' && leavesBorderInstance) {
        if (lastCanvasSize.width !== newWidth || lastCanvasSize.height !== newHeight) {
            lastCanvasSize.width = newWidth;
            lastCanvasSize.height = newHeight;
            // Usar setTimeout para asegurar que el DOM se haya actualizado
            setTimeout(() => {
                leavesBorderInstance.regenerateLeaves();
            }, 50);
        }
    }
    
    // Dibujar celdas
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = maze[y][x];
            
            // Usar texturas si están cargadas, sino usar colores
            if (cell === 1) {
                if (textureWall && textureWall.complete) {
                    ctx.drawImage(textureWall, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                } else {
                    ctx.fillStyle = COLORS.wall;
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            } else if (cell === 2) {
                if (textureTrap && textureTrap.complete) {
                    ctx.drawImage(textureTrap, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                } else {
                    ctx.fillStyle = COLORS.trap;
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            } else {
                if (textureFloor && textureFloor.complete) {
                    ctx.drawImage(textureFloor, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                } else {
                    ctx.fillStyle = COLORS.floor;
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
            
            // Dibujar borde de celda (opcional, puedes comentar si no lo quieres)
            // ctx.strokeStyle = '#999';
            // ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
    
    // Dibujar meta
    const [gx, gy] = goalPosition;
    ctx.fillStyle = COLORS.goal;
    ctx.fillRect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = '#245d3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.lineWidth = 1;
    
    // Dibujar emoji de meta
    ctx.font = `${CELL_SIZE - 10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GOAL_EMOJI, gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE + CELL_SIZE / 2);
    
    // Dibujar jugador
    drawPlayer();
}

function drawPlayer() {
    const [x, y] = playerPosition;
    
    console.log('Drawing player at:', { x, y, playerPosition });
    
    // Usar imagen del muñeco si está cargada, sino usar emoji
    if (texturePlayer && texturePlayer.complete) {
        // Dibujar la imagen del muñeco centrada y un poco más pequeña que la celda
        const padding = 5;
        ctx.drawImage(
            texturePlayer, 
            x * CELL_SIZE + padding, 
            y * CELL_SIZE + padding, 
            CELL_SIZE - padding * 2, 
            CELL_SIZE - padding * 2
        );
    } else {
        // Fallback: dibujar círculo y emoji
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar emoji del jugador
        ctx.font = `${CELL_SIZE - 15}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(PLAYER_EMOJI, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
    }
}

function markVisited(x, y) {
    // Dibujar textura de suelo con un overlay gris semi-transparente
    if (textureFloor && textureFloor.complete) {
        ctx.drawImage(textureFloor, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        // Overlay gris semi-transparente para indicar visitado
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    } else {
        ctx.fillStyle = COLORS.visited;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
}

// Gestión de movimientos
function addMovement(direction) {
    movementSequence.push(direction);
    displaySequence.push(direction);
    updateSequenceUI();
}

function addJump() {
    if (movementSequence.length === 0) return;
    movementSequence.push('jump');
    displaySequence.push('Salto');
    updateSequenceUI();
}

function updateSequenceUI() {
    sequenceContainer.innerHTML = '';
    
    displaySequence.forEach((move, index) => {
        const item = document.createElement('div');
        item.className = 'sequence-item';
        item.id = `seq-${index}`;
        
        const text = document.createElement('span');
        text.className = 'sequence-item-text';
        text.textContent = `${index + 1}. ${move}`;
        
        const tick = document.createElement('span');
        tick.className = 'sequence-item-tick';
        tick.id = `tick-${index}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'sequence-item-delete';
        deleteBtn.textContent = '❌';
        deleteBtn.onclick = () => deleteStep(index);
        
        item.appendChild(text);
        item.appendChild(tick);
        item.appendChild(deleteBtn);
        sequenceContainer.appendChild(item);
    });
    
    // Auto-scroll al último elemento agregado
    if (displaySequence.length > 0) {
        setTimeout(() => {
            const lastElement = document.getElementById(`seq-${displaySequence.length - 1}`);
            if (lastElement && sequenceContainer) {
                const containerRect = sequenceContainer.getBoundingClientRect();
                const elementRect = lastElement.getBoundingClientRect();
                
                // Calcular posición para centrar el elemento
                const elementTop = lastElement.offsetTop;
                const elementHeight = lastElement.offsetHeight;
                const containerHeight = sequenceContainer.clientHeight;
                
                const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
                
                sequenceContainer.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }, 50);
    }
}

function deleteStep(index) {
    movementSequence.splice(index, 1);
    displaySequence.splice(index, 1);
    updateSequenceUI();
}

// Ejecución de la secuencia
async function executeSequence() {
    console.log('executeSequence started, sequence length:', movementSequence.length);
    
    if (movementSequence.length === 0) return;
    
    timerRunning = false;
    disableMoveButtons();
    playSound('adventure');
    
    for (let i = 0; i < movementSequence.length; i++) {
        console.log(`Processing move ${i + 1}/${movementSequence.length}:`, movementSequence[i]);
        
        const move = movementSequence[i];
        let moved = false;
        
        // Hacer scroll automático al elemento actual dentro del contenedor
        const currentElement = document.getElementById(`seq-${i}`);
        const sequenceContainer = document.getElementById('sequenceContainer');
        
        console.log('Auto-scroll:', {
            index: i,
            currentElement: currentElement,
            sequenceContainer: sequenceContainer,
            scrollHeight: sequenceContainer?.scrollHeight,
            clientHeight: sequenceContainer?.clientHeight
        });
        
        if (currentElement && sequenceContainer) {
            // Centrar el elemento actual en el contenedor (sin setTimeout para iOS)
            const elementTop = currentElement.offsetTop;
            const elementHeight = currentElement.offsetHeight;
            const containerHeight = sequenceContainer.clientHeight;
            
            // Calcular la posición para centrar el elemento
            const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
            console.log('Scrolling to:', {
                elementTop,
                elementHeight,
                containerHeight,
                scrollPosition
            });
            
            sequenceContainer.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
        
        if (move === 'jump') {
            // Buscar la última dirección
            let lastDir = null;
            for (let j = i - 1; j >= 0; j--) {
                if (movementSequence[j] !== 'jump') {
                    lastDir = movementSequence[j];
                    break;
                }
            }
            
            if (!lastDir) {
                stopMusic();
                playSound('error');
                showMessage('❌ Movimiento inválido', 'red');
                enableButtons();
                return;
            }
            
            moved = movePlayer(lastDir, true);
        } else {
            moved = movePlayer(move, false);
        }
        
        if (moved) {
            document.getElementById(`tick-${i}`).textContent = '✔';
            document.getElementById(`seq-${i}`).classList.add('completed');
        }
        
        if (!moved) {
            stopMusic();
            playSound('error');
            showMessage('❌ Movimiento inválido', 'red');
            enableButtons();
            return;
        }
        
        // Verificar si ganó
        if (playerPosition[0] === goalPosition[0] && playerPosition[1] === goalPosition[1]) {
            stopMusic();
            playSound('fanfare');
            showMessage('🎉 ¡Ganaste!', 'green');
            showWinnerModal();
            enableButtons();
            return;
        }
        
        // Esperar antes del siguiente movimiento
        await sleep(MOVE_DELAY);
    }
    
    // Si terminó la secuencia sin ganar
    stopMusic();
    playSound('error');
    showMessage('No llegaste a la meta', 'orange');
    enableButtons();
}

function movePlayer(direction, jump = false) {
    console.log('movePlayer called:', { direction, jump, currentPosition: playerPosition });
    
    let dx = 0, dy = 0;
    
    if (direction === 'arriba') dy = -1;
    else if (direction === 'abajo') dy = 1;
    else if (direction === 'izquierda') dx = -1;
    else if (direction === 'derecha') dx = 1;
    
    if (jump) {
        const mx = playerPosition[0] + dx;
        const my = playerPosition[1] + dy;
        const nx = playerPosition[0] + 2 * dx;
        const ny = playerPosition[1] + 2 * dy;
        
        console.log('Jump attempt:', { mx, my, nx, ny });
        
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE &&
            mx >= 0 && mx < GRID_SIZE && my >= 0 && my < GRID_SIZE) {
            if ((maze[my][mx] === 0 || maze[my][mx] === 2) && maze[ny][nx] === 0) {
                markVisited(playerPosition[0], playerPosition[1]);
                playerPosition[0] = nx;
                playerPosition[1] = ny;
                console.log('Jump successful, new position:', playerPosition);
                drawMaze();
                playSound('jump');
                return true;
            }
        }
        console.log('Jump failed');
        return false;
    }
    
    const nx = playerPosition[0] + dx;
    const ny = playerPosition[1] + dy;
    
    console.log('Move attempt:', { nx, ny, mazeCell: maze[ny]?.[nx] });
    
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && maze[ny][nx] === 0) {
        markVisited(playerPosition[0], playerPosition[1]);
        playerPosition[0] = nx;
        playerPosition[1] = ny;
        console.log('Move successful, new position:', playerPosition);
        drawMaze();
        return true;
    }
    
    console.log('Move failed');
    return false;
}

// Temporizador
function startTimer() {
    timerRunning = true;
    timeElapsed = 0;
    updateTimerDisplay();
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        if (timerRunning) {
            timeElapsed++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

function updateTimerDisplay() {
    timerDisplay.textContent = `⏱ ${timeElapsed} s`;
}

// Control de botones
function enableButtons() {
    upBtn.disabled = false;
    downBtn.disabled = false;
    leftBtn.disabled = false;
    rightBtn.disabled = false;
    jumpBtn.disabled = false;
    startBtn.disabled = false;
}

function disableMoveButtons() {
    upBtn.disabled = true;
    downBtn.disabled = true;
    leftBtn.disabled = true;
    rightBtn.disabled = true;
    jumpBtn.disabled = true;
    startBtn.disabled = true;
}

// Juego
function resetGame() {
    stopTimer();
    playSound('suspense');
    
    GRID_SIZE = parseInt(difficultySelect.value);
    playerPosition = [1, 1];
    
    generateMaze();
    drawMaze();
    
    movementSequence = [];
    displaySequence = [];
    updateSequenceUI();
    
    enableButtons();
    startTimer();
}

function clearGame() {
    stopTimer();
    playSound('suspense');
    
    enableButtons();
    
    timeElapsed = 0;
    updateTimerDisplay();
    
    movementSequence = [];
    displaySequence = [];
    updateSequenceUI();
    
    playerPosition = [1, 1];
    drawMaze();
    
    startTimer();
}

// Ranking
function loadRanking() {
    const ranking = localStorage.getItem('ranking');
    return ranking ? JSON.parse(ranking) : [];
}

function saveRanking(ranking) {
    localStorage.setItem('ranking', JSON.stringify(ranking));
}

function addToRanking(name, time, difficulty) {
    const ranking = loadRanking();
    ranking.push({ nombre: name, tiempo: time, dificultad: difficulty });
    
    // Agrupar por dificultad
    const grouped = {};
    ranking.forEach(entry => {
        if (!grouped[entry.dificultad]) {
            grouped[entry.dificultad] = [];
        }
        grouped[entry.dificultad].push(entry);
    });
    
    // Ordenar y mantener top 5 por dificultad
    const finalRanking = [];
    Object.keys(grouped).forEach(diff => {
        const entries = grouped[diff];
        entries.sort((a, b) => a.tiempo - b.tiempo);
        finalRanking.push(...entries.slice(0, 5));
    });
    
    saveRanking(finalRanking);
}

function showRanking() {
    const ranking = loadRanking();
    const difficulties = ['Básico', 'Intermedio', 'Complejo', 'Extremo'];
    
    let content = '';
    
    if (ranking.length === 0) {
        content = '<p>No hay puntuaciones todavía.</p>';
    } else {
        difficulties.forEach(diff => {
            const entries = ranking.filter(r => r.dificultad === diff);
            
            content += `<div class="ranking-section">`;
            content += `<h3>🏅 ${diff}:</h3>`;
            
            if (entries.length === 0) {
                content += '<p>(sin datos)</p>';
            } else {
                content += '<ol>';
                entries.forEach(entry => {
                    content += `<li>${entry.nombre} - ${entry.tiempo} s</li>`;
                });
                content += '</ol>';
            }
            
            content += '</div>';
        });
    }
    
    document.getElementById('rankingContent').innerHTML = content;
    rankingModal.classList.add('show');
}

function showWinnerModal() {
    winnerModal.classList.add('show');
    winnerNameInput.value = '';
    winnerNameInput.focus();
}

function submitWinnerName() {
    const name = winnerNameInput.value.trim();
    if (name) {
        const difficultyName = difficultySelect.options[difficultySelect.selectedIndex].text;
        addToRanking(name, timeElapsed, difficultyName);
        winnerModal.classList.remove('show');
        showRanking();
    }
}

// Modo de edición
function toggleEditMode() {
    editMode = !editMode;
    if (editMode) {
        editModeBtn.textContent = '🛑 Salir de edición';
        editModeBtn.classList.add('btn-warning');
    } else {
        editModeBtn.textContent = '✏️ Editar laberinto';
        editModeBtn.classList.remove('btn-warning');
    }
}

function onCanvasClick(event) {
    if (!editMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        if ((x === playerPosition[0] && y === playerPosition[1]) ||
            (x === goalPosition[0] && y === goalPosition[1])) {
            return;
        }
        
        maze[y][x] = (maze[y][x] + 1) % 3;
        drawMaze();
    }
}

function onCanvasRightClick(event) {
    event.preventDefault();
    if (!editMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        if (maze[y][x] === 1) return;
        
        const choice = confirm('¿Colocar jugador aquí? (Cancelar = meta)');
        if (choice) {
            playerPosition = [x, y];
        } else {
            goalPosition = [x, y];
        }
        drawMaze();
    }
}

function saveMaze() {
    if (!isSolvable()) {
        alert('Este laberinto no tiene solución. Corrígelo antes de guardar.');
        return;
    }
    
    const data = {
        maze: maze,
        playerPosition: playerPosition,
        goalPosition: goalPosition,
        gridSize: GRID_SIZE
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `laberinto_${GRID_SIZE}x${GRID_SIZE}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    alert('Laberinto guardado correctamente');
}

function loadMaze() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                maze = data.maze;
                playerPosition = data.playerPosition;
                goalPosition = data.goalPosition;
                GRID_SIZE = data.gridSize;
                
                difficultySelect.value = GRID_SIZE;
                drawMaze();
                clearGame();
                
                alert('Laberinto cargado correctamente');
            } catch (error) {
                alert('Error al cargar el laberinto: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Teclado
function onKeyDown(event) {
    if (!keyboardEnabled) return;
    
    let button = null;
    
    switch (event.key) {
        case 'ArrowUp':
            event.preventDefault();
            button = upBtn;
            addMovement('arriba');
            break;
        case 'ArrowDown':
            event.preventDefault();
            button = downBtn;
            addMovement('abajo');
            break;
        case 'ArrowLeft':
            event.preventDefault();
            button = leftBtn;
            addMovement('izquierda');
            break;
        case 'ArrowRight':
            event.preventDefault();
            button = rightBtn;
            addMovement('derecha');
            break;
        case ' ':
            event.preventDefault();
            button = jumpBtn;
            addJump();
            break;
    }
    
    // Animar el botón correspondiente
    if (button) {
        button.classList.add('key-pressed');
        setTimeout(() => {
            button.classList.remove('key-pressed');
        }, 150);
    }
}

// Utilidades
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ==================== GENERACIÓN DE PDF ====================

// Función para calcular la solución óptima usando BFS
function findOptimalSolution(mazeData, startPos, goalPos, allowJumps = true) {
    const dirs = {
        'arriba': [0, -1],
        'abajo': [0, 1],
        'izquierda': [-1, 0],
        'derecha': [1, 0]
    };
    
    const dirNames = ['arriba', 'abajo', 'izquierda', 'derecha'];
    const queue = [[startPos[0], startPos[1], []]];
    const visited = new Set();
    visited.add(`${startPos[0]},${startPos[1]}`);
    
    while (queue.length > 0) {
        const [x, y, path] = queue.shift();
        
        // Si llegamos a la meta
        if (x === goalPos[0] && y === goalPos[1]) {
            return path;
        }
        
        // Explorar todas las direcciones
        for (const dirName of dirNames) {
            const [dx, dy] = dirs[dirName];
            let nx = x + dx;
            let ny = y + dy;
            
            // Verificar si podemos movernos (sin salto)
            if (nx >= 0 && nx < mazeData.length && ny >= 0 && ny < mazeData.length) {
                const cell = mazeData[ny][nx];
                const key = `${nx},${ny}`;
                
                if (!visited.has(key) && cell !== 1) { // No es muro
                    visited.add(key);
                    queue.push([nx, ny, [...path, dirName]]);
                }
            }
            
            // Verificar salto (2 casillas) - solo si están permitidos
            if (allowJumps) {
                nx = x + dx * 2;
                ny = y + dy * 2;
                
                if (nx >= 0 && nx < mazeData.length && ny >= 0 && ny < mazeData.length) {
                    const cell = mazeData[ny][nx];
                    const key = `${nx},${ny}`;
                    
                    if (!visited.has(key) && cell !== 1) { // No es muro
                        visited.add(key);
                        queue.push([nx, ny, [...path, `salto-${dirName}`]]);
                    }
                }
            }
        }
    }
    
    return []; // No hay solución
}

// Función para generar un camino enrevesado (no óptimo)
// Máximo 20 movimientos, sin volver sobre los pasos
function findTwistedSolution(mazeData, startPos, goalPos, allowJumps = true) {
    const dirs = {
        'arriba': [0, -1],
        'abajo': [0, 1],
        'izquierda': [-1, 0],
        'derecha': [1, 0]
    };
    
    const dirNames = ['arriba', 'abajo', 'izquierda', 'derecha'];
    const MAX_MOVES = 20; // Máximo de movimientos permitidos
    
    // Intentar generar un camino enrevesado sin repetir celdas
    let bestPath = null;
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const visited = new Set();
        const path = [];
        let x = startPos[0];
        let y = startPos[1];
        visited.add(`${x},${y}`);
        
        // Hacer un recorrido aleatorio sin repetir celdas
        while (path.length < MAX_MOVES) {
            // Si llegamos a la meta, guardamos este camino
            if (x === goalPos[0] && y === goalPos[1]) {
                if (!bestPath || path.length > bestPath.length) {
                    bestPath = [...path];
                }
                break;
            }
            
            // Calcular distancia a la meta
            const distToGoal = Math.abs(x - goalPos[0]) + Math.abs(y - goalPos[1]);
            
            // Obtener movimientos válidos (solo celdas NO visitadas)
            const validMoves = [];
            
            for (const dirName of dirNames) {
                const [dx, dy] = dirs[dirName];
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < mazeData.length && ny >= 0 && ny < mazeData.length) {
                    const cell = mazeData[ny][nx];
                    const key = `${nx},${ny}`;
                    
                    // Solo permitir celdas NO visitadas y que no sean muros
                    if (cell !== 1 && !visited.has(key)) {
                        const newDist = Math.abs(nx - goalPos[0]) + Math.abs(ny - goalPos[1]);
                        
                        // Prioridad: equilibrio entre explorar y acercarse a la meta
                        let priority = Math.random() * 50; // Base aleatoria
                        
                        // Si estamos lejos de la meta, explorar más
                        if (distToGoal > 3 && newDist > distToGoal) {
                            priority += 30; // Alejarse un poco
                        }
                        
                        // Si estamos cerca o tenemos muchos movimientos, acercarse
                        if (distToGoal <= 3 || path.length > 12) {
                            if (newDist < distToGoal) priority += 60; // Acercarse
                        }
                        
                        validMoves.push({ dirName, nx, ny, key, priority });
                    }
                }
            }
            
            if (validMoves.length === 0) break; // Sin movimientos válidos, camino sin salida
            
            // Ordenar por prioridad
            validMoves.sort((a, b) => b.priority - a.priority);
            
            // Seleccionar movimiento con algo de aleatoriedad
            let selectedMove;
            if (Math.random() < 0.6 && validMoves.length > 0) {
                selectedMove = validMoves[0]; // Mejor opción
            } else {
                selectedMove = validMoves[Math.floor(Math.random() * Math.min(3, validMoves.length))];
            }
            
            // Ejecutar movimiento
            x = selectedMove.nx;
            y = selectedMove.ny;
            visited.add(selectedMove.key);
            path.push(selectedMove.dirName);
        }
    }
    
    // Si no encontramos ningún camino válido, usar el óptimo
    if (!bestPath) {
        bestPath = findOptimalSolution(mazeData, startPos, goalPos, allowJumps);
    }
    
    return bestPath;
}

// Función para generar un laberinto temporal
function generateTempMaze(size) {
    let tempMaze;
    let goalX, goalY;
    let attempts = 0;
    const maxAttempts = 100;
    
    function carve(x, y) {
        tempMaze[y][x] = 0;
        const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
        shuffle(dirs);
        
        for (let [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1 && tempMaze[ny][nx] === 1) {
                tempMaze[ny][nx] = 0;
                tempMaze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }
    
    function isTempSolvable() {
        const dirs = {
            'arriba': [0, -1],
            'abajo': [0, 1],
            'izquierda': [-1, 0],
            'derecha': [1, 0]
        };
        
        const start = [1, 1, null];
        const target = [goalX, goalY];
        const queue = [start];
        const visited = new Set();
        visited.add(`${start[0]},${start[1]},${start[2]}`);
        
        while (queue.length > 0) {
            const [x, y, lastDir] = queue.shift();
            
            if (x === target[0] && y === target[1]) {
                return true;
            }
            
            // Movimientos normales
            for (let [dir, [dx, dy]] of Object.entries(dirs)) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && tempMaze[ny][nx] === 0) {
                    const key = `${nx},${ny},${dir}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push([nx, ny, dir]);
                    }
                }
            }
            
            // Saltos
            if (lastDir && dirs[lastDir]) {
                const [dx, dy] = dirs[lastDir];
                const mx = x + dx;
                const my = y + dy;
                const jx = x + 2 * dx;
                const jy = y + 2 * dy;
                
                if (mx >= 0 && mx < size && my >= 0 && my < size &&
                    jx >= 0 && jx < size && jy >= 0 && jy < size &&
                    (tempMaze[my][mx] === 0 || tempMaze[my][mx] === 2) && tempMaze[jy][jx] === 0) {
                    const key = `${jx},${jy},${lastDir}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push([jx, jy, lastDir]);
                    }
                }
            }
        }
        
        return false;
    }
    
    function addTempTraps() {
        // Solo agregar trampas en niveles difíciles (como en el juego principal)
        if (size < 15) return;
        
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const candidates = [];
        
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                if (tempMaze[y][x] === 0 && !(x === 1 && y === 1) && 
                    !(x === goalX && y === goalY)) {
                    candidates.push([x, y]);
                }
            }
        }
        
        shuffle(candidates);
        const maxTraps = Math.floor((size * size) / 10);
        let trapCount = 0;
        
        for (let [x, y] of candidates) {
            if (trapCount >= maxTraps) break;
            
            // Verificar que no haya trampas adyacentes
            let hasAdjacentTrap = false;
            for (let [dx, dy] of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && tempMaze[ny][nx] === 2) {
                    hasAdjacentTrap = true;
                    break;
                }
            }
            
            if (!hasAdjacentTrap) {
                tempMaze[y][x] = 2;
                if (isTempSolvable()) {
                    trapCount++;
                } else {
                    tempMaze[y][x] = 0;
                }
            }
        }
    }
    
    // Generar laberinto con reintentos hasta que sea resoluble
    while (attempts < maxAttempts) {
        tempMaze = Array(size).fill(null).map(() => Array(size).fill(1));
        tempMaze[1][1] = 0;
        carve(1, 1);
        
        // Meta siempre en esquina inferior derecha (como en el juego principal)
        goalX = size - 2;
        goalY = size - 2;
        tempMaze[goalY][goalX] = 0;
        
        // Agregar trampas solo en niveles difíciles
        addTempTraps();
        
        if (isTempSolvable()) {
            break;
        }
        attempts++;
    }
    
    if (attempts === maxAttempts) {
        console.warn('No se pudo generar un laberinto resoluble para PDF, usando el último intento');
    }
    
    tempMaze[goalY][goalX] = 3; // Marcar meta
    
    return { maze: tempMaze, goal: [goalX, goalY] };
}

// Función para cargar imagen como base64
function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = reject;
        img.src = url;
    });
}

// Función para convertir emoji a imagen base64
function emojiToBase64(emoji, size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Configurar fuente para emoji
    ctx.font = `${size * 0.8}px Arial, "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dibujar emoji
    ctx.fillText(emoji, size / 2, size / 2);
    
    return canvas.toDataURL('image/png');
}

// Función principal para generar el PDF
async function generatePDF(difficulty) {
    try {
        // Mostrar mensaje de carga
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000; text-align: center;';
        loadingMsg.innerHTML = '<h3>📄 Generando PDF...</h3><p>Por favor espera un momento</p>';
        document.body.appendChild(loadingMsg);
        
        // Cargar imágenes de cabecera y emoji
        const cabeceraImg = await loadImageAsBase64('cabecera.png');
        const teacherImg = await loadImageAsBase64('teacher.png');
        const targetEmoji = emojiToBase64('🎯', 128); // Emoji de meta como imagen
        
        // Crear instancia de jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        
        // Agregar cabecera (reducida para dar más espacio a los mapas)
        const headerHeight = 25;
        const cabeceraWidth = 70;
        const teacherWidth = 25;
        const totalHeaderWidth = cabeceraWidth + teacherWidth + 5;
        const headerX = (pageWidth - totalHeaderWidth) / 2;
        
        doc.addImage(cabeceraImg, 'PNG', headerX, 8, cabeceraWidth, headerHeight);
        doc.addImage(teacherImg, 'PNG', headerX + cabeceraWidth + 5, 8, teacherWidth, headerHeight);
        
        // Configuración de los mapas (5 filas x 2 columnas = 10 mapas)
        const mapSize = 30; // Tamaño de cada mapa en mm (reducido para caber 10)
        const cellSize = mapSize / difficulty;
        const solutionAreaWidth = 30; // Ancho del área de solución
        const gapBetweenPairs = 4; // Espacio entre pares (Mapa-Solución)
        const gapBetweenRows = 3; // Espacio vertical entre filas
        
        const startY = headerHeight + 18; // Espacio suficiente después de la cabecera
        const pairWidth = mapSize + solutionAreaWidth + 5; // Ancho de un par Mapa+Solución
        const totalWidth = pairWidth * 2 + gapBetweenPairs; // Ancho total de las 2 columnas
        const startX = (pageWidth - totalWidth) / 2; // Centrar horizontalmente
        
        // Generar 10 mapas diferentes (5 filas x 2 columnas)
        for (let i = 0; i < 10; i++) {
            const col = i % 2; // 0 o 1 (columna izquierda o derecha)
            const row = Math.floor(i / 2); // 0, 1, 2, 3 o 4 (filas 1-5)
            
            const x = startX + col * (pairWidth + gapBetweenPairs);
            const y = startY + row * (mapSize + gapBetweenRows + 10);
            
            // Generar laberinto temporal
            const { maze: tempMaze, goal: tempGoal } = generateTempMaze(difficulty);
            
            // Calcular solución (sin saltos para niveles 5 y 7)
            const allowJumps = difficulty > 7; // Solo permitir saltos en niveles superiores
            const solution = findOptimalSolution(tempMaze, [1, 1], tempGoal, allowJumps);
            const movesNeeded = solution.length;
            
            // Dibujar título del mapa
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`Mapa ${i + 1}`, x + mapSize / 2, y - 2, { align: 'center' });
            
            // Dibujar el laberinto
            for (let row = 0; row < difficulty; row++) {
                for (let col = 0; col < difficulty; col++) {
                    const cellX = x + col * cellSize;
                    const cellY = y + row * cellSize;
                    const cellType = tempMaze[row][col];
                    
                    // Determinar color según el tipo de celda
                    if (cellType === 1) {
                        // Muro - gris claro
                        doc.setFillColor(200, 200, 200);
                    } else if (cellType === 2) {
                        // Trampa - NO dibujar (eliminar casillas rojas)
                        doc.setFillColor(255, 255, 255);
                    } else if (cellType === 3) {
                        // Meta - blanco para que resalte el emoji
                        doc.setFillColor(255, 255, 255);
                    } else {
                        // Suelo - blanco
                        doc.setFillColor(255, 255, 255);
                    }
                    
                    doc.rect(cellX, cellY, cellSize, cellSize, 'F');
                    
                    // Dibujar borde
                    doc.setDrawColor(150, 150, 150);
                    doc.setLineWidth(0.1);
                    doc.rect(cellX, cellY, cellSize, cellSize, 'S');
                    
                    // Dibujar jugador en posición inicial
                    if (col === 1 && row === 1) {
                        doc.setFillColor(78, 205, 196);
                        doc.circle(cellX + cellSize / 2, cellY + cellSize / 2, cellSize / 3, 'F');
                    }
                    
                    // Dibujar símbolo de meta
                    if (cellType === 3) {
                        const emojiSize = cellSize * 0.6;
                        doc.addImage(targetEmoji, 'PNG', 
                            cellX + (cellSize - emojiSize) / 2, 
                            cellY + (cellSize - emojiSize) / 2, 
                            emojiSize, emojiSize);
                    }
                }
            }
            
            // Dibujar casillas de solución a la derecha (en grid)
            const solutionX = x + mapSize + 5;
            const solutionY = y;
            
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Solución:', solutionX, solutionY - 0.5);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            
            // Configuración de grid de casillas
            const boxSize = 5.5; // Casillas cuadradas pequeñas (5.5x5.5mm, reducido para 10 mapas)
            const boxGap = 0.7; // Espacio entre casillas
            const boxesPerRow = 5; // 5 columnas
            const maxBoxes = 20; // Siempre 20 casillas por mapa
            
            for (let j = 0; j < maxBoxes; j++) {
                const boxCol = j % boxesPerRow;
                const boxRow = Math.floor(j / boxesPerRow);
                const boxX = solutionX + boxCol * (boxSize + boxGap);
                const boxY = solutionY + boxRow * (boxSize + boxGap);
                
                // Dibujar casilla cuadrada con bordes redondeados
                doc.setDrawColor(180, 190, 220); // Color más claro y suave
                doc.setLineWidth(0.2); // Línea más delgada
                doc.roundedRect(boxX, boxY, boxSize, boxSize, 1, 1, 'S'); // Bordes redondeados
                
                // Todas las casillas tienen número en esquina superior izquierda
                doc.setTextColor(150, 160, 200); // Color más claro con menos opacidad
                doc.setFont('helvetica', 'normal'); // Normal en lugar de bold
                doc.setFontSize(3.5); // Más pequeño (antes 4.5)
                doc.text(`${j + 1}`, boxX + 0.6, boxY + 1.5);
            }
        }
        
        // Agregar pie de página página 1
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Saving Teacher Juan - Laberintos Educativos', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // ============================================
        // PÁGINA 2: 20 mapas con soluciones (4 columnas × 5 filas)
        // ============================================
        doc.addPage();
        
        // Agregar cabecera en página 2
        doc.addImage(cabeceraImg, 'PNG', headerX, 8, cabeceraWidth, headerHeight);
        doc.addImage(teacherImg, 'PNG', headerX + cabeceraWidth + 5, 8, teacherWidth, headerHeight);
        
        // Crear imágenes de emojis de flechas
        const arrowUpEmoji = emojiToBase64('⬆', 64);
        const arrowDownEmoji = emojiToBase64('⬇', 64);
        const arrowLeftEmoji = emojiToBase64('⬅', 64);
        const arrowRightEmoji = emojiToBase64('➡', 64);
        
        // Configuración de los mapas (8 mapas: 4 filas x 2 columnas)
        // Patrón: Solución-Mapa-Solución-Mapa (2 pares por fila)
        const mapSize2 = 37.5; // Tamaño de cada mapa en mm (x2.5 más grande)
        const cellSize2 = mapSize2 / difficulty;
        const solutionAreaWidth2 = 32; // Ancho del área de solución con flechas (escalado x2.5)
        const gapBetweenElements = 3.5; // Espacio entre elementos (escalado x2.5)
        const gapBetweenPairs2 = 6; // Espacio entre pares (escalado x2.5)
        const gapBetweenRows2 = 15; // Espacio vertical entre filas (escalado x2.5)
        
        const startY2 = headerHeight + 18;
        const pairWidth2 = solutionAreaWidth2 + gapBetweenElements + mapSize2; // Ancho de un par Solución+Mapa
        const totalWidth2 = pairWidth2 * 2 + gapBetweenPairs2; // Ancho total de los 2 pares (4 columnas)
        const startX2 = (pageWidth - totalWidth2) / 2;
        
        // Generar 8 mapas diferentes (4 filas x 2 columnas, patrón Sol-Map-Sol-Map)
        const usedSolutions = new Set(); // Para evitar soluciones repetidas
        
        for (let i = 0; i < 8; i++) {
            const pairIndex = i % 2; // 0 o 1 (par izquierdo o derecho)
            const row = Math.floor(i / 2); // 0, 1, 2 o 3 (filas 1-4)
            
            const x = startX2 + pairIndex * (pairWidth2 + gapBetweenPairs2);
            const y = startY2 + row * (mapSize2 + gapBetweenRows2 + 10);
            
            // Generar laberinto y solución únicos
            let tempMaze2, tempGoal2, solution2, solutionKey;
            let attempts = 0;
            const maxAttempts = 50;
            
            do {
                // Generar laberinto temporal
                const mazeData = generateTempMaze(difficulty);
                tempMaze2 = mazeData.maze;
                tempGoal2 = mazeData.goal;
                
                // Calcular solución enrevesada (sin saltos para niveles 5 y 7)
                const allowJumps2 = difficulty > 7; // Solo permitir saltos en niveles superiores
                solution2 = findTwistedSolution(tempMaze2, [1, 1], tempGoal2, allowJumps2);
                
                // Crear clave única para la solución
                solutionKey = solution2.join('-');
                attempts++;
                
            } while (usedSolutions.has(solutionKey) && attempts < maxAttempts);
            
            // Guardar la solución como usada
            usedSolutions.add(solutionKey);
            
            // Posiciones: Solución a la izquierda, Mapa a la derecha
            const solutionX = x;
            const mapX = x + solutionAreaWidth2 + gapBetweenElements;
            
            // Dibujar título del mapa (centrado sobre el mapa)
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`M${i + 1}`, mapX + mapSize2 / 2, y - 3.5, { align: 'center' });
            
            // Dibujar el laberinto
            for (let row = 0; row < difficulty; row++) {
                for (let col = 0; col < difficulty; col++) {
                    const cellX = mapX + col * cellSize2;
                    const cellY = y + row * cellSize2;
                    const cellType = tempMaze2[row][col];
                    
                    // Todas las celdas blancas (sin muros visibles en Página 2)
                    doc.setFillColor(255, 255, 255); // Todo blanco
                    
                    doc.rect(cellX, cellY, cellSize2, cellSize2, 'F');
                    
                    // Dibujar borde
                    doc.setDrawColor(150, 150, 150);
                    doc.setLineWidth(0.1);
                    doc.rect(cellX, cellY, cellSize2, cellSize2, 'S');
                    
                    // Dibujar jugador en posición inicial (verde)
                    if (col === 1 && row === 1) {
                        doc.setFillColor(78, 205, 196); // Verde para inicio
                        doc.circle(cellX + cellSize2 / 2, cellY + cellSize2 / 2, cellSize2 / 3, 'F');
                    }
                    
                    // Dibujar símbolo de meta (rojo)
                    if (cellType === 3) {
                        doc.setFillColor(255, 100, 100); // Rojo para meta
                        doc.circle(cellX + cellSize2 / 2, cellY + cellSize2 / 2, cellSize2 / 3, 'F');
                    }
                }
            }
            
            // Configuración de grid de flechas (sin etiqueta "Sol:")
            const arrowSize = 6; // Tamaño de cada flecha (escalado x2.5)
            const arrowGap = 0.8; // Espacio entre flechas (escalado x2.5)
            const arrowsPerRow = 5; // 5 columnas de flechas
            
            // Dibujar todas las flechas de la solución
            for (let j = 0; j < solution2.length; j++) {
                const arrowCol = j % arrowsPerRow;
                const arrowRow = Math.floor(j / arrowsPerRow);
                const arrowX = solutionX + arrowCol * (arrowSize + arrowGap);
                const arrowY = y + arrowRow * (arrowSize + arrowGap);
                
                // Dibujar caja de la flecha (estilo redondeado y claro como Página 1)
                doc.setDrawColor(180, 190, 220); // Color más claro
                doc.setLineWidth(0.2); // Línea delgada
                doc.roundedRect(arrowX, arrowY, arrowSize, arrowSize, 1, 1, 'S'); // Bordes redondeados
                
                // Determinar dirección
                let move = solution2[j];
                let direction = move;
                let isJump = false;
                
                if (move.startsWith('salto-')) {
                    direction = move.replace('salto-', '');
                    isJump = true;
                }
                
                // Seleccionar imagen de flecha según dirección
                let arrowImg;
                if (direction === 'arriba') arrowImg = arrowUpEmoji;
                else if (direction === 'abajo') arrowImg = arrowDownEmoji;
                else if (direction === 'izquierda') arrowImg = arrowLeftEmoji;
                else if (direction === 'derecha') arrowImg = arrowRightEmoji;
                
                // Dibujar flecha como imagen
                const arrowImgSize = arrowSize * 0.7;
                doc.addImage(arrowImg, 'PNG', 
                    arrowX + (arrowSize - arrowImgSize) / 2, 
                    arrowY + (arrowSize - arrowImgSize) / 2, 
                    arrowImgSize, arrowImgSize);
                
                // Número del paso (esquina superior izquierda, estilo claro como Página 1)
                doc.setTextColor(150, 160, 200); // Color más claro con menos opacidad
                doc.setFont('helvetica', 'normal'); // Normal en lugar de bold
                doc.setFontSize(3.5); // Más pequeño
                doc.text(`${j + 1}`, arrowX + 0.6, arrowY + 1.5); // Misma posición que Página 1
            }
            
            // Agregar emoji de meta al final de la solución
            const finalCol = solution2.length % arrowsPerRow;
            const finalRow = Math.floor(solution2.length / arrowsPerRow);
            const finalX = solutionX + finalCol * (arrowSize + arrowGap);
            const finalY = y + finalRow * (arrowSize + arrowGap);
            
            doc.setDrawColor(102, 126, 234);
            doc.setLineWidth(0.2);
            doc.rect(finalX, finalY, arrowSize, arrowSize, 'S');
            
            const finalEmojiSize = arrowSize * 0.7;
            doc.addImage(targetEmoji, 'PNG', 
                finalX + (arrowSize - finalEmojiSize) / 2, 
                finalY + (arrowSize - finalEmojiSize) / 2, 
                finalEmojiSize, finalEmojiSize);
        }
        
        // Pie de página página 2
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Saving Teacher Juan - Laberintos Educativos', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Guardar el PDF
        const difficultyName = difficulty === 5 ? 'Facil' : 'Intermedio';
        doc.save(`Laberintos_${difficultyName}_${Date.now()}.pdf`);
        
        // Remover mensaje de carga
        document.body.removeChild(loadingMsg);
        
        // Mostrar mensaje de éxito
        alert('✅ PDF generado correctamente');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('❌ Error al generar el PDF: ' + error.message);
        
        // Remover mensaje de carga si existe
        const loadingMsg = document.querySelector('div[style*="position: fixed"]');
        if (loadingMsg) {
            document.body.removeChild(loadingMsg);
        }
    }
}

function sleep(ms) {
    console.log(`Sleep called for ${ms}ms`);
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Sleep completed after ${ms}ms`);
            resolve();
        }, ms);
    });
}

function showMessage(text, color) {
    ctx.save();
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, GRID_SIZE * CELL_SIZE / 2 - 30, GRID_SIZE * CELL_SIZE, 60);
    ctx.fillStyle = color;
    ctx.fillText(text, GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2);
    ctx.restore();
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    if (event.target === rankingModal) {
        rankingModal.classList.remove('show');
    }
};

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}