import TheMovieDb from '@server/api/themoviedb';
import { MediaStatus, MediaType } from '@server/constants/media';
import {
  MedialistSources,
  MedialistSourceTypes,
} from '@server/constants/medialist';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import type { MedialistAddItem } from '@server/interfaces/api/medialistInterfaces';
import { Permission } from '@server/lib/permissions';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import MedialistItem from './MedialistItem';
import { User } from './User';

export interface SourceUrlRegexPatterns {
  regex: RegExp;
  sourceName: MedialistSources;
  type: MedialistSourceTypes;
}

export interface SourceUrlRegexInfo {
  regex: RegExp;
  baseUrl?: string;
  urlPath?: string;
  urlParams?: string;
  sourceName: MedialistSources;
  type: MedialistSourceTypes;
  mediaType?: MediaType;
  listId?: string;
  username?: string;
  params?: string;
  timeframe?: string;
}

export class AddItemPermissionError extends Error {}
export class NotEnoughDetails extends Error {}

export const sourceUrlName = (
  urlString: string
): MedialistSources | undefined => {
  try {
    const url = new URL(urlString);

    switch (url.host) {
      case 'themoviedb.org':
      case 'www.themoviedb.org':
      case 'tmdb.org':
      case 'www.tmdb.org':
        return MedialistSources.TMDB;
      case 'trakt.tv':
      case 'www.trakt.tv':
      case 'api.trakt.tv':
        return MedialistSources.TRAKT;
      case 'www.imdb.com':
      case 'imdb.com':
        return MedialistSources.IMDB;
      default:
        return;
    }
  } catch (e) {
    return;
  }
};

export const sourceUrlRegexInfo: SourceUrlRegexPatterns[] = [
  {
    regex: new RegExp(
      /^http[s]?:\/\/www\.imdb\.com\/search\/title[?]?(?<params>.*)/
    ),
    sourceName: MedialistSources.IMDB,
    type: MedialistSourceTypes.IMDB_SEARCH,
  },
  {
    regex: new RegExp(
      /https?:\/\/www\.imdb\.com\/list\/(?<listId>\w*)\/?\??(?<params>.*)/
    ),
    sourceName: MedialistSources.IMDB,
    type: MedialistSourceTypes.IMDB_LIST,
  },
  {
    regex: new RegExp(/^https?:\/\/www\.imdb\.com\/chart\/(?<listId>.*)/),
    sourceName: MedialistSources.IMDB,
    type: MedialistSourceTypes.IMDB_CHART,
  },
  {
    regex: new RegExp(
      /^https?:\/\/trakt\.tv\/users\/(?<username>.*)\/lists\/(?<listId>.*)\?(?<params>.*)/
    ),
    sourceName: MedialistSources.TRAKT,
    type: MedialistSourceTypes.TRAKT_USERLIST,
  },
  {
    regex: new RegExp(
      /^https?:\/\/trakt\.tv\/shows\/(?<listId>\w*)\/?(?<timeframe>\w*)/
    ),
    sourceName: MedialistSources.TRAKT,
    type: MedialistSourceTypes.TRAKT_CHARTTV,
  },
  {
    regex: new RegExp(
      /^https?:\/\/trakt\.tv\/movies\/(?<listId>\w*)\/?(?<timeframe>\w*)/
    ),
    sourceName: MedialistSources.TRAKT,
    type: MedialistSourceTypes.TRAKT_CHARTMOVIE,
  },
  {
    regex: new RegExp(
      /^https?:\/\/(?:www\.)?themoviedb\.org\/tv\/(?<listId>\w*)\/?(?<timeframe>\w*)/
    ),
    sourceName: MedialistSources.TMDB,
    type: MedialistSourceTypes.TMDB_CHARTTV,
  },
  {
    regex: new RegExp(
      /^https?:\/\/(?:www\.)?themoviedb\.org\/movie\/(?<listId>\w*)\/?(?<timeframe>\w*)/
    ),
    sourceName: MedialistSources.TMDB,
    type: MedialistSourceTypes.TMDB_CHARTMOVIE,
  },
];

export const sourceUrlInfo = (url: string): SourceUrlRegexInfo | undefined => {
  for (const sourceRegInfo of sourceUrlRegexInfo) {
    const regexMatch = url.match(sourceRegInfo.regex);
    if (regexMatch) {
      const groups = regexMatch.groups;
      return {
        ...sourceRegInfo,
        listId: groups?.listId,
        username: groups?.username,
        params: groups?.params,
        timeframe: groups?.timeframe,
      };
    }
  }
};

@Entity()
class Medialist {
  public static getSourceUrlInfo(urlString: string) {
    return sourceUrlInfo(urlString);
  }

