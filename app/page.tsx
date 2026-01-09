"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Settings2 } from 'lucide-react';

// Glass Panel Component
const GlassPanel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 100 }}
    className={`bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-xl p-4 pointer-events-auto ${className}`}
  >
    {children}
  </motion.div>
);

// Custom Slider Component
const Slider = ({ label, value, onChange, min, max, step, unit }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <label className="text-xs text-slate-300">{label}</label>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="font-mono text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"
      >
        {value}{unit}
      </motion.span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, #334155 ${((value - min) / (max - min)) * 100}%, #334155 100%)`
      }}
    />
  </div>
);

// Compact Stat Card Component
const StatCard = ({ label, value, unit }: { label: string; value: string | number; unit: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-slate-950/20 backdrop-blur-sm border border-slate-800/30 rounded-md px-2 py-1"
  >
    <div className="text-[8px] text-slate-500 mb-0">{label}</div>
    <div className="font-mono text-sm font-bold text-white">
      {value}<span className="text-[10px] text-blue-400 ml-0.5">{unit}</span>
    </div>
  </motion.div>
);

// Projectile Component with Enhanced Visual Effects
const Projectile = ({ position, isFlying, trail, velocity }: {
  position: { x: number; y: number; z: number };
  isFlying: boolean;
  trail: any[];
  velocity: { x: number; y: number } | null;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.ArrowHelper>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && position) {
      meshRef.current.position.set(position.x, position.y, position.z);
    }

    // Pulsing glow effect based on speed
    if (glowRef.current && isFlying) {
      const scale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      glowRef.current.scale.set(scale, scale, scale);
    }

    // Update velocity arrow direction and size in real-time
    if (arrowRef.current && velocity && isFlying) {
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      const direction = new THREE.Vector3(velocity.x, velocity.y, 0).normalize();
      const arrowLength = speed * 0.35;
      
      arrowRef.current.setDirection(direction);
      arrowRef.current.setLength(arrowLength, arrowLength * 0.3, arrowLength * 0.2);
    }
  });

  const speed = velocity ? Math.sqrt(velocity.x ** 2 + velocity.y ** 2) : 0;
  const speedIntensity = Math.min(speed / 30, 1);

  return (
    <group>
      {/* Multi-layered Trail System */}
      <Trail
        width={2}
        length={15}
        color={new THREE.Color(0.4, 0.7, 1)}
        attenuation={(t) => Math.pow(t, 1.2)}
      >
        <Trail
          width={3.5}
          length={12}
          color={new THREE.Color(0.2, 0.5, 1)}
          attenuation={(t) => Math.pow(t, 2)}
        >
          <mesh ref={meshRef}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive={isFlying ? "#60a5fa" : "#3b82f6"}
              emissiveIntensity={isFlying ? 1.5 : 0.3}
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
        </Trail>
      </Trail>
      
      {/* Dynamic Glow Sphere */}
      {isFlying && (
        <mesh ref={glowRef} position={[position.x, position.y, position.z]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial 
            color={new THREE.Color(0.3 + speedIntensity * 0.3, 0.6, 1)} 
            transparent 
            opacity={0.25 + speedIntensity * 0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Energy Ring Effect */}
      {isFlying && (
        <mesh position={[position.x, position.y, position.z]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.65, 32]} />
          <meshBasicMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Speed Lines */}
      {isFlying && speed > 15 && velocity && (
        <>
          {[...Array(5)].map((_, i) => {
            const offset = (i - 2) * 0.15;
            return (
              <mesh 
                key={i}
                position={[
                  position.x - velocity.x * 0.1 * (i + 1),
                  position.y - velocity.y * 0.1 * (i + 1) + offset,
                  position.z
                ]}
              >
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial 
                  color="#60a5fa" 
                  transparent 
                  opacity={0.6 - i * 0.12}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </>
      )}
      
      {/* Enhanced Velocity Vector Arrow */}
      {isFlying && velocity && (
        <arrowHelper
          ref={arrowRef}
          args={[
            new THREE.Vector3(velocity.x, velocity.y, 0).normalize(),
            new THREE.Vector3(position.x, position.y, position.z),
            speed * 0.35,
            0xffff00,
            0.6,
            0.4
          ]}
        />
      )}
      
      {/* Enhanced Landing marker */}
      {position.y <= 0.3 && !isFlying && (
        <>
          <mesh position={[position.x, 0.05, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.6, 32]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
          </mesh>
          <mesh position={[position.x, 0.06, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 1.0, 32]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.2} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Enhanced Predictive Trajectory Path with Markers
const PredictiveTrajectory = ({ angle, velocity, gravity, show }: {
  angle: number;
  velocity: number;
  gravity: number;
  show: boolean;
}) => {
  if (!show) return null;

  const points = [];
  const rad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(rad);
  const vy = velocity * Math.sin(rad);
  
  const totalTime = (2 * vy) / gravity;
  
  // Calculate apex (highest point)
  const timeToApex = vy / gravity;
  const apexX = -1 + vx * timeToApex; // Start from batsman position
  const apexY = 1 + (vy * vy) / (2 * gravity);
  
  // Landing position
  const landingX = -1 + vx * totalTime; // Start from batsman position
  
  // Generate parabolic path points
  const numPoints = 60;
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * totalTime;
    const x = -1 + vx * t; // Start from batsman position at x = -1
    const y = Math.max(0.15, 1 + vy * t - 0.5 * gravity * t * t);
    points.push(new THREE.Vector3(x, y, 0));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);

  return (
    <group>
      {/* Main glowing trajectory tube */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial 
          color="#60a5fa" 
          transparent 
          opacity={0.5}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 0.2, 8, false)}>
        <meshBasicMaterial 
          color="#3b82f6" 
          transparent 
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Apex marker - highest point */}
      <group position={[apexX, apexY, 0]}>
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.3, 0.5, 32]} />
          <meshBasicMaterial 
            color="#fbbf24" 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Vertical line to ground */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, 0, -apexY + 0.3, 0])}
              itemSize={3}
              args={[null, 3, 2] as any}
            />
          </bufferGeometry>
          <lineDashedMaterial color="#fbbf24" transparent opacity={0.4} dashSize={0.3} gapSize={0.2} />
        </line>
      </group>

      {/* Landing zone marker */}
      <group position={[landingX, 0.05, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.9, 32]} />
          <meshBasicMaterial 
            color="#10b981" 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.3, 32]} />
          <meshBasicMaterial 
            color="#10b981" 
            transparent 
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Vertical beam */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 3, 8]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Launch point marker */}
      <group position={[-1, 1, 0]}>
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.25, 0.4, 32]} />
          <meshBasicMaterial 
            color="#ef4444" 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

