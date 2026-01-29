import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { GameOrmEntity } from './game.entity';

@Entity('game_players')
@Unique(['gameId', 'slot'])
@Index(['gameId'])
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'game_id' })
  gameId: string;

  @ManyToOne(() => GameOrmEntity, (game) => game.players, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: GameOrmEntity;

  @Column({ type: 'smallint' })
  slot: number;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'boolean', default: false })
  connected: boolean;

  @Column({ type: 'smallint', default: 0 })
  score: number;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_seen_at' })
  lastSeenAt: Date | null;
}
