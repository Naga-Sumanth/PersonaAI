// PersonaAI Frontend Logic

// Robust Markdown Parser with Marked.js and Offline-Safe regex fallback
function parseMarkdown(text) {
    if (!text) return '';
    
    // 1. Try external Marked.js library if loaded
    if (typeof marked !== 'undefined') {
        try {
            if (typeof marked.parse === 'function') {
                return marked.parse(text);
            } else if (typeof marked === 'function') {
                return marked(text);
            }
        } catch (e) {
            console.error("Marked.js parse error:", e);
        }
    }
    
    // 2. High-fidelity Pure JS fallback parser (if CDN fails or offline)
    let html = text;
    
    // Escape simple HTML characters first to prevent injection
    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // Headers (h3, h2, h1)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">$1</code>');
    
    // Lists (unordered lists)
    let lines = html.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith('* ') || line.startsWith('- ')) {
            let content = line.substring(2);
            if (!inList) {
                lines[i] = '<ul><li>' + content + '</li>';
                inList = true;
            } else {
                lines[i] = '<li>' + content + '</li>';
            }
        } else {
            if (inList) {
                lines[i-1] = lines[i-1] + '</ul>';
                inList = false;
            }
        }
    }
    if (inList) {
        lines[lines.length - 1] = lines[lines.length - 1] + '</ul>';
    }
    html = lines.join('\n');
    
    // Newlines to breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// Toast Notification Helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:none;border:none;color:#fff;cursor:pointer;margin-left:auto;" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Custom Glassmorphic Modal Dialog Prompts (Creative confirm replacement)