// Batsman Component
const Batsman = ({ isSwinging }: { isSwinging: boolean }) => {
  const batsmanRef = useRef<THREE.Group>(null);
  const batRef = useRef<THREE.Group>(null);
  const swingProgressRef = useRef(0);

  useFrame((state, delta) => {
    if (isSwinging && batRef.current) {
      // Smooth swing animation over 0.5 seconds
      swingProgressRef.current += delta * 4;
      
      if (swingProgressRef.current <= 1) {
        // Swing forward (0 to PI/2)
        const swingAngle = Math.sin(swingProgressRef.current * Math.PI) * (Math.PI / 2);
        batRef.current.rotation.z = Math.PI / 6 - swingAngle;
        batRef.current.rotation.y = -swingAngle * 0.3;
      } else {
        // Hold final position
        batRef.current.rotation.z = Math.PI / 6 - Math.PI / 2;
        batRef.current.rotation.y = -Math.PI / 6;
      }
    } else {
      // Reset to initial position
      swingProgressRef.current = 0;
      if (batRef.current) {
        batRef.current.rotation.z = Math.PI / 6;
        batRef.current.rotation.y = 0;
      }
    }
  });

  return (
    <group ref={batsmanRef} position={[-1, 0, 0.5]} rotation={[0, Math.PI / 4, 0]}>
      {/* Body */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 1.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>
      
      {/* Helmet */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1, 8]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0.15, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1, 8]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Cricket Bat */}
      <group ref={batRef} position={[-0.2, 0.8, -0.3]} rotation={[0, 0, Math.PI / 6]}>
        {/* Blade */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.15, 0.8, 0.05]} />
          <meshStandardMaterial color="#f5deb3" />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </group>
    </group>
  );
};

