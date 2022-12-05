import MedialistDetails from '@app/components/MedialistDetails';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const MedialistPage: NextPage = () => {
  useRouteGuard(
    [
      Permission.MANAGE_MEDIALIST,
      Permission.VIEW_MEDIALIST,
      Permission.CREATE_MEDIALIST,
    ],
    {
      type: 'or',
    }
  );
  return <MedialistDetails />;
};

export default MedialistPage;
