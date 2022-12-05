import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import { ArrowCircleRightIcon } from '@heroicons/react/solid';
import type Medialist from '@server/entity/Medialist';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import * as Yup from 'yup';

const messages = defineMessages({
  modalTitle: 'Create Medialist',
  validationMessageRequired: 'You must provide a name',
  extras: 'Extras',
  toastSuccessCreate: 'Medialist submitted successfully!',
  toastFailedCreate: 'Something went wrong while creating the medialist.',
  toastViewMedialist: 'View Medialist',
  submitMedialist: 'Submit Medialist',
  medialistNameLabel: 'Name',
  overviewLabel: 'Overview',
  sourceUrlLabel: 'List Source',
  sourceUrlTip: 'url to pull media from.  allowed urls only',
  autoUpdateLabel: 'Keep List Updated',
  autoUpdateTip:
    'Keeps list updated with source.  Cannot add or remove items from the list',
  backdropUrlLabel: 'Backdrop Image Url',
  posterUrlLabel: 'Poster Image Url',
});

interface CreateMedialistModalProps {
  onCancel?: () => void;
}

const CreateMedialistModal = ({ onCancel }: CreateMedialistModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();

  const CreateMedialistItemModalSchema = Yup.object().shape({
    medialistName: Yup.string().required(
      intl.formatMessage(messages.validationMessageRequired)
    ),
  });

  return (
    <Formik
      initialValues={{
        medialistName: '',
        overview: '',
        sourceUrl: '',
        autoUpdate: false,
        backdropUrl: '',
        posterUrl: '',
      }}
      validationSchema={CreateMedialistItemModalSchema}
      onSubmit={async (values) => {
        try {
          const newMedialist = await axios.post<Medialist>(
            `/api/v1/medialist`,
            {
              ...values,
              name: values.medialistName,
            }
          );

          addToast(
            <>
              <div>
                {intl.formatMessage(messages.toastSuccessCreate, {
                  title: newMedialist.data.name,
                  strong: (msg: React.ReactNode) => <strong>{msg}</strong>,
                })}
              </div>
              <Link href={`/medialists/${newMedialist.data.id}`}>
                <Button as="a" className="mt-4">
                  <span>{intl.formatMessage(messages.toastViewMedialist)}</span>
                  <ArrowCircleRightIcon />
                </Button>
              </Link>
            </>,
            {
              appearance: 'success',
              autoDismiss: true,
            }
          );

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
      {({ handleSubmit, errors, touched }) => {
        return (
          <Modal
            backgroundClickable
            onCancel={onCancel}
            title={intl.formatMessage(messages.modalTitle)}
            cancelText={intl.formatMessage(globalMessages.close)}
            onOk={() => handleSubmit()}
            okText={intl.formatMessage(messages.submitMedialist)}
          >
            <Form className="section">
              <div className="form-row">
                <label htmlFor="medialistName" className="text-label">
                  {intl.formatMessage(messages.medialistNameLabel)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      type="text"
                      id="medialistName"
                      name="medialistName"
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="overview" className="text-label">
                  {intl.formatMessage(messages.overviewLabel)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field as="textarea" id="overview" name="overview" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="sourceUrl" className="text-label">
                  {intl.formatMessage(messages.sourceUrlLabel)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.sourceUrlTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field type="text" id="sourceUrl" name="sourceUrl" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="autoUpdate" className="checkbox-label">
                  {intl.formatMessage(messages.autoUpdateLabel)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.autoUpdateTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field type="checkbox" id="autoUpdate" name="autoUpdate" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="backdropUrl" className="text-label">
                  {intl.formatMessage(messages.backdropUrlLabel)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field type="text" id="backdropUrl" name="backdropUrl" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="posterUrl" className="text-label">
                  {intl.formatMessage(messages.posterUrlLabel)}
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field type="text" id="posterUrl" name="posterUrl" />
                  </div>
                </div>
              </div>
              {errors.medialistName &&
                touched.medialistName &&
                typeof errors.medialistName === 'string' && (
                  <div className="error">{errors.medialistName}</div>
                )}
            </Form>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default CreateMedialistModal;
