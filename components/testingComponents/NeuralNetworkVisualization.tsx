'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NeuralNetworkVisualization: React.FC = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(ambientLight);

        // Add a directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Create neuron geometry with a basic material
        const neuronGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const neuronMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // Phong material reacts to lighting

        function createLayer(neurons: number, yPosition: number): THREE.Mesh[] {
            const layer: THREE.Mesh[] = [];
            for (let i = 0; i < neurons; i++) {
                const neuron = new THREE.Mesh(neuronGeometry, neuronMaterial);
                neuron.position.set(i * 0.5, yPosition, Math.random() * 0.5 - 0.25); // Add a bit of depth variation
                scene.add(neuron);
                layer.push(neuron);
            }
            return layer;
        }

        const layer1 = createLayer(5, 1);
        const layer2 = createLayer(3, 0);
        const layer3 = createLayer(2, -1);

        function connectNeurons(neuron1: THREE.Mesh, neuron2: THREE.Mesh) {
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const points = [];
            points.push(neuron1.position);
            points.push(neuron2.position);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            scene.add(line);
        }

        connectNeurons(layer1[0], layer2[0]);
        connectNeurons(layer2[0], layer3[0]);

        camera.position.z = 5;

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} />;
};

export default NeuralNetworkVisualization;
