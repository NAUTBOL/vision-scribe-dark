
class OCRExtractor {
    constructor() {
        this.imageInput = document.getElementById('imageInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.previewSection = document.getElementById('previewSection');
        this.previewImage = document.getElementById('previewImage');
        this.ocrBtn = document.getElementById('ocrBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.extractedText = document.getElementById('extractedText');
        this.copyBtn = document.getElementById('copyBtn');
        this.themeToggle = document.getElementById('themeToggle');
        
        this.selectedFile = null;
        this.isProcessing = false;
        
        this.initializeTheme();
        this.bindEvents();
    }

    initializeTheme() {
        // Check for saved theme preference or default to 'dark'
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    bindEvents() {
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // File upload events
        this.uploadArea.addEventListener('click', () => this.imageInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // OCR button
        this.ocrBtn.addEventListener('click', () => this.startOCR());
        
        // Copy button
        this.copyBtn.addEventListener('click', () => this.copyText());
        
        // Donate button (placeholder)
        document.querySelector('.donate-btn').addEventListener('click', () => {
            alert('Thank you for your interest in donating! This is a demo application.');
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            alert('Please select a valid image file (JPG or PNG).');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size too large. Please select an image smaller than 10MB.');
            return;
        }

        this.selectedFile = file;
        this.displayPreview(file);
    }

    displayPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.hideOtherSections();
            
            // Scroll to preview
            this.previewSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        };
        
        reader.readAsDataURL(file);
    }

    hideOtherSections() {
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
    }

    async startOCR() {
        if (!this.selectedFile || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.ocrBtn.disabled = true;
        this.ocrBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            Processing...
        `;
        
        // Show progress section
        this.progressSection.style.display = 'block';
        this.resultsSection.style.display = 'none';
        
        // Scroll to progress
        this.progressSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });

        try {
            console.log('Starting OCR process...');
            const worker = await Tesseract.createWorker('eng');
            console.log('Worker created successfully');
            
            const { data: { text } } = await worker.recognize(this.selectedFile, {
                logger: (m) => {
                    console.log('OCR Progress:', m);
                    this.updateProgress(m);
                }
            });
            
            console.log('OCR completed, extracted text:', text);
            await worker.terminate();
            
            this.displayResults(text);
            
        } catch (error) {
            console.error('OCR Error:', error);
            alert('An error occurred during text extraction. Please try again with a smaller image or different format.');
        } finally {
            this.isProcessing = false;
            this.resetOCRButton();
        }
    }

    updateProgress(m) {
        if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `Processing... ${progress}%`;
        } else {
            this.progressText.textContent = `${m.status}...`;
        }
    }

    displayResults(text) {
        this.extractedText.value = text || 'No text was detected in the image.';
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    resetOCRButton() {
        this.ocrBtn.disabled = false;
        this.ocrBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
            </svg>
            Extract Text
        `;
    }

    async copyText() {
        try {
            await navigator.clipboard.writeText(this.extractedText.value);
            
            // Visual feedback
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                Copied!
            `;
            this.copyBtn.style.color = 'var(--success)';
            
            setTimeout(() => {
                this.copyBtn.innerHTML = originalText;
                this.copyBtn.style.color = '';
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy text:', err);
            
            // Fallback: select text
            this.extractedText.select();
            this.extractedText.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                alert('Text copied to clipboard!');
            } catch (e) {
                alert('Failed to copy text. Please select and copy manually.');
            }
        }
    }
}

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OCRExtractor();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    // Reset to initial state if needed
    const sections = ['previewSection', 'progressSection', 'resultsSection'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
});
