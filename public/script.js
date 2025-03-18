document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData();
    const avatarFile = document.getElementById('avatar').files[0];
    const nickname = document.getElementById('nickname').value;

    formData.append('avatar', avatarFile);
    formData.append('nickname', nickname);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            const outputImage = document.getElementById('outputImage');
            outputImage.src = result.imageUrl;
            outputImage.style.display = 'block';
        } else {
            alert('生成图片失败，请重试！');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请检查控制台！');
    }
});