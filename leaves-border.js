// Sistema de decoración con hojas alrededor del game-container
class LeavesBorder {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.leavesWrapper = null;
        this.leafImages = ['assets/hoja1.png', 'assets/hoja2.png', 'assets/hoja3.png', 'assets/hoja4.png', 'assets/hoja5.png', 'assets/hoja6.png', 'assets/hoja7.png'];
        this.leafSize = 18; // Tamaño base de cada hoja en píxeles (espaciado muy denso - franja estrecha)
        this.exclusionZones = []; // Zonas donde no se deben generar hojas
        
        // Detectar si es iOS/iPhone para optimizar rendimiento
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (this.isIOS) {
            console.log('🍎 iOS detectado - Modo de rendimiento optimizado activado');
        }
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        // Crear wrapper para las hojas
        this.leavesWrapper = document.createElement('div');
        this.leavesWrapper.className = 'leaves-border-wrapper';
        this.container.appendChild(this.leavesWrapper);

        // Generar hojas iniciales
        this.generateLeaves();

        // Regenerar hojas cuando cambie el tamaño de la ventana
        // SOLO en dispositivos NO móviles (mejor rendimiento en móviles)
        const isMobileDevice = this.isMobile();
        
        if (!isMobileDevice) {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.regenerateLeaves();
                }, 250);
            });
            console.log('🖥️ Dispositivo desktop - Hojas adaptativas activadas');
        } else {
            console.log('📱 Dispositivo móvil/tablet detectado - Hojas fijas (sin regeneración al rotar)');
        }
    }

    generateLeaves() {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Calcular cuántas hojas caben en cada lado
        let topBottomCount = Math.floor(width / this.leafSize);
        let leftRightCount = Math.floor(height / this.leafSize);
        
        // En iOS, reducir la cantidad de hojas a la mitad para mejor rendimiento
        if (this.isIOS) {
            topBottomCount = Math.floor(topBottomCount * 0.5);
            leftRightCount = Math.floor(leftRightCount * 0.5);
        }

        // Limpiar hojas existentes
        this.leavesWrapper.innerHTML = '';
        
        // Actualizar zonas de exclusión
        this.updateExclusionZones();

        // Generar múltiples capas de hojas para mayor densidad
        // En iOS, solo generar 2 capas en lugar de 3
        const maxLayers = this.isIOS ? 2 : 3;
        
        // Capa 1 (más externa)
        this.createLeavesForSide('top', topBottomCount, width, 0);
        this.createLeavesForSide('bottom', topBottomCount, width, 0);
        this.createLeavesForSide('left', leftRightCount, height, 0);
        this.createLeavesForSide('right', leftRightCount, height, 0);
        
        // Capa 2 (intermedia)
        this.createLeavesForSide('top', topBottomCount, width, 1);
        this.createLeavesForSide('bottom', topBottomCount, width, 1);
        this.createLeavesForSide('left', leftRightCount, height, 1);
        this.createLeavesForSide('right', leftRightCount, height, 1);
        
        // Capa 3 (más interna) - Solo en dispositivos no-iOS
        if (maxLayers === 3) {
            this.createLeavesForSide('top', Math.floor(topBottomCount * 0.8), width, 2);
            this.createLeavesForSide('bottom', Math.floor(topBottomCount * 0.8), width, 2);
            this.createLeavesForSide('left', Math.floor(leftRightCount * 0.8), height, 2);
            this.createLeavesForSide('right', Math.floor(leftRightCount * 0.8), height, 2);
        }
    }

    createLeavesForSide(side, count, totalLength, layer = 0) {
        const spacing = totalLength / count;
        
        // Ajustar offset por capa: TODAS las capas MUY lejos hacia el exterior
        // Capa 0: -90px (muy muy afuera)
        // Capa 1: -75px (muy afuera)
        // Capa 2: -60px (afuera)
        const layerOffsets = [-125, -125, -125];
        const baseOffset = layerOffsets[layer] || -120;

        for (let i = 0; i < count; i++) {
            // Posicionar según el lado con offset de capa
            let positionX, positionY;
            const randomOffset = Math.random() * 6 - 3; // ±3px de variación (reducido)
            const finalOffset = baseOffset + randomOffset;
            
            if (side === 'top' || side === 'bottom') {
                positionX = (i * spacing) + (spacing / 2) + (Math.random() * 8 - 4);
                positionY = side === 'top' ? finalOffset : totalLength - finalOffset;
            } else {
                positionX = side === 'left' ? finalOffset : totalLength - finalOffset;
                positionY = (i * spacing) + (spacing / 2) + (Math.random() * 8 - 4);
            }
            
            // Verificar si está en zona de exclusión
            if (this.isInExclusionZone(positionX, positionY)) {
                continue; // Saltar esta hoja
            }
            
            const leaf = document.createElement('div');
            leaf.className = `leaf leaf-${side} leaf-layer-${layer}`;

            // Seleccionar imagen aleatoria
            const randomImage = this.leafImages[Math.floor(Math.random() * this.leafImages.length)];
            
            // Rotación aleatoria
            const rotation = Math.random() * 360;
            
            // Escala aleatoria (90% - 130%) - hojas más grandes
            const scale = 0.8 + Math.random() * 0.4;

            // Aplicar posición
            if (side === 'top' || side === 'bottom') {
                leaf.style.left = `${positionX}px`;
            } else {
                leaf.style.top = `${positionY}px`;
            }

            // Aplicar estilos
            leaf.style.backgroundImage = `url('${randomImage}')`;
            
            // Guardar valores en variables CSS para animaciones
            leaf.style.setProperty('--leaf-rotation', `${rotation}deg`);
            leaf.style.setProperty('--leaf-scale', scale);
            leaf.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            
            // En iOS, usar will-change para optimizar el rendering
            if (this.isIOS) {
                leaf.style.willChange = 'transform, opacity';
            }
            
            if (side === 'top') {
                leaf.style.top = `${finalOffset}px`;
            } else if (side === 'bottom') {
                leaf.style.bottom = `${finalOffset}px`;
            } else if (side === 'left') {
                leaf.style.left = `${finalOffset}px`;
            } else if (side === 'right') {
                leaf.style.right = `${finalOffset}px`;
            }

            // Z-index según la capa (capas externas más atrás)
            leaf.style.zIndex = 10 - layer;

            // Animación de entrada con delay aleatorio (más rápida en iOS)
            const animationDelay = this.isIOS ? Math.random() * 0.6 : Math.random() * 1.2;
            leaf.style.animationDelay = `${animationDelay}s`;

            this.leavesWrapper.appendChild(leaf);
        }
    }

    regenerateLeaves() {
        this.generateLeaves();
    }

    // Detectar si es un dispositivo móvil (táctil)
    isMobile() {
        // Detectar iPad moderno (que se identifica como Mac)
        const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                       /iPad/.test(navigator.userAgent);
        
        // Detectar otros dispositivos móviles
        const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Detectar dispositivos táctiles en general
        const isTouchDevice = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
                             ('ontouchstart' in window);
        
        // Log de depuración para iPad
        if (isIPad || isMobileUA || isTouchDevice) {
            console.log('🔍 Detección de dispositivo:', {
                'iPad detectado': isIPad,
                'Móvil por UA': isMobileUA,
                'Dispositivo táctil': isTouchDevice,
                'Platform': navigator.platform,
                'MaxTouchPoints': navigator.maxTouchPoints,
                'UserAgent': navigator.userAgent.substring(0, 100)
            });
        }
        
        // Retornar true si es iPad o cualquier otro móvil/tablet
        return isIPad || isMobileUA || isTouchDevice;
    }

    // Actualizar las zonas de exclusión basadas en elementos del DOM
    updateExclusionZones() {
        this.exclusionZones = [];
        const containerRect = this.container.getBoundingClientRect();
        
        // Zona de exclusión 1: Imagen del teacher
        const teacherImage = document.querySelector('.teacher-image');
        if (teacherImage) {
            const teacherRect = teacherImage.getBoundingClientRect();
            this.exclusionZones.push({
                left: teacherRect.left - containerRect.left - 10, // Margen extra
                right: teacherRect.right - containerRect.left + 10,
                top: teacherRect.top - containerRect.top - 50,
                bottom: teacherRect.bottom - containerRect.top + 50
            });
        }
        
        // Zona de exclusión 2: Barra de herramientas (controls-top)
        const controlsTop = document.querySelector('.controls-top');
        if (controlsTop) {
            const controlsRect = controlsTop.getBoundingClientRect();
            this.exclusionZones.push({
                left: controlsRect.left - containerRect.left - 30, // Margen extra
                right: controlsRect.right - containerRect.left + 30,
                top: controlsRect.top - containerRect.top - 30,
                bottom: controlsRect.bottom - containerRect.top + 30
            });
        }
    }

    // Verificar si una posición está en una zona de exclusión
    isInExclusionZone(x, y, leafSize = 85) {
        const leafHalfSize = leafSize / 2;
        
        for (const zone of this.exclusionZones) {
            // Verificar si el centro de la hoja o sus bordes están dentro de la zona
            if (x + leafHalfSize > zone.left && 
                x - leafHalfSize < zone.right && 
                y + leafHalfSize > zone.top && 
                y - leafHalfSize < zone.bottom) {
                return true;
            }
        }
        return false;
    }
}

// Variable global para acceder a la instancia desde otros scripts
let leavesBorderInstance = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    leavesBorderInstance = new LeavesBorder('.game-container');
});