import type { MedialistSources } from '@server/constants/medialist';
import { getRepository } from '@server/datasource';
import Medialist, {
  AddItemPermissionError,
  NotEnoughDetails,
} from '@server/entity/Medialist';
import type {
  MedialistItemRequestBody,
  MedialistResultsResponse,
} from '@server/interfaces/api/medialistInterfaces';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const MAX_SOURCE_ITEMS = 300;

const medialistRoutes = Router();
/*
isAuthenticated(
  [
    Permission.MANAGE_MEDIALIST,
    Permission.VIEW_MEDIALIST,
    Permission.CREATE_MEDIALIST,
  ],
  { type: 'or' }
),
*/
medialistRoutes.get<Record<string, string>, MedialistResultsResponse>(
  '/',
  async (req, res, next) => {
    const pageSize = req.query.take ? Number(req.query.take) : 10;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const createdBy = req.query.createdBy ? Number(req.query.createdBy) : null;
    let nameFilter = '';
    let sortFilter: string;

    if (req.query.filter && !Array.isArray(req.query.filter)) {
      nameFilter = req.query.filter as string;
    }

    switch (req.query.sort) {
      case 'modified':
        sortFilter = 'medialist.updatedAt';
        break;
      default:
        sortFilter = 'medialist.createdAt';
    }

    let query = getRepository(Medialist)
      .createQueryBuilder('medialist')
      .leftJoinAndSelect('medialist.createdBy', 'createdBy');

    if (nameFilter && nameFilter != '') {
      query.where(`medialist.name like :nameFilter`, {
        nameFilter: `%${nameFilter}%`,
      });
    }

    if (
      !req.user?.hasPermission(
        [Permission.MANAGE_MEDIALIST, Permission.VIEW_MEDIALIST],
        { type: 'or' }
      )
    ) {
      if (createdBy && createdBy !== req.user?.id) {
        return next({
          status: 403,
          message:
            'You do not have permission to view medialists created by other users',
        });
      }
      query = query.andWhere('createdBy.id = :id', { id: req.user?.id });
    } else if (createdBy) {
      query = query.andWhere('createdBy.id = :id', { id: createdBy });
    }

    const [medialist, medialistCount] = await query
      .orderBy(sortFilter, 'DESC')
      .take(pageSize)
      .skip(skip)
      .getManyAndCount();

    return res.status(200).json({
      pageInfo: {
        pages: Math.ceil(medialistCount / pageSize),
        pageSize,
        results: medialistCount,
        page: Math.ceil(skip / pageSize) + 1,
      },
      results: medialist,
    });
  }
);

medialistRoutes.post<
  Record<string, string>,
  Medialist,
  {
    name: string;
    overview: string;
    backdropUrl: string;
    posterUrl: string;
    sourceUrl: string;
    sourceLimit: number;
    autoUpdate: boolean;
  }
>(
  '/',
  isAuthenticated([Permission.MANAGE_MEDIALIST, Permission.CREATE_MEDIALIST], {
    type: 'or',
  }),
  async (req, res, next) => {
    // Satisfy typescript here. User is set, we assure you!
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    if (!req.body.name) {
      return next({ status: 403, message: 'Name is required for medialist' });
    }

    let source: MedialistSources | undefined;
    if (req.body.sourceUrl) {
      const urlInfo = Medialist.getSourceUrlInfo(req.body.sourceUrl);
      if (!urlInfo) {
        return next({ status: 403, message: 'Source url invalid' });
      }
      source = urlInfo.sourceName;
    }

    const medialistRepository = getRepository(Medialist);

    try {
      const medialistCheck = await medialistRepository
        .createQueryBuilder('medialist')
        .where('medialist.id = :medialistId', {
          name: req.body.name,
        })
        .getOne();

      if (medialistCheck) {
        return next({ status: 403, message: 'Medialist already exists' });
      }

      const medialist = new Medialist({
        createdBy: req.user,
        name: req.body.name,
        overview: req.body.overview,
        backdropUrl: req.body.backdropUrl,
        posterUrl: req.body.posterUrl,
        sourceUrl: req.body.sourceUrl,
        source,
        sourceLimit:
          req.body.sourceLimit > 1 && req.body.sourceLimit <= MAX_SOURCE_ITEMS
            ? req.body.sourceLimit
            : undefined,
        autoUpdate: req.body.autoUpdate ?? false,
      });
      const newMedialist = await medialistRepository.save(medialist);

      return res.status(200).json(newMedialist);
    } catch (e) {
      return next({ status: 500, message: 'Unable to create medialist' });
    }
  }
);

