import ErrorCard from '@app/components/TitleCard/ErrorCard';
import Placeholder from '@app/components/TitleCard/Placeholder';
import { useIsTouch } from '@app/hooks/useIsTouch';
import globalMessages from '@app/i18n/globalMessages';
import { withProperties } from '@app/utils/typeHelpers';
import type { MediaType } from '@server/models/Search';
import { useState } from 'react';
import { useIntl } from 'react-intl';

interface UnknownTitleCardProps {
  name?: string;
  year?: string;
  mediaType?: MediaType;
  canExpand?: boolean;
}

const UnknownTitleCard = ({
  name,
  year,
  mediaType,
  canExpand = false,
}: UnknownTitleCardProps) => {
  const isTouch = useIsTouch();
  const intl = useIntl();
  const [showDetail, setShowDetail] = useState(false);

  // Just to get the year from the date
  if (year) {
    year = year.slice(0, 4);
  }

  return (
    <div
      className={canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'}
      data-testid="unknown-title-card"
    >
      <div
        className={`relative transform-gpu cursor-default overflow-hidden rounded-xl bg-gray-800 bg-cover outline-none ring-1 transition duration-300 ${
          showDetail
            ? 'scale-105 shadow-lg ring-gray-500'
            : 'scale-100 shadow ring-gray-700'
        }`}
        style={{
          paddingBottom: '150%',
        }}
        onMouseEnter={() => {
          if (!isTouch) {
            setShowDetail(true);
          }
        }}
        onMouseLeave={() => setShowDetail(false)}
        onClick={() => setShowDetail(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setShowDetail(true);
          }
        }}
        role="link"
        tabIndex={0}
      >
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          {mediaType && (
            <div className="absolute left-0 right-0 flex items-center justify-between p-2">
              <div
                className={`pointer-events-none z-40 rounded-full shadow ${
                  mediaType === 'movie' ? 'bg-blue-500' : 'bg-purple-600'
                }`}
              >
                <div className="flex h-4 items-center px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-white sm:h-5">
                  {mediaType === 'movie'
                    ? intl.formatMessage(globalMessages.movie)
                    : intl.formatMessage(globalMessages.tvshow)}
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="flex h-full w-full items-end">
              <div className={`'pb-11' px-2 text-white`}>
                {year && <div className="text-sm font-medium">{year}</div>}

                <h1
                  className="whitespace-normal text-xl font-bold leading-tight"
                  style={{
                    WebkitLineClamp: 3,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}
                  data-testid="title-card-title"
                >
                  {name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withProperties(UnknownTitleCard, { Placeholder, ErrorCard });