function showCustomConfirm(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    overlay.innerHTML = `
        <div class="custom-modal-card glass-panel card-spotlight">
            <div class="custom-modal-icon">
                <i data-lucide="help-circle" style="color: var(--warning); width: 44px; height: 44px;"></i>
            </div>
            <div class="custom-modal-body">
                <h3>Confirm Action</h3>
                <p>${message}</p>
            </div>
            <div class="custom-modal-footer">
                <button class="btn btn-secondary cancel-btn" style="border-radius: 30px;">Cancel</button>
                <button class="btn btn-primary confirm-btn btn-spotlight" style="border-radius: 30px;">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Bind spotlight cursor trackers
    initButtonSpotlight();
    
    const cancelBtn = overlay.querySelector('.cancel-btn');
    const confirmBtn = overlay.querySelector('.confirm-btn');
    
    cancelBtn.addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 250);
    });
    
    confirmBtn.addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 250);
        callback();
    });
}

// Custom Glassmorphic Alert Modal Dialog (Creative alert replacement)
function showCustomAlert(title, message, filename = '') {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    let footerButtonsHtml = `<button class="btn btn-primary close-btn btn-spotlight" style="min-width: 120px; border-radius: 30px;">Close</button>`;
    if (filename) {
        footerButtonsHtml = `
            <button class="btn btn-secondary new-tab-btn" style="border-radius: 30px; display: flex; align-items: center; gap: 6px;"><i data-lucide="external-link" style="width:16px;height:16px;"></i> Open in New Tab</button>
            <button class="btn btn-primary close-btn btn-spotlight" style="min-width: 120px; border-radius: 30px;">Close</button>
        `;
    }

    overlay.innerHTML = `
        <div class="custom-modal-card glass-panel card-spotlight" style="max-width: 600px; width: 90vw; padding: 2rem;">
            <div class="custom-modal-icon" style="margin-bottom: 1rem;">
                <i data-lucide="info" style="color: var(--primary); width: 44px; height: 44px;"></i>
            </div>
            <div class="custom-modal-body" style="text-align: left; max-height: 350px; overflow-y: auto; padding: 0 0.5rem; width: 100%; box-sizing: border-box;">
                <h3 style="text-align: center; margin-bottom: 1rem; margin-top: 0; color: var(--text-primary); font-size: 1.4rem; font-weight: 800;">${title}</h3>
                <pre style="white-space: pre-wrap; font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); margin: 0;">${message}</pre>
            </div>
            <div class="custom-modal-footer" style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.8rem; width: 100%; padding: 0; box-sizing: border-box;">
                ${footerButtonsHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Bind spotlight cursor trackers
    initButtonSpotlight();
    
    const closeBtn = overlay.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 250);
    });

    if (filename) {
        const newTabBtn = overlay.querySelector('.new-tab-btn');
        newTabBtn.addEventListener('click', () => {
            const newWin = window.open('', '_blank');
            if (newWin) {
                const currentTheme = localStorage.getItem('theme') || 'dark';
                const bg = currentTheme === 'light' ? '#f8fafc' : '#09090b';
                const text = currentTheme === 'light' ? '#0f172a' : '#f4f4f5';
                const escFilename = filename.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const escMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                newWin.document.write(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <title>Preview: ${escFilename}</title>
                            <style>
                                body {
                                    background: ${bg};
                                    color: ${text};
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                    padding: 3rem;
                                    margin: 0;
                                    line-height: 1.7;
                                }
                                pre {
                                    white-space: pre-wrap;
                                    word-wrap: break-word;
                                    font-size: 1rem;
                                    background: rgba(255,255,255,0.02);
                                    padding: 1.5rem;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255,255,255,0.05);
                                }
                                [data-theme="light"] pre {
                                    background: rgba(0,0,0,0.02);
                                    border: 1px solid rgba(0,0,0,0.05);
                                }
                            </style>
                        </head>
                        <body>
                            <h2 style="margin-top:0;font-size:1.8rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;margin-bottom:20px;">${escFilename}</h2>
                            <pre>${escMessage}</pre>
                        </body>
                    </html>
                `);
                newWin.document.close();
            }
        });
    }
}

// Global App Settings / Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    syncThemeToggleIcons(savedTheme);
    
    const themeSelector = document.getElementById('theme');
    if (themeSelector) {
        themeSelector.value = savedTheme;
        themeSelector.addEventListener('change', (e) => {
            toggleTheme(e.target.value);
        });
    }

    const navToggle = document.getElementById('nav-theme-toggle');
    if (navToggle) {
        // Remove existing listener if any and add a clean one
        const newToggle = navToggle.cloneNode(true);
        navToggle.parentNode.replaceChild(newToggle, navToggle);
        
        newToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);
            syncThemeToggleIcons(nextTheme);
            
            if (themeSelector) {
                themeSelector.value = nextTheme;
                syncCustomDropdown(themeSelector);
            }
            window.dispatchEvent(new Event('themeChanged'));
        });
    }
}

function syncThemeToggleIcons(theme) {
    const sunIcon = document.querySelector('#nav-theme-toggle .sun-icon');
    const moonIcon = document.querySelector('#nav-theme-toggle .moon-icon');
    if (sunIcon && moonIcon) {
        if (theme === 'light') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

function toggleTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    syncThemeToggleIcons(themeName);
    window.dispatchEvent(new Event('themeChanged'));
}

// Active Nav Link highlight
function highlightActiveNav() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === page || (page === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// API Calls Utility
const API_BASE = '/api'; // Handled via FastAPI prefix

async function apiRequest(endpoint, options = {}, silent = false) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const err = new Error(errData.detail || `HTTP error ${response.status}`);
            err.status = response.status;
            throw err;
        }
        return await response.json();
    } catch (err) {
        if (!silent) {
            showToast(err.message, 'error');
        }
        throw err;
    }
}

// --- FILE UPLOADER SYSTEM ---
function initUploader() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.background = 'rgba(139, 92, 246, 0.05)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--glass-border)';
        dropzone.style.background = 'transparent';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--glass-border)';
        dropzone.style.background = 'transparent';
        const files = e.dataTransfer.files;
        if (files.length) handleFileUpload(files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileUpload(fileInput.files[0]);
    });

    fetchUploadedFiles();
}

async function handleFileUpload(file) {
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '20%';

    const formData = new FormData();
    formData.append('file', file);

    if (progressBar) progressBar.style.width = '50%';

    try {
        const result = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (progressBar) progressBar.style.width = '100%';
        
        if (!result.ok) {
            const errData = await result.json().catch(() => ({}));
            throw new Error(errData.detail || 'Upload failed');
        }
        
        showToast(`Successfully uploaded and parsed ${file.name}!`, 'success');
        fetchUploadedFiles();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';
        }, 1500);
    }
}

let filePreviewsMap = {};

async function fetchUploadedFiles() {
    const listContainer = document.getElementById('uploaded-files-list');
    if (!listContainer) return;
    
    try {
        const data = await apiRequest('/profile');
        listContainer.innerHTML = '';
        filePreviewsMap = {}; // Clear cache
        
        if (!data.files || data.files.length === 0) {
            listContainer.innerHTML = '<div style="color: var(--text-secondary); padding: 1.5rem; text-align: center;">No documents uploaded yet. Upload a PDF/DOCX to build your twin.</div>';
            // Disable page scroll and reset viewport position when no files are uploaded
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
            window.scrollTo({ top: 0, behavior: 'instant' });
            return;
        }

        // Enable scrolling dynamically when files are present
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
        document.body.style.height = 'auto';

        data.files.forEach(file => {
            // Cache preview content by filename
            filePreviewsMap[file.filename] = file.preview;

            const item = document.createElement('div');
            item.className = 'file-item glass-panel';
            item.innerHTML = `
                <div class="file-info">
                    <i data-lucide="file-text" style="color: var(--secondary); width: 24px; height: 24px;"></i>
                    <div style="text-align: left;">
                        <div style="font-weight: 600;">${file.filename}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;" onclick="previewFileContent('${escapeJSString(file.filename)}')"><i data-lucide="eye" style="width:14px;height:14px;"></i> Preview</button>
                    <button class="btn-delete" onclick="deleteFile('${escapeJSString(file.filename)}')" style="display: flex; align-items: center; padding: 4px;"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>
                </div>
            `;
            listContainer.appendChild(item);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        showToast("Error retrieving profile files list", "error");
    }
}

function escapeJSString(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function previewFileContent(filename) {
    const previewText = filePreviewsMap[filename] || '';
    showCustomAlert(`Document Preview: ${filename}`, previewText, filename);
}

function deleteFile(filename) {
    showCustomConfirm(`Are you sure you want to delete "${filename}"?`, async () => {
        try {
            await apiRequest(`/upload/${filename}`, { method: 'DELETE' });
            showToast(`Successfully deleted ${filename}`, 'success');
            fetchUploadedFiles();
        } catch (err) {
            console.error(err);
        }
    });
}

// --- CHAT SYSTEM ---
let chatMessagesList = [];

function initChat() {
    const chatForm = document.getElementById('chat-form');
    if (!chatForm) return;

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        appendMessage('user', text);
        
        // Add typing animation
        const typingEl = appendMessage('assistant', '<div class="spinner"></div> Generating response...');
        
        try {
            const data = await apiRequest('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: chatMessagesList
                })
            });
            
            typingEl.remove();
            appendMessage('assistant', data.response);
            
            // Track local session history
            chatMessagesList.push({ role: 'user', content: text });
            chatMessagesList.push({ role: 'assistant', content: data.response });
        } catch (err) {
            typingEl.remove();
            appendMessage('assistant', "Failed to connect to the digital twin assistant.");
        }
    });

    // Clear chat handler
    const clearBtn = document.getElementById('clear-chat-btn');
    const headerClearBtn = document.getElementById('header-clear-btn');
    const performClear = () => {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `
                <div class="message assistant">
                    Hello! I am your AI-powered Digital Twin. Ask me anything about my background, skills, certifications, and technical projects.
                </div>
            `;
        }
        chatMessagesList = [];
        showToast("Chat context cleared.", "info");
    };
    if (clearBtn) clearBtn.addEventListener('click', performClear);
    if (headerClearBtn) headerClearBtn.addEventListener('click', performClear);

    // Download chat handler
    const downloadBtn = document.getElementById('download-chat-btn');
    const headerDownloadBtn = document.getElementById('header-download-btn');
    const performDownload = () => {
        if (chatMessagesList.length === 0) {
            showToast("No chat history to download.", "warning");
            return;
        }
        let transcript = "PersonaAI Chat Transcript\n=========================\n\n";
        chatMessagesList.forEach(m => {
            transcript += `${m.role.toUpperCase()}: ${m.content}\n\n`;
        });
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `twin_chat_history.txt`;
        a.click();
    };
    if (downloadBtn) downloadBtn.addEventListener('click', performDownload);
    if (headerDownloadBtn) headerDownloadBtn.addEventListener('click', performDownload);
}

function appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    
    msg.innerHTML = parseMarkdown(text);
    
    // Add copy button for assistant replies
    if (role === 'assistant' && !text.includes('spinner')) {
        const copyBtn = document.createElement('button');
        copyBtn.style = "background:none;border:none;color:var(--text-secondary);font-size:0.8rem;cursor:pointer;display:block;margin-top:0.5rem;text-align:right;";
        copyBtn.innerText = "Copy Response";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            showToast("Copied to clipboard!", "success");
        };
        msg.appendChild(copyBtn);
    }

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
}

// --- INTERVIEW SIMULATOR ---
let activeInterviewSessionId = null;

function initInterview() {
    const startBtn = document.getElementById('start-interview-btn');
    if (!startBtn) return;

    // Initially lock body scroll since we are in setup-view
    document.body.style.overflowY = 'hidden';

    const options = document.querySelectorAll('.category-option');
    let selectedCategory = null;

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedCategory = opt.dataset.category;
        });
    });

    startBtn.addEventListener('click', async () => {
        if (!selectedCategory) {
            showToast("Please select an interview category card first.", "warning");
            return;
        }
        activeInterviewSessionId = "session_" + Math.random().toString(36).substring(7);
        const setupDiv = document.getElementById('setup-view');
        const activeDiv = document.getElementById('active-view');
        const qContainer = document.getElementById('interview-question');
        
        setupDiv.style.display = 'none';
        activeDiv.style.display = 'block';
        
        // Enable scrolling dynamically now that we are in the active simulator session
        document.body.style.overflowY = 'auto';
        
        qContainer.innerHTML = '<span class="spinner"></span> Generating your first question...';

        try {
            const data = await apiRequest('/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: selectedCategory,
                    session_id: activeInterviewSessionId
                })
            });
            qContainer.innerText = data.question;
        } catch (err) {
            setupDiv.style.display = 'block';
            activeDiv.style.display = 'none';
            document.body.style.overflowY = 'hidden';
        }
    });

    const submitBtn = document.getElementById('submit-answer-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const ansArea = document.getElementById('interview-answer');
            const answer = ansArea.value.trim();
            if (!answer) {
                showToast("Please write down your answer first.", "warning");
                return;
            }

            const qContainer = document.getElementById('interview-question');
            const feedbackContainer = document.getElementById('interview-feedback');
            const nextQuestionBtn = document.getElementById('next-question-btn');
            
            submitBtn.disabled = true;
            submitBtn.innerText = "Evaluating...";
            feedbackContainer.innerHTML = '<span class="spinner"></span> Grading your response...';

            try {
                const data = await apiRequest('/interview/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: activeInterviewSessionId,
                        category: selectedCategory,
                        answer: answer
                    })
                });

                // Display score & feedback
                const evalData = data.evaluation;
                feedbackContainer.innerHTML = `
                    <div class="feedback-card">
                        <div style="font-weight:700; font-size:1.1rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <span>Feedback</span>
                            <span style="background:rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 8px; color: var(--primary);">Score: ${evalData.score}/100</span>
                        </div>
                        <p style="margin-bottom:0.8rem; line-height: 1.5;">${evalData.feedback}</p>
                        <div style="font-weight:600; font-size: 0.95rem;">Key Suggestions:</div>
                        <ul class="suggestions-list">
                            ${evalData.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                `;

                submitBtn.style.display = 'none';

                if (data.completed) {
                    showToast("Interview Simulator Finished! Great work.", "success");
                    nextQuestionBtn.innerText = "Back to Setup";
                    nextQuestionBtn.dataset.action = "reset";
                } else {
                    nextQuestionBtn.innerText = "Next Question";
                    nextQuestionBtn.dataset.action = "next";
                    nextQuestionBtn.dataset.nextQ = data.next_question;
                }
                nextQuestionBtn.style.display = 'inline-block';
            } catch (err) {
                submitBtn.style.display = 'inline-block';
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Answer";
            }
        });
    }

    const nextBtn = document.getElementById('next-question-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const action = nextBtn.dataset.action;
            const qContainer = document.getElementById('interview-question');
            const ansArea = document.getElementById('interview-answer');
            const feedbackContainer = document.getElementById('interview-feedback');
            const submitBtn = document.getElementById('submit-answer-btn');

            if (action === 'reset') {
                window.scrollTo(0, 0);
                document.getElementById('setup-view').style.display = 'block';
                document.getElementById('active-view').style.display = 'none';
                
                // Disable scrolling again now that we are back to setup-view
                document.body.style.overflowY = 'hidden';
                
                nextBtn.style.display = 'none';
                ansArea.value = '';
                feedbackContainer.innerHTML = '';
                submitBtn.style.display = 'inline-block';
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Answer";
            } else {
                qContainer.innerText = nextBtn.dataset.nextQ;
                ansArea.value = '';
                feedbackContainer.innerHTML = '';
                submitBtn.style.display = 'inline-block';
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Answer";
                nextBtn.style.display = 'none';
            }
        });
    }

    // Exit active simulation session (Back Button)
    const cancelBtn = document.getElementById('cancel-session-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            showCustomConfirm("Are you sure you want to exit this interview simulation session? Your progress will be lost.", () => {
                window.scrollTo(0, 0);
                document.getElementById('setup-view').style.display = 'block';
                document.getElementById('active-view').style.display = 'none';
                document.body.style.overflowY = 'hidden';
                
                // Clear active states
                document.getElementById('interview-answer').value = '';
                document.getElementById('interview-feedback').innerHTML = '';
                
                const submitBtn = document.getElementById('submit-answer-btn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Submit Answer";
                }
                
                const nextBtn = document.getElementById('next-question-btn');
                if (nextBtn) nextBtn.style.display = 'none';
                
                showToast("Interview session cancelled.", "info");
            });
        });
    }
}

// --- PROFILE INSIGHTS & UTILITIES ---
function adjustPageOverflow() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (!activeTabBtn) return;

    const tabId = activeTabBtn.dataset.tab;
    let hasContent = false;

    if (tabId === 'tab-summary') {
        hasContent = document.querySelector('.insights-grid') !== null;
    } else if (tabId === 'tab-explainer') {
        const output = document.getElementById('project-explanation-output');
        hasContent = output && output.innerHTML.trim() !== '';
    } else if (tabId === 'tab-career') {
        const output = document.getElementById('career-output');
        hasContent = output && output.innerHTML.trim() !== '';
    } else if (tabId === 'tab-branding') {
        const output = document.getElementById('branding-output');
        hasContent = output && output.innerHTML.trim() !== '';
    }

    // If active tab has no generated output, or if viewport fits, lock scrollbar
    if (!hasContent || (window.innerHeight >= document.documentElement.scrollHeight)) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
}

window.addEventListener('resize', adjustPageOverflow);

function initResumeInsights() {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabs.length === 0) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            tab.classList.add('active');
            const contentId = tab.dataset.tab;
            const targetContent = document.getElementById(contentId);
            if (targetContent) targetContent.classList.add('active');
            
            // Reset tab active views back to setup screens on tab switch
            if (window.exitExplainerActiveView) window.exitExplainerActiveView();
            if (window.exitCareerActiveView) window.exitCareerActiveView();
            if (window.exitBrandingActiveView) window.exitBrandingActiveView();

            // Adjust scrollbars dynamically based on new tab content height
            setTimeout(adjustPageOverflow, 50);
        });
    });

    // Populate Resume summary on page load
    fetchResumeSummary();
    
    window.exitExplainerActiveView = function() {
        const setup = document.getElementById('explainer-setup-view');
        const active = document.getElementById('explainer-active-view');
        if (setup && active) {
            setup.style.display = 'block';
            active.style.display = 'none';
            adjustPageOverflow();
        }
    };

    window.exitCareerActiveView = function() {
        const setup = document.getElementById('career-setup-view');
        const active = document.getElementById('career-active-view');
        if (setup && active) {
            setup.style.display = 'block';
            active.style.display = 'none';
            adjustPageOverflow();
        }
    };

    window.exitBrandingActiveView = function() {
        const setup = document.getElementById('branding-setup-view');
        const active = document.getElementById('branding-active-view');
        if (setup && active) {
            setup.style.display = 'block';
            active.style.display = 'none';
            adjustPageOverflow();
        }
    };

    // Markdown Helper inside script (in case you want to use it, or fallback to parseMarkdown)
    window.renderMarkdownToHtml = function(md) {
        return parseMarkdown(md);
    };

    window.toggleInterviewMode = function(btn) {
        const container = document.getElementById('interview-focus-container');
        if (!container) return;
        if (container.style.display === 'none') {
            container.style.display = 'flex';
            btn.innerText = "Exit Interview Focus Mode";
            btn.className = "btn btn-primary";
        } else {
            container.style.display = 'none';
            btn.innerText = "Enter Interview Focus Mode";
            btn.className = "btn btn-secondary";
        }
        adjustPageOverflow();
    };

    window.exportProjectToPDF = function() {
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('project-explanation-output').cloneNode(true);
        content.querySelectorAll('button, .no-print').forEach(el => el.remove());
        content.querySelectorAll('details').forEach(details => details.open = true);

        const theme = localStorage.getItem('theme') || 'dark';
        const bg = theme === 'light' ? '#ffffff' : '#09090b';
        const text = theme === 'light' ? '#0f172a' : '#f4f4f5';
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Project Details: Explainer</title>
                    <style>
                        body {
                            background: ${bg};
                            color: ${text};
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            padding: 2rem;
                            line-height: 1.6;
                        }
                        h2, h3, h4 {
                            color: #8b5cf6;
                        }
                        .details-section {
                            border-bottom: 1px solid rgba(139, 92, 246, 0.2);
                            padding-bottom: 1rem;
                            margin-bottom: 1rem;
                        }
                        summary {
                            font-weight: 700;
                            font-size: 1.2rem;
                            cursor: pointer;
                            outline: none;
                        }
                        pre, code {
                            font-family: monospace;
                            background: rgba(255,255,255,0.05);
                            padding: 2px 6px;
                            border-radius: 4px;
                        }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    window.copyEntireProjectExplanation = function() {
        const content = document.getElementById('project-explanation-output');
        if (!content) return;
        const tempEl = content.cloneNode(true);
        tempEl.querySelectorAll('button, .no-print').forEach(el => el.remove());
        const text = tempEl.innerText.trim();
        navigator.clipboard.writeText(text);
        showToast("Copied complete project analysis to clipboard!", "success");
    };

    window.selectSuggestedProject = function(name) {
        const selectEl = document.getElementById('project-select');
        if (selectEl) {
            selectEl.value = name;
            syncCustomDropdown(selectEl);
            const explainBtn = document.getElementById('explain-project-btn');
            if (explainBtn) explainBtn.click();
        }
    };

    function escapeJSString(str) {
        if (!str) return '';
        return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    // Project Explainer listener
    const explainBtn = document.getElementById('explain-project-btn');
    if (explainBtn) {
        explainBtn.addEventListener('click', async () => {
            const selectEl = document.getElementById('project-select');
            const projName = selectEl.value;
            if (!projName) {
                showToast("Please select a project first.", "warning");
                return;
            }
            const outputEl = document.getElementById('project-explanation-output');
            
            // Toggle active/setup views
            const setup = document.getElementById('explainer-setup-view');
            const active = document.getElementById('explainer-active-view');
            if (setup && active) {
                setup.style.display = 'none';
                active.style.display = 'block';
            }
            
            const loadingMessages = [
                "Analyzing project description in profile context...",
                "Extracting technical objectives and business problem...",
                "Reconstructing application architecture and workflows...",
                "Mapping the frontend, backend, database, and integrations...",
                "Synthesizing challenge-solution pairs and STAR patterns...",
                "Generating interviewer questions and follow-ups...",
                "Finalizing dashboard view..."
            ];

            outputEl.innerHTML = `
                <div style="text-align: center; padding: 2rem;" class="glass-panel">
                    <span class="spinner" style="display: block; margin: 0 auto 1rem;"></span>
                    <span id="explainer-loading-span" style="color: var(--text-secondary); font-size: 0.95rem;">${loadingMessages[0]}</span>
                </div>
            `;
            
            let loadingIdx = 0;
            const intervalId = setInterval(() => {
                loadingIdx = (loadingIdx + 1) % loadingMessages.length;
                const span = document.getElementById('explainer-loading-span');
                if (span) span.innerText = loadingMessages[loadingIdx];
            }, 1800);

            try {
                const data = await apiRequest('/project-explainer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ project_name: projName })
                });
                
                clearInterval(intervalId);

                if (!data.found) {
                    let suggestionsHtml = "";
                    if (data.suggested_projects && data.suggested_projects.length > 0) {
                        suggestionsHtml = `
                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                                ${data.suggested_projects.map(p => `
                                    <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 20px;" onclick="selectSuggestedProject('${escapeJSString(p)}')">
                                        ${p}
                                    </button>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        suggestionsHtml = `<p style="color: var(--text-secondary); font-style: italic;">No alternative projects found in profile context.</p>`;
                    }
                    
                    outputEl.innerHTML = `
                        <div class="glass-panel" style="padding: 2rem; text-align: center; border: 1px dashed var(--danger);">
                            <i data-lucide="alert-octagon" style="width: 44px; height: 44px; color: var(--danger); margin-bottom: 1rem;"></i>
                            <h3 style="margin-bottom: 0.5rem;">Project Not Found</h3>
                            <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">We couldn't locate any records for "${projName}" in your uploaded documents.</p>
                            <div style="font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">Did you mean one of these?</div>
                            ${suggestionsHtml}
                        </div>
                    `;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                    adjustPageOverflow();
                    return;
                }

                // Render found project sections under a single premium unified card
                const sectionIcons = {
                    "Project Overview": "info",
                    "Business Problem": "alert-circle",
                    "Objective": "target",
                    "Architecture": "cpu",
                    "Workflow": "git-merge",
                    "Tech Stack": "layers",
                    "Challenges & Solutions": "zap",
                    "Scalability & Future Improvements": "trending-up",
                    "STAR Explanation": "star",
                    "Resume Explanation & Pitch": "user-check"
                };

                let sectionsHtml = `<div class="glass-panel card-spotlight" style="padding: 2.2rem; border-radius: 20px; text-align: left; display: flex; flex-direction: column; gap: 1.8rem;">`;
                const entries = Object.entries(data.sections);
                entries.forEach(([title, content], index) => {
                    const iconName = sectionIcons[title] || "file-text";
                    const isLast = index === entries.length - 1;
                    const borderStyle = isLast ? "" : "border-bottom: 1px solid var(--glass-border); padding-bottom: 1.8rem;";
                    sectionsHtml += `
                        <div style="${borderStyle}">
                            <h3 style="font-weight: 800; font-size: 1.15rem; color: var(--primary); display: flex; align-items: center; gap: 8px; margin-bottom: 0.8rem;">
                                <i data-lucide="${iconName}" style="width: 20px; height: 20px; color: var(--primary);"></i>
                                <span>${title}</span>
                            </h3>
                            <div style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; padding-left: 28px;">
                                ${parseMarkdown(content)}
                            </div>
                        </div>
                    `;
                });
                sectionsHtml += `</div>`;

                // Render Q&A blocks for Interview Mode
                const iq = data.interview_questions || [];
                const cq = data.cross_questions || [];
                
                let interviewQAsHtml = "";
                if (iq.length > 0 || cq.length > 0) {
                    const allQs = [
                        ...iq.map(q => ({ ...q, type: "Core Interview Question", color: "var(--primary)" })),
                        ...cq.map(q => ({ ...q, type: "Cross / Challenge Question", color: "var(--secondary)" }))
                    ];
                    
                    interviewQAsHtml = allQs.map((q, idx) => `
                        <div class="glass-panel card-spotlight" style="padding: 1.2rem; text-align: left; margin-bottom: 1rem;">
                            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; color: ${q.color}; margin-bottom: 0.4rem;">
                                ${q.type}
                            </div>
                            <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.6rem; display: flex; align-items: flex-start; gap: 8px;">
                                <i data-lucide="help-circle" style="color: ${q.color}; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;"></i>
                                <span>${q.question}</span>
                            </div>
                            <button class="btn btn-secondary" onclick="this.nextElementSibling.style.display = 'block'; this.style.display = 'none';" style="padding: 0.35rem 0.8rem; font-size: 0.8rem; border-radius: 12px; margin-top: 0.2rem;">
                                Reveal Expected Response
                            </button>
                            <div style="display: none; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem;">
                                <strong style="color: var(--text-primary);">Suggested Answer Guidance:</strong><br>${parseMarkdown(q.expected_answer)}
                            </div>
                        </div>
                    `).join('');
                } else {
                    interviewQAsHtml = `<div style="color: var(--text-secondary); font-style: italic;">No interview questions generated for this project.</div>`;
                }

                outputEl.innerHTML = `
                    <div style="display: flex; gap: 0.8rem; margin-bottom: 1.5rem; justify-content: flex-end;" class="no-print">
                        <button class="btn btn-secondary" onclick="copyEntireProjectExplanation()" style="padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;">
                            <i data-lucide="copy" style="width:14px;height:14px;"></i> Copy Analysis
                        </button>
                        <button class="btn btn-secondary" onclick="exportProjectToPDF()" style="padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;">
                            <i data-lucide="file-text" style="width:14px;height:14px;"></i> Export to PDF
                        </button>
                    </div>
                    
                    <div class="collapsible-sections-container">
                        ${sectionsHtml}
                    </div>

                    <div class="no-print" style="margin-top: 1.5rem; border-top: 1px dashed var(--glass-border); padding-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.6rem;">
                            <h3 style="margin: 0; color: var(--text-primary); font-weight: 800; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="brain-circuit" style="color: var(--secondary); width: 22px; height: 22px;"></i> Interview Simulation Mode
                            </h3>
                            <button class="btn btn-secondary" onclick="toggleInterviewMode(this)" style="padding: 0.4rem 1rem; font-size: 0.85rem; border-radius: 20px;">
                                Enter Interview Focus Mode
                            </button>
                        </div>
                        
                        <div id="interview-focus-container" style="display: none; flex-direction: column; gap: 1rem;">
                            ${interviewQAsHtml}
                        </div>
                    </div>
                `;

                if (typeof lucide !== 'undefined') lucide.createIcons();
                initButtonSpotlight();
                adjustPageOverflow();
            } catch (err) {
                clearInterval(intervalId);
                outputEl.innerHTML = `
                    <div class="glass-panel" style="padding: 2rem; text-align: center; border: 1px dashed var(--danger);">
                        <i data-lucide="alert-triangle" style="width: 44px; height: 44px; color: var(--danger); margin-bottom: 1rem;"></i>
                        <h3 style="margin-bottom: 0.5rem;">Failed to Generate Insights</h3>
                        <p style="color: var(--text-secondary); max-width: 450px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.5;">${err.message || 'An error occurred while communicating with the AI service.'}</p>
                        <div style="display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap;">
                            <button onclick="document.getElementById('explain-project-btn').click()" class="btn btn-primary btn-spotlight" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 30px;"><i data-lucide="refresh-cw" style="width:16px;height:16px;"></i> Retry Analysis</button>
                            <a href="/settings.html" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 30px;"><i data-lucide="settings" style="width:16px;height:16px;"></i> Check API Settings</a>
                        </div>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                initButtonSpotlight();
                adjustPageOverflow();
            }
        });
    }

    // Career Advisor listener
    const careerBtn = document.getElementById('generate-career-btn');
    if (careerBtn) {
        careerBtn.addEventListener('click', async () => {
            const outputEl = document.getElementById('career-output');
            
            // Toggle active/setup views
            const setup = document.getElementById('career-setup-view');
            const active = document.getElementById('career-active-view');
            if (setup && active) {
                setup.style.display = 'none';
                active.style.display = 'block';
            }
            
            outputEl.innerHTML = '<span class="spinner"></span> Designing career roadmap...';
            try {
                const data = await apiRequest('/career-advice', { method: 'POST' });
                outputEl.innerHTML = `<div style="line-height: 1.6; padding: 1.5rem;" class="glass-panel">${parseMarkdown(data.advice)}</div>`;
                adjustPageOverflow();
            } catch (err) {
                outputEl.innerHTML = 'Error fetching career recommendations.';
                adjustPageOverflow();
            }
        });
    }

    // Branding / Achievement Generator
    const brandingOptions = document.querySelectorAll('.brand-opt');
    let selectedPlatform = 'LinkedIn Summary';
    brandingOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            brandingOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedPlatform = opt.dataset.platform;
        });
    });

    const generateBrandingBtn = document.getElementById('generate-branding-btn');
    if (generateBrandingBtn) {
        generateBrandingBtn.addEventListener('click', async () => {
            const outputEl = document.getElementById('branding-output');
            
            // Toggle active/setup views
            const setup = document.getElementById('branding-setup-view');
            const active = document.getElementById('branding-active-view');
            if (setup && active) {
                setup.style.display = 'none';
                active.style.display = 'block';
            }
            
            outputEl.innerHTML = '<span class="spinner"></span> Refining your professional introduction...';
            try {
                const data = await apiRequest('/achievement', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platform: selectedPlatform })
                });
                outputEl.innerHTML = `
                    <div style="line-height: 1.6; padding: 1.5rem; position: relative;" class="glass-panel">
                        <button class="btn btn-secondary" style="position: absolute; top: 10px; right: 10px; padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="copyBrandingText(this)">Copy</button>
                        <div class="branding-content-text">${parseMarkdown(data.generated_text)}</div>
                    </div>
                `;
                adjustPageOverflow();
            } catch (err) {
                outputEl.innerHTML = 'Error generating branding summary.';
                adjustPageOverflow();
            }
        });
    }
}

