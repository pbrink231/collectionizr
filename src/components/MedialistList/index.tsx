import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import MedialistCard from '@app/components/MedialistList/MedialistCard';
import MedialistModal from '@app/components/MedialistModal';
import useDebounceInput from '@app/hooks/useDebounceInput';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import globalMessages from '@app/i18n/globalMessages';
import { PlusIcon, XCircleIcon } from '@heroicons/react/outline';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SortDescendingIcon,
} from '@heroicons/react/solid';
import type { MedialistResultsResponse } from '@server/interfaces/api/medialistInterfaces';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  medialist: 'List',
  sortName: 'Name',
  sortCreated: 'Created Date',
  sortModified: 'Last Modified',
  clearFilter: 'Clear Filter',
  searchPlaceholder: 'Filter Medialists',
  errorloading: 'Error loading data',
  createmedialist: 'Create Medialist',
});

type Sort = 'name' | 'created' | 'modified';

const MedialistList = () => {
  const intl = useIntl();
  const router = useRouter();
  const [currentSort, setCurrentSort] = useState<Sort>('modified');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);
  const [currentFilter, setCurrentFilter] = useState<string>('');
  const debouncedFilter = useDebounceInput<string>(currentFilter);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const updateQueryParams = useUpdateQueryParams({ page: page.toString() });

  const { data, error } = useSWR<MedialistResultsResponse>(
    () =>
      `/api/v1/medialist?take=${currentPageSize}&skip=${
        pageIndex * currentPageSize
      }${
        debouncedFilter !== '' ? `&filter=${debouncedFilter}` : ''
      }&sort=${currentSort}`
  );

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('ml-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter ?? '');
      setCurrentSort(filterSettings.currentSort);
      setCurrentPageSize(filterSettings.currentPageSize);
    }

    // If filter value is provided in query, use that instead
    if (router.query.filter && !Array.isArray(router.query.filter)) {
      setCurrentFilter(router.query.filter);
    }
  }, [router.query.filter]);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'ml-filter-settings',
      JSON.stringify({
        debouncedFilter,
        currentSort,
        currentPageSize,
      })
    );
  }, [debouncedFilter, currentSort, currentPageSize]);

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.medialist)} />
      <MedialistModal
        onCancel={() => setShowCreateModal(false)}
        show={showCreateModal}
      />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header subtext={'some subtext here'}>
          {intl.formatMessage(messages.medialist)}
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <div className="relative flex w-full items-center text-white focus-within:text-gray-200">
              <Button
                className="mb-2 flex-grow sm:mb-0 sm:mr-2"
                buttonType="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon />
                <span>{intl.formatMessage(messages.createmedialist)}</span>
              </Button>
              <input
                id="search_medialist_field"
                style={{
                  paddingRight: currentFilter.length > 0 ? '1.75rem' : '',
                }}
                className="block w-full rounded-full border border-gray-600 bg-gray-900 bg-opacity-80 py-2 pl-10 text-white placeholder-gray-300 hover:border-gray-500 focus:border-gray-500 focus:bg-opacity-100 focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-base"
                type="search"
                value={currentFilter}
                onChange={(e) => setCurrentFilter(e.target.value)}
                placeholder={intl.formatMessage(messages.searchPlaceholder)}
              />
              {currentFilter.length > 0 && (
                <button
                  className="absolute inset-y-0 right-2 m-auto h-7 w-7 border-none p-1 text-gray-400 outline-none transition hover:text-white focus:border-none focus:outline-none"
                  onClick={() => setCurrentFilter('')}
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <SortDescendingIcon className="h-6 w-6" />
            </span>
            <select
              id="sort"
              name="sort"
              onChange={(e) => {
                setCurrentSort(e.target.value as Sort);
                router.push({
                  pathname: router.pathname,
                  query: router.query.userId
                    ? { userId: router.query.userId }
                    : {},
                });
              }}
              value={currentSort}
              className="rounded-r-only"
            >
              <option value="name">
                {intl.formatMessage(messages.sortName)}
              </option>
              <option value="created">
                {intl.formatMessage(messages.sortCreated)}
              </option>
              <option value="modified">
                {intl.formatMessage(messages.sortModified)}
              </option>
            </select>
          </div>
        </div>
      </div>
      {error ? (
        <h2>{intl.formatMessage(globalMessages.errorloadingdata)}</h2>
      ) : !data ? (
        <LoadingSpinner />
      ) : (
        <>
          {data.results.map((medialist) => {
            return (
              <div className="py-2" key={`medialist-card-${medialist.id}`}>
                <MedialistCard medialist={medialist} />
              </div>
            );
          })}
          {data.results.length === 0 && (
            <div className="flex w-full flex-col items-center justify-center py-24 text-white">
              <span className="text-2xl text-gray-400">
                {intl.formatMessage(globalMessages.noresults)}
              </span>
              {currentFilter !== '' && (
                <div className="mt-4">
                  <Button
                    buttonType="primary"
                    onClick={() => setCurrentFilter('')}
                  >
                    {intl.formatMessage(messages.clearFilter)}
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="actions">
            <nav
              className="mb-3 flex flex-col items-center space-y-3 sm:flex-row sm:space-y-0"
              aria-label="Pagination"
            >
              <div className="hidden lg:flex lg:flex-1">
                <p className="text-sm">
                  {data.results.length > 0 &&
                    intl.formatMessage(globalMessages.showingresults, {
                      from: pageIndex * currentPageSize + 1,
                      to:
                        data.results.length < currentPageSize
                          ? pageIndex * currentPageSize + data.results.length
                          : (pageIndex + 1) * currentPageSize,
                      total: data.pageInfo.results,
                      strong: (msg: React.ReactNode) => (
                        <span className="font-medium">{msg}</span>
                      ),
                    })}
                </p>
              </div>
              <div className="flex justify-center sm:flex-1 sm:justify-start lg:justify-center">
                <span className="-mt-3 items-center truncate text-sm sm:mt-0">
                  {intl.formatMessage(globalMessages.resultsperpage, {
                    pageSize: (
                      <select
                        id="pageSize"
                        name="pageSize"
                        onChange={(e) => {
                          setCurrentPageSize(Number(e.target.value));
                          router
                            .push({
                              pathname: router.pathname,
                              query: router.query.userId
                                ? { userId: router.query.userId }
                                : {},
                            })
                            .then(() => window.scrollTo(0, 0));
                        }}
                        value={currentPageSize}
                        className="short inline"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    ),
                  })}
                </span>
              </div>
              <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
                <Button
                  disabled={pageIndex > 0}
                  onClick={() =>
                    updateQueryParams('page', (page - 1).toString())
                  }
                >
                  <ChevronLeftIcon />
                  <span>{intl.formatMessage(globalMessages.previous)}</span>
                </Button>
                <Button
                  disabled={data.pageInfo.pages > pageIndex + 1}
                  onClick={() =>
                    updateQueryParams('page', (page + 1).toString())
                  }
                >
                  <span>{intl.formatMessage(globalMessages.next)}</span>
                  <ChevronRightIcon />
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default MedialistList;
