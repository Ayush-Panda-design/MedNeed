'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // ==========================================
    // LIGHTING SYSTEM
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x3b82f6, 3.5); // Rich medical blue
    mainLight.position.set(5, 6, 5);
    scene.add(mainLight);

    const tealRimLight = new THREE.DirectionalLight(0x14b8a6, 3.2); // Vibrant teal
    tealRimLight.position.set(-5, -4, -3);
    scene.add(tealRimLight);

    const specularLight = new THREE.PointLight(0xffffff, 2.5, 20);
    specularLight.position.set(0, 4, 4);
    scene.add(specularLight);

    // ==========================================
    // 3D MAIN OBJECTS GROUP
    // ==========================================
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Capsule Group
    const capsuleGroup = new THREE.Group();
    rootGroup.add(capsuleGroup);

    // Create dual-tone capsule
    // We construct two halves: Blue half & Teal half
    const capRadius = 0.72;
    const halfHeight = 0.75;

    // Half 1: Upper cylinder + hemisphere (Vibrant Royal Blue)
    const blueCylinderGeo = new THREE.CylinderGeometry(capRadius, capRadius, halfHeight, 32, 1, true);
    const blueSphereGeo = new THREE.SphereGeometry(capRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    
    const blueMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      metalness: 0.15,
      roughness: 0.18,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8,
    });

    const blueCylinder = new THREE.Mesh(blueCylinderGeo, blueMat);
    blueCylinder.position.y = halfHeight / 2;
    capsuleGroup.add(blueCylinder);

    const blueCap = new THREE.Mesh(blueSphereGeo, blueMat);
    blueCap.position.y = halfHeight;
    capsuleGroup.add(blueCap);

    // Half 2: Lower cylinder + hemisphere (Vibrant Emerald Teal with glassy translucency)
    const tealCylinderGeo = new THREE.CylinderGeometry(capRadius, capRadius, halfHeight, 32, 1, true);
    const tealSphereGeo = new THREE.SphereGeometry(capRadius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

    const tealMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d9488,
      metalness: 0.1,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });

    const tealCylinder = new THREE.Mesh(tealCylinderGeo, tealMat);
    tealCylinder.position.y = -halfHeight / 2;
    capsuleGroup.add(tealCylinder);

    const tealCap = new THREE.Mesh(tealSphereGeo, tealMat);
    tealCap.position.y = -halfHeight;
    capsuleGroup.add(tealCap);

    // Central Silver Metallic Ring band
    const ringGeo = new THREE.TorusGeometry(capRadius + 0.02, 0.035, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.1,
    });
    const midRing = new THREE.Mesh(ringGeo, ringMat);
    midRing.rotation.x = Math.PI / 2;
    capsuleGroup.add(midRing);

    // Floating micro-pellets (bio-active medicine spheres orbiting the capsule)
    const pelletsGroup = new THREE.Group();
    capsuleGroup.add(pelletsGroup);

    const pelletGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const pelletColors = [0x60a5fa, 0x34d399, 0xfbbf24, 0xf43f5e, 0xa78bfa, 0x38bdf8];
    const pellets: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; y: number; ySpeed: number }[] = [];

    for (let i = 0; i < 28; i++) {
      const pColor = pelletColors[i % pelletColors.length];
      const pMat = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.2,
        metalness: 0.3,
        emissive: pColor,
        emissiveIntensity: 0.35,
      });
      const pMesh = new THREE.Mesh(pelletGeo, pMat);
      const angle = (i / 28) * Math.PI * 2;
      const radius = 1.1 + Math.random() * 0.7;
      const y = (Math.random() - 0.5) * 2.2;
      pMesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      pelletsGroup.add(pMesh);

      pellets.push({
        mesh: pMesh,
        angle,
        speed: 0.015 + Math.random() * 0.02,
        radius,
        y,
        ySpeed: (Math.random() - 0.5) * 0.01,
      });
    }

    // ==========================================
    // ORBITING HOLOGRAPHIC GYROSCOPE RINGS
    // ==========================================
    const gyroRingGeo1 = new THREE.TorusGeometry(2.0, 0.018, 16, 64);
    const gyroRingMat1 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.45,
    });
    const gyroRing1 = new THREE.Mesh(gyroRingGeo1, gyroRingMat1);
    rootGroup.add(gyroRing1);

    const gyroRingGeo2 = new THREE.TorusGeometry(2.35, 0.015, 16, 64);
    const gyroRingMat2 = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.4,
    });
    const gyroRing2 = new THREE.Mesh(gyroRingGeo2, gyroRingMat2);
    gyroRing2.rotation.x = Math.PI / 3;
    rootGroup.add(gyroRing2);

    // ==========================================
    // 3D DNA DOUBLE HELIX (Diagnostic theme)
    // ==========================================
    const dnaGroup = new THREE.Group();
    dnaGroup.position.set(3.2, 0.2, -1.8);
    dnaGroup.scale.set(0.7, 0.7, 0.7);
    rootGroup.add(dnaGroup);

    const dnaSphereGeo = new THREE.SphereGeometry(0.09, 14, 14);
    const strand1Mat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.5,
    });
    const strand2Mat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      emissive: 0x0f766e,
      emissiveIntensity: 0.5,
    });
    const rungMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.7,
    });

    const numBasePairs = 22;
    for (let i = 0; i < numBasePairs; i++) {
      const t = (i / numBasePairs) * Math.PI * 4;
      const y = (i - numBasePairs / 2) * 0.26;
      const r = 0.65;

      const x1 = Math.cos(t) * r;
      const z1 = Math.sin(t) * r;
      const x2 = Math.cos(t + Math.PI) * r;
      const z2 = Math.sin(t + Math.PI) * r;

      const node1 = new THREE.Mesh(dnaSphereGeo, strand1Mat);
      node1.position.set(x1, y, z1);
      dnaGroup.add(node1);

      const node2 = new THREE.Mesh(dnaSphereGeo, strand2Mat);
      node2.position.set(x2, y, z2);
      dnaGroup.add(node2);

      // Connecting rung
      const rungDist = r * 2;
      const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, rungDist, 8);
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -t;
      dnaGroup.add(rung);
    }

    // ==========================================
    // FLOATING MEDICAL PARTICLES DUST
    // ==========================================
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      particleScales[i] = Math.random() * 0.8 + 0.2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Initial orientation
    capsuleGroup.rotation.z = -Math.PI / 5;
    capsuleGroup.rotation.x = Math.PI / 7;

    setIsLoaded(true);

    // ==========================================
    // MOUSE PARALLAX & SCROLL LISTENER
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.2;
      targetY = y * 1.2;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // ==========================================
    // INTERSECTION OBSERVER & VISIBILITY CONTROLS
    // Pauses render loop when canvas is off-screen or tab is backgrounded
    // ==========================================
    let isIntersecting = true;
    let isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;
    let animationFrameId: number | null = null;
    let clock = new THREE.Clock();

    const startLoop = () => {
      if (animationFrameId !== null) return;
      if (!isIntersecting || !isTabVisible) return;
      clock.start();
      animationFrameId = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      clock.stop();
    };

    const tick = () => {
      if (!isIntersecting || !isTabVisible) {
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(tick);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp mouse & scroll
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      scrollY += (targetScrollY - scrollY) * 0.08;

      // Rotate Capsule continuously + tilt with mouse & scroll
      capsuleGroup.rotation.y = elapsedTime * 0.6 + mouseX * 1.5;
      capsuleGroup.rotation.x = Math.PI / 7 + mouseY * 1.2 + scrollY * 0.002;
      capsuleGroup.rotation.z = -Math.PI / 5 + Math.sin(elapsedTime * 0.8) * 0.1 + scrollY * 0.001;

      // 3D Floating Bobbing effect
      capsuleGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.18 - scrollY * 0.0015;
      capsuleGroup.position.x = mouseX * 0.6;

      // Orbiting Pellets animation
      pellets.forEach((p) => {
        p.angle += p.speed;
        p.y += p.ySpeed;
        if (p.y > 1.2 || p.y < -1.2) p.ySpeed = -p.ySpeed;
        p.mesh.position.x = Math.cos(p.angle) * p.radius;
        p.mesh.position.z = Math.sin(p.angle) * p.radius;
        p.mesh.position.y = p.y;
      });

      // Gyroscope rings rotation
      gyroRing1.rotation.z = elapsedTime * 0.35;
      gyroRing1.rotation.y = elapsedTime * 0.2;
      gyroRing2.rotation.z = -elapsedTime * 0.4;
      gyroRing2.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.5) * 0.2;

      // DNA Helix continuous spin & float
      dnaGroup.rotation.y = elapsedTime * 0.7;
      dnaGroup.position.y = 0.2 + Math.cos(elapsedTime * 1.4) * 0.25 - scrollY * 0.001;

      // Particles gentle drift
      particleSystem.rotation.y = elapsedTime * 0.04;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.03) * 0.1;

      // Camera parallax tilt
      camera.position.x = mouseX * 0.8;
      camera.position.y = -mouseY * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    // 1. Intersection Observer to halt rendering when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (entry.isIntersecting) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(mount);

    // 2. Tab visibility listener to halt rendering when tab is hidden
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && isIntersecting) {
        startLoop();
      } else {
        stopLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Handle WebGL context loss gracefully
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      stopLoop();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    startLoop();

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }

      // Dispose Geometries & Materials
      blueCylinderGeo.dispose();
      blueSphereGeo.dispose();
      tealCylinderGeo.dispose();
      tealSphereGeo.dispose();
      ringGeo.dispose();
      pelletGeo.dispose();
      gyroRingGeo1.dispose();
      gyroRingGeo2.dispose();
      dnaSphereGeo.dispose();
      particleGeo.dispose();

      blueMat.dispose();
      tealMat.dispose();
      ringMat.dispose();
      gyroRingMat1.dispose();
      gyroRingMat2.dispose();
      strand1Mat.dispose();
      strand2Mat.dispose();
      rungMat.dispose();
      particleMat.dispose();

      // Force context loss to immediately free GPU memory and stay below browser WebGL context limits
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center justify-center select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />
    </div>
  );
}
