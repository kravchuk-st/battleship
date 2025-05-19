import { MatrixCells, IUpdatedCoordinates } from 'src/types';

export const getUpdatedCoordinates = (
  originalMatrix: MatrixCells[][],
  updatedMatrix: MatrixCells[][]
): IUpdatedCoordinates[] => {
  const updatedCoordinates: IUpdatedCoordinates[] = [];

  for (let y = 0; y < updatedMatrix.length; y += 1) {
    for (let x = 0; x < updatedMatrix[y].length; x += 1) {
      const coordinate = { x, y, status: updatedMatrix[y][x] };

      if (originalMatrix[y][x] !== updatedMatrix[y][x]) {
        updatedCoordinates.push(coordinate);
      }
    }
  }

  return updatedCoordinates;
};
