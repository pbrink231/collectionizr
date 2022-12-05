import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import { Permission, useUser } from '@app/hooks/useUser';
import { EyeIcon } from '@heroicons/react/solid';
import type Medialist from '@server/entity/Medialist';
import Link from 'next/link';
import { defineMessages, FormattedRelativeTime, useIntl } from 'react-intl';

const messages = defineMessages({
  createduserdate: '{date} by {user}',
  modified: 'Modified',
  viewmedialist: 'View Medialist',
  unknownissuetype: 'Unknown',
});

interface MedialistCardProps {
  medialist: Medialist;
}

const MedialistCard = ({ medialist }: MedialistCardProps) => {
  const intl = useIntl();
  const { hasPermission } = useUser();

  return (
    <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gray-800 py-4 text-gray-400 shadow-md ring-1 ring-gray-700 xl:h-28 xl:flex-row">
      {medialist.backdropUrl && (
        <div className="absolute inset-0 z-0 w-full bg-cover bg-center xl:w-2/3">
          <CachedImage
            src={`${medialist.backdropUrl}`}
            alt=""
            layout="fill"
            objectFit="cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(31, 41, 55, 0.47) 0%, rgba(31, 41, 55, 1) 100%)',
            }}
          />
        </div>
      )}
      <div className="relative flex w-full flex-col justify-between overflow-hidden sm:flex-row">
        <div className="relative z-10 flex w-full items-center overflow-hidden pl-4 pr-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
          <Link href={`/medialists/${medialist.id}`}>
            <a className="relative h-auto w-12 flex-shrink-0 scale-100 transform-gpu overflow-hidden rounded-md transition duration-300 hover:scale-105">
              <CachedImage
                src={
                  medialist.posterUrl
                    ? `${medialist.posterUrl}`
                    : '/images/overseerr_poster_not_found.png'
                }
                alt=""
                layout="responsive"
                width={600}
                height={900}
                objectFit="cover"
              />
            </a>
          </Link>
          <div className="flex flex-col justify-center overflow-hidden pl-2 xl:pl-4">
            <Link href={`/medialists/${medialist.id}`}>
              <a className="mr-2 min-w-0 truncate text-lg font-bold text-white hover:underline xl:text-xl">
                {medialist.name}
              </a>
            </Link>
          </div>
        </div>
        <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
          <div className="card-field">
            {hasPermission([Permission.MANAGE_ISSUES, Permission.VIEW_ISSUES], {
              type: 'or',
            }) ? (
              <>
                <span className="card-field-name">
                  {intl.formatMessage(messages.modified)}
                </span>
                <span className="flex truncate text-sm text-gray-300">
                  {intl.formatMessage(messages.createduserdate, {
                    date: (
                      <FormattedRelativeTime
                        value={Math.floor(
                          (new Date(medialist.createdAt).getTime() -
                            Date.now()) /
                            1000
                        )}
                        updateIntervalInSeconds={1}
                        numeric="auto"
                      />
                    ),
                    user: (
                      <Link href={`/users/${medialist.createdBy.id}`}>
                        <a className="group flex items-center truncate">
                          <img
                            src={medialist.createdBy.avatar}
                            alt=""
                            className="avatar-sm ml-1.5 object-cover"
                          />
                          <span className="truncate text-sm font-semibold group-hover:text-white group-hover:underline">
                            {medialist.createdBy.displayName}
                          </span>
                        </a>
                      </Link>
                    ),
                  })}
                </span>
              </>
            ) : (
              <>
                <span className="card-field-name">
                  {intl.formatMessage(messages.modified)}
                </span>
                <span className="flex truncate text-sm text-gray-300">
                  <FormattedRelativeTime
                    value={Math.floor(
                      (new Date(medialist.createdAt).getTime() - Date.now()) /
                        1000
                    )}
                    updateIntervalInSeconds={1}
                    numeric="auto"
                  />
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="z-10 mt-4 flex w-full flex-col justify-center pl-4 pr-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
        <span className="w-full">
          <Link href={`/medialists/${medialist.id}`} passHref>
            <Button as="a" className="w-full" buttonType="primary">
              <EyeIcon />
              <span>{intl.formatMessage(messages.viewmedialist)}</span>
            </Button>
          </Link>
        </span>
      </div>
    </div>
  );
};

export default MedialistCard;
