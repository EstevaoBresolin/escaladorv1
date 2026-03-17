"use client";

import { useState, useEffect } from "react";
import { CompleteProfileModal } from "./complete-profile-modal";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  profilePhone?: string;
  profileChurchId?: string;
  requireProfileCompletion?: boolean;
}

export function DashboardLayoutClient({
  children,
  profilePhone,
  profileChurchId,
  requireProfileCompletion = true,
}: DashboardLayoutClientProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!requireProfileCompletion) {
      setShowModal(false);
      return;
    }

    // Show modal if phone or church_id is missing
    if (!profilePhone || !profileChurchId) {
      setShowModal(true);
    }
  }, [profilePhone, profileChurchId, requireProfileCompletion]);

  return (
    <>
      {children}
      <CompleteProfileModal
        isOpen={showModal}
        userPhone={profilePhone}
        userChurchId={profileChurchId}
        onComplete={() => setShowModal(false)}
      />
    </>
  );
}
