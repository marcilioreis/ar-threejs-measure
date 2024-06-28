import React from 'react'
import * as THREE from 'three'
import {
    useHitTest,
    ARCanvas,
    DefaultXRControllers,
    useXREvent,
    Interactive,
} from '@react-three/xr'
import { Ring, Circle, Plane } from './customDrei/Shapes'
import { Line } from './customDrei/Line'
import { Text } from './customDrei/Text'

const Reticle = React.forwardRef((props, ref) => (
    <mesh ref={ref}>
        <Ring args={[0.045, 0.05, 32]} rotation={[-Math.PI / 2, 0, 0]} />
        <Circle args={[0.005, 32]} rotation={[-Math.PI / 2, 0, 0]} />
    </mesh>
))

const XREvent = ({ onSelect }) => {
    useXREvent('select', onSelect)

    return null
}

const matrixToVector = (matrix) => {
    const vector = new THREE.Vector3()
    vector.setFromMatrixPosition(matrix)
    return vector
}

const getDistance = (points) => {
    if (points.length === 2) return points[0].distanceTo(points[1])
}

const getCenterPoint = (points) => {
    const [[x1, y1, z1], [x2, y2, z2]] = points.map((point) => point.toArray())
    return [(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2]
}

const Dialog = ({
    messages,
    position,
    onConfirm,
    confirmText,
    onCancel,
    cancelText,
}) => {
    const [confirmBtnHovered, setConfirmBtnHovered] = React.useState(false)
    const [cancelBtnHovered, setCancelBtnHovered] = React.useState(false)

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
    const reticleRef = React.createRef()
    const [lineStart, setLineStart] = React.useState()
    const [lineEnd, setLineEnd] = React.useState()
    const [measurements, setMeasurements] = React.useState([])

    useHitTest((hit) => {
        if (reticleRef.current) {
            hit.decompose(
                reticleRef.current.position,
                new THREE.Quaternion().setFromEuler(
                    reticleRef.current.rotation
                ),
                reticleRef.current.scale
            )

            const lastMeasurement = measurements[measurements.length - 1]

            if (lineStart && !lastMeasurement[1]) {
                setLineEnd(matrixToVector(reticleRef.current.matrix))
            }
        }
    })

    const handleReset = () => setMeasurements([])

    const handleSelect = () => {
        if (reticleRef.current) {
            const vector = matrixToVector(reticleRef.current.matrix)

            if (lineStart && lineEnd) {
                setMeasurements((_measurements) => {
                    const [lastMeasurement, ...restMeasurements] =
                        _measurements.reverse()
                    const updatedLastMeasurement = [lastMeasurement[0], vector]

                    return [...restMeasurements, updatedLastMeasurement]
                })
                setLineStart(null)
                setLineEnd(null)
                // Change else if to else, to measure multiple lines
            } else if (!measurements.length) {
                setLineStart(vector)
                setLineEnd(vector)
                setMeasurements((_measurements) => [
                    ..._measurements,
                    [vector, null],
                ])
            }
        }
    }

    const filterMeasurements = (measurement) => {
        return measurement.every((point) => point)
    }

    return (
        <>
            <hemisphereLight
                args={['#FFFFFF', '#BBBBFF', 1]}
                position={[0.5, 1, 0.25]}
            />

            <Reticle ref={reticleRef} />

            {lineStart && lineEnd && (
                <Line
                    points={[lineStart, lineEnd]}
                    color="#FFFFFF"
                    lineWidth={2}
                />
            )}

            {measurements.filter(filterMeasurements).map((measurement) => {
                const distance = Math.round(getDistance(measurement) * 100)
                const [x, y, z] = getCenterPoint(measurement)

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

            <XREvent onSelect={handleSelect} />
            <DefaultXRControllers />
        </>
    )
}

const Measure = () => (
    <>
        <ARCanvas
            vr="false"
            camera={{
                fov: 70,
                near: 0.01,
                far: 20,
            }}
            sessionInit={{ requiredFeatures: ['hit-test'] }}
        >
            <CanvasInner />
        </ARCanvas>
    </>
)

export default Measure
