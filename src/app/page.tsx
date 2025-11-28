"use client";

import React, { useState } from 'react';
import WeatherDashboard from "@/components/WeatherDashboard";
import WeatherReportingModal from "@/components/WeatherReportingModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div>
      <WeatherDashboard />
      <WeatherReportingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
