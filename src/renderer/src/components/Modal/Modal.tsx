import React from 'react';
import ReactModal, { Props } from 'react-modal';

import { ReactComponent as Cross } from '@renderer/assets/icons/cross.svg';

import './style.css';

ReactModal.setAppElement('#root');

interface ModalProps extends Props {
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ children, title, ...props }) => {
  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-28 w-full max-w-3xl -translate-x-1/2 rounded-lg bg-neutral-800 p-6 text-neutral-100 outline-none"
      overlayClassName="bg-neutral-700 fixed inset-0 backdrop-blur"
      closeTimeoutMS={100}
    >
      <div className="relative mb-5 flex items-center justify-between border-b border-neutral-400 pb-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          className="rounded-full border-none p-3 text-neutral-50 shadow-none outline-1 outline-neutral-100 transition-colors hover:bg-neutral-700"
          onClick={props.onRequestClose}
        >
          <Cross width="1rem" height="1rem" />
        </button>
      </div>

      {children}
    </ReactModal>
  );
};
