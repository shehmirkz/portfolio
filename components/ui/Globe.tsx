"use client";
import React, { Component, useEffect, useRef, useState } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import { useThree, Object3DNode, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

declare module "@react-three/fiber" {
    interface ThreeElements {
        threeGlobe: Object3DNode<any, any>;
    }
}

/** Recursively sanitize GeoJSON coordinates so no NaN/undefined reaches three-globe (avoids computeBoundingSphere NaN crash). */
function sanitizeGeoJSONCoordinates(coords: unknown): unknown {
    if (Array.isArray(coords)) {
        return coords.map((item) => sanitizeGeoJSONCoordinates(item));
    }
    if (typeof coords === "number") {
        return Number.isFinite(coords) ? coords : 0;
    }
    return coords;
}

type GeoFeature = { type: string; geometry: { type: string; coordinates: unknown }; properties?: unknown };

/** Returns a copy of features with all coordinates validated (finite numbers only). */
function getSanitizedFeatures(): GeoFeature[] {
    const raw = (countries as { features?: GeoFeature[] }).features ?? [];
    return raw.map((f) => {
        if (!f?.geometry?.coordinates) return f;
        return {
            ...f,
            geometry: {
                ...f.geometry,
                coordinates: sanitizeGeoJSONCoordinates(f.geometry.coordinates) as number[] | number[][][] | number[][][][],
            },
        };
    });
}

/** Emergency safety net: catches THREE.BufferGeometry computeBoundingSphere NaN and other globe errors. */
class GlobeErrorBoundary extends Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.warn("Invalid geometry skipped", error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

type Position = {
    order: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    arcAlt: number;
    color: string;
};

export type GlobeConfig = {
    pointSize?: number;
    globeColor?: string;
    showAtmosphere?: boolean;
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    emissive?: string;
    emissiveIntensity?: number;
    shininess?: number;
    polygonColor?: string;
    ambientLight?: string;
    directionalLeftLight?: string;
    directionalTopLight?: string;
    pointLight?: string;
    arcTime?: number;
    arcLength?: number;
    rings?: number;
    maxRings?: number;
    initialPosition?: {
        lat: number;
        lng: number;
    };
    autoRotate?: boolean;
    autoRotateSpeed?: number;
};

interface WorldProps {
    globeConfig: GlobeConfig;
    data: Position[];
}

let numbersOfRings = [0];
let ThreeGlobeClass: object | null = null;
let isExtended = false;

const initThreeGlobe = async () => {
    if (typeof window === 'undefined' || ThreeGlobeClass) return;
    try {
        const threeGlobeModule = await import("three-globe");
        ThreeGlobeClass = threeGlobeModule.default;
        if (!isExtended) {
            extend({ ThreeGlobe: ThreeGlobeClass });
            isExtended = true;
        }
    } catch (e) {
        console.error('Failed to load three-globe:', e);
    }
};

export function Globe({ globeConfig, data }: WorldProps) {
    const [globeData, setGlobeData] = useState<
        | {
            size: number;
            order: number;
            color: (t: number) => string;
            lat: number;
            lng: number;
        }[]
        | null
    >(null);
    const [isReady, setIsReady] = useState(false);

    const globeRef = useRef<any | null>(null);

    // Ensure we're on the client side
    useEffect(() => {
        if (typeof window === 'undefined') return;
        initThreeGlobe().then(() => {
            setIsReady(true);
        });
    }, []);

    const defaultProps = {
        pointSize: 1,
        atmosphereColor: "#ffffff",
        showAtmosphere: true,
        atmosphereAltitude: 0.1,
        polygonColor: "rgba(255,255,255,0.7)",
        globeColor: "#1d072e",
        emissive: "#000000",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        arcTime: 2000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        ...globeConfig,
    };

    useEffect(() => {
        if (globeRef.current && isReady) {
            _buildData();
            _buildMaterial();
        }
        // Intentionally run when isReady/data change; _buildData/_buildMaterial close over current data
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, data]);

    const _buildMaterial = () => {
        if (!globeRef.current) return;

        const globeMaterial = globeRef.current.globeMaterial() as unknown as {
            color: Color;
            emissive: Color;
            emissiveIntensity: number;
            shininess: number;
        };
        globeMaterial.color = new Color(globeConfig.globeColor);
        globeMaterial.emissive = new Color(globeConfig.emissive);
        globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
        globeMaterial.shininess = globeConfig.shininess || 0.9;
    };

    const _buildData = () => {
        const arcs = data.filter(
            (arc) =>
                Number.isFinite(arc.startLat) &&
                Number.isFinite(arc.startLng) &&
                Number.isFinite(arc.endLat) &&
                Number.isFinite(arc.endLng) &&
                Number.isFinite(arc.arcAlt)
        );
        let points: { size: number; order: number; color: (t: number) => string; lat: number; lng: number }[] = [];
        for (let i = 0; i < arcs.length; i++) {
            const arc = arcs[i];
            const rgb = hexToRgb(arc.color) as { r: number; g: number; b: number } | null;
            if (!rgb) continue;
            const lat1 = Number(arc.startLat);
            const lng1 = Number(arc.startLng);
            const lat2 = Number(arc.endLat);
            const lng2 = Number(arc.endLng);
            if (Number.isFinite(lat1) && Number.isFinite(lng1)) {
                points.push({
                    size: defaultProps.pointSize,
                    order: arc.order,
                    color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
                    lat: lat1,
                    lng: lng1,
                });
            }
            if (Number.isFinite(lat2) && Number.isFinite(lng2)) {
                points.push({
                    size: defaultProps.pointSize,
                    order: arc.order,
                    color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
                    lat: lat2,
                    lng: lng2,
                });
            }
        }

        // remove duplicates for same lat and lng
        const filteredPoints = points.filter(
            (v, i, a) =>
                a.findIndex((v2) =>
                    ["lat", "lng"].every(
                        (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
                    )
                ) === i
        );

        setGlobeData(filteredPoints);
    };

    useEffect(() => {
        if (globeRef.current && globeData && isReady) {
            try {
                const sanitizedFeatures = getSanitizedFeatures();
                globeRef.current
                    .hexPolygonsData(sanitizedFeatures)
                    .hexPolygonResolution(3)
                    .hexPolygonMargin(0.7)
                    .showAtmosphere(defaultProps.showAtmosphere)
                    .atmosphereColor(defaultProps.atmosphereColor)
                    .atmosphereAltitude(defaultProps.atmosphereAltitude)
                    .hexPolygonColor(() => defaultProps.polygonColor);
                startAnimation();
            } catch (e) {
                console.warn("Invalid geometry skipped", e);
            }
        }
        // Run when globe data is ready; startAnimation/defaultProps are stable for this effect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globeData, isReady]);

    const startAnimation = () => {
        if (!globeRef.current || !globeData) return;

        const validData = data.filter(
            (d: Position) =>
                Number.isFinite(d.startLat) &&
                Number.isFinite(d.startLng) &&
                Number.isFinite(d.endLat) &&
                Number.isFinite(d.endLng) &&
                Number.isFinite(d.arcAlt)
        );
        globeRef.current
            .arcsData(validData)
            .arcStartLat((d: Position) => {
                const x = d.startLat;
                return Number.isFinite(x) ? x : 0;
            })
            .arcStartLng((d: Position) => {
                const x = d.startLng;
                return Number.isFinite(x) ? x : 0;
            })
            .arcEndLat((d: Position) => {
                const x = d.endLat;
                return Number.isFinite(x) ? x : 0;
            })
            .arcEndLng((d: Position) => {
                const x = d.endLng;
                return Number.isFinite(x) ? x : 0;
            })
            .arcColor((e: Position) => e.color)
            .arcAltitude((e: Position) => {
                const alt = e.arcAlt;
                return Number.isFinite(alt) ? alt : 0;
            })
            .arcStroke((_e: Position) => {
                return [0.32, 0.28, 0.3][Math.round(Math.random() * 2)];
            })
            .arcDashLength(defaultProps.arcLength)
            .arcDashInitialGap((e: Position) => {
                const order = e.order;
                return Number.isFinite(Number(order)) ? Number(order) : 0;
            })
            .arcDashGap(15)
            .arcDashAnimateTime(() => defaultProps.arcTime);

        globeRef.current
            .pointsData(validData)
            .pointColor((e: Position) => e.color)
            .pointsMerge(true)
            .pointAltitude(0.0)
            .pointRadius(2);

        globeRef.current
            .ringsData([])
            .ringColor((e: { color: (t: number) => string }) => (t: number) => e.color(t))
            .ringMaxRadius(defaultProps.maxRings)
            .ringPropagationSpeed(RING_PROPAGATION_SPEED)
            .ringRepeatPeriod(
                (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
            );
    };

    useEffect(() => {
        if (!globeRef.current || !globeData || !isReady) return;

        const interval = setInterval(() => {
            if (!globeRef.current || !globeData) return;
            try {
                numbersOfRings = genRandomNumbers(
                    0,
                    data.length,
                    Math.floor((data.length * 4) / 5)
                );
                globeRef.current.ringsData(
                    globeData.filter((d, i) => numbersOfRings.includes(i))
                );
            } catch (e) {
                console.warn("Invalid geometry skipped", e);
            }
        }, 2000);

        return () => {
            clearInterval(interval);
        };
        // globeRef.current is a ref; we only re-run when globe data or readiness changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globeData, isReady, data.length]);

    if (typeof window === 'undefined' || !isReady) {
        return null;
    }

    return (
        <>
            <threeGlobe ref={globeRef} />
        </>
    );
}

export function WebGLRendererConfig() {
    const { gl, size } = useThree();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            gl.setPixelRatio(window.devicePixelRatio);
        }
        gl.setSize(size.width, size.height);
        gl.setClearColor(0xffaaff, 0);
    }, [gl, size.width, size.height]);

    return null;
}

function WorldInner(props: WorldProps) {
    const { globeConfig } = props;
    const scene = new Scene();
    scene.fog = new Fog(0xffffff, 400, 2000);
    return (
        <Canvas scene={scene} camera={new PerspectiveCamera(50, aspect, 180, 1800)}>
            <WebGLRendererConfig />
            <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
            <directionalLight
                color={globeConfig.directionalLeftLight}
                position={new Vector3(-400, 100, 400)}
            />
            <directionalLight
                color={globeConfig.directionalTopLight}
                position={new Vector3(-200, 500, 200)}
            />
            <pointLight
                color={globeConfig.pointLight}
                position={new Vector3(-200, 500, 200)}
                intensity={0.8}
            />
            <Globe {...props} />
            <OrbitControls
                enablePan={false}
                enableZoom={false}
                minDistance={cameraZ}
                maxDistance={cameraZ}
                autoRotateSpeed={1}
                autoRotate={true}
                minPolarAngle={Math.PI / 3.5}
                maxPolarAngle={Math.PI - Math.PI / 3}
            />
        </Canvas>
    );
}

/** World wrapped with error boundary to catch computeBoundingSphere NaN and other geometry errors. */
export function World(props: WorldProps) {
    return (
        <GlobeErrorBoundary>
            <WorldInner {...props} />
        </GlobeErrorBoundary>
    );
}

export function hexToRgb(hex: string) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
    const arr = [];
    while (arr.length < count) {
        const r = Math.floor(Math.random() * (max - min)) + min;
        if (arr.indexOf(r) === -1) arr.push(r);
    }

    return arr;
}
