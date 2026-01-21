import { IsString, IsUUID, IsInt, Min, Max } from 'class-validator';

export class OpenCellDto {
  @IsUUID()
  gameId: string;

  @IsString()
  token: string;

  @IsInt()
  @Min(0)
  @Max(5)
  x: number;

  @IsInt()
  @Min(0)
  @Max(5)
  y: number;
}
