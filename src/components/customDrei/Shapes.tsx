import * as THREE from 'three'
import React from 'react'
import { } from 'react-three-fiber'

export type Args<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T
export type ShapeProps<T> = Omit<JSX.IntrinsicElements['mesh'], 'args'> & { args?: Args<T> }

function create<T>(type: string) {
  const El: any = type + 'BufferGeometry'
  return React.forwardRef(({ args, children, ...props }: ShapeProps<T>, ref) => (
    <mesh ref={ref as React.MutableRefObject<THREE.Mesh>} {...props}>
      <El attach="geometry" args={args} />
      {children}
    </mesh>
  ))
}

export const Box = create<typeof THREE.BoxBufferGeometry>('box')
export const Circle = create<typeof THREE.CircleBufferGeometry>('circle')
export const Plane = create<typeof THREE.PlaneBufferGeometry>('plane')
export const Ring = create<typeof THREE.RingBufferGeometry>('ring')
