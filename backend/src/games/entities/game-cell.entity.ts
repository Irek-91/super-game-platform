import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';

@Entity('game_cells')
@Unique(['gameId', 'x', 'y'])
export class GameCell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'game_id' })
  gameId: string;

  @ManyToOne(() => Game, (game) => game.cells, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ type: 'smallint' })
  x: number; // 0..fieldSize-1

  @Column({ type: 'smallint' })
  y: number; // 0..fieldSize-1

  @Column({ type: 'boolean', name: 'is_diamond', default: false })
  isDiamond: boolean;

  @Column({ type: 'smallint', name: 'adjacent_diamonds', default: 0 })
  adjacentDiamonds: number; // 0..8

  @Column({ type: 'uuid', nullable: true, name: 'opened_by_player_id' })
  openedByPlayerId: string | null;

  @ManyToOne(() => GamePlayer, { nullable: true })
  @JoinColumn({ name: 'opened_by_player_id' })
  openedByPlayer: GamePlayer | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'opened_at' })
  openedAt: Date | null;
}