window.copyCardText = function(btn) {
    const card = btn.closest('.card-spotlight');
    if (!card) return;
    const contentEl = card.querySelector('.card-content-copyable') || card;
    const tempEl = contentEl.cloneNode(true);
    tempEl.querySelectorAll('button').forEach(b => b.remove());
    const textToCopy = tempEl.innerText.trim();
    navigator.clipboard.writeText(textToCopy);
    showToast("Copied card details to clipboard!", "success");
};

function copyBrandingText(btn) {
    const parent = btn.parentElement;
    const txt = parent.querySelector('.branding-content-text').innerText;
    navigator.clipboard.writeText(txt);
    showToast("Copied to clipboard!", "success");
}

async function fetchResumeSummary() {
    const container = document.getElementById('summary-insights-container');
    const projectSelect = document.getElementById('project-select');
    const tabsSelector = document.querySelector('.profile-tabs');
    if (!container) return;

    // Render beautiful skeleton cards with pulse animation
    container.innerHTML = `
        <style>
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
            }
            .skeleton-line {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 4px;
                margin-bottom: 0.8rem;
                animation: pulse 1.5s infinite ease-in-out;
            }
        </style>
        <div class="insights-grid">
            <div class="insight-card card-spotlight" style="min-height: 220px;">
                <div class="skeleton-line" style="width: 45%; height: 22px;"></div>
                <div class="skeleton-line" style="width: 85%; height: 14px; margin-top: 1.5rem;"></div>
                <div class="skeleton-line" style="width: 70%; height: 14px;"></div>
                <div class="skeleton-line" style="width: 90%; height: 14px;"></div>
            </div>
            <div class="insight-card card-spotlight" style="min-height: 220px;">
                <div class="skeleton-line" style="width: 55%; height: 22px;"></div>
                <div class="skeleton-line" style="width: 80%; height: 14px; margin-top: 1.5rem;"></div>
                <div class="skeleton-line" style="width: 75%; height: 14px;"></div>
                <div class="skeleton-line" style="width: 60%; height: 14px;"></div>
            </div>
            <div class="insight-card card-spotlight" style="min-height: 220px;">
                <div class="skeleton-line" style="width: 40%; height: 22px;"></div>
                <div class="skeleton-line" style="width: 90%; height: 14px; margin-top: 1.5rem;"></div>
                <div class="skeleton-line" style="width: 85%; height: 14px;"></div>
                <div class="skeleton-line" style="width: 75%; height: 14px;"></div>
            </div>
            <div class="insight-card card-spotlight" style="min-height: 220px;">
                <div class="skeleton-line" style="width: 50%; height: 22px;"></div>
                <div class="skeleton-line" style="width: 70%; height: 14px; margin-top: 1.5rem;"></div>
                <div class="skeleton-line" style="width: 80%; height: 14px;"></div>
                <div class="skeleton-line" style="width: 65%; height: 14px;"></div>
            </div>
        </div>
        <div class="experience-card card-spotlight" style="margin-top: 2rem; min-height: 120px;">
            <div class="skeleton-line" style="width: 30%; height: 22px;"></div>
            <div class="skeleton-line" style="width: 95%; height: 14px; margin-top: 1.5rem;"></div>
            <div class="skeleton-line" style="width: 90%; height: 14px;"></div>
        </div>
    `;

    try {
        const data = await apiRequest('/resume-summary', { method: 'POST' }, true);
        if (tabsSelector) tabsSelector.style.display = 'flex';
        
        // Render Categorized Skills
        let skillsHtml = "";
        if (data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)) {
            const categories = {
                programming_languages: { label: "Programming Languages" },
                frameworks: { label: "Frameworks & Libraries" },
                tools: { label: "Tools & Technologies" },
                soft_skills: { label: "Soft Skills" },
                databases: { label: "Databases" },
                web_technologies: { label: "Web Technologies" }
            };
            for (const [key, config] of Object.entries(categories)) {
                const list = data.skills[key] || [];
                if (list.length > 0) {
                    skillsHtml += `
                        <div style="margin-bottom: 1rem; text-align: left;">
                            <h4 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin-bottom: 0.4rem; font-weight: 700;">
                                ${config.label}
                            </h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                                ${list.map(s => `<span style="background:rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">${s}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }
            }
            // Fallback for any other dynamically generated keys in skills object
            for (const [key, list] of Object.entries(data.skills)) {
                if (!categories[key] && Array.isArray(list) && list.length > 0) {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    skillsHtml += `
                        <div style="margin-bottom: 1rem; text-align: left;">
                            <h4 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin-bottom: 0.4rem; font-weight: 700;">
                                ${label}
                            </h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                                ${list.map(s => `<span style="background:rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">${s}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }
            }
        } else if (Array.isArray(data.skills)) {
            skillsHtml = `
                <div style="display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.5rem; text-align: left;">
                    ${data.skills.map(s => `<span style="background:rgba(139, 92, 246, 0.15); border: 1px solid var(--primary); padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; color: var(--text-primary);">${s}</span>`).join('')}
                </div>
            `;
        }
        if (!skillsHtml) {
            skillsHtml = '<div style="color: var(--text-secondary); font-style: italic; text-align: left;">No skills identified.</div>';
        }
        
        // Render Projects
        const projects = data.projects || [];
        let projectsHtml = projects.length > 0 ? projects.map(p => `
            <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.8rem; text-align: left;">
                <h4 style="color: var(--primary); margin-bottom: 0.3rem; font-weight: 700;">${p.name}</h4>
                <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin: 0;">${p.description}</p>
            </div>
        `).join('') : '<div style="color: var(--text-secondary); font-style: italic; text-align: left;">No projects listed.</div>';

        // Populate dropdown for explainer and automatically rebuild custom dropdown
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">-- Choose a Project --</option>';
            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.innerText = p.name;
                projectSelect.appendChild(opt);
            });
            const customSelectContainer = projectSelect.nextElementSibling;
            if (customSelectContainer && customSelectContainer.classList.contains('custom-select-container')) {
                customSelectContainer.remove();
                projectSelect.dataset.customized = 'false';
            }
            initializeCustomDropdowns();
        }

        // Render Strengths & Weaknesses
        const strengths = data.strengths || [];
        const weaknesses = data.weaknesses || [];
        let strengthsHtml = strengths.length > 0 ? strengths.map(s => `<li style="text-align: left; line-height: 1.4; color: var(--text-primary);"><i data-lucide="check-circle-2" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;color:var(--success);display:inline-block;"></i> ${s}</li>`).join('') : '<li style="color: var(--text-secondary); font-style: italic; text-align: left;">None identified.</li>';
        let weaknessesHtml = weaknesses.length > 0 ? weaknesses.map(w => `<li style="text-align: left; line-height: 1.4; color: var(--text-primary);"><i data-lucide="alert-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;color:var(--warning);display:inline-block;"></i> ${w}</li>`).join('') : '<li style="color: var(--text-secondary); font-style: italic; text-align: left;">None identified.</li>';

        // Render Certifications
        const certifications = data.certifications || [];
        let certificationsHtml = certifications.length > 0 ? certifications.map(c => `
            <div style="margin-bottom: 0.8rem; text-align: left; display: flex; align-items: flex-start; gap: 8px;">
                <i data-lucide="award" style="color: var(--secondary); width: 16px; height: 16px; flex-shrink: 0; margin-top: 3px;"></i>
                <span style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.4;">${c}</span>
            </div>
        `).join('') : '<div style="color: var(--text-secondary); font-style: italic; text-align: left;">No certifications listed.</div>';

        // Render Education
        const education = data.education || [];
        let educationHtml = education.length > 0 ? education.map(e => `
            <div style="margin-bottom: 0.8rem; text-align: left; display: flex; align-items: flex-start; gap: 8px;">
                <i data-lucide="graduation-cap" style="color: var(--secondary); width: 16px; height: 16px; flex-shrink: 0; margin-top: 3px;"></i>
                <span style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.4;">${e}</span>
            </div>
        `).join('') : '<div style="color: var(--text-secondary); font-style: italic; text-align: left;">No education entries listed.</div>';

        // Render Achievements
        const achievements = data.achievements || [];
        let achievementsHtml = achievements.length > 0 ? achievements.map(a => `
            <div style="margin-bottom: 0.8rem; text-align: left; display: flex; align-items: flex-start; gap: 8px;">
                <i data-lucide="trophy" style="color: var(--warning); width: 16px; height: 16px; flex-shrink: 0; margin-top: 3px;"></i>
                <span style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.4;">${a}</span>
            </div>
        `).join('') : '<div style="color: var(--text-secondary); font-style: italic; text-align: left;">No key achievements listed.</div>';

        // Render Suggested Roles
        const suggestedRoles = data.suggested_roles || [];
        let suggestedRolesHtml = suggestedRoles.length > 0 ? suggestedRoles.map(r => `
            <span style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 5px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">${r}</span>
        `).join('') : '<div style="color: var(--text-secondary); font-style: italic; text-align: left;">No suggestions available.</div>';

        container.innerHTML = `
            <div class="insights-grid">
                <!-- Skills -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="wrench" style="color:var(--primary);width:20px;height:20px;"></i> Core Skills</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">${skillsHtml}</div>
                </div>

                <!-- Projects -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="folder-git-2" style="color:var(--primary);width:20px;height:20px;"></i> Identified Projects</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">${projectsHtml}</div>
                </div>

                <!-- Strengths -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="shield-check" style="color:var(--primary);width:20px;height:20px;"></i> Core Strengths</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">
                        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.6rem;">${strengthsHtml}</ul>
                    </div>
                </div>

                <!-- Weaknesses / Development Areas -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="trending-up" style="color:var(--primary);width:20px;height:20px;"></i> Development Areas</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">
                        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.6rem;">${weaknessesHtml}</ul>
                    </div>
                </div>

                <!-- Suggested Career Roles -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="compass" style="color:var(--primary);width:20px;height:20px;"></i> Suggested Career Roles</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="display:flex; flex-wrap:wrap; gap:0.6rem; margin-top: 1.2rem; text-align: left;">${suggestedRolesHtml}</div>
                </div>

                <!-- Education -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="graduation-cap" style="color:var(--primary);width:20px;height:20px;"></i> Education</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">${educationHtml}</div>
                </div>

                <!-- Certifications -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="award" style="color:var(--primary);width:20px;height:20px;"></i> Certifications</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">${certificationsHtml}</div>
                </div>

                <!-- Key Achievements -->
                <div class="insight-card card-spotlight">
                    <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="trophy" style="color:var(--primary);width:20px;height:20px;"></i> Key Achievements</span>
                        <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                    </h3>
                    <div class="card-content-copyable" style="margin-top: 1.2rem;">${achievementsHtml}</div>
                </div>
            </div>
            
            <!-- Experience Summary -->
            <div class="experience-card card-spotlight" style="margin-top: 2rem;">
                <h3 style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <span style="display:flex;align-items:center;gap:8px;"><i data-lucide="briefcase" style="color:var(--primary);width:22px;height:22px;"></i> Professional Experience Summary</span>
                    <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;" onclick="copyCardText(this)">Copy</button>
                </h3>
                <div class="card-content-copyable" style="margin-top: 1.2rem; line-height: 1.7; color: var(--text-secondary); font-size: 1.05rem; text-align: left;">
                    ${parseMarkdown(data.experience_summary) || 'No experience summary available.'}
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        initButtonSpotlight();
        adjustPageOverflow();
    } catch (err) {
        const msg = (err && err.message) || '';
        const isMissingKey = /API Key is missing/i.test(msg);

        if (err.status === 400) {
            if (tabsSelector) tabsSelector.style.display = 'none';
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(255, 255, 255, 0.02); border-radius: 16px; border: 1px dashed var(--glass-border); max-width: 600px; margin: 0 auto;">
                    <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.7;"></i>
                    <h3 style="margin-bottom: 0.5rem; font-weight: 700; color: var(--text-primary);">No Profile Context Uploaded</h3>
                    <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.5;">Please upload your resume, project description, or profile document first so we can analyze and generate twin insights.</p>
                    <a href="/upload.html" class="btn btn-primary btn-spotlight" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 30px; margin: 0 auto;"><i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Upload Profile Now</a>
                </div>
            `;
        } else if (isMissingKey) {
            // Only show the "configure your key" message when the backend
            // actually reported a missing key - not for any other failure.
            if (tabsSelector) tabsSelector.style.display = 'flex';
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(239, 68, 68, 0.02); border-radius: 16px; border: 1px dashed rgba(239, 68, 68, 0.25); max-width: 600px; margin: 0 auto;">
                    <i data-lucide="key" style="width: 48px; height: 48px; color: var(--warning); margin-bottom: 1rem; opacity: 0.85;"></i>
                    <h3 style="margin-bottom: 0.5rem; font-weight: 700; color: var(--text-primary);">API Configuration Required</h3>
                    <p style="color: var(--text-secondary); max-width: 450px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.5;">To generate AI insights, please configure your <strong>Gemini API Key</strong> (or Groq/OpenRouter) in the application settings first.</p>
                    <a href="/settings.html" class="btn btn-primary btn-spotlight" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 30px; margin: 0 auto;"><i data-lucide="settings" style="width:16px;height:16px;"></i> Configure API Key Now</a>
                </div>
            `;
        } else {
            // A real backend/AI provider failure - show what actually
            // happened instead of always blaming the API key, and let the
            // person retry without navigating away.
            if (tabsSelector) tabsSelector.style.display = 'flex';
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(239, 68, 68, 0.02); border-radius: 16px; border: 1px dashed rgba(239, 68, 68, 0.25); max-width: 600px; margin: 0 auto;">
                    <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--danger); margin-bottom: 1rem; opacity: 0.85;"></i>
                    <h3 style="margin-bottom: 0.5rem; font-weight: 700; color: var(--text-primary);">Couldn't Generate Insights</h3>
                    <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.9rem; line-height: 1.5; word-break: break-word;">${msg || 'The AI provider returned an unexpected error.'}</p>
                    <button class="btn btn-primary btn-spotlight" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 30px; margin: 0 auto;" onclick="fetchResumeSummary()"><i data-lucide="refresh-cw" style="width:16px;height:16px;"></i> Retry</button>
                </div>
            `;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        initButtonSpotlight();
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">-- No Projects Available --</option>';
        }
        adjustPageOverflow();
    }
}

