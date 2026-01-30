"use client";

import { useState, useEffect } from "react";
import { CompleteProfileModal } from "./complete-profile-modal";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  profilePhone?: string;
  profileChurchId?: string;
}

export function DashboardLayoutClient({
  children,
  profilePhone,
  profileChurchId,
}: DashboardLayoutClientProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show modal if phone or church_id is missing
    if (!profilePhone || !profileChurchId) {
      setShowModal(true);
    }
  }, [profilePhone, profileChurchId]);

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
