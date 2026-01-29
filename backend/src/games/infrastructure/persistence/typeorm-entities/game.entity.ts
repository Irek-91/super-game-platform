import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import { GameStatus } from '@/games/domain/entities/game.entity';
import { GamePlayer } from './game-player.entity';
import { GameCell } from './game-cell.entity';

@Entity('games')
@Check(`"field_size" BETWEEN 2 AND 5`)
export class GameOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint', name: 'field_size' })
  fieldSize: number;

  @Column({ type: 'smallint', name: 'diamonds_count' })
  diamondsCount: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: GameStatus.WAITING,
    enum: GameStatus,
  })
  status: GameStatus;

  @Column({ type: 'uuid', nullable: true, name: 'turn_player_id' })
  turnPlayerId: string | null;

  @Column({ type: 'smallint', name: 'diamonds_found', default: 0 })
  diamondsFound: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'finished_at' })
  finishedAt: Date | null;

  @OneToMany(() => GamePlayer, (player) => player.game)
  players: GamePlayer[];

  @OneToMany(() => GameCell, (cell) => cell.game)
  cells: GameCell[];
}