// --- SETTINGS FORM ---
function initSettings() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    // Load persisted settings values from backend settings API
    loadSettingsData();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = form.querySelector('button[type="submit"]');
        saveBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px; border-width: 2px; margin-right: 0.5rem; display: inline-block; vertical-align: middle;"></span> Saving...';
        saveBtn.disabled = true;

        const settings = {
            theme: document.getElementById('theme').value,
            ai_provider: document.getElementById('ai_provider').value,
            gemini_api_key: document.getElementById('gemini_api_key').value,
            groq_api_key: document.getElementById('groq_api_key').value,
            openrouter_api_key: document.getElementById('openrouter_api_key').value,
            huggingface_api_key: document.getElementById('huggingface_api_key').value,
            temperature: parseFloat(document.getElementById('temperature').value),
            max_tokens: parseInt(document.getElementById('max_tokens').value)
        };

        try {
            await apiRequest('/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            showToast("Settings updated successfully!", "success");
            toggleTheme(settings.theme);
        } catch (err) {
            // Toast automatically handles showing the error
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i data-lucide="save"></i> Save Configurations';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    const clearAllBtn = document.getElementById('clear-all-data-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showCustomConfirm("Are you sure you want to delete all uploaded profile documents? This action is irreversible.", async () => {
                try {
                    await apiRequest('/uploads', { method: 'DELETE' });
                    showToast("All data cleared successfully.", "success");
                } catch (err) {
                    // Toast handles error
                }
            });
        });
    }
}

