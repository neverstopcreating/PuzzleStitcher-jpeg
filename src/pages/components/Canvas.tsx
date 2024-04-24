import PuzzlePiece, {loadPuzzlePiece} from "@/pages/components/PuzzlePiece";
import {useEffect, useRef} from "react";


function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        async function setupCanvas() {
            const canvas = canvasRef.current;
            if (!canvas) {
                console.error("Failed to find the canvas element");
                return;
            }

            const ctx = canvas.getContext('2d', {willReadFrequently: true});
            if (!ctx) {
                console.error("Failed to get canvas context");
                return;
            }

            const loadingPuzzlePieces: Promise<PuzzlePiece>[] = [];
            for (let i = 0; i < 256; i++) {
                const url = `/peaces_extra/peace-${i}.jpg`;
                loadingPuzzlePieces.push(loadPuzzlePiece(url))
            }

            const puzzlePieces = await Promise.all(loadingPuzzlePieces);
            assemblePuzzle(puzzlePieces, ctx);
        }

        //I am grouping the pieces by their sizes before matching by colors
        function groupPuzzlePieces(pieces: PuzzlePiece[]): {
            topLeftPiece: PuzzlePiece,
            leftColumnPiecesGroup: Set<PuzzlePiece>,
            otherPiecesGroup: Set<PuzzlePiece>
        } {
            let topLeftPiece: PuzzlePiece | undefined = undefined;
            const leftColumnPiecesGroup: Set<PuzzlePiece> = new Set();
            const otherPiecesGroup: Set<PuzzlePiece> = new Set();

            pieces.forEach(piece => {
                if (piece.image.width === 240 && piece.image.height === 135) {
                    topLeftPiece = piece;
                } else if (piece.image.width === 240 && piece.image.height === 136) {
                    leftColumnPiecesGroup.add(piece);
                } else {
                    otherPiecesGroup.add(piece);
                }
            });

            if (!topLeftPiece) {
                throw new Error('Top left piece not found');
            }

            return {topLeftPiece, leftColumnPiecesGroup, otherPiecesGroup};
        }

        function assemblePuzzle(pieces: PuzzlePiece[], ctx: CanvasRenderingContext2D) {

            const puzzleWidthInPieces = 16;
            const puzzleHeightInPieces = 16;

            const {topLeftPiece, leftColumnPiecesGroup, otherPiecesGroup} = groupPuzzlePieces(pieces);

            // Put top left in its place
            topLeftPiece.draw(ctx, 0, 0);

            // Create arrays to hold matched ones for the top row and left column
            const leftColumnPieces = [topLeftPiece];
            let previousPiece = topLeftPiece;

            console.log('foo',leftColumnPieces);

            for (let y = 1; y < puzzleHeightInPieces; y++) {
                for (const pieceToCheck of leftColumnPiecesGroup) {
                    if (previousPiece.matchWith(pieceToCheck, 'bottom')) {
                        pieceToCheck.draw(ctx, 0, y);
                        leftColumnPieces.push(pieceToCheck);
                        previousPiece = pieceToCheck;
                        leftColumnPiecesGroup.delete(pieceToCheck);
                        break;
                    }
                }
            }

            for (let y = 0; y < puzzleHeightInPieces; y++) {
                let previousPiece = leftColumnPieces[y];
                for (let x = 1; x < puzzleWidthInPieces; x++) {
                    for (const pieceToCheck of otherPiecesGroup) {
                        if (previousPiece.matchWith(pieceToCheck, 'right')) {
                            pieceToCheck.draw(ctx, x, y);
                            previousPiece = pieceToCheck;
                            otherPiecesGroup.delete(pieceToCheck);
                            break;
                        }

                    }
                }
            }
        }

        setupCanvas();
    }, []); // Empty array makes sure this effect runs only 1 time after the component mounts
    return (
        <div>
            <h1>Puzzle stitcher</h1>
            <canvas ref={canvasRef} width="3840" height="2160"></canvas>
        </div>
    );
}

export default Canvas;
