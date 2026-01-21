import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

interface HighFidConnectionProps {
    start: THREE.Vector3;
    end: THREE.Vector3;
}

export function HighFidConnection({ start, end }: HighFidConnectionProps) {
    const mid = useMemo(() => {
        const m = start.clone().lerp(end, 0.5);
        m.add(new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        ));
        return m;
    }, [start, end]);

    const lineRef = useRef<any>(null!);

    useFrame(() => {
        if (lineRef.current) {
            // Constant subtle animation of the mid point could go here
        }
    });

    const threads = useMemo(() => {
        return [...Array(4)].map((_, i) => {
            const offset = (Math.random() - 0.5) * 1.5;
            const midPoint = mid.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 1.2
            ));
            return { offset, midPoint, color: i % 2 === 0 ? "#00ffff" : "#ff00ff" };
        });
    }, [mid]);

    useFrame(() => {
        if (lineRef.current) {
            lineRef.current.dashOffset -= 0.01;
        }
    });

    return (
        <group>
            {/* Primary Connection Line */}
            <QuadraticBezierLine
                ref={lineRef}
                start={start}
                end={end}
                mid={mid}
                color="#00ffff"
                lineWidth={0.8}
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
                dashed
                dashScale={50}
                dashSize={1}
            />

            {/* Synaptic threads */}
            {threads.map((thread, i) => (
                <QuadraticBezierLine
                    key={i}
                    start={start}
                    end={end}
                    mid={thread.midPoint}
                    color={thread.color}
                    lineWidth={0.3}
                    transparent
                    opacity={0.08}
                    blending={THREE.AdditiveBlending}
                />
            ))}
        </group>
    );
}
