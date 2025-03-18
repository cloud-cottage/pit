document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData();
    const avatarFile = document.getElementById('avatar').files[0];
    const nickname = document.getElementById('nickname').value;
    const title = document.getElementById('title').value;

    formData.append('avatar', avatarFile);
    formData.append('nickname', nickname);
    formData.append('title', title);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            // 更新预览图片
            const previewImage = document.getElementById('previewImage');
            previewImage.src = imageUrl;

            // 启用下载按钮
            const downloadButton = document.getElementById('downloadButton');
            downloadButton.disabled = false;
            downloadButton.onclick = () => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = 'generated_image.jpg';
                link.click();
            };
        } else {
            alert('生成图片失败，请重试！');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请检查控制台！');
    }
});