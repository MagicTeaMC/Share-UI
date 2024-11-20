document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const progressBar = document.getElementById('progressBar');
    const progress = progressBar.querySelector('.progress');
    const shareLink = document.getElementById('shareLink');
    const linkInput = document.getElementById('linkInput');
    const copyButton = document.getElementById('copyButton');

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#4f46e5';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#818cf8';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#818cf8';
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Handle file input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Handle file upload
    function handleFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        progressBar.style.display = 'block';
        shareLink.style.display = 'none';

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            progress.style.width = '100%';
            setTimeout(() => {
                progressBar.style.display = 'none';
                shareLink.style.display = 'block';
                linkInput.value = data.fileUrl;
            }, 500);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Upload failed. Please try again.');
            progressBar.style.display = 'none';
        });
    }

    // Handle copy button
    copyButton.addEventListener('click', () => {
        linkInput.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy Link';
        }, 2000);
    });
});