//loading puzzle and extracting buffer data before matching and drawing visual for user
export function loadPuzzlePiece(imageSrc: string): Promise<PuzzlePiece> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const offScreenCanvas = document.createElement('canvas');
            offScreenCanvas.width = image.width;
            offScreenCanvas.height = image.height;
            const ctx = offScreenCanvas.getContext('2d', {willReadFrequently: true})!;
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height);
            const buffer = imageData.data;
            resolve(new PuzzlePiece(image, buffer));
        };
        image.onerror = () => {
            reject('Image could not be loaded');
        };
    })
}

export default class PuzzlePiece {
    image: HTMLImageElement;
    edgeData: {
        top: { r: number, g: number, b: number }[],
        right: { r: number, g: number, b: number }[],
        bottom: { r: number, g: number, b: number }[],
        left: { r: number, g: number, b: number }[]
    };

    constructor(image: HTMLImageElement, buffer: Uint8ClampedArray) {
        this.image = image;
        this.edgeData = {top: [], right: [], bottom: [], left: []};
        this.extractEdges(buffer);
    }

    //I am using only 2 sides in my alghoritm but it can be easily extended to 4 sides for future implementations
    matchWith(otherPiece: PuzzlePiece, edgeToMatch: 'top' | 'bottom' | 'left' | 'right'): boolean {
        const thisEdge = this.getEdgeData(edgeToMatch);
        const otherEdge = otherPiece.getEdgeData(this.getOppositeEdge(edgeToMatch));

        // Check length
        if (thisEdge.length !== otherEdge.length) {
            return false;
        }

        const colorTolerance = 25;
        // Check pixel colors with tolerance
        for (let i = 0; i < thisEdge.length; i++) {
            if (Math.abs(thisEdge[i].r - otherEdge[i].r) > colorTolerance ||
                Math.abs(thisEdge[i].g - otherEdge[i].g) > colorTolerance ||
                Math.abs(thisEdge[i].b - otherEdge[i].b) > colorTolerance) {
                return false;
            }
        }
        return true;
    }

    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.drawImage(this.image, x * 240, y * 135);
    }

    private extractEdges(buffer: Uint8ClampedArray) {
        // Get pixel colors from sides
        this.edgeData.top = this.extractEdgeData(buffer, 'top');
        this.edgeData.right = this.extractEdgeData(buffer, 'right');
        this.edgeData.bottom = this.extractEdgeData(buffer, 'bottom');
        this.edgeData.left = this.extractEdgeData(buffer, 'left');
    }

    private extractEdgeData(buffer: Uint8ClampedArray, edge: 'top' | 'bottom' | 'left' | 'right'): {
        r: number,
        g: number,
        b: number
    }[] {
        const width = this.image.width;
        const height = this.image.height;
        const colors: { r: number, g: number, b: number }[] = [];

        switch (edge) {
            case 'top':
                for (let x = 0; x < width; x++) {
                    const index = (x * 4); //RGBA 4 values
                    colors.push({r: buffer[index], g: buffer[index + 1], b: buffer[index + 2]});
                }
                break;
            case 'bottom':
                for (let x = 0; x < width; x++) {
                    const index = ((width * (height - 1) + x) * 4);
                    colors.push({r: buffer[index], g: buffer[index + 1], b: buffer[index + 2]});
                }
                break;
            case 'left':
                for (let y = 0; y < height; y++) {
                    const index = (y * width * 4); // Start of each row
                    colors.push({r: buffer[index], g: buffer[index + 1], b: buffer[index + 2]});
                }
                break;
            case 'right':
                for (let y = 0; y < height; y++) {
                    const index = ((y * width + width - 1) * 4); // Last pixel in each row
                    colors.push({r: buffer[index], g: buffer[index + 1], b: buffer[index + 2]});
                }
                break;
        }
        return colors;
    }

    private getEdgeData(edge: 'top' | 'bottom' | 'left' | 'right'): { r: number, g: number, b: number }[] {
        return this.edgeData[edge];
    }

    private getOppositeEdge(edge: 'top' | 'bottom' | 'left' | 'right'): 'top' | 'bottom' | 'left' | 'right' {
        switch (edge) {
            case 'top':
                return 'bottom';
            case 'bottom':
                return 'top';
            case 'left':
                return 'right';
            case 'right':
                return 'left';
            default:
                throw new Error('Invalid edge');
        }
    }
}
