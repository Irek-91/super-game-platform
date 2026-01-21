import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { GameStatus } from '../types/game-state.types';
import { GamePlayer } from './game-player.entity';
import { GameCell } from './game-cell.entity';

@Entity('games')
@Check(`"field_size" BETWEEN 2 AND 5`)
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint', name: 'field_size' })
  fieldSize: number; // размер поля NxN (2..5)

  @Column({ type: 'smallint', name: 'diamonds_count' })
  diamondsCount: number; // количество алмазов (1..fieldSize*fieldSize, нечётное)

  @Column({
    type: 'varchar',
    length: 20,
    default: GameStatus.WAITING,
    enum: GameStatus,
  })
  status: GameStatus;

  @Column({ type: 'uuid', nullable: true, name: 'turn_player_id' })
  turnPlayerId: string | null;

  @ManyToOne(() => GamePlayer, { nullable: true })
  @JoinColumn({ name: 'turn_player_id' })
  turnPlayer: GamePlayer | null;

  @Column({ type: 'smallint', name: 'diamonds_found', default: 0 })
  diamondsFound: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'finished_at' })
  finishedAt: Date | null;

  @OneToMany(() => GamePlayer, (player) => player.game, { cascade: true })
  players: GamePlayer[];

  @OneToMany(() => GameCell, (cell) => cell.game, { cascade: true })
  cells: GameCell[];
}
