"use client";

import { useState, useEffect } from "react";
import { CompleteProfileModal } from "./complete-profile-modal";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  profilePhone?: string;
  profileBirthDate?: string;
  profileChurchId?: string;
  requireProfileCompletion?: boolean;
}

export function DashboardLayoutClient({
  children,
  profilePhone,
  profileBirthDate,
  profileChurchId,
  requireProfileCompletion = true,
}: DashboardLayoutClientProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!requireProfileCompletion) {
      setShowModal(false);
      return;
    }

    if (!profilePhone || !profileBirthDate || !profileChurchId) {
      setShowModal(true);
    }
  }, [
    profilePhone,
    profileBirthDate,
    profileChurchId,
    requireProfileCompletion,
  ]);

  return (
    <>
      {children}
      <CompleteProfileModal
        isOpen={showModal}
        userPhone={profilePhone}
        userBirthDate={profileBirthDate}
        userChurchId={profileChurchId}
        onComplete={() => setShowModal(false)}
      />
    </>
  );
}
