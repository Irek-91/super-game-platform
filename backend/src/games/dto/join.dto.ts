import { IsString, IsUUID } from 'class-validator';

export class JoinDto {
  @IsUUID()
  gameId: string;

  @IsString()
  token: string;
}
