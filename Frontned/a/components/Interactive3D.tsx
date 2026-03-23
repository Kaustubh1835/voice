"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "next-themes";

function ParticleField({ count = 2500 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const particleColor = isDark ? "#3b82f6" : "#2563eb";

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate particles in a 3D volume
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 45; // Spread horizontally
      const y = (Math.random() - 0.5) * 20; // Spread vertically
      const z = (Math.random() - 0.5) * 10; // Shallow depth
      const speed = 0.01 + Math.random() / 200;
      temp.push({ x, y, z, originalX: x, originalY: y, originalZ: z, speed });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;

    // Use state.pointer (-1 to +1 range) translated to scene coordinates
    const mouseX = (state.pointer.x * state.viewport.width) / 2;
    const mouseY = (state.pointer.y * state.viewport.height) / 2;

    if (light.current) {
      // Light source strictly follows the mouse
      light.current.position.x = mouseX;
      light.current.position.y = mouseY;
    }

    particles.forEach((particle, i) => {
      let { x, y, z, originalX, originalY, speed } = particle;

      // Calculate distance to mouse point strictly on X/Y axis
      const dx = mouseX - x;
      const dy = mouseY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Mouse repulsion radius max 4 units
      const maxDistance = 4;
      const force = Math.max(0, maxDistance - dist);

      // Apply repulsion force away from the mouse
      const targetX = originalX - dx * force * 0.15;
      const targetY = originalY - dy * force * 0.15;

      // Smooth interpolation for fluid returning motion
      particle.x += (targetX - x) * 0.1;
      particle.y += (targetY - y) * 0.1;

      // Tiny natural oscillation to look alive
      const time = state.clock.getElapsedTime();
      const floatY = Math.sin(time * speed * 50 + originalX) * 0.15;

      dummy.position.set(particle.x, particle.y + floatY, z);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <pointLight ref={light} distance={15} intensity={8} color={isDark ? "#60a5fa" : "#3b82f6"} />
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color={particleColor} 
          transparent 
          opacity={isDark ? 0.7 : 0.9} 
          roughness={0.6} 
        />
      </instancedMesh>
    </>
  );
}

export default function Interactive3D() {
  return (
    <div style={{ 
      width: "100%", 
      height: "480px", 
      position: "relative",
      background: "transparent",
      overflow: "hidden",
      borderTop: "1px solid var(--bg-secondary)",
      borderBottom: "1px solid var(--bg-secondary)",
      margin: "40px 0",
      backgroundColor: "var(--bg-primary)"
    }}>
      {/* Soft gradient accent lighting behind the 3D scene */}
      <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05), transparent 70%)",
          zIndex: 0,
          pointerEvents: "none"
      }} />

      {/* The 3D Canvas captures the mouse events */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", cursor: "crosshair" }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <ParticleField count={3000} />
        </Canvas>
      </div>
      
      {/* Decorative overlay text */}
      <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          pointerEvents: "none", zIndex: 2, textAlign: "center",
          background: "var(--bg-nav)", padding: "20px 32px",
          borderRadius: "24px", border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)"
      }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.03em" }}>Interactive Intelligence</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Hover the grid array to see it react physically to your mouse map.</p>
      </div>
    </div>
  );
}
