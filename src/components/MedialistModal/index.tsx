import CreateMedialistModal from '@app/components/MedialistModal/CreateMedialistModal';
import { Transition } from '@headlessui/react';

interface MedialistItemModalProps {
  show?: boolean;
  onCancel: () => void;
}

const MedialistModal = ({ show, onCancel }: MedialistItemModalProps) => (
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
    <CreateMedialistModal onCancel={onCancel} />
  </Transition>
);

export default MedialistModal;
