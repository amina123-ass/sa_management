// src/components/ThreeBackground.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Box } from '@mui/material';

const ThreeBackground = ({ variant = 'particles' }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Créer l'effet selon la variante
    let particles;
    let geometry;
    let material;

    if (variant === 'particles') {
      // Effet particules
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 3000;
      const posArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.015,
        color: 0x3498db,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    } else if (variant === 'waves') {
      // Effet vagues
      geometry = new THREE.PlaneGeometry(20, 20, 50, 50);
      material = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 3;
      scene.add(mesh);

      // Lumières
      const light = new THREE.PointLight(0x3498db, 1);
      light.position.set(0, 5, 5);
      scene.add(light);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
    } else if (variant === 'hexagons') {
      // Effet hexagones
      const hexGroup = new THREE.Group();
      
      for (let i = 0; i < 50; i++) {
        const hexGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6);
        const hexMaterial = new THREE.MeshBasicMaterial({
          color: 0x3498db,
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
        
        const hex = new THREE.Mesh(hexGeometry, hexMaterial);
        hex.position.x = (Math.random() - 0.5) * 20;
        hex.position.y = (Math.random() - 0.5) * 20;
        hex.position.z = (Math.random() - 0.5) * 10;
        hex.rotation.y = Math.random() * Math.PI;
        
        hexGroup.add(hex);
      }
      
      scene.add(hexGroup);
      particles = hexGroup;
    }

    // Animation
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    document.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (variant === 'particles' && particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x = mouseY * 0.1;
        particles.rotation.z = mouseX * 0.1;
      } else if (variant === 'waves' && geometry) {
        const time = Date.now() * 0.001;
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          positions[i + 2] = Math.sin(x * 0.5 + time) * 0.5 + 
                            Math.cos(y * 0.5 + time) * 0.5;
        }
        
        geometry.attributes.position.needsUpdate = true;
      } else if (variant === 'hexagons' && particles) {
        particles.rotation.y += 0.002;
        particles.children.forEach((hex, i) => {
          hex.rotation.y += 0.01 + (i * 0.0001);
          hex.rotation.x += 0.005;
        });
      }

      camera.position.x = mouseX * 0.5;
      camera.position.y = mouseY * 0.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [variant]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2842 50%, #2c3e50 100%)',
      }}
    />
  );
};

export default ThreeBackground;