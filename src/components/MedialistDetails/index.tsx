import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Slider from '@app/components/Slider';
import StatusBadge from '@app/components/StatusBadge';
import TmdbTitleCard from '@app/components/TitleCard/TmdbTitleCard';
import UnknownTitleCard from '@app/components/TitleCard/UnknownTitleCard';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import Error from '@app/pages/_error';
import { MediaStatus } from '@server/constants/media';
import type Medialist from '@server/entity/Medialist';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  overview: 'Overview',
  numberofitems: '{count} Items',
  requestcollection: 'Request Collection',
  requestcollection4k: 'Request Collection in 4K',
  medialistItems: 'List Items',
});

interface MedialistDetailsProps {
  medialist?: Medialist;
}

const MedialistDetails = ({ medialist }: MedialistDetailsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const settings = useSettings();
  const { hasPermission } = useUser();

  const { data, error } = useSWR<Medialist>(
    `/api/v1/medialist/${router.query.medialistId}`,
    {
      fallbackData: medialist,
      revalidateOnMount: true,
    }
  );

  /*
  const { data: genres } =
    useSWR<{ id: number; name: string }[]>(`/api/v1/genres/movie`);
*/

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  let medialistStatus = MediaStatus.UNKNOWN;
  let medialistStatus4k = MediaStatus.UNKNOWN;

  if (
    data.medialistItems.every(
      (item) => item.media && item.media.status === MediaStatus.AVAILABLE
    )
  ) {
    medialistStatus = MediaStatus.AVAILABLE;
  } else if (
    data.medialistItems.some(
      (item) => item.media && item.media.status === MediaStatus.AVAILABLE
    )
  ) {
    medialistStatus = MediaStatus.PARTIALLY_AVAILABLE;
  }

  if (
    data.medialistItems.every(
      (item) => item.media && item.media.status4k === MediaStatus.AVAILABLE
    )
  ) {
    medialistStatus4k = MediaStatus.AVAILABLE;
  } else if (
    data.medialistItems.some(
      (item) => item.media && item.media.status4k === MediaStatus.AVAILABLE
    )
  ) {
    medialistStatus4k = MediaStatus.PARTIALLY_AVAILABLE;
  }
  /*
  const hasRequestable =
    hasPermission([Permission.REQUEST, Permission.REQUEST_MOVIE], {
      type: 'or',
    }) &&
    data.medialistItems.filter(
      (item) => !item.media || item.media.status === MediaStatus.UNKNOWN
    ).length > 0;

  const hasRequestable4k =
    settings.currentSettings.movie4kEnabled &&
    hasPermission([Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE], {
      type: 'or',
    }) &&
    data.medialistItems.filter(
      (item) => !item.media || item.media.status4k === MediaStatus.UNKNOWN
    ).length > 0;
*/
  const medialistAttributes: React.ReactNode[] = [];

  medialistAttributes.push(
    intl.formatMessage(messages.numberofitems, {
      count: data.medialistItems.length,
    })
  );
  /*
  if (genres && data.medialistItems.some((item) => item.genreIds.length)) {
    medialistAttributes.push(
      uniq(
        data.medialistItems.reduce(
          (genresList: number[], curr) => genresList.concat(curr.genreIds),
          []
        )
      )
        .map((genreId) => (
          <Link
            href={`/discover/movies/genre/${genreId}`}
            key={`genre-${genreId}`}
          >
            <a className="hover:underline">
              {genres.find((g) => g.id === genreId)?.name}
            </a>
          </Link>
        ))
        .reduce((prev, curr) => (
          <>
            {intl.formatMessage(globalMessages.delimitedlist, {
              a: prev,
              b: curr,
            })}
          </>
        ))
    );
  }
  */

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      {data.backdropUrl && (
        <div className="media-page-bg-image">
          <CachedImage
            alt=""
            src={`${data.backdropUrl}`}
            layout="fill"
            objectFit="cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
            }}
          />
        </div>
      )}
      <PageTitle title={data.name} />
      {/*}
      <RequestModal
        tmdbId={data.id}
        show={requestModal}
        type="medialist"
        is4k={is4k}
        onComplete={() => {
          revalidate();
          setRequestModal(false);
        }}
        onCancel={() => setRequestModal(false)}
      />
      */}
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              data.posterUrl
                ? data.posterUrl
                : '/images/overseerr_poster_not_found.png'
            }
            alt=""
            layout="responsive"
            width={600}
            height={900}
            priority
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            <StatusBadge
              status={medialistStatus}
              inProgress={data.medialistItems.some(
                (item) => (item.media?.downloadStatus ?? []).length > 0
              )}
            />
            {settings.currentSettings.movie4kEnabled &&
              hasPermission(
                [Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE],
                {
                  type: 'or',
                }
              ) && (
                <StatusBadge
                  status={medialistStatus4k}
                  is4k
                  inProgress={data.medialistItems.some(
                    (item) => (item.media?.downloadStatus4k ?? []).length > 0
                  )}
                />
              )}
          </div>
          <h1>{data.name}</h1>
          <span className="media-attributes">
            {medialistAttributes.length > 0 &&
              medialistAttributes
                .map((t, k) => <span key={k}>{t}</span>)
                .reduce((prev, curr) => (
                  <>
                    {prev}
                    <span>|</span>
                    {curr}
                  </>
                ))}
          </span>
        </div>
        <div className="media-actions">
          {/*
          {(hasRequestable || hasRequestable4k) && (
            <ButtonWithDropdown
              buttonType="primary"
              onClick={() => {
                setRequestModal(true);
                setIs4k(!hasRequestable);
              }}
              text={
                <>
                  <DownloadIcon />
                  <span>
                    {intl.formatMessage(
                      hasRequestable
                        ? messages.requestcollection
                        : messages.requestcollection4k
                    )}
                  </span>
                </>
              }
            >
              {hasRequestable && hasRequestable4k && (
                <ButtonWithDropdown.Item
                  buttonType="primary"
                  onClick={() => {
                    setRequestModal(true);
                    setIs4k(true);
                  }}
                >
                  <DownloadIcon />
                  <span>
                    {intl.formatMessage(messages.requestcollection4k)}
                  </span>
                </ButtonWithDropdown.Item>
              )}
            </ButtonWithDropdown>
          )}
          */}
        </div>
      </div>
      {data.overview && (
        <div className="media-overview">
          <div className="flex-1">
            <h2>{intl.formatMessage(messages.overview)}</h2>
            <p>{data.overview}</p>
          </div>
        </div>
      )}
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.medialistItems)}</span>
        </div>
      </div>

      <Slider
        sliderKey="medialist-items"
        isLoading={false}
        isEmpty={data.medialistItems.length === 0}
        items={data.medialistItems.map((item) => {
          return item.tmdbId && item.mediaType ? (
            <TmdbTitleCard
              id={item.tmdbId}
              tmdbId={item.tmdbId}
              mediaType={item.mediaType}
            />
          ) : (
            <UnknownTitleCard
              name={item.name}
              year={item.year}
              mediaType={item.mediaType}
            />
          );
        })}
      />
      <div className="pb-8" />
    </div>
  );
};

export default MedialistDetails;
