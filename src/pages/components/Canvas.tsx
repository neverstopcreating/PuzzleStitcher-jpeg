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

            for (let y = 1; y < puzzleHeightInPieces; y++) {
                // To match jpeg I am finding sides with less difference
                let bestCandidate: PuzzlePiece | undefined = undefined;
                let bestCandidateScore: number = Number.MAX_VALUE;

                for (const pieceToCheck of leftColumnPiecesGroup) {
                    let score = previousPiece.matchWith(pieceToCheck, 'bottom')


                    if (bestCandidate == null || score < bestCandidateScore) {
                        bestCandidate = pieceToCheck;
                        bestCandidateScore = score;
                    }

                    //if we will use this code for png then right piece difference score
                    //will be 0 and we want to finish matching and not check the rest of the pieces
                    if (bestCandidateScore === 0) {
                        break;
                    }
                }

                if (bestCandidate == null) {
                    throw new Error('Failed to find a piece to match');
                }

                bestCandidate.draw(ctx, 0, y);
                leftColumnPieces.push(bestCandidate);
                previousPiece = bestCandidate;
                leftColumnPiecesGroup.delete(bestCandidate);
            }

            for (let y = 0; y < puzzleHeightInPieces; y++) {
                let previousPiece = leftColumnPieces[y];
                for (let x = 1; x < puzzleWidthInPieces; x++) {
                    let bestCandidate: PuzzlePiece | undefined = undefined;
                    let bestCandidateScore: number = Number.MAX_VALUE;

                    for (const pieceToCheck of otherPiecesGroup) {
                        let score = previousPiece.matchWith(pieceToCheck, 'right')

                        if (bestCandidate == null || score < bestCandidateScore) {
                            bestCandidate = pieceToCheck;
                            bestCandidateScore = score;
                        }

                        if (bestCandidateScore === 0) {
                            break;
                        }
                    }
                    if (bestCandidate == null) {
                        throw new Error('Failed to find a piece to match');
                    }

                    bestCandidate.draw(ctx, x, y);
                    previousPiece = bestCandidate;
                    otherPiecesGroup.delete(bestCandidate);
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
