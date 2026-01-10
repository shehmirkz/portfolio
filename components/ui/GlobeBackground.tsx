"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const World = dynamic(() => import("./Globe").then((m) => m.World), {
    ssr: false,
});

export function GlobeBackground() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const globeConfig = {
        pointSize: 3,
        globeColor: "#062056",
        showAtmosphere: true,
        atmosphereColor: "#FFFFFF",
        atmosphereAltitude: 0.1,
        emissive: "#062056",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        polygonColor: "rgba(255,255,255,0.7)",
        ambientLight: "#38bdf8",
        directionalLeftLight: "#ffffff",
        directionalTopLight: "#ffffff",
        pointLight: "#ffffff",
        arcTime: 1000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        initialPosition: { lat: 22.3193, lng: 114.1694 },
        autoRotate: true,
        autoRotateSpeed: 0.5,
    };

    const sampleArcs = [
        {
            order: 1,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -22.9068,
            endLng: -43.1729,
            arcAlt: 0.1,
            color: "#06b6d4",
        },
        {
            order: 2,
            startLat: 28.6139,
            startLng: 77.209,
            endLat: 3.139,
            endLng: 101.6869,
            arcAlt: 0.2,
            color: "#3b82f6",
        },
        {
            order: 3,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -1.303396,
            endLng: 36.852443,
            arcAlt: 0.5,
            color: "#6366f1",
        },
    ];

    if (!isMounted) {
        return null;
    }

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ width: '100%', height: '100%', left: 0, top: 0, right: 0, bottom: 0 }}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <World data={sampleArcs} globeConfig={globeConfig} />
            </div>
        </div>
    );
}

