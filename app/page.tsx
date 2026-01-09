"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Info, Maximize2, Download } from 'lucide-react';

const Stat = ({ label, value, unit, description }) => (
  <div className="bg-slate-900/80 backdrop-blur-md border border-green-500/40 rounded-lg px-3 py-2.5 shadow-xl group relative">
    <div className="text-[10px] text-green-400 mb-1 font-semibold uppercase tracking-wide">{label}</div>
    <div className="font-mono text-xl font-bold text-white">
      {value}<span className="text-sm text-green-300 ml-1">{unit}</span>
    </div>
    {description && (
      <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-56 bg-slate-900/95 border border-green-500/50 rounded-lg p-2.5 text-xs text-slate-300 z-50 shadow-2xl">
        {description}
      </div>
    )}
  </div>
);

const Slider = ({ label, value, onChange, min, max, step, unit, description }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-200 font-medium">{label}</span>
          {description && (
            <div className="group relative">
              <Info size={13} className="text-green-400 cursor-help" />
              <div className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-64 bg-slate-900/95 border border-green-500/50 rounded-lg p-2.5 text-xs text-slate-300 z-50 shadow-2xl">
                {description}
              </div>
            </div>
          )}
        </div>
        <span className="font-mono text-base font-bold text-green-400">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-2.5 bg-slate-800/70 rounded-full overflow-hidden shadow-inner">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-200 shadow-lg shadow-green-500/40"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default function CricketProjectileSimulator() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const ballRef = useRef(null);
  const batsmanRef = useRef(null);
  const batRef = useRef(null);
  const trailRef = useRef(null);
  const predictedPathRef = useRef(null);
  const animationRef = useRef(null);

  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(28);
  const [gravity, setGravity] = useState(9.8);
  const [stats, setStats] = useState({
    velocityX: 0,
    velocityY: 0,
    maxHeight: 0,
    range: 0,
    time: 0,
    currentHeight: 0
  });
  const [canLaunch, setCanLaunch] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const simulationState = useRef({
    isFlying: false,
    time: 0,
    position: { x: 0, y: 1.2, z: 0 },
    velocity: { x: 0, y: 0 },
    maxHeight: 1.2,
    totalTime: 0
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 80, 180);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      65,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      300
    );
    camera.position.set(-30, 20, 40);
    camera.lookAt(25, 5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main sunlight
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
    sunLight.position.set(60, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.far = 200;
    scene.add(sunLight);

    // Stadium floodlights (4 corners)
    const floodlightPositions = [
      { x: -60, z: -60 },
      { x: 60, z: -60 },
      { x: -60, z: 60 },
      { x: 60, z: 60 }
    ];

    floodlightPositions.forEach(pos => {
      // Light tower
      const towerGeometry = new THREE.CylinderGeometry(1, 1.5, 40, 8);
      const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(pos.x, 20, pos.z);
      tower.castShadow = true;
      scene.add(tower);

      // Floodlight
      const light = new THREE.PointLight(0xffffcc, 0.6, 120);
      light.position.set(pos.x, 40, pos.z);
      light.castShadow = true;
      scene.add(light);

      // Light fixture
      const fixtureGeometry = new THREE.BoxGeometry(3, 1, 3);
      const fixtureMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
      });
      const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
      fixture.position.set(pos.x, 40, pos.z);
      scene.add(fixture);
    });

    // Cricket Ground (grass)
    const groundGeometry = new THREE.CircleGeometry(85, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a5c1a,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grass texture variation (darker stripes)
    for (let i = -8; i <= 8; i++) {
      if (i % 2 === 0) {
        const stripeGeometry = new THREE.PlaneGeometry(170, 10);
        const stripeMaterial = new THREE.MeshStandardMaterial({
          color: 0x155c15,
          roughness: 0.9
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.01, i * 10);
        stripe.receiveShadow = true;
        scene.add(stripe);
      }
    }

    // 30-yard circle
    const circleGeometry = new THREE.RingGeometry(27.4, 27.5, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    scene.add(circle);

    // Boundary rope
    const boundaryGeometry = new THREE.TorusGeometry(75, 0.3, 16, 100);
    const boundaryMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.3
    });
    const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
    boundary.rotation.x = Math.PI / 2;
    boundary.position.y = 0.3;
    scene.add(boundary);

    // Stadium stands (4 sections)
    const createStand = (startAngle, endAngle, radius, color) => {
      const standGeometry = new THREE.CylinderGeometry(radius + 15, radius + 10, 20, 32, 1, true, startAngle, endAngle - startAngle);
      const standMaterial = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
        roughness: 0.7
      });
      const stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.y = 10;
      scene.add(stand);

      // Seating rows
      for (let i = 0; i < 8; i++) {
        const seatGeometry = new THREE.CylinderGeometry(radius + 11 + i * 0.5, radius + 11 + i * 0.5, 0.5, 32, 1, true, startAngle, endAngle - startAngle);
        const seatMaterial = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x2a4a8a : 0x8a2a4a,
          side: THREE.DoubleSide
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 2 + i * 2;
        scene.add(seat);
      }

      // Roof
      const roofGeometry = new THREE.CylinderGeometry(radius + 20, radius + 18, 2, 32, 1, true, startAngle, endAngle - startAngle);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a5e,
        side: THREE.DoubleSide
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 19;
      scene.add(roof);
    };

    // Create 4 stands
    createStand(0, Math.PI / 2, 80, 0x1a2a4a);
    createStand(Math.PI / 2, Math.PI, 80, 0x2a1a4a);
    createStand(Math.PI, 3 * Math.PI / 2, 80, 0x1a2a4a);
    createStand(3 * Math.PI / 2, 2 * Math.PI, 80, 0x2a1a4a);

    // Giant scoreboard
    const scoreboardGeometry = new THREE.BoxGeometry(20, 12, 2);
    const scoreboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      emissive: 0x2a2a4e,
      emissiveIntensity: 0.3
    });
    const scoreboard = new THREE.Mesh(scoreboardGeometry, scoreboardMaterial);
    scoreboard.position.set(0, 25, -90);
    scene.add(scoreboard);

    // Scoreboard screen
    const screenGeometry = new THREE.PlaneGeometry(18, 10);
    const screenMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 25, -88.9);
    scene.add(screen);

    // Cricket Pitch (detailed)
    const pitchGeometry = new THREE.BoxGeometry(3.66, 0.08, 20.12);
    const pitchMaterial = new THREE.MeshStandardMaterial({
      color: 0xc19a6b,
      roughness: 0.85,
      metalness: 0.05
    });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.position.set(0, 0.04, 0);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Pitch markings (white lines)
    const linesMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Popping crease at batting end
    const creaseGeometry = new THREE.BoxGeometry(3.66, 0.01, 0.1);
    const crease1 = new THREE.Mesh(creaseGeometry, linesMaterial);
    crease1.position.set(0, 0.09, 0);
    scene.add(crease1);

    // Bowling crease at other end
    const crease2 = new THREE.Mesh(creaseGeometry, linesMaterial);
    crease2.position.set(0, 0.09, 20.12);
    scene.add(crease2);

    // Return creases
    const returnCreaseGeometry = new THREE.BoxGeometry(0.05, 0.01, 2.64);
    [-1.83, 1.83].forEach(x => {
      const returnCrease1 = new THREE.Mesh(returnCreaseGeometry, linesMaterial);
      returnCrease1.position.set(x, 0.09, -1.22);
      scene.add(returnCrease1);

      const returnCrease2 = new THREE.Mesh(returnCreaseGeometry, linesMaterial);
      returnCrease2.position.set(x, 0.09, 21.34);
      scene.add(returnCrease2);
    });

    // Stumps at batting end (3 stumps)
    const stumpGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.71, 12);
    const stumpMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf0e6,
      roughness: 0.6
    });

    [-0.115, 0, 0.115].forEach(z => {
      const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
      stump.position.set(1, 0.395, z);
      stump.castShadow = true;
      scene.add(stump);
    });

    // Bails (2 bails)
    const bailGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8);
    const bailMaterial = new THREE.MeshStandardMaterial({ color: 0xfaf0e6 });

    [-0.06, 0.06].forEach(z => {
      const bail = new THREE.Mesh(bailGeometry, bailMaterial);
      bail.rotation.z = Math.PI / 2;
      bail.position.set(1, 0.71, z);
      scene.add(bail);
    });

    // Stumps at bowling end
    [-0.115, 0, 0.115].forEach(z => {
      const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
      stump.position.set(-1, 0.395, 20.12 + z);
      stump.castShadow = true;
      scene.add(stump);
    });

    // Distance markers with poles
    for (let i = 1; i <= 10; i++) {
      const distance = i * 10;

      // Ground circle
      const markerGeometry = new THREE.RingGeometry(0.9, 1, 32);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(distance, 0.05, 0);
      scene.add(marker);

      // Distance pole
      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
      const poleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(distance, 0.5, -4);
      pole.castShadow = true;
      scene.add(pole);

      // Number marker on pole
      const numberGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const numberMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        emissive: 0xff6b6b,
        emissiveIntensity: 0.5
      });
      const number = new THREE.Mesh(numberGeometry, numberMaterial);
      number.position.set(distance, 1.2, -4);
      scene.add(number);
    }

    // Height reference grid
    for (let i = 1; i <= 7; i++) {
      const height = i * 5;

      // Horizontal line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-5, height, 0),
        new THREE.Vector3(100, height, 0)
      ]);
      const lineMaterial = new THREE.LineDashedMaterial({
        color: 0xffffff,
        linewidth: 1,
        dashSize: 1.5,
        gapSize: 1,
        transparent: true,
        opacity: 0.25
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.computeLineDistances();
      scene.add(line);

      // Height marker
      const markerGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.7
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(-5, height, 0);
      scene.add(marker);
    }

    // Detailed Batsman
    const batsmanGroup = new THREE.Group();

    // Legs with pads
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.14, 1.1, 16);
    const padMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1
    });

    const leftLeg = new THREE.Mesh(legGeometry, padMaterial);
    leftLeg.position.set(-0.22, 0.55, 0);
    leftLeg.castShadow = true;
    batsmanGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, padMaterial);
    rightLeg.position.set(0.22, 0.55, 0.15);
    rightLeg.castShadow = true;
    batsmanGroup.add(rightLeg);

    // Pad details
    const padDetailGeometry = new THREE.BoxGeometry(0.22, 0.85, 0.12);
    const leftPad = new THREE.Mesh(padDetailGeometry, padMaterial);
    leftPad.position.set(-0.22, 0.55, -0.08);
    leftPad.castShadow = true;
    batsmanGroup.add(leftPad);

    // Body (jersey)
    const bodyGeometry = new THREE.CylinderGeometry(0.38, 0.42, 1.5, 16);
    const jerseyMaterial = new THREE.MeshStandardMaterial({
      color: 0x003d99,
      roughness: 0.6,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, jerseyMaterial);
    body.position.y = 1.6;
    body.castShadow = true;
    batsmanGroup.add(body);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.09, 0.11, 0.75, 12);

    const leftArm = new THREE.Mesh(armGeometry, jerseyMaterial);
    leftArm.position.set(-0.5, 1.7, 0);
    leftArm.rotation.z = Math.PI / 5;
    leftArm.castShadow = true;
    batsmanGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, jerseyMaterial);
    rightArm.position.set(0.5, 1.6, 0);
    rightArm.rotation.z = -Math.PI / 5;
    rightArm.castShadow = true;
    batsmanGroup.add(rightArm);

    // Gloves
    const gloveGeometry = new THREE.SphereGeometry(0.14, 12, 12);
    const gloveMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8
    });

    const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
    leftGlove.position.set(-0.75, 1.5, 0);
    batsmanGroup.add(leftGlove);

    const rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
    rightGlove.position.set(0.75, 1.4, 0);
    batsmanGroup.add(rightGlove);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 20, 20);
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.8
    });
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    batsmanGroup.add(head);

    // Helmet
    const helmetGeometry = new THREE.SphereGeometry(0.34, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x003d99,
      metalness: 0.7,
      roughness: 0.3
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 2.6;
    helmet.castShadow = true;
    batsmanGroup.add(helmet);

    // Face guard
    const guardGeometry = new THREE.BoxGeometry(0.28, 0.18, 0.02);
    const guardMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.6
    });
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.position.set(0, 2.45, 0.32);
    batsmanGroup.add(guard);

    batsmanGroup.position.set(-1.2, 0, -0.3);
    batsmanGroup.rotation.y = Math.PI / 7;
    scene.add(batsmanGroup);
    batsmanRef.current = batsmanGroup;

    // Cricket Bat (professional)
    const batGroup = new THREE.Group();

    // Blade
    const bladeGeometry = new THREE.BoxGeometry(0.13, 1.05, 0.065);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,
      roughness: 0.4,
      metalness: 0.1
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 0.525;
    blade.castShadow = true;
    batGroup.add(blade);

    // Sweet spot
    const sweetSpotGeometry = new THREE.BoxGeometry(0.125, 0.35, 0.066);
    const sweetSpotMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.5
    });
    const sweetSpot = new THREE.Mesh(sweetSpotGeometry, sweetSpotMaterial);
    sweetSpot.position.y = 0.45;
    batGroup.add(sweetSpot);

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.052, 0.048, 0.55, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = 1.325;
    batGroup.add(handle);

    // Rubber grip
    const gripGeometry = new THREE.CylinderGeometry(0.058, 0.058, 0.38, 16);
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95
    });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.y = 1.45;
    batGroup.add(grip);

    batGroup.position.set(-0.55, 0.45, -0.45);
    batGroup.rotation.z = Math.PI / 4;
    batGroup.rotation.x = -Math.PI / 12;
    scene.add(batGroup);
    batRef.current = batGroup;

    // Cricket Ball (red leather ball)
    const ballGeometry = new THREE.SphereGeometry(0.125, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.65,
      metalness: 0.15,
      emissive: 0x440000,
      emissiveIntensity: 0.1
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 1.2, 0);
    ball.castShadow = true;
    scene.add(ball);
    ballRef.current = ball;

    // Ball seam (white stitching)
    const seamPoints = [];
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      seamPoints.push(new THREE.Vector3(
        Math.cos(angle) * 0.125,
        Math.sin(angle) * 0.125,
        0
      ));
    }
    const seamGeometry = new THREE.BufferGeometry().setFromPoints(seamPoints);
    const seamMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2
    });
    const seam = new THREE.Line(seamGeometry, seamMaterial);
    seam.rotation.x = Math.PI / 2;
    ball.add(seam);

    // Ball glow effect
    const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.25
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    ball.add(glow);

    // Ball shadow on ground
    const shadowGeometry = new THREE.CircleGeometry(0.5, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0
    });
    const ballShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.y = 0.02;
    scene.add(ballShadow);

    // Actual trajectory trail (thick red)
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xff2222,
      linewidth: 6,
      transparent: true,
      opacity: 0.95
    });
    const trailGeometry = new THREE.BufferGeometry();
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trail);
    trailRef.current = trail;

    // Predicted path (yellow dashed)
    const predictedMaterial = new THREE.LineDashedMaterial({
      color: 0xffff00,
      linewidth: 3,
      dashSize: 1,
      gapSize: 0.6,
      transparent: true,
      opacity: 0.75
    });
    const predictedGeometry = new THREE.BufferGeometry();
    const predictedPath = new THREE.Line(predictedGeometry, predictedMaterial);
    scene.add(predictedPath);
    predictedPathRef.current = predictedPath;

    // Camera controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { theta: -Math.PI / 5, phi: Math.PI / 5.5 };
    let cameraDistance = 55;
    let cameraTarget = new THREE.Vector3(25, 8, 0);

    const updateCamera = () => {
      const x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
      const y = cameraDistance * Math.cos(cameraRotation.phi);
      const z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);

      camera.position.set(
        cameraTarget.x + x,
        Math.max(y, 4),
        cameraTarget.z + z
      );
      camera.lookAt(cameraTarget);
    };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      cameraRotation.theta -= deltaX * 0.005;
      cameraRotation.phi += deltaY * 0.005;
      cameraRotation.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.phi));
      previousMousePosition = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e) => {
      e.preventDefault();
      cameraDistance += e.deltaY * 0.06;
      cameraDistance = Math.max(30, Math.min(100, cameraDistance));
      updateCamera();
    };

    canvasRef.current.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvasRef.current.addEventListener('wheel', onWheel, { passive: false });

    let lastTime = Date.now();
    let trailPoints = [];

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Camera tracking
      if (simulationState.current.isFlying) {
        const targetX = Math.max(20, Math.min(70, simulationState.current.position.x * 0.6 + 15));
        const targetY = Math.max(7, simulationState.current.maxHeight * 0.45);

        cameraTarget.x += (targetX - cameraTarget.x) * deltaTime * 1.8;
        cameraTarget.y += (targetY - cameraTarget.y) * deltaTime * 1.8;
        updateCamera();

        // Ball shadow
        ballShadow.position.x = simulationState.current.position.x;
        ballShadow.position.z = simulationState.current.position.z;
        const shadowOpacity = Math.min(0.55, simulationState.current.position.y / 30);
        ballShadow.material.opacity = shadowOpacity;
        ballShadow.scale.setScalar(1 + simulationState.current.position.y * 0.09);
      }

      // Physics
      if (simulationState.current.isFlying) {
        simulationState.current.time += deltaTime;
        simulationState.current.totalTime += deltaTime;
        const t = simulationState.current.time;

        const newX = simulationState.current.velocity.x * t;
        const newY = 1.2 + simulationState.current.velocity.y * t - 0.5 * gravity * t * t;

        if (newY <= 0.125) {
          simulationState.current.isFlying = false;
          simulationState.current.position = { x: newX, y: 0.125, z: 0 };
          setCanLaunch(true);
          ballShadow.material.opacity = 0;

          setStats(prev => ({
            ...prev,
            range: newX,
            currentHeight: 0
          }));
        } else {
          simulationState.current.position = { x: newX, y: newY, z: 0 };
          simulationState.current.maxHeight = Math.max(simulationState.current.maxHeight, newY);

          const currentVelY = simulationState.current.velocity.y - gravity * t;

          setStats({
            velocityX: simulationState.current.velocity.x,
            velocityY: currentVelY,
            maxHeight: simulationState.current.maxHeight - 1.2,
            range: newX,
            time: simulationState.current.totalTime,
            currentHeight: newY - 1.2
          });

          // Trail
          trailPoints.push(newX, newY, 0);
          if (trailPoints.length > 1800) {
            trailPoints = trailPoints.slice(-1800);
          }
          trailRef.current.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(trailPoints, 3)
          );
        }

        ball.position.set(
          simulationState.current.position.x,
          simulationState.current.position.y,
          simulationState.current.position.z
        );

        // Ball spin
        const rotSpeed = Math.sqrt(
          simulationState.current.velocity.x ** 2 +
          (simulationState.current.velocity.y - gravity * t) ** 2
        );
        ball.rotation.x += deltaTime * rotSpeed * 2.5;
        ball.rotation.z += deltaTime * rotSpeed * 1.8;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvasRef.current?.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [gravity]);

  // Update predicted path
  useEffect(() => {
    if (!predictedPathRef.current) return;

    const rad = (angle * Math.PI) / 180;
    const vx = speed * Math.cos(rad);
    const vy = speed * Math.sin(rad);

    const points = [];
    const totalTime = (2 * vy) / gravity;
    const steps = 120;

    for (let i = 0; i <= steps; i++) {
      const t = (totalTime * i) / steps;
      const x = vx * t;
      const y = 1.2 + vy * t - 0.5 * gravity * t * t;

      if (y >= 0.125) {
        points.push(new THREE.Vector3(x, y, 0));
      }
    }

    predictedPathRef.current.geometry.setFromPoints(points);
    predictedPathRef.current.computeLineDistances();
  }, [angle, speed, gravity]);

  const handleLaunch = () => {
    if (!canLaunch) return;

    // Bat swing animation
    if (batRef.current) {
      const initialRotZ = batRef.current.rotation.z;
      const initialRotX = batRef.current.rotation.x;
      let swingProgress = 0;

      const swingInterval = setInterval(() => {
        swingProgress += 0.075;
        const swingAmount = Math.sin(swingProgress * Math.PI);
        batRef.current.rotation.z = initialRotZ - swingAmount * (Math.PI / 2.3);
        batRef.current.rotation.x = initialRotX + swingAmount * (Math.PI / 9);
        batRef.current.position.x = -0.55 + swingAmount * 0.85;
        batRef.current.position.y = 0.45 + swingAmount * 0.25;

        if (swingProgress >= 1) {
          clearInterval(swingInterval);
          setTimeout(() => {
            batRef.current.rotation.z = initialRotZ;
            batRef.current.rotation.x = initialRotX;
            batRef.current.position.set(-0.55, 0.45, -0.45);
          }, 250);
        }
      }, 16);
    }

    setTimeout(() => {
      const rad = (angle * Math.PI) / 180;
      simulationState.current = {
        isFlying: true,
        time: 0,
        totalTime: 0,
        position: { x: 0, y: 1.2, z: 0 },
        velocity: {
          x: speed * Math.cos(rad),
          y: speed * Math.sin(rad)
        },
        maxHeight: 1.2
      };

      if (trailRef.current?.geometry) {
        trailRef.current.geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute([], 3)
        );
      }

      setCanLaunch(false);
    }, 130);
  };

  const handleReset = () => {
    simulationState.current = {
      isFlying: false,
      time: 0,
      totalTime: 0,
      position: { x: 0, y: 1.2, z: 0 },
      velocity: { x: 0, y: 0 },
      maxHeight: 1.2
    };

    if (ballRef.current) {
      ballRef.current.position.set(0, 1.2, 0);
    }

    if (trailRef.current?.geometry) {
      trailRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([], 3)
      );
    }

    setStats({ velocityX: 0, velocityY: 0, maxHeight: 0, range: 0, time: 0, currentHeight: 0 });
    setCanLaunch(true);
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toLocaleString();
    const csvContent = [
      ['Cricket Projectile Motion Simulation Data'],
      ['Generated:', timestamp],
      [''],
      ['Parameter', 'Value', 'Unit'],
      ['Launch Angle', angle, '°'],
      ['Initial Velocity', speed, 'm/s'],
      ['Gravity', gravity, 'm/s²'],
      [''],
      ['Results', '', ''],
      ['Velocity X', stats.velocityX.toFixed(2), 'm/s'],
      ['Velocity Y', stats.velocityY.toFixed(2), 'm/s'],
      ['Max Height', stats.maxHeight.toFixed(2), 'm'],
      ['Range (Distance)', stats.range.toFixed(2), 'm'],
      ['Flight Time', stats.time.toFixed(2), 's'],
      ['Current Height', stats.currentHeight.toFixed(2), 'm']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cricket_simulation_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 pointer-events-none h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]">
              🏏 CRICKET PROJECTILE MOTION SIMULATOR
            </h1>
            <p className="text-sm text-green-300 drop-shadow-lg mt-1">
              Professional Cricket Stadium • Real-time Physics Visualization
            </p>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInfo(!showInfo)}
              className="p-2.5 bg-slate-800/80 backdrop-blur-md border border-green-500/40 rounded-lg hover:bg-slate-700/80 transition-colors shadow-xl"
            >
              <Info size={18} className="text-green-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-2.5 bg-slate-800/80 backdrop-blur-md border border-green-500/40 rounded-lg hover:bg-slate-700/80 transition-colors shadow-xl"
            >
              <RotateCcw size={18} className="text-green-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              title="Export to CSV"
              className="p-2.5 bg-slate-800/80 backdrop-blur-md border border-green-500/40 rounded-lg hover:bg-slate-700/80 transition-colors shadow-xl"
            >
              <Download size={18} className="text-green-400" />
            </motion.button>
          </div>
        </div>

        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-green-500/50 rounded-xl p-4 max-w-3xl mb-3 shadow-2xl pointer-events-auto"
            >
              <h3 className="text-green-400 font-bold mb-3 text-lg">📚 Physics Concepts in Cricket</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                  <strong className="text-green-300">Parabolic Motion:</strong> The ball follows a curved path under gravity's influence
                </div>
                <div>
                  <strong className="text-green-300">Launch Angle:</strong> 45° gives maximum distance (ideal for boundaries!)
                </div>
                <div>
                  <strong className="text-green-300">Velocity Components:</strong> Horizontal (constant) vs Vertical (decreases due to gravity)
                </div>
                <div>
                  <strong className="text-green-300">Time of Flight:</strong> Higher angles mean longer flight time but shorter distance
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Stats */}
        <div className="grid grid-cols-5 gap-2.5 max-w-4xl mb-3">
          <Stat
            label="Horizontal Speed"
            value={stats.velocityX.toFixed(1)}
            unit="m/s"
            description="Constant horizontal speed throughout flight (no air resistance in this model)"
          />
          <Stat
            label="Vertical Speed"
            value={stats.velocityY.toFixed(1)}
            unit="m/s"
            description="Vertical speed decreases due to gravity pulling the ball down"
          />
          <Stat
            label="Current Height"
            value={stats.currentHeight.toFixed(1)}
            unit="m"
            description="Ball's current height above ground level"
          />
          <Stat
            label="Max Height"
            value={stats.maxHeight.toFixed(1)}
            unit="m"
            description="Peak height reached - apex of the parabola"
          />
          <Stat
            label="Range"
            value={stats.range.toFixed(1)}
            unit="m"
            description="Total horizontal distance traveled (boundary is at 75m!)"
          />
        </div>

        <div className="flex-1" />

        {/* Control Panel */}
        <div className="flex justify-center pointer-events-auto">
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-green-500/50 rounded-2xl p-6 w-full max-w-5xl space-y-5 shadow-2xl">
            <div className="grid grid-cols-3 gap-6">
              <Slider
                label="Launch Angle (θ)"
                value={angle}
                onChange={setAngle}
                min={0}
                max={90}
                step={1}
                unit="°"
                description="The angle at which the batsman hits the ball. 45° gives maximum range! Try different angles to see the effect on trajectory."
              />
              <Slider
                label="Shot Speed (v₀)"
                value={speed}
                onChange={setSpeed}
                min={5}
                max={50}
                step={0.5}
                unit="m/s"
                description="How hard the batsman hits! Higher speed means both greater distance and height. Professional shots can exceed 40 m/s!"
              />
              <Slider
                label="Gravity (g)"
                value={gravity}
                onChange={setGravity}
                min={1}
                max={20}
                step={0.1}
                unit="m/s²"
                description="Earth's gravity is 9.8 m/s². Try changing it to see how the ball would travel on different planets!"
              />
            </div>

            <div className="border-t border-slate-700/50 pt-5 space-y-4">
              <motion.button
                whileHover={{ scale: canLaunch ? 1.01 : 1 }}
                whileTap={{ scale: canLaunch ? 0.98 : 1 }}
                onClick={handleLaunch}
                disabled={!canLaunch}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-2xl ${canLaunch
                  ? 'bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 hover:from-green-500 hover:to-emerald-400 text-white shadow-green-500/50'
                  : 'bg-slate-700/60 text-slate-500 cursor-not-allowed'
                  }`}
              >
                <Play size={24} fill="currentColor" />
                {canLaunch ? '🏏 HIT THE SHOT!' : '🏏 BALL IN FLIGHT...'}
              </motion.button>

              <div className="flex justify-between items-center text-xs">
                <div className="flex gap-6 text-green-300">
                  <span>⏱️ Flight Time: <span className="font-mono font-bold text-white">{stats.time.toFixed(2)}s</span></span>
                  <span>🔴 Red = Actual Path</span>
                  <span>🟡 Yellow = Predicted Path</span>
                  <span>📏 Markers every 10m</span>
                </div>
                <span className="text-slate-400">🖱️ Drag to rotate • Scroll to zoom • Explore the stadium!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}