function syncCustomDropdown(select) {
    const container = select.nextElementSibling;
    if (container && container.classList.contains('custom-select-container')) {
        const triggerText = container.querySelector('.custom-select-trigger span');
        if (triggerText) {
            triggerText.textContent = select.options[select.selectedIndex]?.textContent || 'Select...';
        }
        const optionsList = container.querySelector('.custom-select-options');
        if (optionsList) {
            optionsList.querySelectorAll('.custom-option').forEach(optDiv => {
                if (optDiv.dataset.value === select.value) {
                    optDiv.classList.add('selected');
                } else {
                    optDiv.classList.remove('selected');
                }
            });
        }
    }
}

async function loadSettingsData() {
    try {
        const data = await apiRequest('/settings');
        
        // Prioritize localStorage state for the theme to avoid stale overrides
        const activeTheme = localStorage.getItem('theme') || data.theme || 'dark';
        
        const themeSelector = document.getElementById('theme');
        if (themeSelector) {
            themeSelector.value = activeTheme;
            syncCustomDropdown(themeSelector);
        }
        
        const providerSelector = document.getElementById('ai_provider');
        if (providerSelector) {
            providerSelector.value = data.ai_provider;
            syncCustomDropdown(providerSelector);
        }
        
        document.getElementById('gemini_api_key').value = data.gemini_api_key || '';
        document.getElementById('groq_api_key').value = data.groq_api_key || '';
        document.getElementById('openrouter_api_key').value = data.openrouter_api_key || '';
        document.getElementById('huggingface_api_key').value = data.huggingface_api_key || '';
        document.getElementById('temperature').value = data.temperature;
        document.getElementById('max_tokens').value = data.max_tokens;
        
        toggleTheme(activeTheme);
    } catch (err) {
        console.error(err);
    }
}

