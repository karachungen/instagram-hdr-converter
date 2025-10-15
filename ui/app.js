// App state
let wasmModule = null;
let selectedFile = null;
let fileData = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const processBtn = document.getElementById('processBtn');
const decodeBtn = document.getElementById('decodeBtn');
const clearBtn = document.getElementById('clearBtn');
const logElement = document.getElementById('log');
const statusElement = document.getElementById('status');
const previewElement = document.getElementById('preview');

// Logging functions
function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
}

function clearLog() {
    logElement.innerHTML = '';
}

function updateStatus(text, type = 'loading') {
    statusElement.textContent = text;
    statusElement.className = `status ${type}`;
}

// File handling
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function handleFileSelect(file) {
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileType.textContent = file.type || 'unknown';
    fileInfo.classList.add('show');
    processBtn.disabled = false;
    decodeBtn.disabled = false;
    
    log(`File selected: ${file.name} (${formatFileSize(file.size)})`, 'success');
    
    // Read file data
    const reader = new FileReader();
    reader.onload = (e) => {
        fileData = new Uint8Array(e.target.result);
        log(`File loaded into memory: ${fileData.length} bytes`, 'info');
    };
    reader.readAsArrayBuffer(file);
}

// Drag and drop
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// WASM interaction
function callWasmFunction(funcName, ...args) {
    try {
        if (!wasmModule) {
            log('WASM module not loaded', 'error');
            return null;
        }
        
        log(`Calling WASM function: ${funcName}`, 'info');
        const result = wasmModule[funcName](...args);
        log(`Function ${funcName} returned: ${result}`, 'success');
        return result;
    } catch (error) {
        log(`Error calling ${funcName}: ${error.message}`, 'error');
        return null;
    }
}

// Process button handler
processBtn.addEventListener('click', async () => {
    if (!fileData) {
        log('No file data loaded', 'error');
        return;
    }
    
    try {
        log('Starting image processing...', 'info');
        
        // Write file to WASM filesystem
        const inputPath = '/input.jpg';
        const outputPath = '/output.jpg';
        
        if (wasmModule.FS) {
            wasmModule.FS.writeFile(inputPath, fileData);
            log(`Written file to WASM FS: ${inputPath}`, 'success');
            
            // Try to call ultrahdr_app with basic arguments
            // Note: This is a simplified example - actual usage depends on the compiled binary
            log('Processing with ultrahdr_app...', 'info');
            
            // Check if file exists in WASM FS
            try {
                const stat = wasmModule.FS.stat(inputPath);
                log(`Input file size in WASM FS: ${stat.size} bytes`, 'info');
            } catch (e) {
                log(`Error checking file: ${e.message}`, 'error');
            }
            
            log('Image processing complete! (Note: Actual processing depends on WASM module interface)', 'success');
        } else {
            log('WASM filesystem not available', 'error');
        }
    } catch (error) {
        log(`Processing error: ${error.message}`, 'error');
    }
});

// Decode button handler
decodeBtn.addEventListener('click', () => {
    if (!fileData) {
        log('No file data loaded', 'error');
        return;
    }
    
    log('Decoding HDR image...', 'info');
    
    // Create image preview
    const blob = new Blob([fileData], { type: selectedFile.type });
    const url = URL.createObjectURL(blob);
    
    previewElement.innerHTML = `
        <p style="margin-bottom: 10px; color: #667eea; font-weight: 600;">Image Preview:</p>
        <img src="${url}" alt="Preview" />
    `;
    
    log('Image preview displayed (browser native rendering)', 'success');
});

// Clear button handler
clearBtn.addEventListener('click', clearLog);

