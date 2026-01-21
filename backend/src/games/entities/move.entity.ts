import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';
import { GameCell } from './game-cell.entity';

export enum MoveResult {
  DIAMOND = 'diamond',
  NUMBER = 'number',
}

@Entity('moves')
@Unique(['gameId', 'moveNo'])
export class Move {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'game_id' })
  gameId: string;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ type: 'uuid', name: 'player_id' })
  playerId: string;

  @ManyToOne(() => GamePlayer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: GamePlayer;

  @Column({ type: 'uuid', name: 'cell_id' })
  cellId: string;

  @ManyToOne(() => GameCell, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cell_id' })
  cell: GameCell;

  @Column({ type: 'int', name: 'move_no' })
  moveNo: number; // порядковый номер хода в игре

  @Column({
    type: 'varchar',
    length: 20,
    enum: MoveResult,
  })
  result: MoveResult;

  @Column({ type: 'smallint', nullable: true, name: 'number_value' })
  numberValue: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
