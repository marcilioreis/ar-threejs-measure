import * as React from 'react'
import { Text as TextMeshImpl } from 'troika-three-text'
import { ReactThreeFiber, useThree } from 'react-three-fiber'

type Props = JSX.IntrinsicElements['mesh'] & {
    children: React.ReactNode
    color?: ReactThreeFiber.Color
    fontSize?: number
    maxWidth?: number
    lineHeight?: number
    letterSpacing?: number
    textAlign?: 'left' | 'right' | 'center' | 'justify'
    font?: string
    anchorX?: number | 'left' | 'center' | 'right'
    anchorY?:
        | number
        | 'top'
        | 'top-baseline'
        | 'middle'
        | 'bottom-baseline'
        | 'bottom'
    clipRect?: [number, number, number, number]
    depthOffset?: number
    overflowWrap?: 'normal' | 'break-word'
    whiteSpace?: 'normal' | 'overflowWrap' | 'overflowWrap'
    outlineWidth?: number | string
    outlineColor?: ReactThreeFiber.Color
    debugSDF?: boolean
    onSync?: (troika: InstanceType<typeof TextMeshImpl>) => void
}

export const Text = React.forwardRef(
    (
        {
            anchorX = 'center',
            anchorY = 'middle',
            children,
            onSync,
            ...props
        }: Props,
        ref
    ) => {
        const { invalidate } = useThree()
        const [troikaMesh] = React.useState(() => new TextMeshImpl())
        const [nodes, text] = React.useMemo(() => {
            let n: React.ReactNode[] = []
            let t = ''
            React.Children.forEach(children, (child) => {
                if (typeof child === 'string' || typeof child === 'number') {
                    t += child
                } else {
                    n.push(child)
                }
            })
            return [n, t]
        }, [children])
        React.useLayoutEffect(
            () =>
                void troikaMesh.sync(() => {
                    invalidate()
                    if (onSync) onSync(troikaMesh)
                })
        )
        return (
            <primitive
                dispose={undefined}
                object={troikaMesh}
                ref={ref}
                text={text}
                anchorX={anchorX}
                anchorY={anchorY}
                {...props}
            >
                {nodes}
            </primitive>
        )
    }
)