// --- SELF-INTRODUCTION GENERATOR ON LANDING / HOME ---
function initHome() {

    // --- Interactive 3D SVG Hologram Hover Tilt ---
    const hologramContainer = document.getElementById('hologram-3d-container');
    if (hologramContainer) {
        const svgEl = hologramContainer.querySelector('.hologram-svg');
        if (svgEl) {
            hologramContainer.addEventListener('mousemove', (e) => {
                const rect = hologramContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const xc = rect.width / 2;
                const yc = rect.height / 2;
                
                // Extremely subtle tilt (limit to 6 degrees max) for premium vector 3D look
                const angleX = (yc - y) / 25;
                const angleY = (x - xc) / 25;
                
                svgEl.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.03)`;
            });
            
            hologramContainer.addEventListener('mouseleave', () => {
                svgEl.style.transform = '';
            });
        }
    }

    const genBtn = document.getElementById('generate-home-intro-btn');
    if (!genBtn) return;

    genBtn.addEventListener('click', async () => {
        const type = document.getElementById('intro-type').value;
        const length = document.getElementById('intro-length').value;
        const resultEl = document.getElementById('home-intro-result');

        resultEl.innerHTML = '<span class="spinner"></span> Tuning elevator pitch...';

        try {
            const data = await apiRequest('/self-introduction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ intro_type: type, duration: length })
            });

            resultEl.innerHTML = `
                <div class="glass-panel" style="padding: 1.5rem; text-align: left; margin-top: 1rem; position: relative;">
                    <button class="btn btn-secondary" style="position: absolute; top: 10px; right: 10px; padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="copyBrandingText(this)">Copy</button>
                    <div class="branding-content-text" style="line-height: 1.6; color: var(--text-primary); font-size: 1.05rem;">${data.introduction.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } catch (err) {
            resultEl.innerHTML = '<div style="color: var(--danger);">Please upload your profile context first to generate a digital twin self introduction.</div>';
        }
    });
}

// --- POPUP CHAT SYSTEM ---
function initPopupChat() {
    const floatingBtn = document.getElementById('floating-chat-btn');
    const popupModal = document.getElementById('chat-popup-modal');
    const popupOverlay = document.getElementById('chat-popup-overlay');
    const closeBtn = document.getElementById('close-chat-popup');
    const saveBtn = document.getElementById('save-chat-popup-btn');
    const popupForm = document.getElementById('chat-popup-form');
    const popupInput = document.getElementById('chat-popup-input');
    const popupMessages = document.getElementById('chat-popup-messages');
    
    if (!floatingBtn || !popupModal) return;
    
    let popupHistory = [];
    
    const openPopup = () => {
        popupModal.classList.add('active');
        if (popupOverlay) popupOverlay.classList.add('active');
        setTimeout(() => {
            popupMessages.scrollTop = popupMessages.scrollHeight;
        }, 50);
    };

    const closePopup = () => {
        popupModal.classList.remove('active');
        if (popupOverlay) popupOverlay.classList.remove('active');
    };

    floatingBtn.addEventListener('click', () => {
        if (!popupModal.classList.contains('active')) {
            openPopup();
        } else {
            closePopup();
        }
    });
    
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (popupOverlay) popupOverlay.addEventListener('click', closePopup);
    
    // Save Transcript Button click listener
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            let transcript = "";
            const msgElements = popupMessages.querySelectorAll('.message');
            if (msgElements.length <= 1) {
                showToast("No active conversation to save yet.", "warning");
                return;
            }
            
            msgElements.forEach(el => {
                const role = el.classList.contains('user') ? "User" : "Twin Assistant";
                const text = el.innerText;
                transcript += `[${role}]: ${text}\n\n`;
            });
            
            const blob = new Blob([transcript], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `PersonaAI_Twin_Chat_Transcript.txt`;
            link.click();
            showToast("Chat transcript saved successfully!", "success");
        });
    }

    // Clear Chat Button click listener
    const clearPopupBtn = document.getElementById('clear-chat-popup-btn');
    if (clearPopupBtn) {
        clearPopupBtn.addEventListener('click', () => {
            if (popupMessages) {
                popupMessages.innerHTML = `
                    <div class="message assistant" style="max-width: 85%; padding: 0.8rem 1.2rem; border-radius: 16px; border-bottom-left-radius: 4px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); line-height: 1.5; text-align: left;">
                        Hello! I am your AI Digital Twin. Ask me anything about your uploaded profile, experience, or projects.
                    </div>
                `;
            }
            popupHistory = [];
            showToast("Chat context cleared.", "info");
        });
    }

    // Expose dynamic suggested prompt triggers globally
    window.sendSuggestedQuestion = function(question) {
        if (popupInput && popupForm) {
            popupInput.value = question;
            popupForm.dispatchEvent(new Event('submit'));
        }
    };
    
    if (popupForm) {
        popupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = popupInput.value.trim();
            if (!text) return;
            
            popupInput.value = '';
            
            // Append User Message
            appendPopupMessage('user', text);
            
            // Append assistant typing indicator
            const typingEl = appendPopupMessage('assistant', '<div class="spinner"></div> Thinking...');
            
            try {
                const data = await apiRequest('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        history: popupHistory
                    })
                });
                
                // Replace typing indicator with text response
                typingEl.innerHTML = data.response.replace(/\n/g, '<br>');
                popupHistory.push({ role: 'user', content: text });
                popupHistory.push({ role: 'assistant', content: data.response });
                
                popupMessages.scrollTop = popupMessages.scrollHeight;
            } catch (err) {
                typingEl.innerHTML = '<span style="color: var(--danger);">Failed to get response from Twin. Make sure an API Key is set in Settings.</span>';
            }
        });
    }
    
    function appendPopupMessage(role, text) {
        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        if (role === 'user') {
            msg.style.cssText = 'max-width: 85%; align-self: flex-end; padding: 0.8rem 1.2rem; border-radius: 16px; border-bottom-right-radius: 4px; background: var(--primary-gradient); color: #fff; box-shadow: 0 4px 12px rgba(124,58,237,0.2); margin-left: auto;';
        } else {
            msg.style.cssText = 'max-width: 85%; align-self: flex-start; padding: 0.8rem 1.2rem; border-radius: 16px; border-bottom-left-radius: 4px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); line-height: 1.5; margin-right: auto; text-align: left;';
        }
        msg.innerHTML = text;
        popupMessages.appendChild(msg);
        popupMessages.scrollTop = popupMessages.scrollHeight;
        return msg;
    }
}