  public static async addItem(
    medialist: Medialist,
    addItemDetails: MedialistAddItem,
    user: User
  ): Promise<Medialist> {
    const tmdb = new TheMovieDb();
    const mediaRepository = getRepository(Media);
    const medialistItemRepository = getRepository(MedialistItem);
    const userRepository = getRepository(User);

    let requestUser = user;

    if (medialist.autoUpdate) {
      throw new AddItemPermissionError('Medialist cannot be manually changed.');
    }

    if (
      addItemDetails.userId &&
      !requestUser.hasPermission([
        Permission.MANAGE_USERS,
        Permission.MANAGE_MEDIALIST,
      ])
    ) {
      throw new AddItemPermissionError(
        'You do not have permission to modify the request user.'
      );
    } else if (addItemDetails.userId) {
      requestUser = await userRepository.findOneOrFail({
        where: { id: addItemDetails.userId },
      });
    } else if (
      medialist.createdBy.id !== requestUser.id &&
      !requestUser.hasPermission(Permission.MANAGE_MEDIALIST)
    ) {
      throw new AddItemPermissionError(
        'You do not have permission to add on to this medialist.'
      );
    }

    if (!requestUser) {
      throw new Error('User missing from request context.');
    }

    let foundMedia: Media | null = null;

    if (!foundMedia && addItemDetails.tmdbId) {
      foundMedia = await mediaRepository.findOne({
        where: {
          tmdbId: addItemDetails.tmdbId,
          mediaType: addItemDetails.mediaType,
        },
      });
    }
    if (!foundMedia && addItemDetails.tvdbId) {
      foundMedia = await mediaRepository.findOne({
        where: { tvdbId: addItemDetails.tvdbId },
      });
    }
    if (!foundMedia && addItemDetails.imdbId) {
      foundMedia = await mediaRepository.findOne({
        where: { imdbId: addItemDetails.imdbId },
      });
    }

    if (!foundMedia && addItemDetails.tmdbId && addItemDetails.mediaType) {
      const tmdbMedia =
        addItemDetails.mediaType === MediaType.MOVIE
          ? await tmdb.getMovie({ movieId: addItemDetails.tmdbId })
          : await tmdb.getTvShow({ tvId: addItemDetails.tmdbId });

      if (tmdbMedia) {
        const media = new Media({
          tmdbId: tmdbMedia.id,
          tvdbId: addItemDetails.tvdbId ?? tmdbMedia.external_ids.tvdb_id,
          imdbId: tmdbMedia.external_ids.imdb_id,
          status: MediaStatus.UNKNOWN,
          status4k: MediaStatus.UNKNOWN,
          mediaType: addItemDetails.mediaType,
        });
        foundMedia = await mediaRepository.save(media);
      }
    }

    if (!foundMedia && addItemDetails.imdbId) {
      const tmdbMedia = await tmdb.getMediaByImdbId({
        imdbId: addItemDetails.imdbId,
      });

      if (tmdbMedia) {
        const media = new Media({
          tmdbId: tmdbMedia.id,
          tvdbId: addItemDetails.tvdbId ?? tmdbMedia.external_ids.tvdb_id,
          imdbId: tmdbMedia.external_ids.imdb_id,
          status: MediaStatus.UNKNOWN,
          status4k: MediaStatus.UNKNOWN,
          mediaType: addItemDetails.mediaType,
        });
        foundMedia = await mediaRepository.save(media);
      }
    }

    if (!foundMedia && !addItemDetails.name) {
      throw new NotEnoughDetails(
        'Cannot add to medialist without a name or found media.'
      );
    }

    const medialistItem = new MedialistItem({
      medialist: medialist,
      addedBy: requestUser,
      media: foundMedia ?? undefined,
      name: addItemDetails.name,
      year: addItemDetails.year,
      mediaType: addItemDetails.mediaType,
      tmdbId: foundMedia ? foundMedia.tmdbId : addItemDetails.tmdbId,
      tvdbId: foundMedia ? foundMedia.tvdbId : addItemDetails.tvdbId,
      imdbId: foundMedia ? foundMedia.imdbId : addItemDetails.imdbId,
      seasonNumber: addItemDetails.season,
      episodeNumber: addItemDetails.episode,
    });

    await medialistItemRepository.save(medialistItem);
    return medialist;
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, (user) => user.createdMedialists, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public createdBy: User;

  @OneToMany(() => MedialistItem, (medialistItem) => medialistItem.medialist, {
    cascade: true,
    eager: true,
  })
  public medialistItems: MedialistItem[];

  @Column({ unique: true })
  public name: string;

  @Column({ nullable: true })
  public overview?: string;

  @Column({ nullable: true })
  public backdropUrl?: string;

  @Column({ nullable: true })
  public posterUrl?: string;

  @Column({ nullable: true })
  public source?: MedialistSources;

  @Column({ nullable: true })
  public sourceType?: MedialistSourceTypes;

  @Column({ nullable: true })
  public sourceUrl?: string;

  @Column({ default: false })
  public autoUpdate: boolean;

  @Column({ nullable: true })
  public sourceLimit?: number;

  @Column({ nullable: true })
  public sourceGenres?: string;

  @Column({ nullable: true })
  public sourceRatings?: string;

  @Column({ nullable: true })
  public sourceYears?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Medialist>) {
    Object.assign(this, init);
  }

  public async addItem(addItemDetails: MedialistAddItem, user: User) {
    return Medialist.addItem(this, addItemDetails, user);
  }
}

export default Medialist;
