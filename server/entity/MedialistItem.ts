import type { MediaType } from '@server/constants/media';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Media from './Media';
import Medialist from './Medialist';
import { User } from './User';

@Entity()
class MedialistItem {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Medialist, (medialist) => medialist.medialistItems, {
    onDelete: 'CASCADE',
  })
  public medialist: Medialist;

  @ManyToOne(() => User, (user) => user.addedMedialistItems, {
    nullable: true,
    eager: true,
  })
  public addedBy?: User;

  @ManyToOne(() => Media, {
    nullable: true,
    eager: true,
  })
  public media?: Media;

  @Column({ nullable: true })
  public name?: string;

  @Column({ nullable: true })
  public year?: string;

  @Column({ nullable: true })
  public mediaType?: MediaType;

  @Column({ nullable: true })
  public tmdbId?: number;

  @Column({ nullable: true })
  public tvdbId?: number;

  @Column({ nullable: true })
  public imdbId?: string;

  @Column({ nullable: true })
  public seasonNumber?: number;

  @Column({ nullable: true })
  public episodeNumber?: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<MedialistItem>) {
    Object.assign(this, init);
  }
}

export default MedialistItem;
