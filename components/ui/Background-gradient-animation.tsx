"use client";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState } from "react";

export const BackgroundGradientAnimation = ({
    gradientBackgroundStart = "rgb(108, 0, 162)",
    gradientBackgroundEnd = "rgb(0, 17, 82)",
    firstColor = "18, 113, 255",
    secondColor = "221, 74, 255",
    thirdColor = "100, 220, 255",
    fourthColor = "200, 50, 50",
    fifthColor = "180, 180, 50",
    pointerColor = "140, 100, 255",
    size = "80%",
    blendingValue = "hard-light",
    children,
    className,
    interactive = true,
    containerClassName,
}: {
    gradientBackgroundStart?: string;
    gradientBackgroundEnd?: string;
    firstColor?: string;
    secondColor?: string;
    thirdColor?: string;
    fourthColor?: string;
    fifthColor?: string;
    pointerColor?: string;
    size?: string;
    blendingValue?: string;
    children?: React.ReactNode;
    className?: string;
    interactive?: boolean;
    containerClassName?: string;
}) => {
    const interactiveRef = useRef<HTMLDivElement>(null);
    const [curX, setCurX] = useState(0);
    const [curY, setCurY] = useState(0);
    const [tgX, setTgX] = useState(0);
    const [tgY, setTgY] = useState(0);
    const [isMounted, setIsMounted] = useState(false); // State to track if component is mounted
    const [isSafari, setIsSafari] = useState(false);

    useEffect(() => {
        setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
        setIsMounted(true); // Mark component as mounted
    }, []);

    useEffect(() => {
        if (isMounted) { // Ensure document is accessed only after mount
            document.body.style.setProperty("--gradient-background-start", gradientBackgroundStart);
            document.body.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
            document.body.style.setProperty("--first-color", firstColor);
            document.body.style.setProperty("--second-color", secondColor);
            document.body.style.setProperty("--third-color", thirdColor);
            document.body.style.setProperty("--fourth-color", fourthColor);
            document.body.style.setProperty("--fifth-color", fifthColor);
            document.body.style.setProperty("--pointer-color", pointerColor);
            document.body.style.setProperty("--size", size);
            document.body.style.setProperty("--blending-value", blendingValue);
        }
    }, [
        isMounted,
        gradientBackgroundStart,
        gradientBackgroundEnd,
        firstColor,
        secondColor,
        thirdColor,
        fourthColor,
        fifthColor,
        pointerColor,
        size,
        blendingValue,
    ]);

    useEffect(() => {
        function move() {
            if (!interactiveRef.current) return;

            setCurX((prev) => prev + (tgX - curX) / 20);
            setCurY((prev) => prev + (tgY - curY) / 20);
            interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
        }

        move();
    }, [tgX, tgY, curX, curY]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (interactiveRef.current) {
            const rect = interactiveRef.current.getBoundingClientRect();
            setTgX(event.clientX - rect.left);
            setTgY(event.clientY - rect.top);
        }
    };

    return (
        <div
            className={cn(
                "h-full w-full absolute overflow-hidden top-0 left-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
                containerClassName
            )}
        >
            <svg className="hidden">
                <defs>
                    <filter id="blurMe">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>
            <div className={cn("", className)}>{children}</div>
            <div
                className={cn(
                    "gradients-container h-full w-full blur-lg",
                    isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
                )}
            >
                {/* Gradient circles */}
                {[firstColor, secondColor, thirdColor, fourthColor, fifthColor].map((color, index) => (
                    <div
                        key={index}
                        className={cn(
                            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--${color}),_0.8)_0,_rgba(var(--${color}),_0)_50%)_no-repeat]`,
                            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                            `[transform-origin:calc(50%${index % 2 === 0 ? '-' : '+'}${(index + 1) * 400}px)]`,
                            `animate-${['first', 'second', 'third', 'fourth', 'fifth'][index]}`,
                            `opacity-${index === 3 ? '70' : '100'}`
                        )}
                    ></div>
                ))}

                {interactive && (
                    <div
                        ref={interactiveRef}
                        onMouseMove={handleMouseMove}
                        className={cn(
                            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
                            `[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2`,
                            `opacity-70`
                        )}
                    ></div>
                )}
            </div>
        </div>
    );
};
