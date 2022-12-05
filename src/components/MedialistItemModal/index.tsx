import CreateMedialistItemModal from '@app/components/MedialistItemModal/CreateMedialistItemModal';
import { Transition } from '@headlessui/react';
import type { MediaType } from '@server/constants/media';

interface MedialistItemModalProps {
  show?: boolean;
  onCancel: () => void;
  mediaType: MediaType;
  tmdbId: number;
}

const MedialistItemModal = ({
  show,
  mediaType,
  onCancel,
  tmdbId,
}: MedialistItemModalProps) => (
  <Transition
    as="div"
    enter="transition opacity-0 duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave="transition opacity-100 duration-300"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
    show={show}
  >
    <CreateMedialistItemModal
      mediaType={mediaType}
      onCancel={onCancel}
      tmdbId={tmdbId}
    />
  </Transition>
);

export default MedialistItemModal;
