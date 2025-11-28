"use client";

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => <p>Loading Map...</p>
});

export default function MapPage() {
    return <MapComponent />;
}
