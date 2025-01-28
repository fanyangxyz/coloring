let img;
let edgeImg;
let currentColor;
let isProcessed = false;
let canvas;
const colorPalettes = [
    ['#FF7E5F', '#FEB47B', '#FFE66D', '#76C1D4'], // Coral, Peach, Yellow, Ocean
    ['#2D5A27', '#8DB580', '#E3DCD2', '#5C4033'], // Pine, Sage, Birch, Brown
    ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'], // Navy, Steel, Frost, Red
];
let selectedColorBox = null; // Variable to track the currently selected color box

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
    createPaletteButtons();
    
    noLoop();
}

function selectImage(imagePath) {
    currentImage = imagePath;
    console.log("Selected image:", currentImage);
    loadImage(currentImage, (loadedImg) => {
        img = loadedImg;
        processImage();
    });
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
    const scale = Math.min(1000 / img.width, 800 / img.height);
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

function createPaletteButtons() {
    const paletteContainer = document.getElementById('paletteContainer');
    colorPalettes.forEach(palette => {
        const paletteDiv = document.createElement('div');
        paletteDiv.className = 'palette';
        paletteDiv.style.display = 'flex';

        palette.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.style.backgroundColor = color;
            colorBox.style.width = '30px'; // Width of each color box
            colorBox.style.height = '30px'; // Height of each color box
            colorBox.style.margin = '2px'; // Margin between boxes
            colorBox.style.cursor = 'pointer';
            colorBox.onclick = () => {
                // Remove highlight from the previously selected color box
                if (selectedColorBox) {
                    selectedColorBox.style.border = ''; // Reset border
                }

                // Set currentColor to the clicked color
                currentColor = color;
                console.log("Selected color:", currentColor);

                // Highlight the currently selected color box
                selectedColorBox = colorBox; // Update the selected color box
                selectedColorBox.style.border = '2px solid black'; // Highlight with a border
            };
            paletteDiv.appendChild(colorBox);
        });

        paletteContainer.appendChild(paletteDiv);
    });
}

function selectPalette(palette) {
    currentColor = color(palette[0]);
    console.log("Selected color:", currentColor);
}