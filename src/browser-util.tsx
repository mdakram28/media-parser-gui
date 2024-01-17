
function downloadURL(data: string, fileName: string) {
    var a;
    a = document.createElement('a');
    a.href = data;
    a.download = fileName;
    document.body.appendChild(a);
    // @ts-ignore
    a.style = 'display: none';
    a.click();
    a.remove();
}

export function downloadBlob(parts: Uint8Array[], fileName: string, mimeType: string) {
    var blob, url: string;
    blob = new Blob(parts, {
        type: mimeType
    });
    url = window.URL.createObjectURL(blob);
    downloadURL(url, fileName);
    setTimeout(function () {
        return window.URL.revokeObjectURL(url);
    }, 1000);
}


export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}