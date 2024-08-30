document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const endlessModeButton = document.getElementById('endless-mode');
    const moneyModeButton = document.getElementById('money-mode');
    const startScreen = document.getElementById('start-screen');
    const modeSelection = document.getElementById('mode-selection');
    const gameCanvas = document.getElementById('game-canvas');
    const gl = initWebGL(gameCanvas);

    let programInfo;
    let buffers = {};
    let textures = {};

    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        modeSelection.classList.remove('hidden');
    });

  endlessModeButton.addEventListener('click', () => {
        modeSelection.classList.add('hidden');
        gameCanvas.classList.remove('hidden');
        startGame('endless');
    });

    moneyModeButton.addEventListener('click', () => {
        modeSelection.classList.add('hidden');
        gameCanvas.classList.remove('hidden');
        startGame('money');
    });

    function startGame(mode) {
        initGameGraphics();
        if (mode === 'money') {
            setupBettingSystem();
        }
        dealInitialCards();
        gameLoop();
    }

    function initGameGraphics() {
        programInfo = initShaders(gl);
        buffers = initBuffers(gl);
        textures = loadTextures(gl);
        gl.clearColor(0, 100 / 255, 0, 1); // Dark green background
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

  function initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        const textureCoordinates = [
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            1.0,  1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            textureCoord: textureCoordBuffer,
        };
    }

    function loadTextures(gl) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]); // A blue pixel
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, pixel);

        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        image.src = 'card_texture.png'; // Replace with the path to your card texture

        return { texture };
    }

   function setupBettingSystem() {
        // Implement the betting logic with chip animations
    }

    function dealInitialCards() {
        // Implement dealing cards with animations
    }

    function gameLoop() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawScene(gl, programInfo, buffers, textures);
        requestAnimationFrame(gameLoop);
    }

    function drawScene(gl, programInfo, buffers, textures) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, new Float32Array([
            2 / gameCanvas.width, 0, 0, 0,
            0, -2 / gameCanvas.height, 0, 0,
            0, 0, -1, 0,
            -1, 1, 0, 1
        ]));
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function initWebGL(canvas) {
        let gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return null;
        }
        return gl;
    }

   function createShader(gl, type, source) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    function initShaders(gl) {
        const vertexShaderSource = `
            attribute vec4 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying highp vec2 vTextureCoord;
            void main(void) {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vTextureCoord = aTextureCoord;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            varying highp vec2 vTextureCoord;
            uniform sampler2D uSampler;
            void main(void) {
                gl_FragColor = texture2D(uSampler, vTextureCoord);
            }
        `;

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const shaderProgram = createProgram(gl, vertexShader, fragmentShader);

        return {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            },
        };
    }
});
