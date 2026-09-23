import React, { createContext, useContext, useState, useEffect } from 'react';
import { castService, CastSessionState, CastType, CastDisplayOptions } from '../services/castService';

interface CastContextType extends CastSessionState {
  requestCast: () => Promise<boolean>;
  triggerGoogleCast: () => Promise<boolean>;
  triggerAirPlay: () => Promise<boolean>;
  triggerRemotePlayback: () => Promise<boolean>;
  endCast: () => void;
  isCastModalOpen: boolean;
  setIsCastModalOpen: (open: boolean) => void;
  openCastModal: () => void;
  closeCastModal: () => void;
  setDisplayOptions: (options: Partial<CastDisplayOptions>) => void;
}

const CastContext = createContext<CastContextType | undefined>(undefined);

export const CastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [castState, setCastState] = useState<CastSessionState>(castService.getState());
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = castService.subscribe((newState) => {
      setCastState(newState);
    });
    return unsubscribe;
  }, []);

  const openCastModal = () => setIsCastModalOpen(true);
  const closeCastModal = () => setIsCastModalOpen(false);

  const requestCast = async () => {
    // If modal is opened, user can choose target, or it can attempt native picker
    const success = await castService.requestCast();
    if (!success) {
      // Open modal if direct request didn't trigger
      setIsCastModalOpen(true);
    }
    return success;
  };

  return (
    <CastContext.Provider
      value={{
        ...castState,
        requestCast,
        triggerGoogleCast: () => castService.triggerGoogleCast(),
        triggerAirPlay: () => castService.triggerAirPlay(),
        triggerRemotePlayback: () => castService.triggerRemotePlayback(),
        endCast: () => castService.endCast(),
        isCastModalOpen,
        setIsCastModalOpen,
        openCastModal,
        closeCastModal,
        setDisplayOptions: (opts) => castService.setDisplayOptions(opts),
      }}
    >
      {children}
    </CastContext.Provider>
  );
};

export const useCast = () => {
  const context = useContext(CastContext);
  if (!context) {
    throw new Error('useCast must be used within a CastProvider');
  }
  return context;
};