medialistRoutes.get('/count', async (req, res, next) => {
  const medialistRepository = getRepository(Medialist);

  try {
    const query = medialistRepository.createQueryBuilder('medialist');

    const totalCount = await query.getCount();

    return res.status(200).json({
      total: totalCount,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving medialist counts.', {
      label: 'API',
      errorMessage: e.message,
    });
    next({ status: 500, message: 'Unable to retrieve medialist counts.' });
  }
});

medialistRoutes.get<{ medialistId: string }>(
  '/:medialistId',
  isAuthenticated(
    [
      Permission.MANAGE_MEDIALIST,
      Permission.VIEW_MEDIALIST,
      Permission.CREATE_MEDIALIST,
    ],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const medialistRepository = getRepository(Medialist);
    // Satisfy typescript here. User is set, we assure you!
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    try {
      const medialist = await medialistRepository
        .createQueryBuilder('medialist')
        .leftJoinAndSelect('medialist.createdBy', 'createdBy')
        .leftJoinAndSelect('medialist.medialistItems', 'medialistItems')
        .where('medialist.id = :medialistId', {
          medialistId: Number(req.params.medialistId),
        })
        .getOneOrFail();

      if (
        medialist.createdBy.id !== req.user.id &&
        !req.user.hasPermission(
          [Permission.MANAGE_MEDIALIST, Permission.VIEW_MEDIALIST],
          { type: 'or' }
        )
      ) {
        return next({
          status: 403,
          message: 'You do not have permission to view this list.',
        });
      }

      return res.status(200).json(medialist);
    } catch (e) {
      logger.debug('Failed to retrieve medialist.', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Medialist not found.' });
    }
  }
);

medialistRoutes.delete<{ medialistId: string }>(
  '/:medialistId',
  isAuthenticated([Permission.MANAGE_MEDIALIST, Permission.CREATE_MEDIALIST], {
    type: 'or',
  }),
  async (req, res, next) => {
    const medialistRepository = getRepository(Medialist);

    try {
      const medialist = await medialistRepository.findOneOrFail({
        where: { id: Number(req.params.medialistId) },
        relations: { createdBy: true },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_MEDIALIST) &&
        medialist.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 401,
          message: 'You do not have permission to delete this medialist.',
        });
      }

      await medialistRepository.remove(medialist);

      return res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong deleting a medialist.', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Medialist not found.' });
    }
  }
);

medialistRoutes.post<
  { medialistId: string },
  Medialist,
  MedialistItemRequestBody
>(
  '/:medialistId/addItem',
  isAuthenticated([Permission.MANAGE_MEDIALIST, Permission.CREATE_MEDIALIST], {
    type: 'or',
  }),
  async (req, res, next) => {
    const medialistRepository = getRepository(Medialist);

    try {
      // Satisfy typescript here. User is set, we assure you!
      if (!req.user) {
        return next({ status: 500, message: 'User missing from request.' });
      }

      const medialist = await medialistRepository.findOneOrFail({
        where: { id: Number(req.params.medialistId) },
      });

      const updatedMedialist = await medialist.addItem(req.body, req.user);

      return res.status(200).json(updatedMedialist);
    } catch (error) {
      if (!(error instanceof Error)) {
        return;
      }

      switch (error.constructor) {
        case AddItemPermissionError:
        case NotEnoughDetails:
          return next({ status: 403, message: error.message });
        default:
          return next({ status: 500, message: error.message });
      }
    }
  }
);

export default medialistRoutes;