// Initialize WASM module with verbose logging
async function initWasm() {
    try {
        log('=== WASM Module Initialization Started ===', 'info');
        log(`Timestamp: ${new Date().toISOString()}`, 'info');
        log(`Browser: ${navigator.userAgent}`, 'info');
        log(`Location: ${window.location.href}`, 'info');
        
        // Check if UltraHDRModule is loaded
        log('Step 1: Checking for UltraHDRModule...', 'info');
        if (typeof UltraHDRModule === 'undefined') {
            throw new Error('UltraHDRModule not found! ultrahdr_app.js may not be loaded.');
        }
        log(`✓ UltraHDRModule type: ${typeof UltraHDRModule}`, 'success');
        
        // Check for WASM file
        log('Step 2: Checking WASM file availability...', 'info');
        try {
            const wasmResponse = await fetch('ultrahdr_app.wasm', { method: 'HEAD' });
            log(`✓ WASM file status: ${wasmResponse.status} ${wasmResponse.statusText}`, 'success');
            const contentLength = wasmResponse.headers.get('content-length');
            if (contentLength) {
                log(`  WASM file size: ${(parseInt(contentLength) / 1024).toFixed(2)} KB`, 'info');
            }
            log(`  WASM content-type: ${wasmResponse.headers.get('content-type') || 'not set'}`, 'info');
        } catch (e) {
            log(`✗ WASM file check failed: ${e.message}`, 'error');
            throw new Error('Cannot access ultrahdr_app.wasm. Make sure you are using a web server!');
        }
        
        // Create module configuration
        log('Step 3: Configuring module...', 'info');
        const moduleConfig = {
            // Print functions
            print: (text) => {
                log(`[WASM-OUT] ${text}`, 'info');
            },
            printErr: (text) => {
                log(`[WASM-ERR] ${text}`, 'error');
            },
            
            // Callbacks
            onRuntimeInitialized: () => {
                log('✓ onRuntimeInitialized callback triggered!', 'success');
            },
            
            onAbort: (error) => {
                log(`✗ Module aborted: ${error}`, 'error');
                updateStatus('Aborted', 'error');
            },
            
            // Monitor progress
            monitorRunDependencies: (left) => {
                log(`  Dependencies remaining: ${left}`, 'info');
            },
            
            // Status updates
            setStatus: (text) => {
                if (text) {
                    log(`  [Module Status] ${text}`, 'info');
                }
            },
            
            // Locating files
            locateFile: (path, prefix) => {
                const fullPath = prefix + path;
                log(`  Locating: ${path} → ${fullPath}`, 'info');
                return fullPath;
            }
        };
        
        // Initialize the module (UltraHDRModule is an async function!)
        log('Step 4: Calling UltraHDRModule() [this may take a few seconds]...', 'info');
        updateStatus('Loading WASM...', 'loading');
        
        const startTime = performance.now();
        wasmModule = await UltraHDRModule(moduleConfig);
        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        
        log(`✓ UltraHDRModule loaded in ${loadTime}s!`, 'success');
        log('Step 5: Checking module exports...', 'info');
        
        // Check what's available
        const exports = Object.keys(wasmModule).filter(k => !k.startsWith('_') || k === '_main');
        log(`  Available exports: ${exports.length} items`, 'info');
        log(`  Key exports: ${exports.slice(0, 15).join(', ')}${exports.length > 15 ? '...' : ''}`, 'info');
        
        // Check for FS
        if (wasmModule.FS) {
            log('✓ Filesystem API (FS) is available', 'success');
            
            try {
                // List root directory
                const rootContents = wasmModule.FS.readdir('/');
                log(`  Root directory: ${rootContents.join(', ')}`, 'info');
                
                // Create working directories
                log('  Creating /data directory...', 'info');
                try {
                    wasmModule.FS.mkdir('/data');
                    log('  ✓ Created /data directory', 'success');
                } catch (e) {
                    if (e.message && e.message.includes('exist')) {
                        log('  /data directory already exists', 'info');
                    } else {
                        throw e;
                    }
                }
                
                // Verify directory was created
                const dataDir = wasmModule.FS.stat('/data');
                log(`  /data mode: ${dataDir.mode.toString(8)}`, 'info');
                
            } catch (e) {
                log(`  Warning with FS operations: ${e.message}`, 'error');
            }
        } else {
            log('✗ Filesystem API (FS) not available!', 'error');
        }
        
        // Check for main function
        if (typeof wasmModule._main === 'function') {
            log('✓ _main function is available', 'success');
        } else if (typeof wasmModule.callMain === 'function') {
            log('✓ callMain function is available', 'success');
        } else {
            log('⚠ No main function found (this may be OK)', 'error');
        }
        
        // Check memory
        if (wasmModule.HEAP8) {
            log(`  HEAP8 size: ${wasmModule.HEAP8.length} bytes`, 'info');
        }
        
        log('=== WASM Module Initialization Complete ===', 'success');
        updateStatus('Ready', 'ready');
        
        log('---', 'info');
        log('✨ Ready to process images!', 'success');
        log('📝 Instructions:', 'info');
        log('  1. Upload an HDR image file', 'info');
        log('  2. Click "Process Image" to test WASM processing', 'info');
        log('  3. Click "Decode HDR" to preview the image', 'info');
        log('  4. Check this log for detailed processing info', 'info');
        
    } catch (error) {
        log('=== WASM Module Initialization FAILED ===', 'error');
        log(`❌ Error: ${error.message}`, 'error');
        if (error.stack) {
            log(`Stack trace:`, 'error');
            error.stack.split('\n').forEach(line => log(`  ${line}`, 'error'));
        }
        updateStatus('Failed', 'error');
        
        // Provide helpful troubleshooting
        log('---', 'error');
        log('🔧 Troubleshooting Steps:', 'error');
        log('  1. Verify WASM files exist:', 'error');
        log('     ls -la ultrahdr_app.wasm ultrahdr_app.js', 'error');
        log('  2. Build the WASM module if missing:', 'error');
        log('     ./build-wasm.sh OR ./build-wasm-docker.sh', 'error');
        log('  3. Make sure you are using a web server:', 'error');
        log('     python3 -m http.server 8000', 'error');
        log('  4. Check browser console (F12) for errors', 'error');
        log('  5. Try a different browser (Chrome/Firefox recommended)', 'error');
    }
}

// Start initialization when DOM is ready
log('🚀 Starting WASM initialization...', 'info');
initWasm();

