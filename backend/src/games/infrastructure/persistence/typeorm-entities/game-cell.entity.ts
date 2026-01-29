import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { GameOrmEntity } from './game.entity';

@Entity('game_cells')
@Unique(['gameId', 'x', 'y'])
@Index(['gameId'])
@Index(['gameId', 'x', 'y'])
export class GameCell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'game_id' })
  gameId: string;

  @ManyToOne(() => GameOrmEntity, (game) => game.cells, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: GameOrmEntity;

  @Column({ type: 'smallint' })
  x: number;

  @Column({ type: 'smallint' })
  y: number;

  @Column({ type: 'boolean', name: 'is_diamond', default: false })
  isDiamond: boolean;

  @Column({ type: 'smallint', name: 'adjacent_diamonds', default: 0 })
  adjacentDiamonds: number;

  @Column({ type: 'uuid', nullable: true, name: 'opened_by_player_id' })
  openedByPlayerId: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'opened_at' })
  openedAt: Date | null;
}