// Cricket Stumps
const Stumps = () => (
  <group>
    {/* Batting end stumps (behind batsman) */}
    {[...Array(3)].map((_, i) => (
      <mesh key={i} position={[-1.8, 0.4, -0.15 + i * 0.15]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
    ))}
    {/* Bowling end stumps (22 yards away) */}
    {[...Array(3)].map((_, i) => (
      <mesh key={`bowl-${i}`} position={[18.2, 0.4, -0.15 + i * 0.15]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
    ))}
  </group>
);

// Cricket Ground Component
const CricketGround = () => (
  <>
    {/* Main grass field */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#228B22" roughness={0.9} />
    </mesh>
    
    {/* Cricket pitch strip (22 yards = 20.12m long, 3m wide) */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.2, 0.01, 0]} receiveShadow>
      <planeGeometry args={[22, 3]} />
      <meshStandardMaterial color="#D2B48C" roughness={0.8} />
    </mesh>
    
    {/* Batting crease line (at batsman's position) */}
    <mesh position={[-1.8, 0.02, 0]}>
      <boxGeometry args={[0.08, 0.05, 2.6]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    
    {/* Bowling crease line (at bowling end) */}
    <mesh position={[18.2, 0.02, 0]}>
      <boxGeometry args={[0.08, 0.05, 2.6]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    
    {/* Popping crease (1.22m in front of batting stumps) */}
    <mesh position={[-0.58, 0.02, 0]}>
      <boxGeometry args={[0.05, 0.05, 3.66]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    
    {/* Grid lines for reference */}
    <Grid
      args={[100, 100]}
      cellSize={5}
      cellThickness={0.5}
      cellColor="#2d5016"
      sectionSize={10}
      sectionThickness={1}
      sectionColor="#3d6b1f"
      fadeDistance={50}
      fadeStrength={1}
      followCamera={false}
      position={[0, 0.02, 0]}
    />
  </>
);

// Ground Grid Component
const GroundGrid = () => (
  <>
    <Grid
      args={[100, 100]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#334155"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#475569"
      fadeDistance={50}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
    />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.3} />
    </mesh>
  </>
);

// Main Scene Component
const Scene = ({ angle, velocity, gravity, bounce, onStatsUpdate, isLaunched, onLaunchComplete }: {
  angle: number;
  velocity: number;
  gravity: number;
  bounce: number;
  onStatsUpdate: (stats: any) => void;
  isLaunched: boolean;
  onLaunchComplete: () => void;
}) => {
  const [position, setPosition] = useState({ x: 0, y: 1, z: 0 });
  const [isFlying, setIsFlying] = useState(false);
  const timeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const startPositionRef = useRef({ x: 0, y: 0.3 }); // Track starting position for each arc
  const maxHeightRef = useRef(0); // Track maximum height achieved
  const totalTimeRef = useRef(0); // Track total elapsed time
  const [trail, setTrail] = useState<any[]>([]);
  const [currentVelocity, setCurrentVelocity] = useState<{ x: number; y: number } | null>({ x: 0, y: 0 });

  useEffect(() => {
    if (isLaunched) {
      // Vector decomposition: Convert angle and speed into X and Y components
      const rad = (angle * Math.PI) / 180;
      velocityRef.current = {
        x: velocity * Math.cos(rad), // Horizontal component (forward)
        y: velocity * Math.sin(rad)  // Vertical component (upward)
      };
      
      // Reset all tracking variables
      timeRef.current = 0;
      totalTimeRef.current = 0;
      startPositionRef.current = { x: -1, y: 1 }; // Start from batsman position
      maxHeightRef.current = 1;
      setIsFlying(true);
      setTrail([]);
      setPosition({ x: -1, y: 1, z: 0 }); // Start from batsman position
      setCurrentVelocity(velocityRef.current);
    }
  }, [isLaunched, angle, velocity]);

  useFrame((state, delta) => {
    // ═══════════════════════════════════════════════════════════════
    // PHYSICS ENGINE - Classical Mechanics (Kinematics)
    // ═══════════════════════════════════════════════════════════════
    
    if (!isFlying) return;

    // Advance time counters
    timeRef.current += delta;
    totalTimeRef.current += delta;
    const t = timeRef.current; // Time since current arc started

    // ═══════════════════════════════════════════════════════════════
    // KINEMATIC EQUATIONS (Constant Acceleration)
    // ═══════════════════════════════════════════════════════════════
    
    // Position equations with initial position offset for bounces:
    // x(t) = x₀ + v₀ₓ·t           [Uniform motion - no horizontal acceleration]
    // y(t) = y₀ + v₀ᵧ·t - ½g·t²   [Uniformly accelerated motion - gravity acts downward]
    
    const newX = startPositionRef.current.x + velocityRef.current.x * t;
    const newY = startPositionRef.current.y + velocityRef.current.y * t - 0.5 * gravity * t * t;

    // Velocity equations (derivatives of position):
    // vₓ(t) = v₀ₓ              [Constant - no air resistance]
    // vᵧ(t) = v₀ᵧ - g·t        [Linear decrease due to gravity]
    
    const currentVelX = velocityRef.current.x;
    const currentVelY = velocityRef.current.y - gravity * t;

    // Track maximum height achieved during entire flight
    if (newY > maxHeightRef.current) {
      maxHeightRef.current = newY;
    }

    // ═══════════════════════════════════════════════════════════════
    // COLLISION DETECTION & RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    const groundLevel = 0.15; // Cricket ball radius
    
    if (newY <= groundLevel) {
      // Ball has reached or passed through ground level
      
      // Calculate impact velocity magnitude
      const impactSpeed = Math.abs(currentVelY);
      
      // Energy threshold: Below this, friction absorbs remaining energy
      const minimumBounceVelocity = 0.5; // m/s
      
      if (impactSpeed > minimumBounceVelocity) {
        // ═══════════════════════════════════════════════════════════
        // ELASTIC COLLISION (with energy loss)
        // ═══════════════════════════════════════════════════════════
        
        // Coefficient of Restitution (bounce factor):
        // e = v_separation / v_approach
        // Perfect elastic: e = 1.0, Perfectly inelastic: e = 0.0
        
        // Reverse and reduce vertical velocity (energy loss during collision)
        velocityRef.current.y = Math.abs(currentVelY) * bounce;
        
        // Horizontal velocity remains constant (no friction in this model)
        velocityRef.current.x = currentVelX;
        
        // Reset arc parameters for next parabolic trajectory
        timeRef.current = 0;
        startPositionRef.current = { x: newX, y: groundLevel };
        
        // Update position to ground level (prevent underground clipping)
        setPosition({ x: newX, y: groundLevel, z: 0 });
        setCurrentVelocity({ x: currentVelX, y: velocityRef.current.y });
        
      } else {
        // ═══════════════════════════════════════════════════════════
        // MOTION COMPLETE - Energy fully dissipated
        // ═══════════════════════════════════════════════════════════
        
        setIsFlying(false);
        setPosition({ x: newX, y: groundLevel, z: 0 });
        setCurrentVelocity({ x: 0, y: 0 });
        onLaunchComplete();
        
        // Final statistics report
        onStatsUpdate({
          velocityX: 0,
          velocityY: 0,
          maxHeight: maxHeightRef.current - 1,
          distance: newX,
          time: totalTimeRef.current
        });
      }
      
    } else {
      // ═══════════════════════════════════════════════════════════
      // PROJECTILE IN FLIGHT - Update position and statistics
      // ═══════════════════════════════════════════════════════════
      
      setPosition({ x: newX, y: newY, z: 0 });
      setCurrentVelocity({ x: currentVelX, y: currentVelY });
      
      // Maintain trail history (limited to last 20 positions for performance)
      setTrail(prev => [...prev.slice(-20), { x: newX, y: newY, z: 0 }]);

      // Real-time statistics update
      onStatsUpdate({
        velocityX: currentVelX,
        velocityY: currentVelY,
        maxHeight: maxHeightRef.current - 1,
        distance: newX,
        time: totalTimeRef.current
      });
    }
  });

  return (
    <>
      {/* Cricket field atmosphere */}
      <color attach="background" args={['#87CEEB']} />
      
      {/* Bright outdoor cricket lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 40, 15]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-30}
        shadow-camera-right={40}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Predictive Trajectory Path with Markers */}
      <PredictiveTrajectory 
        angle={angle} 
        velocity={velocity} 
        gravity={gravity} 
        show={!isFlying}
      />
      
      <Batsman isSwinging={isFlying && totalTimeRef.current < 0.5} />
      <Stumps />
      <Projectile 
        position={position} 
        isFlying={isFlying} 
        trail={trail} 
        velocity={currentVelocity}
      />
      <CricketGround />
    </>
  );
};

// Main App Component
export default function ProjectileSimulator() {
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(20);
  const [gravity, setGravity] = useState(9.8);
  const [bounce, setBounce] = useState(0.6);
  const [stats, setStats] = useState({
    velocityX: 0,
    velocityY: 0,
    maxHeight: 0,
    distance: 0,
    time: 0
  });
  const [isLaunched, setIsLaunched] = useState(false);
  const [canLaunch, setCanLaunch] = useState(true);

  const handleLaunch = () => {
    if (canLaunch) {
      setIsLaunched(true);
      setCanLaunch(false);
      setTimeout(() => setIsLaunched(false), 100);
    }
  };

  const handleReset = () => {
    setStats({
      velocityX: 0,
      velocityY: 0,
      maxHeight: 0,
      distance: 0,
      time: 0
    });
    setCanLaunch(true);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Custom Styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
          transition: transform 0.2s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.9);
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
          transition: transform 0.2s;
        }
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.9);
        }
      `}</style>

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [-5, 10, 20], fov: 60 }}
          shadows
          gl={{ antialias: true }}
        >
          <Scene
            angle={angle}
            velocity={velocity}
            gravity={gravity}
            bounce={bounce}
            onStatsUpdate={setStats}
            isLaunched={isLaunched}
            onLaunchComplete={() => setCanLaunch(true)}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={8}
            maxDistance={60}
            target={[8, 3, 0]}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none h-full flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              PROJECTILE SIM
            </h1>
            <p className="text-xs text-slate-400 mt-1">Physics Trajectory Analyzer</p>
          </motion.div>

          <div className="flex gap-2 pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-3 bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl hover:bg-slate-700/50 transition-colors"
            >
              <RotateCcw size={20} className="text-slate-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl hover:bg-slate-700/50 transition-colors"
            >
              <Settings2 size={20} className="text-slate-300" />
            </motion.button>
          </div>
        </div>

        {/* Stats HUD - Top Left */}
        <div className="px-6 grid grid-cols-4 gap-2 max-w-2xl">
          <StatCard label="Velocity X" value={stats.velocityX.toFixed(1)} unit="m/s" />
          <StatCard label="Velocity Y" value={stats.velocityY.toFixed(1)} unit="m/s" />
          <StatCard label="Max Height" value={stats.maxHeight.toFixed(1)} unit="m" />
          <StatCard label="Distance" value={stats.distance.toFixed(1)} unit="m" />
        </div>

        <div className="flex-1" />

        {/* Control Deck - Bottom Center */}
        <div className="p-4 flex justify-center">
          <GlassPanel className="w-full max-w-xl space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="Launch Angle"
                value={angle}
                onChange={setAngle}
                min={0}
                max={90}
                step={1}
                unit="°"
              />
              <Slider
                label="Initial Velocity"
                value={velocity}
                onChange={setVelocity}
                min={5}
                max={50}
                step={0.5}
                unit="m/s"
              />
              <Slider
                label="Gravity"
                value={gravity}
                onChange={setGravity}
                min={1}
                max={20}
                step={0.1}
                unit="m/s²"
              />
              <Slider
                label="Bounce Factor"
                value={bounce}
                onChange={setBounce}
                min={0}
                max={0.95}
                step={0.05}
                unit=""
              />
            </div>

            <motion.button
              whileHover={{ scale: canLaunch ? 1.02 : 1 }}
              whileTap={{ scale: canLaunch ? 0.98 : 1 }}
              onClick={handleLaunch}
              disabled={!canLaunch}
              className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                canLaunch
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] text-white'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              {canLaunch ? 'LAUNCH' : 'IN FLIGHT...'}
            </motion.button>

            <div className="text-center text-[10px] text-slate-400">
              Time: <span className="font-mono text-blue-400">{stats.time.toFixed(2)}s</span>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}