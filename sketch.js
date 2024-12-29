let img;
let edgeImg;
let currentColor;
let isProcessed = false;
let canvas;

function setup() {
    canvas = createCanvas(600, 400);
    canvas.parent('canvas-container');
    background(255);
    
    // Setup file input handler
    document.getElementById('imageInput').addEventListener('change', handleFileSelect);
    
    // Setup color picker
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('input', (event) => {
        currentColor = color(event.target.value);
    });
    currentColor = color('#ff0000');
    
    noLoop();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadImage(e.target.result, (loadedImg) => {
                img = loadedImg;
                processImage();
            });
        };
        reader.readAsDataURL(file);
    }
}

function processImage() {
    // Resize image to fit canvas while maintaining aspect ratio
    const scale = Math.min(width / img.width, height / img.height);
    const newWidth = img.width * scale;
    const newHeight = img.height * scale;
    
    // Create new canvas size based on image
    resizeCanvas(newWidth, newHeight);
    
    // Create edge image
    edgeImg = createImage(img.width, img.height);
    edgeImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    edgeImg.loadPixels();
    img.loadPixels();
    
    // Apply Sobel edge detection
    for (let x = 1; x < edgeImg.width - 1; x++) {
        for (let y = 1; y < edgeImg.height - 1; y++) {
            const gx = getGradientX(img, x, y);
            const gy = getGradientY(img, x, y);
            const gradient = sqrt(gx * gx + gy * gy);
            // console.log(gradient);
            
            const index = 4 * (y * edgeImg.width + x);
            const edgeValue = gradient > 50 ? 0 : 255;
            edgeImg.pixels[index] = edgeValue;
            edgeImg.pixels[index + 1] = edgeValue;
            edgeImg.pixels[index + 2] = edgeValue;
            edgeImg.pixels[index + 3] = 255;
        }
    }
    edgeImg.updatePixels();
    isProcessed = true;

    image(edgeImg, 0, 0, edgeImg.width, edgeImg.height);
}

function getGradientX(img, x, y) {
    const idx = (y * img.width + x) * 4;
    const left = (img.pixels[idx - 4] + img.pixels[idx - 3] + img.pixels[idx - 2]) / 3;
    const right = (img.pixels[idx + 4] + img.pixels[idx + 5] + img.pixels[idx + 6]) / 3;
    return right - left;
}

function getGradientY(img, x, y) {
    const idx = (y * img.width + x) * 4;
    const up = (img.pixels[idx - img.width * 4] + img.pixels[idx - img.width * 4 + 1] + img.pixels[idx - img.width * 4 + 2]) / 3;
    const down = (img.pixels[idx + img.width * 4] + img.pixels[idx + img.width * 4 + 1] + img.pixels[idx + img.width * 4 + 2]) / 3;
    return down - up;
}

function floodFill(startX, startY, fillColor) {
    edgeImg.loadPixels();
    img.loadPixels();
    const imageData = edgeImg.pixels;
    const imagePixels = img.pixels;

    const startPos = (startY * edgeImg.width + startX) * 4;
    const startR = imagePixels[startPos];
    const startG = imagePixels[startPos + 1];
    const startB = imagePixels[startPos + 2];

    // Return if clicking on a black edge
    if (startR < 50 && startG < 50 && startB < 50) return;
    
    const stack = [[startX, startY]];
    const visited = new Set();
    const tolerance = 50;

    // Flood fill
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const pos = (y * edgeImg.width + x) * 4;
        if (visited.has(pos)) continue;
        visited.add(pos);

        // Check if pixel is within tolerance of start color
        if (x < 0 || x >= edgeImg.width || y < 0 || y >= edgeImg.height) continue;
        
        const r = imagePixels[pos];
        const g = imagePixels[pos + 1];
        const b = imagePixels[pos + 2];
        
        if (Math.abs(r - startR) > tolerance ||
            Math.abs(g - startG) > tolerance ||
            Math.abs(b - startB) > tolerance) continue;
        
        // Fill pixel
        imageData[pos] = red(fillColor);
        imageData[pos + 1] = green(fillColor);
        imageData[pos + 2] = blue(fillColor);
        imageData[pos + 3] = 255;
        
        // Add neighboring pixels to stack
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    edgeImg.updatePixels();
}

function mousePressed() {
    if (isProcessed && mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
        mouseX = Math.round(mouseX);
        mouseY = Math.round(mouseY);
        floodFill(mouseX, mouseY, currentColor);
    }
    image(edgeImg, 0, 0, edgeImg.width, edgeImg.height);
}