import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import { ArrowCircleRightIcon } from '@heroicons/react/solid';
import { MediaType } from '@server/constants/media';
import type MedialistItem from '@server/entity/MedialistItem';
import type { MedialistResultsResponse } from '@server/interfaces/api/medialistInterfaces';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import { Field, Formik } from 'formik';
import Link from 'next/link';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages({
  validationMessageRequired: 'You must provide a medialist',
  whatswrong: "What's wrong?",
  providedetail:
    'Please provide a detailed explanation of the issue you encountered.',
  extras: 'Extras',
  season: 'Season {seasonNumber}',
  episode: 'Episode {episodeNumber}',
  allseasons: 'All Seasons',
  allepisodes: 'All Episodes',
  seasonLabel: 'Season',
  episodeLabel: 'Episode',
  medialistLabel: 'Medialist',
  toastSuccessCreate: 'Medialist submitted successfully!',
  toastFailedCreate: 'Something went wrong while submitting the issue.',
  toastviewissue: 'View Medialist',
  addmedialistitem: 'Add to a Medialist',
  submitissue: 'Submit Item',
  pickmedialist: 'Pick a Medialist',
});

const isMovie = (movie: MovieDetails | TvDetails): movie is MovieDetails => {
  return (movie as MovieDetails).title !== undefined;
};

interface CreateMedialistItemModalProps {
  mediaType: MediaType;
  tmdbId?: number;
  onCancel?: () => void;
}

const CreateMedialistItemModal = ({
  onCancel,
  mediaType,
  tmdbId,
}: CreateMedialistItemModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails | TvDetails>(
    tmdbId ? `/api/v1/${mediaType}/${tmdbId}` : null
  );
  const { data: medialistData, error: medialistError } =
    useSWR<MedialistResultsResponse>(`/api/v1/medialist`);

  if (!tmdbId) {
    return null;
  }

  const availableSeasons = (data?.mediaInfo?.seasons ?? []).map(
    (season) => season.seasonNumber
  );

  const CreateMedialistItemModalSchema = Yup.object().shape({
    medialist: Yup.string().required(
      intl.formatMessage(messages.validationMessageRequired)
    ),
  });

  return (
    <Formik
      initialValues={{
        season: availableSeasons.length === 1 ? availableSeasons[0] : 0,
        episode: 0,
        medialist: '',
      }}
      validationSchema={CreateMedialistItemModalSchema}
      onSubmit={async (values) => {
        try {
          const newMedialistItem = await axios.post<MedialistItem>(
            `/api/v1/medialist/${values.medialist}/addItem`,
            {
              mediaType,
              tmdbId,
              season: values.season,
              episode: values.season > 0 ? values.episode : 0,
            }
          );

          if (data) {
            addToast(
              <>
                <div>
                  {intl.formatMessage(messages.toastSuccessCreate, {
                    title: isMovie(data) ? data.title : data.name,
                    strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
                  })}
                </div>
                <Link href={`/medialists/${newMedialistItem.data.id}`}>
                  <Button as="a" className="mt-4">
                    <span>{intl.formatMessage(messages.toastviewissue)}</span>
                    <ArrowCircleRightIcon />
                  </Button>
                </Link>
              </>,
              {
                appearance: 'success',
                autoDismiss: true,
              }
            );
          }

          if (onCancel) {
            onCancel();
          }
        } catch (e) {
          addToast(intl.formatMessage(messages.toastFailedCreate), {
            appearance: 'error',
            autoDismiss: true,
          });
        }
      }}
    >
      {({ handleSubmit, values, errors, touched }) => {
        return (
          <Modal
            backgroundClickable
            onCancel={onCancel}
            title={intl.formatMessage(messages.addmedialistitem)}
            subTitle={data && isMovie(data) ? data?.title : data?.name}
            cancelText={intl.formatMessage(globalMessages.close)}
            onOk={() => handleSubmit()}
            okText={intl.formatMessage(messages.submitissue)}
            loading={!data && !error}
            backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
          >
            <>
              <div className="form-row">
                <label htmlFor="medialist" className="text-label">
                  {intl.formatMessage(messages.medialistLabel)}
                  <span className="label-required">*</span>
                </label>
                {medialistError ? (
                  <h2>Error Loading</h2>
                ) : (
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <Field as="select" id="medialist" name="medialist">
                        <option key="default" value="" disabled>
                          {intl.formatMessage(messages.pickmedialist)}
                        </option>
                        {medialistData &&
                          medialistData.results.map((medialistOptions) => (
                            <option
                              value={medialistOptions.id}
                              key={`medialist-${medialistOptions.id}`}
                            >
                              {medialistOptions.name}
                            </option>
                          ))}
                      </Field>
                    </div>
                  </div>
                )}
              </div>
              {mediaType === MediaType.TV && data && !isMovie(data) && (
                <>
                  <div className="form-row">
                    <label htmlFor="season" className="text-label">
                      {intl.formatMessage(messages.seasonLabel)}
                      <span className="label-required">*</span>
                    </label>
                    <div className="form-input-area">
                      <div className="form-input-field">
                        <Field
                          as="select"
                          id="season"
                          name="season"
                          disabled={availableSeasons.length === 1}
                        >
                          {availableSeasons.length > 1 && (
                            <option value={0}>
                              {intl.formatMessage(messages.allseasons)}
                            </option>
                          )}
                          {availableSeasons.map((season) => (
                            <option value={season} key={`season-${season}`}>
                              {season === 0
                                ? intl.formatMessage(messages.extras)
                                : intl.formatMessage(messages.season, {
                                    seasonNumber: season,
                                  })}
                            </option>
                          ))}
                        </Field>
                      </div>
                    </div>
                  </div>
                  {values.season > 0 && (
                    <div className="form-row mb-2">
                      <label htmlFor="episode" className="text-label">
                        {intl.formatMessage(messages.episodeLabel)}
                        <span className="label-required">*</span>
                      </label>
                      <div className="form-input-area">
                        <div className="form-input-field">
                          <Field as="select" id="episode" name="episode">
                            <option value={0}>
                              {intl.formatMessage(messages.allepisodes)}
                            </option>
                            {[
                              ...Array(
                                data.seasons.find(
                                  (season) =>
                                    Number(values.season) ===
                                    season.seasonNumber
                                )?.episodeCount ?? 0
                              ),
                            ].map((i, index) => (
                              <option
                                value={index + 1}
                                key={`episode-${index + 1}`}
                              >
                                {intl.formatMessage(messages.episode, {
                                  episodeNumber: index + 1,
                                })}
                              </option>
                            ))}
                          </Field>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {errors.medialist &&
                touched.medialist &&
                typeof errors.medialist === 'string' && (
                  <div className="error">{errors.medialist}</div>
                )}
            </>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default CreateMedialistItemModal;