// Custom Glassmorphic Dropdowns Builder
function initializeCustomDropdowns() {
    const nativeSelects = document.querySelectorAll('select.form-control');
    nativeSelects.forEach(select => {
        if (select.dataset.customized === 'true') return;
        select.dataset.customized = 'true';
        
        // Hide native select
        select.style.display = 'none';
        
        // Create custom structure
        const container = document.createElement('div');
        container.className = 'custom-select-container';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        
        const triggerText = document.createElement('span');
        triggerText.textContent = select.options[select.selectedIndex]?.textContent || 'Select...';
        trigger.appendChild(triggerText);
        
        const chevron = document.createElement('i');
        chevron.setAttribute('data-lucide', 'chevron-down');
        chevron.style.width = '16px';
        chevron.style.height = '16px';
        trigger.appendChild(chevron);
        
        const optionsList = document.createElement('div');
        optionsList.className = 'custom-select-options';
        
        Array.from(select.options).forEach((opt, idx) => {
            const optDiv = document.createElement('div');
            optDiv.className = 'custom-option';
            if (idx === select.selectedIndex) optDiv.classList.add('selected');
            optDiv.textContent = opt.textContent;
            optDiv.dataset.value = opt.value;
            
            optDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                select.value = opt.value;
                triggerText.textContent = opt.textContent;
                
                // Update selected styles
                optionsList.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
                optDiv.classList.add('selected');
                
                // Close dropdown
                optionsList.classList.remove('open');
                trigger.classList.remove('active');
                
                // Dispatch change event to trigger API/calculations if any
                select.dispatchEvent(new Event('change'));
            });
            optionsList.appendChild(optDiv);
        });
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other custom dropdowns first
            document.querySelectorAll('.custom-select-options').forEach(el => {
                if (el !== optionsList) el.classList.remove('open');
            });
            document.querySelectorAll('.custom-select-trigger').forEach(el => {
                if (el !== trigger) el.classList.remove('active');
            });
            
            // Check if there is enough space below the dropdown
            const rect = trigger.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 160; // Estimated height of options panel
            
            if (spaceBelow < dropdownHeight) {
                optionsList.classList.add('open-upwards');
            } else {
                optionsList.classList.remove('open-upwards');
            }
            
            optionsList.classList.toggle('open');
            trigger.classList.toggle('active');
        });
        
        container.appendChild(trigger);
        container.appendChild(optionsList);
        
        // Insert custom container right after the native select
        select.parentNode.insertBefore(container, select.nextSibling);
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-options').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.custom-select-trigger').forEach(el => el.classList.remove('active'));
    });
    
    // Render new lucide icons inside triggers
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Nav Button & Card Edge Light Spotlight Position Tracker
function initButtonSpotlight() {
    const spotlightElements = document.querySelectorAll('.btn-spotlight, .card-spotlight');
    spotlightElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            el.style.setProperty('--mouse-x', `${x}px`);
            el.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    highlightActiveNav();
    initUploader();
    initChat();
    initInterview();
    initResumeInsights();
    initSettings();
    initHome();
    initPopupChat();
    initializeCustomDropdowns();
    initButtonSpotlight();
});

// Toggle password fields visibility
window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i data-lucide="eye" style="width: 18px; height: 18px;"></i>';
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};
