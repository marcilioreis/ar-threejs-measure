import * as THREE from 'three'
import React, { useState, useRef, forwardRef, MutableRefObject } from 'react'
import {
    ARCanvas,
    useHitTest,
    DefaultXRControllers,
    useXREvent,
    Interactive,
    XRInteractionHandler,
} from '@react-three/xr'
import { ResizeObserver } from '@juggle/resize-observer'
import { Ring, Circle, Plane } from './customDrei/Shapes'
import { Line } from './customDrei/Line'
import { Text } from './customDrei/Text'
import { OrbitControls } from './customDrei/OrbitControls'

let rotateX: any = [-Math.PI / 2, 0, 0]

const Reticle = forwardRef<THREE.Mesh>((props, ref) => (
    <mesh {...props} ref={ref}>
        <Ring args={[0.045, 0.05, 32]} rotateX={rotateX} />
        <Circle args={[0.005, 32]} rotateX={rotateX} />
    </mesh>
))

const XREvent = ({ onSelect }: { onSelect: any }) => {
    useXREvent('select', onSelect)
    return null
}

const matrixToVector = (matrix: THREE.Matrix4) => {
    const vector = new THREE.Vector3()
    vector.setFromMatrixPosition(matrix)
    return vector
}

const getDistance = (points: any[] | null) => {
    if (points) {
        if (points.length === 2) return points[0].distanceTo(points[1])
    }
}

const getCenterPoint = (points: any, target: THREE.Vector3) => {
    let line = new THREE.Line3(...points)
    return line.getCenter(target)
}

interface DialogProps {
    messages: string[]
    position: number[]
    onConfirm: XRInteractionHandler | undefined
    confirmText: string
    onCancel: XRInteractionHandler | undefined
    cancelText: string
}

const Dialog = ({
    messages,
    position,
    onConfirm,
    confirmText,
    onCancel,
    cancelText,
}: DialogProps) => {
    const [confirmBtnHovered, setConfirmBtnHovered] = useState(false)
    const [cancelBtnHovered, setCancelBtnHovered] = useState(false)

    const [x, y, z] = position
    const w = 0.1
    const h = 0.05
    const fontSize = 0.02

    return (
        <group>
            {/* Panel */}
            <group>
                <Plane args={[w * 2, h * 2]} position={[x, y + h * 1.5, z]}>
                    <meshStandardMaterial
                        color="#292524"
                        transparent
                        opacity={0.6}
                    />
                    {messages.map((message, i) => (
                        <Text
                            position={[
                                0,
                                (0.5 * (messages.length - (i + 1)) -
                                    (i + 1 - 1) / 2) *
                                    fontSize,
                                0.01,
                            ]}
                            fontSize={fontSize}
                            color="#FFFFFF"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {message}
                        </Text>
                    ))}
                </Plane>
            </group>

            {/* Confirm Button */}
            <Interactive
                onSelect={onConfirm}
                onHover={() => setConfirmBtnHovered(true)}
                onBlur={() => setConfirmBtnHovered(false)}
            >
                <group>
                    <Plane args={[w, h]} position={[x - w / 2, y, z]}>
                        <meshStandardMaterial
                            color="#3b82f6"
                            transparent
                            opacity={confirmBtnHovered ? 1 : 0.6}
                        />
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={fontSize}
                            color="#FFFFFF"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {confirmText}
                        </Text>
                    </Plane>
                </group>
            </Interactive>

            {/* Cancel Button */}
            <Interactive
                onSelect={onCancel}
                onHover={() => setCancelBtnHovered(true)}
                onBlur={() => setCancelBtnHovered(false)}
            >
                <group>
                    <Plane args={[w, h]} position={[x + w / 2, y, z]}>
                        <meshStandardMaterial
                            color="#ef4444"
                            transparent
                            opacity={cancelBtnHovered ? 1 : 0.6}
                        />
                        <Text
                            position={[0, 0, 0.01]}
                            fontSize={fontSize}
                            color="#FFFFFF"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {cancelText}
                        </Text>
                    </Plane>
                </group>
            </Interactive>
        </group>
    )
}

const CanvasInner = () => {
    const reticleRef = useRef<THREE.Mesh>(null!)
    const [lineStart, setLineStart] = useState<THREE.Vector3 | null>()
    const [lineEnd, setLineEnd] = useState<THREE.Vector3 | null>()
    const [measurements, setMeasurements] = useState<string[] | any[]>([])

    const currentPoint = reticleRef.current
    let vector: THREE.Vector3

    useHitTest((hitMatrix: THREE.Matrix4, hit: THREE.XRHitTestResult) => {
        if (currentPoint) {
            hitMatrix.decompose(
                currentPoint.position,
                new THREE.Quaternion().setFromEuler(currentPoint.rotation),
                currentPoint.scale
            )

            const lastMeasurement = measurements[measurements.length - 1]

            if (lineStart && !lastMeasurement[1]) {
                setLineEnd(matrixToVector(currentPoint.matrix))
            }
        }
    })

    const handleReset = () => setMeasurements([])

    const onSelect = () => {
        if (currentPoint) {
            vector = matrixToVector(currentPoint.matrix)

            if (lineStart && lineEnd) {
                setMeasurements((_measurements) => {
                    const [lastMeasurement, ...restMeasurements] =
                        _measurements.reverse()
                    const updatedLastMeasurement = [lastMeasurement[0], vector]

                    return [...restMeasurements, updatedLastMeasurement]
                })
                setLineStart(null)
                setLineEnd(null)
                // } else {
            } else if (!measurements.length) {
                // Uncomment code below if you only want 1 measurement
                // setMeasurements([])
                setLineStart(vector)
                setLineEnd(vector)
                setMeasurements((_measurements) => [
                    ..._measurements,
                    [vector, null],
                ])
            }
        }
    }

    const filterMeasurements = (measurement: any[]) => {
        return measurement.every((point: any) => point)
    }

    return (
        <>
            <hemisphereLight
                args={['#FFFFFF', '#BBBBFF', 1]}
                position={[0.5, 1, 0.25]}
            />

            <Reticle ref={reticleRef as MutableRefObject<THREE.Mesh>} />

            {lineStart && lineEnd && (
                <Line
                    points={[lineStart.toArray(), lineEnd.toArray()]}
                    color="#FFFFFF"
                    lineWidth={2}
                />
            )}

            {measurements.filter(filterMeasurements).map((measurement) => {
                const distance = Math.round(getDistance(measurement) * 100)
                const { x, y, z } = getCenterPoint(measurement, vector)

                return (
                    <mesh>
                        <Dialog
                            messages={['Measurement:', distance + ' cm']}
                            position={[x, y + 0.05, z]}
                            onConfirm={() => console.log('OK')}
                            confirmText="OK"
                            onCancel={handleReset}
                            cancelText="RESET"
                        />
                        <Line
                            points={measurement}
                            color="#FFFFFF"
                            lineWidth={2}
                        />
                    </mesh>
                )
            })}

            <XREvent onSelect={onSelect} />
            <DefaultXRControllers />
        </>
    )
}

function MeasureAR() {
    return (
        <div id="canvas-container" style={{ height: '100vh' }}>
            <ARCanvas
                vr={true}
                camera={{
                    position: [0, 0, 10],
                    fov: 40,
                    near: 0.01,
                    far: 10000,
                }}
                resize={{ polyfill: ResizeObserver }}
                sessionInit={{ requiredFeatures: ['hit-test'] }}
            >
                <CanvasInner />
                <OrbitControls />
            </ARCanvas>
        </div>
    )
}

export default MeasureAR
